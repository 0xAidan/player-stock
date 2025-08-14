# Player Stock Tokenomics System

## Overview

The Player Stock protocol implements a sophisticated tokenomics system designed to create a long-running, self-sustaining ecosystem that rewards active participation and aligns incentives between players, traders, and stakers.

## Core Principles

1. **Long-term Sustainability**: The protocol generates revenue through trading fees and distributes rewards to stakers
2. **Performance-Based Tokenomics**: Player token supply adjusts based on actual NFL performance (PPR points)
3. **Staking Incentives**: Users lock tokens for NFL week periods to earn rewards from trading fees
4. **Healthy Supply Pressure**: Burn mechanics create deflationary pressure during good performances
5. **Injury Protection**: Players with 0 PPR (injured) don't experience supply changes

## Tokenomics Components

### 1. Trading Fee System
- **Fee Rate**: 0.25% on all trades
- **Purpose**: Generates protocol revenue for staking rewards
- **Collection**: Fees are collected in the contract and distributed weekly to stakers

### 2. Staking System
- **Lock Period**: 7 days (NFL week duration)
- **Reward Rate**: 0.5% of collected trading fees per week
- **Distribution**: Proportional to staked amount relative to total staked
- **Benefits**: 
  - Earn passive income from trading activity
  - Support protocol stability
  - Long-term holder incentives

### 3. Burn Mechanics

#### PPR → Burn Formula
```
burnRate = min(1%, (pprPoints * 10) / 1000)
burnAmount = playerSupply * burnRate * performanceRatio / 10000 / 100
```

#### Key Features:
- **Dynamic Rate**: Burn rate scales with PPR performance (0.1% to 1% max)
- **Performance Ratio**: Based on improvement from last week's PPR
- **Minimum Threshold**: 1 PPR point required to trigger burn
- **Zero PPR Protection**: Injured players (0 PPR) experience no supply changes

#### Example Calculations:
- Player with 10 PPR: burnRate = 0.1%
- Player with 50 PPR: burnRate = 0.5%
- Player with 100+ PPR: burnRate = 1% (capped)

### 4. Emission Mechanics

#### Bad Performance Compensation
- **Rate**: Half of the burn rate for equivalent performance
- **Trigger**: When current PPR < last week PPR
- **Purpose**: Provides some compensation for poor performance while maintaining deflationary pressure

#### Formula:
```
emissionRate = burnRate / 2
emissionAmount = playerSupply * emissionRate * performanceRatio / 10000 / 100
```

## Weekly Cycle

### 1. Player Updates
- Admin calls `updatePlayerWeek()` with new PPR points
- System calculates burn/emission based on performance
- Week data is updated with totals

### 2. Week Processing
- Admin calls `processWeekEnd()` after all players updated
- Staking rewards are distributed
- Protocol moves to next week
- Trading fees are allocated for next week's rewards

### 3. Staking Operations
- Users can stake/unstake at any time
- Rewards accumulate weekly
- Lock period ensures commitment to protocol

## Economic Benefits

### For Traders:
- Transparent fee structure (0.25%)
- Performance-based price discovery
- No hidden costs

### For Stakers:
- Passive income from trading activity
- Long-term value appreciation through burns
- Protocol governance participation

### For the Protocol:
- Sustainable revenue model
- Deflationary pressure during good performances
- Incentivized long-term holding

## Supply Pressure Analysis

### Deflationary Forces:
1. **Performance Burns**: Good PPR weeks reduce supply
2. **Trading Fee Burns**: Fees collected reduce circulating supply
3. **Staking Locks**: Tokens locked reduce available supply

### Inflationary Forces:
1. **Bad Performance Emissions**: Limited compensation for poor weeks
2. **Staking Rewards**: New tokens minted for stakers

### Net Effect:
- **Long-term**: Deflationary due to performance burns and fee collection
- **Short-term**: Balanced through staking rewards and emissions

## Risk Management

### 1. Burn Rate Caps
- Maximum 1% burn rate prevents excessive deflation
- Gradual scaling prevents market shocks

### 2. Emission Limits
- Emissions capped at 50% of burn rate
- Prevents inflationary spirals

### 3. Staking Requirements
- 7-day lock prevents rapid speculation
- Rewards proportional to commitment

### 4. Zero PPR Protection
- Injured players maintain price discovery
- No artificial supply pressure during injuries

## Implementation Details

### Smart Contract Functions:

#### Staking:
- `stake(uint256 amount)`: Lock tokens for rewards
- `unstake()`: Withdraw after lock period
- `claimRewards()`: Claim accumulated rewards

#### Admin:
- `updatePlayerWeek(address player, uint256 pprPoints)`: Update player performance
- `processWeekEnd()`: Process weekly rewards and advance week
- `updateMarketCap(address player, uint256 marketCap)`: Update market data

#### View:
- `getStakingPosition(address user)`: View staking details
- `getPendingRewards(address user)`: Check claimable rewards
- `getBurnRateForPPR(uint256 pprPoints)`: Calculate burn rate for PPR

### Events:
- `Staked`: User stakes tokens
- `Unstaked`: User withdraws tokens
- `RewardsClaimed`: User claims rewards
- `TokensBurned`: Player tokens burned
- `TokensEmitted`: Player tokens emitted
- `WeekProcessed`: Weekly cycle completed

## Sustainability Metrics

### Revenue Sources:
1. Trading fees (0.25% per trade)
2. Protocol growth through burns

### Cost Structure:
1. Staking rewards (0.5% of fees)
2. Gas costs for operations

### Break-even Analysis:
- Protocol becomes profitable when trading volume exceeds staking rewards
- Burns create additional value through supply reduction

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

This tokenomics system creates a sustainable, long-running protocol that:
- Rewards active participation through staking
- Creates deflationary pressure during good performances
- Protects injured players from artificial supply changes
- Generates sustainable revenue through trading fees
- Aligns incentives between all protocol participants

The system is designed to be self-sustaining and can scale with the protocol's growth while maintaining economic balance and user incentives. 