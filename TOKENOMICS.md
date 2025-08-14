# Player Stock Tokenomics System (Updated)

## Overview

The Player Stock protocol implements an improved hybrid tokenomics system designed to create a sustainable, long-running ecosystem that rewards active participation and aligns incentives between players, traders, and stakers. The system combines **fixed trading fees**, **player-specific staking**, and **performance-based supply changes** to create natural price discovery beyond just market demand.

## Core Principles

1. **Simple & Transparent**: Fixed 0.25% trading fee with no complexity
2. **Performance-Based Supply**: Player token supply adjusts based on NFL performance (PPR points)
3. **Player-Specific Staking**: Users can stake individual player tokens for performance-based rewards
4. **Natural Price Discovery**: Supply changes create price pressure beyond just demand
5. **Injury Protection**: Players with 0 PPR (injured) don't experience supply changes

## Tokenomics Components

### 1. Fixed Trading Fee System
- **Fee Rate**: 0.25% on all trades (FIXED - no changes)
- **Purpose**: Generates protocol revenue for staking rewards
- **Collection**: Fees are collected in the contract and distributed weekly to stakers
- **Transparency**: Users know exactly what they'll pay - no surprises

### 2. Player-Specific Staking System
- **Lock Period**: 7 days (NFL week duration)
- **Base Reward Rate**: 0.5% of staked amount per week
- **Performance Multiplier**: Rewards scale based on player's recent performance
- **Individual Staking**: Users stake specific player tokens, not generic protocol tokens
- **Benefits**: 
  - Earn passive income from trading activity
  - Higher rewards for well-performing players
  - Support protocol stability
  - Long-term holder incentives

#### Performance Multiplier Calculation
```
if (currentPPR > lastWeekPPR) {
    // Good performance = higher rewards
    improvement = currentPPR - lastWeekPPR;
    bonus = min(improvement * 5, 100); // Max 100% bonus
    multiplier = 100 + bonus; // 100% to 200%
} else if (currentPPR < lastWeekPPR) {
    // Bad performance = lower rewards
    decline = lastWeekPPR - currentPPR;
    penalty = min(decline * 3, 80); // Max 80% penalty
    multiplier = max(100 - penalty, 20); // 20% to 100%
} else {
    // Same performance = base rewards
    multiplier = 100;
}
```

### 3. Improved Supply Change Mechanics

#### Performance-Based Supply Formula
```
baseRate = playerSupply * 0.1% // Base rate of 0.1%

if (performanceChange > 0) {
    // Good performance = BURN tokens (deflationary pressure)
    improvement = performanceChange;
    burnMultiplier = min(improvement * 2, 10); // Max 10x multiplier
    burnAmount = baseRate * burnMultiplier / 10;
} else if (performanceChange < 0) {
    // Bad performance = EMIT tokens (inflationary pressure)
    decline = abs(performanceChange);
    emissionMultiplier = min(decline, 5); // Max 5x multiplier
    emissionAmount = baseRate * emissionMultiplier / 10;
}
```

#### Key Improvements:
- **Smaller Base Rate**: 0.1% instead of 1% (less volatile)
- **Better Scaling**: Performance improvement/decline affects magnitude
- **Capped Multipliers**: Prevents excessive supply changes
- **Intuitive Logic**: Good performance = burn (deflationary), bad performance = emit (inflationary)

#### Example Calculations:
- Player with 1M tokens, 10 PPR improvement: burn = 1M * 0.1% * 2 = 2,000 tokens
- Player with 1M tokens, 5 PPR decline: emit = 1M * 0.1% * 1 = 1,000 tokens
- Player with 1M tokens, 20 PPR improvement: burn = 1M * 0.1% * 10 = 10,000 tokens (capped)

## Weekly Cycle

### 1. Player Updates
- Admin calls `updatePlayerWeek()` with new PPR points
- System calculates burn/emission based on performance change
- Week data is updated with totals

### 2. Week Processing
- Admin calls `processWeekEnd()` after all players updated
- Staking rewards are distributed based on performance multipliers
- Protocol moves to next week
- Trading fees are allocated for next week's rewards

### 3. Staking Operations
- Users can stake/unstake individual player tokens
- Rewards accumulate weekly with performance-based multipliers
- Lock period ensures commitment to protocol

## Economic Benefits

### For Traders:
- **Transparent fees**: Always 0.25% - no surprises
- **Performance-based price discovery**: Supply changes create natural price pressure
- **No hidden costs**: Clear fee structure

### For Stakers:
- **Player-specific rewards**: Stake tokens of players you believe in
- **Performance bonuses**: Higher rewards for well-performing players
- **Passive income**: Earn from trading activity
- **Long-term value**: Burns create deflationary pressure

### For the Protocol:
- **Sustainable revenue**: Fixed trading fees provide consistent income
- **Natural price discovery**: Supply changes beyond just demand
- **Incentivized participation**: Multiple ways to earn and participate

## Supply Pressure Analysis

### Deflationary Forces:
1. **Performance Burns**: Good PPR weeks reduce supply
2. **Trading Fee Collection**: Fees collected reduce circulating supply
3. **Staking Locks**: Tokens locked reduce available supply

### Inflationary Forces:
1. **Bad Performance Emissions**: Limited compensation for poor weeks
2. **Staking Rewards**: New tokens minted for stakers (but performance-based)

### Net Effect:
- **Long-term**: Deflationary due to performance burns and fee collection
- **Short-term**: Balanced through staking rewards and emissions
- **Natural**: Supply changes create price discovery beyond just demand

## Risk Management

### 1. Supply Change Caps
- Maximum 10x burn multiplier prevents excessive deflation
- Maximum 5x emission multiplier prevents inflationary spirals
- Base rate of 0.1% keeps changes manageable

### 2. Performance Multiplier Limits
- Maximum 200% reward multiplier (100% bonus)
- Minimum 20% reward multiplier (80% penalty)
- Gradual scaling prevents market shocks

### 3. Staking Requirements
- 7-day lock prevents rapid speculation
- Individual player staking creates targeted incentives
- Performance-based rewards align with player success

### 4. Zero PPR Protection
- Injured players maintain price discovery
- No artificial supply pressure during injuries

## Implementation Details

### Smart Contract Functions:

#### Player-Specific Staking:
- `stakePlayerTokens(address player, uint256 amount)`: Stake specific player tokens
- `unstakePlayerTokens(uint256 stakeIndex)`: Withdraw after lock period
- `claimPlayerRewards(uint256 stakeIndex)`: Claim accumulated rewards
- `calculatePlayerStakingRewards(address user, uint256 stakeIndex)`: View pending rewards

#### Admin:
- `updatePlayerWeek(address player, uint256 pprPoints)`: Update player performance
- `processWeekEnd()`: Process weekly rewards and advance week
- `updateMarketCap(address player, uint256 marketCap)`: Update market data

#### View:
- `getUserPlayerStakes(address user)`: View all user staking positions
- `getPlayerTotalStaked(address player)`: View total staked per player
- `getPerformanceMultiplier(address player)`: Get current reward multiplier

### Events:
- `PlayerStaked`: User stakes player tokens
- `PlayerUnstaked`: User withdraws player tokens
- `PlayerRewardsClaimed`: User claims player-specific rewards
- `TokensBurned`: Player tokens burned
- `TokensEmitted`: Player tokens emitted
- `WeekProcessed`: Weekly cycle completed

## Sustainability Metrics

### Revenue Sources:
1. Trading fees (0.25% per trade)
2. Protocol growth through burns

### Cost Structure:
1. Staking rewards (0.5% base + performance multipliers)
2. Gas costs for operations

### Break-even Analysis:
- Protocol becomes profitable when trading volume exceeds staking rewards
- Burns create additional value through supply reduction
- Performance-based rewards create natural demand for well-performing players

## Future Enhancements

### Potential Upgrades:
1. **USDC Rewards**: Convert trading fees to USDC for stakers
2. **Governance Tokens**: Stakers earn governance rights
3. **Tiered Staking**: Different lock periods with different rewards
4. **Performance Bonuses**: Additional rewards for top-performing stakers

### Scalability Considerations:
1. **Batch Processing**: Process multiple players in single transaction
2. **Gas Optimization**: Minimize transaction costs
3. **Layer 2 Integration**: Scale to higher transaction volumes

## Conclusion

This improved tokenomics system creates a sustainable, long-running protocol that:
- **Keeps trading fees simple and transparent** (0.25% fixed)
- **Creates natural price discovery** through supply changes
- **Rewards active participation** through player-specific staking
- **Aligns incentives** between all protocol participants
- **Protects injured players** from artificial supply changes
- **Generates sustainable revenue** through trading fees

The system is designed to be self-sustaining and can scale with the protocol's growth while maintaining economic balance and user incentives. The combination of fixed fees, performance-based staking, and supply changes creates a robust ecosystem that rewards good performance and creates natural price discovery beyond just market demand. 