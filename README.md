# Player Stock - Enhanced Tokenomics System

A revolutionary player token protocol that implements **robust staking and burn mechanics** with direct relationships between player performance (PPR) and token economics. This system goes far beyond simple weekly burns to create a sophisticated performance-based economy that rewards consistency, punishes volatility, and creates natural price discovery through supply mechanics.

## 🚀 Core Innovations

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

## 📊 Enhanced Tokenomics System

### Performance-to-Burn Formula
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

### Burn Percentage Calculation
- **Base Target**: 5% of circulating supply per week
- **Performance Scaling**: 1-10% based on performance ratio
- **Maximum Burn**: 10% of supply per week (prevents excessive deflation)
- **Minimum Burn**: 1% of supply per week (ensures meaningful impact)

### Example Burn Scenarios
- **Average Performer** (100% of league average): 5% burn
- **Elite Performer** (150% of league average): 7.5% burn
- **Superstar** (200% of league average): 10% burn (capped)
- **Below Average** (80% of league average): 1% emission
- **Poor Performer** (50% of league average): 2% emission (capped)

## 🎯 Advanced Performance Scoring

### Performance Score Formula
```
baseScore = playerAveragePPR
deviationBonus = calculateStandardDeviationBonus(player, league)
variancePenalty = calculateVariancePenalty(player, league)
performanceScore = baseScore + deviationBonus - variancePenalty
```

### Standard Deviation Bonus
- **Above Average**: 150% bonus for 1 standard deviation above mean
- **Below Average**: 50% bonus for 1 standard deviation below mean
- **Scaling**: Linear scaling based on deviation magnitude

### Variance Penalty
- **High Variance**: Up to 75% penalty for inconsistent performance
- **Normalized**: Variance calculated relative to league average
- **Protection**: Prevents negative performance scores

## 🔒 Enhanced Staking System

### Performance-Frozen Multipliers
When a user stakes tokens, the performance multiplier is **frozen at that moment** and remains constant for the duration of the stake. This prevents gaming the system and rewards early believers.

### Tiered Multiplier System
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

### Variance Impact on Staking
- **High Variance Penalty**: Up to 25% reduction in staking rewards
- **Consistency Bonus**: Low variance players get full multiplier
- **Minimum Floor**: 20% minimum multiplier regardless of performance

## 📈 Supply Management System

### Supply Categories
- **Total Supply**: Fixed at 50M tokens (can only decrease through burns)
- **Circulating Supply**: Available for trading (decreases with burns, increases with emissions)
- **Locked Supply**: Tokens staked in the protocol (moves between circulating and locked)

### Supply Flow Mechanics
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

## 🏗️ Smart Contract Architecture

### Key Contracts
- **PlayerToken.sol**: Main contract with enhanced tokenomics
- **Enhanced API**: Complete interface for all new features
- **Frontend Components**: Updated UI for new functionality

### Protocol Treasury System
The protocol now implements a **treasury-based tokenomics system** that protects user holdings while creating meaningful supply dynamics:

#### Treasury Operations
- **Treasury Source**: Trading fees (0.25%) + optional owner contributions
- **Burn Source**: Protocol treasury (never user balances)
- **Emission Destination**: Protocol treasury (never user balances)
- **Reward Source**: Trading fees + treasury funds

#### User Protection
- **No Balance Touching**: User token holdings are never burned or emitted
- **Staking Safety**: Staked tokens remain safe from burns/emissions
- **Reward Security**: Rewards come from treasury, not user balances

#### Flywheel Mechanism
```
User buys player token → User stakes token (optional) → Staked tokens get treasury rewards → 
Treasury supply influenced by player performance → Staking multiplier based on performance → 
Users get rewards from trading fees + treasury → Users buy more tokens with deflationary supply
```

### Core Functions

#### Enhanced Performance Tracking
```solidity
function updatePlayerWeek(address player, uint256 pprPoints) external onlyOwner
function _updatePlayerPerformanceHistory(address player, uint256 pprPoints) internal
function _calculatePerformanceScore(address player) internal view returns (uint256)
function _calculateLeagueStats() internal view returns (LeagueStats memory)
```

#### Enhanced Tokenomics
```solidity
function _calculateEnhancedTokenomics(address player, uint256 pprPoints) internal view returns (uint256, uint256)
function _calculateBurnPercentage(uint256 performanceRatio, uint256 playerSupply) internal view returns (uint256)
function _calculateEmissionPercentage(uint256 performanceRatio, uint256 playerSupply) internal view returns (uint256)
```

#### Enhanced Staking
```solidity
function stakePlayerTokens(address player, uint256 amount) external nonReentrant
function calculateEnhancedStakingRewards(address user, uint256 stakeIndex) public view returns (uint256)
function _calculateStakingMultiplier(address player) internal view returns (uint256)
```

#### Supply Management
```solidity
function getSupplyInfo() external view returns (uint256 total, uint256 circulating, uint256 locked)
function getTreasuryInfo() external view returns (uint256 treasury, uint256 tradingFees)
function addTreasuryFunds(uint256 amount) external onlyOwner
```

## 🧪 Testing

### Comprehensive Test Suite
The enhanced system includes extensive tests covering:

- **Performance Tracking**: 8-week history, variance calculation, standard deviation
- **League Statistics**: Real-time averages, distributions, calculations
- **Tokenomics**: Burn/emission calculations, percentage limits, supply tracking
- **Staking System**: Multiplier calculations, frozen rewards, supply movement
- **Edge Cases**: Zero PPR, insufficient balances, lock periods
- **Gas Optimization**: Performance calculations, efficiency

### Running Tests
```bash
npm test
```

## 🚀 Getting Started

### Prerequisites
- Node.js 16+
- Hardhat
- Ethers.js
- OpenZeppelin Contracts

### Installation
```bash
npm install
```

### Compilation
```bash
npx hardhat compile
```

### Deployment
```bash
npx hardhat run scripts/deploy.js --network <network>
```

### Testing
```bash
npx hardhat test
```

## 📊 API Integration

### Enhanced PlayerTokenService
```typescript
import { PlayerTokenService } from '@/lib/api';

const playerToken = new PlayerTokenService(contractAddress, signer);

// Performance tracking
await playerToken.updatePlayerWeek(playerAddress, pprPoints);
const performanceScore = await playerToken.getPerformanceScore(playerAddress);

// League statistics
const leagueStats = await playerToken.getCurrentLeagueStats();

// Staking
await playerToken.stakePlayerTokens(playerAddress, amount);
const multiplier = await playerToken.getStakingMultiplier(playerAddress);

// Supply tracking
const supplyInfo = await playerToken.getSupplyInfo();
```

### Performance Analytics
```typescript
import { PerformanceAnalyticsService } from '@/lib/api';

const standardDeviation = PerformanceAnalyticsService.calculateStandardDeviation(values);
const variance = PerformanceAnalyticsService.calculateVariance(values);
const performanceRatio = PerformanceAnalyticsService.calculatePerformanceRatio(playerScore, leagueAverage);
const tier = PerformanceAnalyticsService.getPerformanceTier(performanceRatio);
```

## 🎨 Frontend Components

### Enhanced StakingInterface
The updated staking interface includes:

- **Supply Overview**: Real-time display of total, circulating, and locked supply
- **League Statistics**: Live league averages, standard deviation, variance
- **Performance Scoring**: Individual player performance scores and tiers
- **Frozen Multipliers**: Display of locked staking multipliers
- **Enhanced UI**: Modern gradients, icons, and responsive design

### Key Features
- Real-time supply tracking
- Performance tier visualization
- League statistics dashboard
- Frozen multiplier display
- Enhanced error handling
- Responsive design

## 🔧 Configuration

### Environment Variables
```env
NEXT_PUBLIC_CONTRACT_ADDRESS=your_contract_address
NEXT_PUBLIC_NETWORK_ID=your_network_id
NFL_API_KEY=your_nfl_api_key
```

### Contract Constants
```solidity
uint256 public constant WEEKLY_BURN_TARGET_BPS = 500; // 5% target
uint256 public constant MAX_WEEKLY_BURN_BPS = 1000; // 10% max
uint256 public constant MIN_WEEKLY_BURN_BPS = 100; // 1% min
uint256 public constant PERFORMANCE_HISTORY_WEEKS = 8; // 8-week history
uint256 public constant STANDARD_DEVIATION_MULTIPLIER = 150; // 150% bonus
uint256 public constant VARIANCE_PENALTY_MULTIPLIER = 75; // 75% penalty
```

## 📈 Economic Benefits

### For Traders
- **Predictable Supply Changes**: Clear relationship between performance and supply
- **Meaningful Impact**: 1-10% supply changes create real price pressure
- **Performance-Based Pricing**: Supply changes reflect actual player value
- **Transparent Mechanics**: All calculations are on-chain and verifiable

### For Stakers
- **Performance-Frozen Rewards**: Lock in good multipliers early
- **Tiered System**: Elite performers get up to 200% rewards
- **Consistency Rewards**: Low variance players get bonus rewards
- **Supply Appreciation**: Burns increase value of remaining tokens

### For the Protocol
- **Sustainable Economics**: Meaningful burns create long-term value
- **Performance Alignment**: Token economics directly tied to player success
- **Anti-Gaming**: Frozen multipliers prevent manipulation
- **Natural Price Discovery**: Supply changes beyond just demand

## 🛡️ Risk Management

### Supply Change Limits
- **Maximum Burn**: 10% per week prevents excessive deflation
- **Minimum Burn**: 1% per week ensures meaningful impact
- **Emission Caps**: 2% maximum emission prevents inflation

### Performance Multiplier Limits
- **Maximum Multiplier**: 200% prevents excessive rewards
- **Minimum Multiplier**: 20% ensures some rewards for all stakers
- **Variance Caps**: 25% maximum variance penalty

### Staking Protection
- **Frozen Multipliers**: Prevents timing-based manipulation
- **Lock Periods**: 7-day minimum stake duration
- **Supply Tracking**: Prevents double-counting of staked tokens

## 🔮 Future Enhancements

### Potential Upgrades
1. **Dynamic Burn Targets**: Adjust burn rates based on market conditions
2. **Performance NFTs**: Mint NFTs for exceptional performances
3. **Governance Integration**: Stakers earn governance rights
4. **Cross-Player Analytics**: Compare performance across positions

### Scalability Considerations
1. **Batch Processing**: Process multiple players efficiently
2. **Gas Optimization**: Minimize computational costs
3. **Layer 2 Integration**: Scale to higher transaction volumes
4. **Off-Chain Analytics**: Move complex calculations off-chain

## 📚 Documentation

- **[Enhanced Tokenomics](./TOKENOMICS.md)**: Detailed tokenomics documentation
- **[API Reference](./lib/api.ts)**: Complete API documentation
- **[Smart Contract](./contracts/PlayerToken.sol)**: Contract source code
- **[Test Suite](./test/PlayerToken.test.js)**: Comprehensive tests

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the test suite for examples

---

**This enhanced system represents a paradigm shift in player token economics, creating a truly robust and sustainable player token economy that aligns incentives between players, traders, and stakers while providing meaningful economic impact.**
