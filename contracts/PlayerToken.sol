// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";

contract PlayerToken is ERC20, Ownable, Pausable, ReentrancyGuard {
    using Math for uint256;
    
    // Tokenomics Constants
    uint256 public constant INITIAL_SUPPLY = 50_000_000 * 10**18; // 50M tokens
    uint256 public constant NFL_WEEK_DURATION = 7 days;
    uint256 public constant TRADING_FEE_BPS = 25; // 0.25% trading fee
    uint256 public constant BASE_STAKING_REWARD_BPS = 50; // 0.5% base staking reward
    uint256 public constant MIN_PPR_FOR_BURN = 1;
    
    // Enhanced Burn Mechanics
    uint256 public constant WEEKLY_BURN_TARGET_BPS = 500; // 5% of circulating supply target
    uint256 public constant MAX_WEEKLY_BURN_BPS = 1000; // 10% max burn per week
    uint256 public constant MIN_WEEKLY_BURN_BPS = 100; // 1% min burn per week
    
    // Performance Calculation Constants
    uint256 public constant PERFORMANCE_HISTORY_WEEKS = 8; // Track 8 weeks of performance
    uint256 public constant STANDARD_DEVIATION_MULTIPLIER = 150; // 150% bonus for 1 std dev above mean
    uint256 public constant VARIANCE_PENALTY_MULTIPLIER = 75; // 75% penalty for high variance
    
    // Protocol state
    uint256 public totalTradingFees;
    uint256 public currentWeek;
    uint256 public lastWeekUpdate;
    uint256 public circulatingSupply;
    uint256 public lockedSupply;
    uint256 public protocolTreasury; // Tokens held by protocol for operations
    
    struct PlayerStats {
        uint256 lastWeekPPR;
        uint256 currentWeekPPR;
        uint256 totalBurned;
        uint256 totalEmitted;
        uint256 marketCap;
        bool isActive;
        uint256 lastWeekUpdate;
        
        // Enhanced performance tracking
        uint256[8] pprHistory; // Last 8 weeks of PPR
        uint256 historyIndex; // Current position in circular buffer
        uint256 totalPPR; // Sum of all PPR values
        uint256 pprVariance; // Variance in performance
        uint256 averagePPR; // Rolling average
        uint256 performanceScore; // Calculated performance score
    }
    
    struct PlayerStakingPosition {
        address player;
        uint256 amount;
        uint256 startTime;
        uint256 lockEndTime;
        uint256 lastRewardClaim;
        bool isActive;
        uint256 performanceMultiplier; // Stored multiplier at stake time
    }
    
    struct WeekData {
        uint256 totalPPR;
        uint256 totalBurnAmount;
        uint256 totalEmissionAmount;
        uint256 stakingRewardsDistributed;
        uint256 tradingFeesCollected;
        uint256 leagueAveragePPR;
        uint256 leagueStandardDeviation;
        bool isProcessed;
    }
    
    struct LeagueStats {
        uint256 totalActivePlayers;
        uint256 totalPPR;
        uint256 averagePPR;
        uint256 standardDeviation;
        uint256 totalVariance;
    }
    
    mapping(address => PlayerStats) public playerStats;
    mapping(address => PlayerStakingPosition[]) public userPlayerStakes;
    mapping(address => uint256) public playerTotalStaked;
    mapping(uint256 => WeekData) public weekData;
    mapping(uint256 => LeagueStats) public leagueStats;
    address[] public activePlayers;
    
    // Events
    event PlayerAdded(address indexed player, string name);
    event WeekUpdated(address indexed player, uint256 pprPoints, uint256 burnAmount, uint256 emissionAmount, uint256 performanceScore);
    event TokensBurned(address indexed player, uint256 amount, uint256 pprPoints, uint256 burnPercentage);
    event TokensEmitted(address indexed player, uint256 amount, uint256 pprPoints);
    event PlayerStaked(address indexed user, address indexed player, uint256 amount, uint256 lockEndTime, uint256 performanceMultiplier);
    event PlayerUnstaked(address indexed user, address indexed player, uint256 amount);
    event PlayerRewardsClaimed(address indexed user, address indexed player, uint256 amount, uint256 multiplier);
    event TradingFeeCollected(uint256 amount);
    event WeekProcessed(uint256 weekNumber, uint256 totalBurn, uint256 totalEmission, uint256 stakingRewards, uint256 leagueAveragePPR);
    event LeagueStatsUpdated(uint256 week, uint256 averagePPR, uint256 standardDeviation, uint256 totalVariance);
    event TreasuryUpdated(uint256 newTreasuryAmount, uint256 changeAmount, bool isBurn);
    
    constructor() ERC20("Player Stock Token", "PST") Ownable(msg.sender) {
        _mint(msg.sender, INITIAL_SUPPLY);
        circulatingSupply = INITIAL_SUPPLY;
        lockedSupply = 0;
        protocolTreasury = 0; // Initialize treasury
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
            lastWeekUpdate: 0,
            pprHistory: [uint256(0), uint256(0), uint256(0), uint256(0), uint256(0), uint256(0), uint256(0), uint256(0)],
            historyIndex: 0,
            totalPPR: 0,
            pprVariance: 0,
            averagePPR: 0,
            performanceScore: 0
        });
        
        activePlayers.push(player);
        emit PlayerAdded(player, name);
    }
    
    // ========== ENHANCED WEEKLY UPDATE SYSTEM ==========
    
    function updatePlayerWeek(address player, uint256 pprPoints) external onlyOwner {
        require(playerStats[player].isActive, "Player not found");
        require(block.timestamp >= lastWeekUpdate + NFL_WEEK_DURATION, "Week not elapsed");
        
        PlayerStats storage stats = playerStats[player];
        stats.lastWeekPPR = stats.currentWeekPPR;
        stats.currentWeekPPR = pprPoints;
        stats.lastWeekUpdate = block.timestamp;
        
        // Update performance history
        _updatePlayerPerformanceHistory(player, pprPoints);
        
        // Calculate performance score
        stats.performanceScore = _calculatePerformanceScore(player);
        
        // Calculate burn/emission based on enhanced tokenomics
        (uint256 burnAmount, uint256 emissionAmount) = _calculateEnhancedTokenomics(player, pprPoints);
        
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
        
        emit WeekUpdated(player, pprPoints, burnAmount, emissionAmount, stats.performanceScore);
    }
    
    function processWeekEnd() external onlyOwner {
        require(block.timestamp >= lastWeekUpdate + NFL_WEEK_DURATION, "Week not elapsed");
        
        WeekData storage week = weekData[currentWeek];
        require(!week.isProcessed, "Week already processed");
        
        // Calculate league statistics
        LeagueStats memory league = _calculateLeagueStats();
        leagueStats[currentWeek] = league;
        week.leagueAveragePPR = league.averagePPR;
        week.leagueStandardDeviation = league.standardDeviation;
        
        // Distribute staking rewards with enhanced calculations
        uint256 stakingRewards = _distributeEnhancedStakingRewards(league);
        week.stakingRewardsDistributed = stakingRewards;
        week.tradingFeesCollected = totalTradingFees;
        week.isProcessed = true;
        
        // Move to next week
        currentWeek = currentWeek + 1;
        lastWeekUpdate = block.timestamp;
        
        emit WeekProcessed(currentWeek - 1, week.totalBurnAmount, week.totalEmissionAmount, stakingRewards, league.averagePPR);
        emit LeagueStatsUpdated(currentWeek - 1, league.averagePPR, league.standardDeviation, league.totalVariance);
    }
    
    // ========== ENHANCED PERFORMANCE CALCULATIONS ==========
    
    function _updatePlayerPerformanceHistory(address player, uint256 pprPoints) internal {
        PlayerStats storage stats = playerStats[player];
        
        // Remove old PPR from total
        stats.totalPPR = stats.totalPPR - stats.pprHistory[stats.historyIndex];
        
        // Add new PPR
        stats.pprHistory[stats.historyIndex] = pprPoints;
        stats.totalPPR = stats.totalPPR + pprPoints;
        
        // Update circular buffer index
        stats.historyIndex = (stats.historyIndex + 1) % PERFORMANCE_HISTORY_WEEKS;
        
        // Calculate new average
        stats.averagePPR = stats.totalPPR / PERFORMANCE_HISTORY_WEEKS;
        
        // Calculate variance
        uint256 varianceSum = 0;
        for (uint256 i = 0; i < PERFORMANCE_HISTORY_WEEKS; i++) {
            if (stats.pprHistory[i] > 0) { // Only count non-zero weeks
                uint256 diff = stats.pprHistory[i] > stats.averagePPR ? 
                    stats.pprHistory[i] - stats.averagePPR : 
                    stats.averagePPR - stats.pprHistory[i];
                varianceSum = varianceSum + (diff * diff);
            }
        }
        stats.pprVariance = varianceSum / PERFORMANCE_HISTORY_WEEKS;
    }
    
    function _calculatePerformanceScore(address player) internal view returns (uint256) {
        PlayerStats storage stats = playerStats[player];
        
        if (stats.averagePPR == 0) return 0;
        
        // Get current league stats
        LeagueStats memory league = _calculateLeagueStats();
        if (league.averagePPR == 0) return stats.averagePPR;
        
        // Calculate standard deviation bonus/penalty
        int256 deviationFromMean = int256(stats.averagePPR) - int256(league.averagePPR);
        uint256 deviationBonus = 0;
        
        if (league.standardDeviation > 0) {
            uint256 deviationMultiplier = uint256(deviationFromMean > 0 ? deviationFromMean : -deviationFromMean) * 100 / league.standardDeviation;
            if (deviationFromMean > 0) {
                // Above average performance
                deviationBonus = deviationMultiplier * STANDARD_DEVIATION_MULTIPLIER / 100;
            } else {
                // Below average performance
                deviationBonus = deviationMultiplier * 50 / 100; // Reduced bonus for below average
            }
        }
        
        // Calculate variance penalty
        uint256 variancePenalty = 0;
        if (league.averagePPR > 0) {
            uint256 normalizedVariance = stats.pprVariance * 100 / (league.averagePPR * league.averagePPR);
            variancePenalty = normalizedVariance * VARIANCE_PENALTY_MULTIPLIER / 100;
        }
        
        // Final performance score
        uint256 baseScore = stats.averagePPR;
        uint256 adjustedScore = baseScore + deviationBonus;
        
        if (variancePenalty > adjustedScore) {
            return 0; // Prevent negative scores
        }
        
        return adjustedScore - variancePenalty;
    }
    
    function _calculateLeagueStats() internal view returns (LeagueStats memory) {
        uint256 totalPPR = 0;
        uint256 activeCount = 0;
        uint256 totalVariance = 0;
        
        // Calculate total PPR and count active players
        for (uint256 i = 0; i < activePlayers.length; i++) {
            PlayerStats storage stats = playerStats[activePlayers[i]];
            if (stats.isActive && stats.averagePPR > 0) {
                totalPPR = totalPPR + stats.averagePPR;
                activeCount = activeCount + 1;
                totalVariance = totalVariance + stats.pprVariance;
            }
        }
        
        if (activeCount == 0) {
            return LeagueStats(0, 0, 0, 0, 0);
        }
        
        uint256 averagePPR = totalPPR / activeCount;
        
        // Calculate standard deviation
        uint256 varianceSum = 0;
        for (uint256 i = 0; i < activePlayers.length; i++) {
            PlayerStats storage stats = playerStats[activePlayers[i]];
            if (stats.isActive && stats.averagePPR > 0) {
                uint256 diff = stats.averagePPR > averagePPR ? 
                    stats.averagePPR - averagePPR : 
                    averagePPR - stats.averagePPR;
                varianceSum = varianceSum + (diff * diff);
            }
        }
        
        uint256 standardDeviation = Math.sqrt(varianceSum / activeCount);
        
        return LeagueStats(activeCount, totalPPR, averagePPR, standardDeviation, totalVariance);
    }
    
    // ========== ENHANCED TOKENOMICS CALCULATIONS ==========
    
    function _calculateEnhancedTokenomics(address player, uint256 pprPoints) internal view returns (uint256 burnAmount, uint256 emissionAmount) {
        // Remove playerSupply calculation - we use treasury instead
        // uint256 playerSupply = balanceOf(player);
        
        // No changes for 0 PPR (injured players)
        if (pprPoints == 0) {
            return (0, 0);
        }
        
        // Calculate performance score
        uint256 performanceScore = _calculatePerformanceScore(player);
        
        // Get league stats for comparison
        LeagueStats memory league = _calculateLeagueStats();
        
        if (performanceScore > 0 && league.averagePPR > 0) {
            // Calculate burn based on performance vs league average
            uint256 performanceRatio = performanceScore * 100 / league.averagePPR;
            
            if (performanceRatio >= 100) {
                // Above average performance = BURN from treasury (deflationary)
                uint256 burnPercentage = _calculateBurnPercentage(performanceRatio);
                burnAmount = protocolTreasury * burnPercentage / 10000; // Use treasury instead of playerSupply
            } else {
                // Below average performance = EMIT to treasury (inflationary, but limited)
                uint256 emissionPercentage = _calculateEmissionPercentage(performanceRatio);
                emissionAmount = protocolTreasury * emissionPercentage / 10000; // Use treasury instead of playerSupply
            }
        }
        
        // Ensure minimum PPR threshold for burn
        if (pprPoints < MIN_PPR_FOR_BURN) {
            burnAmount = 0;
        }
    }
    
    function _calculateBurnPercentage(uint256 performanceRatio) internal pure returns (uint256) {
        // Base burn rate based on performance ratio
        uint256 baseBurnRate = WEEKLY_BURN_TARGET_BPS; // 5% target
        
        // Scale based on performance ratio (100% = average, 150% = 1.5x average)
        uint256 performanceMultiplier = performanceRatio * 100 / 100; // Normalize to basis points
        
        // Cap the multiplier to prevent excessive burns
        if (performanceMultiplier > 300) { // Max 3x multiplier
            performanceMultiplier = 300;
        }
        
        uint256 burnPercentage = baseBurnRate * performanceMultiplier / 100;
        
        // Ensure within bounds
        if (burnPercentage > MAX_WEEKLY_BURN_BPS) {
            burnPercentage = MAX_WEEKLY_BURN_BPS;
        } else if (burnPercentage < MIN_WEEKLY_BURN_BPS) {
            burnPercentage = MIN_WEEKLY_BURN_BPS;
        }
        
        return burnPercentage;
    }
    
    function _calculateEmissionPercentage(uint256 performanceRatio) internal pure returns (uint256) {
        // Limited emission for below-average performance
        uint256 baseEmissionRate = 100; // 1% base emission
        
        // Scale down emission based on how far below average
        uint256 emissionMultiplier = 100 - performanceRatio; // Inverse relationship
        
        // Cap emission to prevent excessive inflation
        if (emissionMultiplier > 200) { // Max 2x emission
            emissionMultiplier = 200;
        }
        
        uint256 emissionPercentage = baseEmissionRate * emissionMultiplier / 100;
        
        // Cap at 2% max emission
        if (emissionPercentage > 200) {
            emissionPercentage = 200;
        }
        
        return emissionPercentage;
    }
    
    // ========== ENHANCED STAKING SYSTEM ==========
    
    function stakePlayerTokens(address player, uint256 amount) external nonReentrant {
        require(amount > 0, "Cannot stake 0 tokens");
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");
        require(playerStats[player].isActive, "Player not found");
        
        // Calculate current performance multiplier
        uint256 performanceMultiplier = _calculateStakingMultiplier(player);
        
        // Transfer tokens to contract
        _transfer(msg.sender, address(this), amount);
        
        // Update supply tracking
        circulatingSupply = circulatingSupply - amount;
        lockedSupply = lockedSupply + amount;
        
        // Create staking position
        PlayerStakingPosition memory position = PlayerStakingPosition({
            player: player,
            amount: amount,
            startTime: block.timestamp,
            lockEndTime: block.timestamp + NFL_WEEK_DURATION,
            lastRewardClaim: currentWeek,
            isActive: true,
            performanceMultiplier: performanceMultiplier
        });
        
        userPlayerStakes[msg.sender].push(position);
        playerTotalStaked[player] = playerTotalStaked[player] + amount;
        
        emit PlayerStaked(msg.sender, player, amount, position.lockEndTime, performanceMultiplier);
    }
    
    function unstakePlayerTokens(uint256 stakeIndex) external nonReentrant {
        require(stakeIndex < userPlayerStakes[msg.sender].length, "Invalid stake index");
        
        PlayerStakingPosition storage position = userPlayerStakes[msg.sender][stakeIndex];
        require(position.isActive, "Stake not active");
        require(block.timestamp >= position.lockEndTime, "Lock period not ended");
        
        uint256 stakedAmount = position.amount;
        address player = position.player;
        
        // Claim any pending rewards first
        uint256 pendingRewards = calculateEnhancedStakingRewards(msg.sender, stakeIndex);
        if (pendingRewards > 0) {
            _mint(msg.sender, pendingRewards);
            emit PlayerRewardsClaimed(msg.sender, player, pendingRewards, position.performanceMultiplier);
        }
        
        // Reset position
        position.isActive = false;
        playerTotalStaked[player] = playerTotalStaked[player] - stakedAmount;
        
        // Update supply tracking
        lockedSupply = lockedSupply - stakedAmount;
        circulatingSupply = circulatingSupply + stakedAmount;
        
        // Transfer staked tokens back
        _transfer(address(this), msg.sender, stakedAmount);
        emit PlayerUnstaked(msg.sender, player, stakedAmount);
    }
    
    function claimPlayerRewards(uint256 stakeIndex) external nonReentrant {
        require(stakeIndex < userPlayerStakes[msg.sender].length, "Invalid stake index");
        
        PlayerStakingPosition storage position = userPlayerStakes[msg.sender][stakeIndex];
        require(position.isActive, "Stake not active");
        
        uint256 pendingRewards = calculateEnhancedStakingRewards(msg.sender, stakeIndex);
        require(pendingRewards > 0, "No rewards to claim");
        
        position.lastRewardClaim = currentWeek;
        
        _mint(msg.sender, pendingRewards);
        emit PlayerRewardsClaimed(msg.sender, position.player, pendingRewards, position.performanceMultiplier);
    }
    
    function calculateEnhancedStakingRewards(address user, uint256 stakeIndex) public view returns (uint256) {
        if (stakeIndex >= userPlayerStakes[user].length) return 0;
        
        PlayerStakingPosition storage position = userPlayerStakes[user][stakeIndex];
        if (!position.isActive) return 0;
        
        uint256 weeksSinceLastClaim = currentWeek - position.lastRewardClaim;
        if (weeksSinceLastClaim == 0) return 0;
        
        // Base reward: 0.5% of staked amount per week
        uint256 baseReward = position.amount * BASE_STAKING_REWARD_BPS / 10000;
        
        // Use stored performance multiplier (frozen at stake time)
        uint256 totalReward = baseReward * position.performanceMultiplier / 100;
        return totalReward * weeksSinceLastClaim;
    }
    
    function _calculateStakingMultiplier(address player) internal view returns (uint256) {
        PlayerStats storage stats = playerStats[player];
        
        if (stats.performanceScore == 0) {
            return 100; // Base multiplier for new players
        }
        
        // Get league stats for comparison
        LeagueStats memory league = _calculateLeagueStats();
        if (league.averagePPR == 0) return 100;
        
        // Calculate performance ratio
        uint256 performanceRatio = stats.performanceScore * 100 / league.averagePPR;
        
        // Base multiplier calculation
        uint256 baseMultiplier = 100;
        
        if (performanceRatio >= 120) {
            // Top 20% performers get 150-200% multiplier
            uint256 bonus = (performanceRatio - 120) * 5; // 5% bonus per 1% above 120%
            baseMultiplier = 150 + bonus;
            if (baseMultiplier > 200) baseMultiplier = 200;
        } else if (performanceRatio >= 100) {
            // Above average performers get 100-150% multiplier
            uint256 bonus = (performanceRatio - 100) * 25 / 10; // 2.5% bonus per 1% above average
            baseMultiplier = 100 + bonus;
        } else if (performanceRatio >= 80) {
            // Below average performers get 50-100% multiplier
            uint256 penalty = (100 - performanceRatio) * 25 / 10; // 2.5% penalty per 1% below average
            baseMultiplier = 100 - penalty;
        } else {
            // Poor performers get 20-50% multiplier
            uint256 penalty = (80 - performanceRatio) * 15 / 10 + 50; // Additional penalty
            baseMultiplier = 50 - penalty;
            if (baseMultiplier < 20) baseMultiplier = 20;
        }
        
        // Apply variance penalty
        if (stats.pprVariance > 0 && league.averagePPR > 0) {
            uint256 normalizedVariance = stats.pprVariance * 100 / (league.averagePPR * league.averagePPR);
            uint256 variancePenalty = normalizedVariance * 25 / 100; // 25% penalty for high variance
            if (variancePenalty > baseMultiplier) {
                baseMultiplier = 20; // Minimum multiplier
            } else {
                baseMultiplier = baseMultiplier - variancePenalty;
            }
        }
        
        return baseMultiplier;
    }
    
    function _distributeEnhancedStakingRewards(LeagueStats memory /* league */) internal returns (uint256) {
        // Calculate total rewards from trading fees + treasury
        uint256 tradingFeeRewards = totalTradingFees * BASE_STAKING_REWARD_BPS / 10000;
        uint256 treasuryRewards = protocolTreasury * BASE_STAKING_REWARD_BPS / 10000;
        uint256 totalRewards = tradingFeeRewards + treasuryRewards;
        
        // Use trading fees first
        if (totalTradingFees >= tradingFeeRewards) {
            totalTradingFees = totalTradingFees - tradingFeeRewards;
        } else {
            totalTradingFees = 0;
        }
        
        // Supplement with treasury if needed
        if (protocolTreasury >= treasuryRewards) {
            protocolTreasury = protocolTreasury - treasuryRewards;
        } else {
            protocolTreasury = 0;
        }
        
        return totalRewards;
    }
    
    // ========== TRADING FEE SYSTEM ==========
    
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
        if (burnAmount > 0 && burnAmount <= protocolTreasury) {
            // Burn from treasury instead of player balance
            _burn(address(this), burnAmount);
            protocolTreasury = protocolTreasury - burnAmount;
            circulatingSupply = circulatingSupply - burnAmount;
            
            // Update player stats (but don't burn from their balance)
            playerStats[player].totalBurned = playerStats[player].totalBurned + burnAmount;
            
            uint256 burnPercentage = burnAmount * 10000 / protocolTreasury;
            emit TokensBurned(player, burnAmount, pprPoints, burnPercentage);
            emit TreasuryUpdated(protocolTreasury, burnAmount, true); // true for burn
        }
    }
    
    function _emitTokens(address player, uint256 emissionAmount, uint256 pprPoints) internal {
        if (emissionAmount > 0) {
            // Mint to treasury instead of player
            _mint(address(this), emissionAmount);
            protocolTreasury = protocolTreasury + emissionAmount;
            circulatingSupply = circulatingSupply + emissionAmount;
            
            // Update player stats (but don't mint to their balance)
            playerStats[player].totalEmitted = playerStats[player].totalEmitted + emissionAmount;
            
            emit TokensEmitted(player, emissionAmount, pprPoints);
            emit TreasuryUpdated(protocolTreasury, emissionAmount, false); // false for emission
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
    
    function getLeagueStats(uint256 week) external view returns (LeagueStats memory) {
        return leagueStats[week];
    }
    
    function getCurrentLeagueStats() external view returns (LeagueStats memory) {
        return _calculateLeagueStats();
    }
    
    function getPerformanceScore(address player) external view returns (uint256) {
        return _calculatePerformanceScore(player);
    }
    
    function getStakingMultiplier(address player) external view returns (uint256) {
        return _calculateStakingMultiplier(player);
    }
    
    function getSupplyInfo() external view returns (uint256 total, uint256 circulating, uint256 locked) {
        return (totalSupply(), circulatingSupply, lockedSupply);
    }
    
    function getTreasuryInfo() external view returns (uint256 treasury, uint256 tradingFees) {
        return (protocolTreasury, totalTradingFees);
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
    
    // Optional: Allow owner to add initial treasury funds
    function addTreasuryFunds(uint256 amount) external onlyOwner {
        require(amount > 0, "Amount must be greater than 0");
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");
        
        _transfer(msg.sender, address(this), amount);
        protocolTreasury = protocolTreasury + amount;
        emit TreasuryUpdated(protocolTreasury, amount, false); // false for emission
    }
} 