# Enhanced Player Stock Tokenomics System

## Overview

The Player Stock protocol now implements a **revolutionary robust tokenomics system** that creates a direct, meaningful relationship between player performance (PPR) and token economics. This system goes far beyond simple weekly burns to create a sophisticated performance-based economy that rewards consistency, punishes volatility, and creates natural price discovery through supply mechanics.

## Core Innovations

### 1. **Direct PPR-to-Burn Relationship**
- **Meaningful Supply Impact**: 1-10% of circulating supply burned weekly based on performance
- **Performance-Based Scaling**: Burn rates scale directly with player performance vs league average
- **Supply Separation**: Clear distinction between circulating and locked supply

### 2. **Advanced Performance Analytics**
- **8-Week Rolling History**: Tracks performance over 8 weeks for stability
- **Standard Deviation Analysis**: Rewards players who perform above league average
- **Variance Penalty**: Penalizes inconsistent performers regardless of average
- **League-Wide Statistics**: Real-time calculation of league averages and distributions

### 3. **Sophisticated Staking Mechanics**
- **Performance-Frozen Multipliers**: Staking rewards locked at time of stake
- **Tiered Reward System**: 20-200% multipliers based on performance tiers
- **Variance Impact**: High variance players get reduced staking rewards
- **Supply Tracking**: Staked tokens move from circulating to locked supply

## Enhanced Tokenomics Components

### 1. **Robust Burn Mechanics**

#### Direct Performance-to-Burn Formula
```
performanceRatio = playerPerformanceScore / leagueAveragePPR

if (performanceRatio >= 100) {
    // Above average = BURN from treasury (deflationary)
    burnPercentage = calculateBurnPercentage(performanceRatio)
    burnAmount = protocolTreasury * burnPercentage / 10000
} else {
    // Below average = EMIT to treasury (inflationary, limited)
    emissionPercentage = calculateEmissionPercentage(performanceRatio)
    emissionAmount = protocolTreasury * emissionPercentage / 10000
}
```

#### Burn Percentage Calculation
- **Base Target**: 5% of circulating supply per week
- **Performance Scaling**: 1-10% based on performance ratio
- **Maximum Burn**: 10% of supply per week (prevents excessive deflation)
- **Minimum Burn**: 1% of supply per week (ensures meaningful impact)

#### Example Burn Scenarios:
- **Average Performer** (100% of league average): 5% burn
- **Elite Performer** (150% of league average): 7.5% burn
- **Superstar** (200% of league average): 10% burn (capped)
- **Below Average** (80% of league average): 1% emission
- **Poor Performer** (50% of league average): 2% emission (capped)

### 2. **Advanced Performance Scoring**

#### Performance Score Formula
```
baseScore = playerAveragePPR
deviationBonus = calculateStandardDeviationBonus(player, league)
variancePenalty = calculateVariancePenalty(player, league)
performanceScore = baseScore + deviationBonus - variancePenalty
```

#### Standard Deviation Bonus
- **Above Average**: 150% bonus for 1 standard deviation above mean
- **Below Average**: 50% bonus for 1 standard deviation below mean
- **Scaling**: Linear scaling based on deviation magnitude

#### Variance Penalty
- **High Variance**: Up to 75% penalty for inconsistent performance
- **Normalized**: Variance calculated relative to league average
- **Protection**: Prevents negative performance scores

### 3. **Enhanced Staking System**

#### Performance-Frozen Multipliers
When a user stakes tokens, the performance multiplier is **frozen at that moment** and remains constant for the duration of the stake. This prevents gaming the system and rewards early believers.

#### Tiered Multiplier System
```
if (performanceRatio >= 120%) {
    // Elite tier: 150-200% multiplier
    multiplier = 150 + (performanceRatio - 120) * 5
} else if (performanceRatio >= 100%) {
    // Above average: 100-150% multiplier
    multiplier = 100 + (performanceRatio - 100) * 2.5
} else if (performanceRatio >= 80%) {
    // Below average: 50-100% multiplier
    multiplier = 100 - (100 - performanceRatio) * 2.5
} else {
    // Poor performers: 20-50% multiplier
    multiplier = 50 - (80 - performanceRatio) * 1.5
}
```

#### Variance Impact on Staking
- **High Variance Penalty**: Up to 25% reduction in staking rewards
- **Consistency Bonus**: Low variance players get full multiplier
- **Minimum Floor**: 20% minimum multiplier regardless of performance

### 4. **Supply Management System**

#### Supply Categories
- **Total Supply**: Fixed at 50M tokens (can only decrease through burns)
- **Circulating Supply**: Available for trading (decreases with burns, increases with emissions)
- **Locked Supply**: Tokens staked in the protocol (moves between circulating and locked)
- **Protocol Treasury**: Tokens held by protocol for operations (source of burns, destination of emissions)

#### Protocol Treasury System
The protocol implements a **treasury-based tokenomics system** that protects user holdings while creating meaningful supply dynamics:

##### Treasury Operations
- **Treasury Source**: Trading fees (0.25%) + optional owner contributions
- **Burn Source**: Protocol treasury (never user balances)
- **Emission Destination**: Protocol treasury (never user balances)
- **Reward Source**: Trading fees + treasury funds

##### User Protection
- **No Balance Touching**: User token holdings are never burned or emitted
- **Staking Safety**: Staked tokens remain safe from burns/emissions
- **Reward Security**: Rewards come from treasury, not user balances

##### Flywheel Mechanism
```
User buys player token → User stakes token (optional) → Staked tokens get treasury rewards → 
Treasury supply influenced by player performance → Staking multiplier based on performance → 
Users get rewards from trading fees + treasury → Users buy more tokens with deflationary supply
```

#### Supply Flow Mechanics
```
// Staking
circulatingSupply -= stakeAmount
lockedSupply += stakeAmount

// Unstaking
lockedSupply -= stakeAmount
circulatingSupply += stakeAmount

// Burning from treasury
protocolTreasury -= burnAmount
circulatingSupply -= burnAmount

// Emitting to treasury
protocolTreasury += emissionAmount
circulatingSupply += emissionAmount
```

## Weekly Cycle Mechanics

### 1. **Player Performance Updates**
```
updatePlayerWeek(player, pprPoints) {
    // Update 8-week rolling history
    updatePerformanceHistory(player, pprPoints)
    
    // Calculate new performance score
    performanceScore = calculatePerformanceScore(player)
    
    // Calculate burn/emission based on performance
    (burnAmount, emissionAmount) = calculateEnhancedTokenomics(player, pprPoints)
    
    // Execute supply changes
    if (burnAmount > 0) burnTokens(player, burnAmount)
    if (emissionAmount > 0) emitTokens(player, emissionAmount)
}
```

### 2. **League Statistics Calculation**
```
calculateLeagueStats() {
    // Calculate league-wide averages
    averagePPR = sum(allPlayerAveragePPR) / activePlayers
    
    // Calculate standard deviation
    standardDeviation = sqrt(sum((playerPPR - averagePPR)^2) / activePlayers)
    
    // Calculate total variance
    totalVariance = sum(allPlayerVariance)
}
```

### 3. **Staking Reward Distribution**
```
distributeEnhancedStakingRewards() {
    // Use frozen multipliers from stake time
    for each stake {
        reward = baseReward * frozenMultiplier / 100
        mintRewards(user, reward)
    }
}
```

## Economic Benefits

### For Traders:
- **Predictable Supply Changes**: Clear relationship between performance and supply
- **Meaningful Impact**: 1-10% supply changes create real price pressure
- **Performance-Based Pricing**: Supply changes reflect actual player value
- **Transparent Mechanics**: All calculations are on-chain and verifiable

### For Stakers:
- **Performance-Frozen Rewards**: Lock in good multipliers early
- **Tiered System**: Elite performers get up to 200% rewards
- **Consistency Rewards**: Low variance players get bonus rewards
- **Supply Appreciation**: Burns increase value of remaining tokens

### For the Protocol:
- **Sustainable Economics**: Meaningful burns create long-term value
- **Performance Alignment**: Token economics directly tied to player success
- **Anti-Gaming**: Frozen multipliers prevent manipulation
- **Natural Price Discovery**: Supply changes beyond just demand

## Advanced Analytics Features

### 1. **Performance History Tracking**
- **8-Week Rolling Window**: Balances recent performance with historical data
- **Circular Buffer**: Efficient storage of historical PPR data
- **Variance Calculation**: Real-time calculation of performance consistency

### 2. **League-Wide Statistics**
- **Dynamic Averages**: League average updates weekly
- **Standard Deviation**: Measures performance distribution across league
- **Variance Analysis**: Tracks consistency across all players

### 3. **Performance Scoring**
- **Multi-Factor Analysis**: Combines average, deviation, and variance
- **Normalized Metrics**: All calculations relative to league performance
- **Anti-Manipulation**: Prevents gaming through multiple data points

## Risk Management

### 1. **Supply Change Limits**
- **Maximum Burn**: 10% per week prevents excessive deflation
- **Minimum Burn**: 1% per week ensures meaningful impact
- **Emission Caps**: 2% maximum emission prevents inflation

### 2. **Performance Multiplier Limits**
- **Maximum Multiplier**: 200% prevents excessive rewards
- **Minimum Multiplier**: 20% ensures some rewards for all stakers
- **Variance Caps**: 25% maximum variance penalty

### 3. **Staking Protection**
- **Frozen Multipliers**: Prevents timing-based manipulation
- **Lock Periods**: 7-day minimum stake duration
- **Supply Tracking**: Prevents double-counting of staked tokens

## Implementation Details

### Smart Contract Functions:

#### Enhanced Performance Tracking:
- `updatePlayerWeek(address player, uint256 pprPoints)`: Update with full analytics
- `_updatePlayerPerformanceHistory(address player, uint256 pprPoints)`: Update 8-week history
- `_calculatePerformanceScore(address player)`: Calculate advanced performance score
- `_calculateLeagueStats()`: Calculate league-wide statistics

#### Enhanced Tokenomics:
- `_calculateEnhancedTokenomics(address player, uint256 pprPoints)`: Calculate burn/emission
- `_calculateBurnPercentage(uint256 performanceRatio, uint256 playerSupply)`: Calculate burn rate
- `_calculateEmissionPercentage(uint256 performanceRatio, uint256 playerSupply)`: Calculate emission rate

#### Enhanced Staking:
- `stakePlayerTokens(address player, uint256 amount)`: Stake with frozen multiplier
- `calculateEnhancedStakingRewards(address user, uint256 stakeIndex)`: Calculate rewards
- `_calculateStakingMultiplier(address player)`: Calculate current multiplier

#### Supply Management:
- `getSupplyInfo()`: Get total, circulating, and locked supply
- `getTreasuryInfo()`: Get treasury and trading fee information
- `addTreasuryFunds(uint256 amount)`: Add funds to treasury (owner only)
- `circulatingSupply`: Public variable tracking available supply
- `lockedSupply`: Public variable tracking staked supply
- `protocolTreasury`: Public variable tracking treasury funds

### Events:
- `WeekUpdated`: Player performance updated with score
- `TokensBurned`: Tokens burned with percentage
- `PlayerStaked`: Staking with performance multiplier
- `PlayerRewardsClaimed`: Rewards claimed with multiplier
- `LeagueStatsUpdated`: League statistics updated
- `TreasuryUpdated`: Treasury operations tracked

## Sustainability Metrics

### Revenue Sources:
1. **Trading fees** (0.25% per trade)
2. **Performance burns** (1-10% of supply weekly)
3. **Protocol growth** through supply appreciation

### Cost Structure:
1. **Staking rewards** (20-200% multipliers)
2. **Gas costs** for operations
3. **Performance tracking** computational costs

### Break-even Analysis:
- **High Volume**: Trading fees exceed staking rewards
- **Performance Burns**: Create additional value through supply reduction
- **Elite Performers**: Generate more burns than emissions
- **Consistent Players**: Provide stable staking rewards

## Future Enhancements

### Potential Upgrades:
1. **Dynamic Burn Targets**: Adjust burn rates based on market conditions
2. **Performance NFTs**: Mint NFTs for exceptional performances
3. **Governance Integration**: Stakers earn governance rights
4. **Cross-Player Analytics**: Compare performance across positions

### Scalability Considerations:
1. **Batch Processing**: Process multiple players efficiently
2. **Gas Optimization**: Minimize computational costs
3. **Layer 2 Integration**: Scale to higher transaction volumes
4. **Off-Chain Analytics**: Move complex calculations off-chain

## Conclusion

This enhanced tokenomics system represents a **paradigm shift** in player token economics:

- **Direct Performance Impact**: PPR directly affects token supply in meaningful ways
- **Sophisticated Analytics**: Standard deviation and variance create nuanced performance evaluation
- **Anti-Gaming Mechanics**: Frozen multipliers and multi-factor analysis prevent manipulation
- **Supply Transparency**: Clear separation between circulating and locked supply
- **Sustainable Economics**: Meaningful burns create long-term value appreciation

The system rewards **consistency**, punishes **volatility**, and creates **natural price discovery** through supply mechanics that directly reflect player performance. This creates a truly robust and sustainable player token economy that aligns incentives between players, traders, and stakers while providing meaningful economic impact. 