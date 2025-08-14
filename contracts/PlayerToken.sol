// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract PlayerToken is ERC20, Ownable, Pausable, ReentrancyGuard {
    using SafeMath for uint256;
    
    // Tokenomics Constants
    uint256 public constant INITIAL_SUPPLY = 50_000_000 * 10**18; // 50M tokens
    uint256 public constant NFL_WEEK_DURATION = 7 days; // 1 week lock period
    uint256 public constant TRADING_FEE_BPS = 25; // 0.25% trading fee
    uint256 public constant STAKING_REWARD_BPS = 50; // 0.5% weekly staking reward
    uint256 public constant MAX_BURN_RATE_BPS = 100; // 1% max burn rate
    uint256 public constant MIN_PPR_FOR_BURN = 1; // Minimum PPR points to trigger burn
    
    // Protocol state
    uint256 public totalStaked;
    uint256 public totalTradingFees;
    uint256 public currentWeek;
    uint256 public lastWeekUpdate;
    
    struct PlayerStats {
        uint256 lastWeekPPR;
        uint256 currentWeekPPR;
        uint256 totalBurned;
        uint256 totalEmitted;
        uint256 marketCap;
        bool isActive;
        uint256 lastWeekUpdate;
    }
    
    struct StakingPosition {
        uint256 amount;
        uint256 startTime;
        uint256 lockEndTime;
        uint256 lastRewardClaim;
        bool isActive;
    }
    
    struct WeekData {
        uint256 totalPPR;
        uint256 totalBurnAmount;
        uint256 totalEmissionAmount;
        uint256 stakingRewardsDistributed;
        uint256 tradingFeesCollected;
        bool isProcessed;
    }
    
    mapping(address => PlayerStats) public playerStats;
    mapping(address => StakingPosition) public stakingPositions;
    mapping(uint256 => WeekData) public weekData; // week number => week data
    address[] public activePlayers;
    
    // Events
    event PlayerAdded(address indexed player, string name);
    event WeekUpdated(address indexed player, uint256 pprPoints, uint256 burnAmount, uint256 emissionAmount);
    event TokensBurned(address indexed player, uint256 amount, uint256 pprPoints);
    event TokensEmitted(address indexed player, uint256 amount, uint256 pprPoints);
    event Staked(address indexed user, uint256 amount, uint256 lockEndTime);
    event Unstaked(address indexed user, uint256 amount);
    event RewardsClaimed(address indexed user, uint256 amount);
    event TradingFeeCollected(uint256 amount);
    event WeekProcessed(uint256 weekNumber, uint256 totalBurn, uint256 totalEmission, uint256 stakingRewards);
    
    constructor() ERC20("Player Stock Token", "PST") {
        _mint(msg.sender, INITIAL_SUPPLY);
        currentWeek = 1;
        lastWeekUpdate = block.timestamp;
    }
    
    // ========== PLAYER MANAGEMENT ==========
    
    function addPlayer(address player, string memory name) external onlyOwner {
        require(!playerStats[player].isActive, "Player already exists");
        
        playerStats[player] = PlayerStats({
            lastWeekPPR: 0,
            currentWeekPPR: 0,
            totalBurned: 0,
            totalEmitted: 0,
            marketCap: 0,
            isActive: true,
            lastWeekUpdate: 0
        });
        
        activePlayers.push(player);
        emit PlayerAdded(player, name);
    }
    
    // ========== WEEKLY UPDATE SYSTEM ==========
    
    function updatePlayerWeek(address player, uint256 pprPoints) external onlyOwner {
        require(playerStats[player].isActive, "Player not found");
        require(block.timestamp >= lastWeekUpdate + NFL_WEEK_DURATION, "Week not elapsed");
        
        PlayerStats storage stats = playerStats[player];
        stats.lastWeekPPR = stats.currentWeekPPR;
        stats.currentWeekPPR = pprPoints;
        stats.lastWeekUpdate = block.timestamp;
        
        // Calculate burn/emission based on PPR performance
        (uint256 burnAmount, uint256 emissionAmount) = _calculateTokenomics(player, pprPoints);
        
        if (burnAmount > 0) {
            _burnTokens(player, burnAmount, pprPoints);
        }
        
        if (emissionAmount > 0) {
            _emitTokens(player, emissionAmount, pprPoints);
        }
        
        // Update week data
        WeekData storage week = weekData[currentWeek];
        week.totalPPR = week.totalPPR.add(pprPoints);
        week.totalBurnAmount = week.totalBurnAmount.add(burnAmount);
        week.totalEmissionAmount = week.totalEmissionAmount.add(emissionAmount);
        
        emit WeekUpdated(player, pprPoints, burnAmount, emissionAmount);
    }
    
    function processWeekEnd() external onlyOwner {
        require(block.timestamp >= lastWeekUpdate + NFL_WEEK_DURATION, "Week not elapsed");
        
        WeekData storage week = weekData[currentWeek];
        require(!week.isProcessed, "Week already processed");
        
        // Distribute staking rewards
        uint256 stakingRewards = _distributeStakingRewards();
        week.stakingRewardsDistributed = stakingRewards;
        week.tradingFeesCollected = totalTradingFees;
        week.isProcessed = true;
        
        // Move to next week
        currentWeek = currentWeek.add(1);
        lastWeekUpdate = block.timestamp;
        
        emit WeekProcessed(currentWeek.sub(1), week.totalBurnAmount, week.totalEmissionAmount, stakingRewards);
    }
    
    // ========== TOKENOMICS CALCULATIONS ==========
    
    function _calculateTokenomics(address player, uint256 pprPoints) internal view returns (uint256 burnAmount, uint256 emissionAmount) {
        PlayerStats storage stats = playerStats[player];
        uint256 playerSupply = balanceOf(player);
        
        // No burn/emission for 0 PPR (injured players)
        if (pprPoints == 0) {
            return (0, 0);
        }
        
        // Calculate performance ratio (current PPR vs last week PPR)
        uint256 performanceRatio;
        if (stats.lastWeekPPR == 0) {
            performanceRatio = pprPoints; // First week performance
        } else {
            performanceRatio = pprPoints > stats.lastWeekPPR ? 
                pprPoints.sub(stats.lastWeekPPR) : 
                stats.lastWeekPPR.sub(pprPoints);
        }
        
        // Dynamic burn rate based on PPR performance
        // Formula: burnRate = min(MAX_BURN_RATE_BPS, (pprPoints * 10) / 1000)
        uint256 burnRate = _calculateBurnRate(pprPoints);
        
        if (pprPoints > stats.lastWeekPPR) {
            // Good week - burn tokens
            burnAmount = playerSupply.mul(burnRate).mul(performanceRatio).div(10000).div(100);
        } else if (pprPoints < stats.lastWeekPPR) {
            // Bad week - emit tokens (but at a lower rate)
            uint256 emissionRate = burnRate.div(2); // Emission is half the burn rate
            emissionAmount = playerSupply.mul(emissionRate).mul(performanceRatio).div(10000).div(100);
        }
        
        // Ensure minimum PPR threshold for burn
        if (pprPoints < MIN_PPR_FOR_BURN) {
            burnAmount = 0;
        }
    }
    
    function _calculateBurnRate(uint256 pprPoints) internal pure returns (uint256) {
        // Formula: burnRate = min(MAX_BURN_RATE_BPS, (pprPoints * 10) / 1000)
        uint256 calculatedRate = pprPoints.mul(10).div(1000);
        return calculatedRate > MAX_BURN_RATE_BPS ? MAX_BURN_RATE_BPS : calculatedRate;
    }
    
    // ========== STAKING SYSTEM ==========
    
    function stake(uint256 amount) external nonReentrant {
        require(amount > 0, "Cannot stake 0 tokens");
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");
        
        // Transfer tokens to contract
        _transfer(msg.sender, address(this), amount);
        
        // Create or update staking position
        StakingPosition storage position = stakingPositions[msg.sender];
        
        if (position.isActive) {
            // Add to existing position
            position.amount = position.amount.add(amount);
        } else {
            // Create new position
            position.amount = amount;
            position.startTime = block.timestamp;
            position.lockEndTime = block.timestamp.add(NFL_WEEK_DURATION);
            position.lastRewardClaim = currentWeek;
            position.isActive = true;
        }
        
        totalStaked = totalStaked.add(amount);
        emit Staked(msg.sender, amount, position.lockEndTime);
    }
    
    function unstake() external nonReentrant {
        StakingPosition storage position = stakingPositions[msg.sender];
        require(position.isActive, "No active staking position");
        require(block.timestamp >= position.lockEndTime, "Lock period not ended");
        
        uint256 stakedAmount = position.amount;
        
        // Claim any pending rewards first
        uint256 pendingRewards = _calculatePendingRewards(msg.sender);
        if (pendingRewards > 0) {
            _mint(msg.sender, pendingRewards);
            emit RewardsClaimed(msg.sender, pendingRewards);
        }
        
        // Reset position
        position.amount = 0;
        position.isActive = false;
        
        totalStaked = totalStaked.sub(stakedAmount);
        
        // Transfer staked tokens back
        _transfer(address(this), msg.sender, stakedAmount);
        emit Unstaked(msg.sender, stakedAmount);
    }
    
    function claimRewards() external nonReentrant {
        uint256 pendingRewards = _calculatePendingRewards(msg.sender);
        require(pendingRewards > 0, "No rewards to claim");
        
        StakingPosition storage position = stakingPositions[msg.sender];
        position.lastRewardClaim = currentWeek;
        
        _mint(msg.sender, pendingRewards);
        emit RewardsClaimed(msg.sender, pendingRewards);
    }
    
    function _calculatePendingRewards(address user) internal view returns (uint256) {
        StakingPosition storage position = stakingPositions[user];
        if (!position.isActive || totalStaked == 0) return 0;
        
        uint256 weeksSinceLastClaim = currentWeek.sub(position.lastRewardClaim);
        if (weeksSinceLastClaim == 0) return 0;
        
        // Calculate rewards based on staked amount and trading fees
        uint256 userShare = position.amount.mul(1e18).div(totalStaked);
        uint256 weeklyReward = totalTradingFees.mul(STAKING_REWARD_BPS).div(10000);
        uint256 userReward = weeklyReward.mul(userShare).div(1e18);
        
        return userReward.mul(weeksSinceLastClaim);
    }
    
    function _distributeStakingRewards() internal returns (uint256) {
        if (totalStaked == 0) return 0;
        
        uint256 totalRewards = totalTradingFees.mul(STAKING_REWARD_BPS).div(10000);
        totalTradingFees = totalTradingFees.sub(totalRewards);
        
        return totalRewards;
    }
    
    // ========== TRADING FEE SYSTEM ==========
    
    function _beforeTokenTransfer(address from, address to, uint256 amount)
        internal
        whenNotPaused
        override
    {
        super._beforeTokenTransfer(from, to, amount);
        
        // Apply trading fee (exclude minting, burning, and staking operations)
        if (from != address(0) && to != address(0) && 
            from != address(this) && to != address(this)) {
            
            uint256 feeAmount = amount.mul(TRADING_FEE_BPS).div(10000);
            uint256 transferAmount = amount.sub(feeAmount);
            
            // Transfer fee to contract
            _transfer(from, address(this), feeAmount);
            totalTradingFees = totalTradingFees.add(feeAmount);
            
            emit TradingFeeCollected(feeAmount);
            
            // Update the actual transfer amount
            amount = transferAmount;
        }
    }
    
    // ========== INTERNAL FUNCTIONS ==========
    
    function _burnTokens(address player, uint256 burnAmount, uint256 pprPoints) internal {
        if (burnAmount > 0) {
            _burn(player, burnAmount);
            playerStats[player].totalBurned = playerStats[player].totalBurned.add(burnAmount);
            emit TokensBurned(player, burnAmount, pprPoints);
        }
    }
    
    function _emitTokens(address player, uint256 emissionAmount, uint256 pprPoints) internal {
        if (emissionAmount > 0) {
            _mint(player, emissionAmount);
            playerStats[player].totalEmitted = playerStats[player].totalEmitted.add(emissionAmount);
            emit TokensEmitted(player, emissionAmount, pprPoints);
        }
    }
    
    // ========== VIEW FUNCTIONS ==========
    
    function getActivePlayers() external view returns (address[] memory) {
        return activePlayers;
    }
    
    function getPlayerStats(address player) external view returns (PlayerStats memory) {
        return playerStats[player];
    }
    
    function getStakingPosition(address user) external view returns (StakingPosition memory) {
        return stakingPositions[user];
    }
    
    function getWeekData(uint256 week) external view returns (WeekData memory) {
        return weekData[week];
    }
    
    function getPendingRewards(address user) external view returns (uint256) {
        return _calculatePendingRewards(user);
    }
    
    function getBurnRateForPPR(uint256 pprPoints) external pure returns (uint256) {
        return _calculateBurnRate(pprPoints);
    }
    
    // ========== ADMIN FUNCTIONS ==========
    
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
    
    function updateMarketCap(address player, uint256 marketCap) external onlyOwner {
        require(playerStats[player].isActive, "Player not found");
        playerStats[player].marketCap = marketCap;
    }
} 