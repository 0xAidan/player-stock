export interface Player {
  id: string;
  name: string;
  team: string;
  position: string;
  imageUrl?: string;
  currentPPR: number;
  lastWeekPPR: number;
  tokenSupply: number;
  tokenPrice: number;
  totalBurned: number;
  totalEmitted: number;
  isActive: boolean;
}

export interface PlayerStats {
  week: number;
  pprPoints: number;
  rushingYards?: number;
  receivingYards?: number;
  touchdowns?: number;
  receptions?: number;
}

export interface PlayerStakingPosition {
  player: string;
  amount: number;
  startTime: number;
  lockEndTime: number;
  lastRewardClaim: number;
  isActive: boolean;
}

export interface Portfolio {
  playerId: string;
  tokensOwned: number;
  averagePrice: number;
  totalValue: number;
  profitLoss: number;
}

export interface Trade {
  id: string;
  playerId: string;
  type: 'buy' | 'sell';
  amount: number;
  price: number;
  timestamp: Date;
  txHash?: string;
}

export interface StakingRewards {
  playerId: string;
  pendingRewards: number;
  performanceMultiplier: number;
  baseReward: number;
  totalReward: number;
}