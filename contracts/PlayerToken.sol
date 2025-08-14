// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract PlayerToken is ERC20, Ownable, Pausable, ReentrancyGuard {
    
    // Tokenomics Constants
    uint256 public constant INITIAL_SUPPLY = 50_000_000 * 10**18; // 50M tokens
    uint256 public constant NFL_WEEK_DURATION = 7 days; // 1 week lock period
    uint256 public constant TRADING_FEE_BPS = 25; // 0.25% trading fee (FIXED)
    uint256 public constant BASE_STAKING_REWARD_BPS = 50; // 0.5% base staking reward
    uint256 public constant MIN_PPR_FOR_BURN = 1; // Minimum PPR points to trigger burn
    
    // Protocol state
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
    
    struct PlayerStakingPosition {
        address player;           // Which player's tokens are staked
        uint256 amount;          // Amount of player tokens staked
        uint256 startTime;       // When staking started
        uint256 lockEndTime;     // When lock period ends
        uint256 lastRewardClaim; // Last week rewards were claimed
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
    mapping(address => PlayerStakingPosition[]) public userPlayerStakes;
    mapping(address => uint256) public playerTotalStaked; // Total staked per player
    mapping(uint256 => WeekData) public weekData; // week number => week data
    address[] public activePlayers;
    
    // Events
    event PlayerAdded(address indexed player, string name);
    event WeekUpdated(address indexed player, uint256 pprPoints, uint256 burnAmount, uint256 emissionAmount);
    event TokensBurned(address indexed player, uint256 amount, uint256 pprPoints);
    event TokensEmitted(address indexed player, uint256 amount, uint256 pprPoints);
    event PlayerStaked(address indexed user, address indexed player, uint256 amount, uint256 lockEndTime);
    event PlayerUnstaked(address indexed user, address indexed player, uint256 amount);
    event PlayerRewardsClaimed(address indexed user, address indexed player, uint256 amount);
    event TradingFeeCollected(uint256 amount);
    event WeekProcessed(uint256 weekNumber, uint256 totalBurn, uint256 totalEmission, uint256 stakingRewards);
    
    constructor() ERC20("Player Stock Token", "PST") Ownable(msg.sender) {
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
        week.totalPPR = week.totalPPR + pprPoints;
        week.totalBurnAmount = week.totalBurnAmount + burnAmount;
        week.totalEmissionAmount = week.totalEmissionAmount + emissionAmount;
        
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
        currentWeek = currentWeek + 1;
        lastWeekUpdate = block.timestamp;
        
        emit WeekProcessed(currentWeek - 1, week.totalBurnAmount, week.totalEmissionAmount, stakingRewards);
    }
    
    // ========== IMPROVED TOKENOMICS CALCULATIONS ==========
    
    function _calculateTokenomics(address player, uint256 pprPoints) internal view returns (uint256 burnAmount, uint256 emissionAmount) {
        PlayerStats storage stats = playerStats[player];
        uint256 playerSupply = balanceOf(player);
        
        // No changes for 0 PPR (injured players)
        if (pprPoints == 0) {
            return (0, 0);
        }
        
        // Calculate performance change
        int256 performanceChange;
        if (stats.lastWeekPPR == 0) {
            performanceChange = int256(pprPoints); // First week
        } else {
            performanceChange = int256(pprPoints) - int256(stats.lastWeekPPR);
        }
        
        // Base rate: 0.1% of supply
        uint256 baseRate = playerSupply * 10 / 10000; // 0.1%
        
        if (performanceChange > 0) {
            // Good performance = BURN tokens (deflationary pressure)
            // Scale burn by performance improvement
            uint256 improvement = uint256(performanceChange);
            uint256 burnMultiplier = _min(improvement * 2, 10); // Max 10x multiplier
            burnAmount = baseRate * burnMultiplier / 10;
        } else if (performanceChange < 0) {
            // Bad performance = EMIT tokens (inflationary pressure)
            // Scale emission by performance decline (but capped lower)
            uint256 decline = uint256(-performanceChange);
            uint256 emissionMultiplier = _min(decline, 5); // Max 5x multiplier
            emissionAmount = baseRate * emissionMultiplier / 10;
        }
        
        // Ensure minimum PPR threshold for burn
        if (pprPoints < MIN_PPR_FOR_BURN) {
            burnAmount = 0;
        }
    }
    
    function _min(uint256 a, uint256 b) internal pure returns (uint256) {
        return a < b ? a : b;
    }
    
    // ========== PLAYER-SPECIFIC STAKING SYSTEM ==========
    
    function stakePlayerTokens(address player, uint256 amount) external nonReentrant {
        require(amount > 0, "Cannot stake 0 tokens");
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");
        require(playerStats[player].isActive, "Player not found");
        
        // Transfer tokens to contract
        _transfer(msg.sender, address(this), amount);
        
        // Create staking position
        PlayerStakingPosition memory position = PlayerStakingPosition({
            player: player,
            amount: amount,
            startTime: block.timestamp,
            lockEndTime: block.timestamp + NFL_WEEK_DURATION,
            lastRewardClaim: currentWeek,
            isActive: true
        });
        
        userPlayerStakes[msg.sender].push(position);
        playerTotalStaked[player] = playerTotalStaked[player] + amount;
        
        emit PlayerStaked(msg.sender, player, amount, position.lockEndTime);
    }
    
    function unstakePlayerTokens(uint256 stakeIndex) external nonReentrant {
        require(stakeIndex < userPlayerStakes[msg.sender].length, "Invalid stake index");
        
        PlayerStakingPosition storage position = userPlayerStakes[msg.sender][stakeIndex];
        require(position.isActive, "Stake not active");
        require(block.timestamp >= position.lockEndTime, "Lock period not ended");
        
        uint256 stakedAmount = position.amount;
        address player = position.player;
        
        // Claim any pending rewards first
        uint256 pendingRewards = calculatePlayerStakingRewards(msg.sender, stakeIndex);
        if (pendingRewards > 0) {
            _mint(msg.sender, pendingRewards);
            emit PlayerRewardsClaimed(msg.sender, player, pendingRewards);
        }
        
        // Reset position
        position.isActive = false;
        playerTotalStaked[player] = playerTotalStaked[player] - stakedAmount;
        
        // Transfer staked tokens back
        _transfer(address(this), msg.sender, stakedAmount);
        emit PlayerUnstaked(msg.sender, player, stakedAmount);
    }
    
    function claimPlayerRewards(uint256 stakeIndex) external nonReentrant {
        require(stakeIndex < userPlayerStakes[msg.sender].length, "Invalid stake index");
        
        PlayerStakingPosition storage position = userPlayerStakes[msg.sender][stakeIndex];
        require(position.isActive, "Stake not active");
        
        uint256 pendingRewards = calculatePlayerStakingRewards(msg.sender, stakeIndex);
        require(pendingRewards > 0, "No rewards to claim");
        
        position.lastRewardClaim = currentWeek;
        
        _mint(msg.sender, pendingRewards);
        emit PlayerRewardsClaimed(msg.sender, position.player, pendingRewards);
    }
    
    function calculatePlayerStakingRewards(address user, uint256 stakeIndex) public view returns (uint256) {
        if (stakeIndex >= userPlayerStakes[user].length) return 0;
        
        PlayerStakingPosition storage position = userPlayerStakes[user][stakeIndex];
        if (!position.isActive) return 0;
        
        uint256 weeksSinceLastClaim = currentWeek - position.lastRewardClaim;
        if (weeksSinceLastClaim == 0) return 0;
        
        // Base reward: 0.5% of staked amount per week
        uint256 baseReward = position.amount * BASE_STAKING_REWARD_BPS / 10000;
        
        // Performance multiplier based on player's recent performance
        uint256 performanceMultiplier = _calculatePerformanceMultiplier(position.player);
        
        uint256 totalReward = baseReward * performanceMultiplier / 100;
        return totalReward * weeksSinceLastClaim;
    }
    
    function _calculatePerformanceMultiplier(address player) internal view returns (uint256) {
        PlayerStats storage stats = playerStats[player];
        
        if (stats.currentWeekPPR == 0) {
            return 100; // Base multiplier for new players
        }
        
        // Compare current week to last week
        if (stats.currentWeekPPR > stats.lastWeekPPR) {
            // Good performance = higher rewards
            uint256 improvement = stats.currentWeekPPR - stats.lastWeekPPR;
            uint256 bonus = _min(improvement * 5, 100); // Max 100% bonus
            return 100 + bonus; // 100% to 200%
        } else if (stats.currentWeekPPR < stats.lastWeekPPR) {
            // Bad performance = lower rewards
            uint256 decline = stats.lastWeekPPR - stats.currentWeekPPR;
            uint256 penalty = _min(decline * 3, 80); // Max 80% penalty
            return 100 > penalty ? 100 - penalty : 20; // 20% to 100%
        }
        
        return 100; // Same performance = base rewards
    }
    
    function _distributeStakingRewards() internal returns (uint256) {
        uint256 totalRewards = totalTradingFees * BASE_STAKING_REWARD_BPS / 10000;
        totalTradingFees = totalTradingFees - totalRewards;
        
        return totalRewards;
    }
    
    // ========== SIMPLIFIED TRADING FEE SYSTEM ==========
    
    function _update(address from, address to, uint256 amount)
        internal
        whenNotPaused
        override
    {
        // Apply fixed trading fee (exclude minting, burning, and staking operations)
        if (from != address(0) && to != address(0) && 
            from != address(this) && to != address(this)) {
            
            uint256 feeAmount = amount * TRADING_FEE_BPS / 10000;
            uint256 transferAmount = amount - feeAmount;
            
            // Transfer fee to contract
            _transfer(from, address(this), feeAmount);
            totalTradingFees = totalTradingFees + feeAmount;
            
            emit TradingFeeCollected(feeAmount);
            
            // Update with the reduced amount
            super._update(from, to, transferAmount);
        } else {
            super._update(from, to, amount);
        }
    }
    
    // ========== INTERNAL FUNCTIONS ==========
    
    function _burnTokens(address player, uint256 burnAmount, uint256 pprPoints) internal {
        if (burnAmount > 0) {
            _burn(player, burnAmount);
            playerStats[player].totalBurned = playerStats[player].totalBurned + burnAmount;
            emit TokensBurned(player, burnAmount, pprPoints);
        }
    }
    
    function _emitTokens(address player, uint256 emissionAmount, uint256 pprPoints) internal {
        if (emissionAmount > 0) {
            _mint(player, emissionAmount);
            playerStats[player].totalEmitted = playerStats[player].totalEmitted + emissionAmount;
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
    
    function getUserPlayerStakes(address user) external view returns (PlayerStakingPosition[] memory) {
        return userPlayerStakes[user];
    }
    
    function getPlayerTotalStaked(address player) external view returns (uint256) {
        return playerTotalStaked[player];
    }
    
    function getWeekData(uint256 week) external view returns (WeekData memory) {
        return weekData[week];
    }
    
    function getPerformanceMultiplier(address player) external view returns (uint256) {
        return _calculatePerformanceMultiplier(player);
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