import axios from 'axios';
import { ethers } from 'ethers';
import PlayerTokenABI from '../contracts/PlayerToken.sol/PlayerToken.json';

const NFL_API_BASE = 'https://api.sportsdata.io/v3/nfl/stats/json';
const HYPERLIQUID_API_BASE = 'https://api.hyperliquid.xyz';

// Enhanced contract interface types
export interface PlayerStats {
  lastWeekPPR: number;
  currentWeekPPR: number;
  totalBurned: number;
  totalEmitted: number;
  marketCap: number;
  isActive: boolean;
  lastWeekUpdate: number;
  pprHistory: number[];
  historyIndex: number;
  totalPPR: number;
  pprVariance: number;
  averagePPR: number;
  performanceScore: number;
}

export interface PlayerStakingPosition {
  player: string;
  amount: number;
  startTime: number;
  lockEndTime: number;
  lastRewardClaim: number;
  isActive: boolean;
  performanceMultiplier: number;
}

export interface WeekData {
  totalPPR: number;
  totalBurnAmount: number;
  totalEmissionAmount: number;
  stakingRewardsDistributed: number;
  tradingFeesCollected: number;
  leagueAveragePPR: number;
  leagueStandardDeviation: number;
  isProcessed: boolean;
}

export interface LeagueStats {
  totalActivePlayers: number;
  totalPPR: number;
  averagePPR: number;
  standardDeviation: number;
  totalVariance: number;
}

export interface SupplyInfo {
  total: number;
  circulating: number;
  locked: number;
}

export interface TreasuryInfo {
  treasury: number;
  tradingFees: number;
}

export class NFLDataService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async getPlayerStats(season: number, week: number): Promise<any[]> {
    try {
      const response = await axios.get(
        `${NFL_API_BASE}/PlayerGameStatsByWeek/${season}/${week}`,
        {
          headers: { 'Ocp-Apim-Subscription-Key': this.apiKey }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching NFL data:', error);
      throw error;
    }
  }

  async getPlayers(): Promise<any[]> {
    try {
      const response = await axios.get(
        `${NFL_API_BASE}/Players`,
        {
          headers: { 'Ocp-Apim-Subscription-Key': this.apiKey }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching players:', error);
      throw error;
    }
  }
}

export class HyperliquidService {
  async getMarkets(): Promise<any[]> {
    try {
      const response = await axios.get(`${HYPERLIQUID_API_BASE}/info`);
      return response.data;
    } catch (error) {
      console.error('Error fetching Hyperliquid markets:', error);
      throw error;
    }
  }

  async placeOrder(order: any): Promise<any> {
    try {
      const response = await axios.post(`${HYPERLIQUID_API_BASE}/exchange`, order);
      return response.data;
    } catch (error) {
      console.error('Error placing order:', error);
      throw error;
    }
  }
}

// Enhanced Player Token Contract Service
export class PlayerTokenService {
  private contract: ethers.Contract;
  private signer: ethers.Signer;

  constructor(contractAddress: string, signer: ethers.Signer) {
    this.contract = new ethers.Contract(contractAddress, PlayerTokenABI.abi, signer);
    this.signer = signer;
  }

  // ========== ENHANCED PLAYER MANAGEMENT ==========

  async addPlayer(playerAddress: string, name: string): Promise<void> {
    try {
      const tx = await this.contract.addPlayer(playerAddress, name);
      await tx.wait();
    } catch (error) {
      console.error('Error adding player:', error);
      throw error;
    }
  }

  // ========== ENHANCED WEEKLY UPDATE SYSTEM ==========

  async updatePlayerWeek(playerAddress: string, pprPoints: number): Promise<void> {
    try {
      const tx = await this.contract.updatePlayerWeek(playerAddress, pprPoints);
      await tx.wait();
    } catch (error) {
      console.error('Error updating player week:', error);
      throw error;
    }
  }

  async processWeekEnd(): Promise<void> {
    try {
      const tx = await this.contract.processWeekEnd();
      await tx.wait();
    } catch (error) {
      console.error('Error processing week end:', error);
      throw error;
    }
  }

  // ========== ENHANCED STAKING SYSTEM ==========

  async stakePlayerTokens(playerAddress: string, amount: number): Promise<void> {
    try {
      const amountWei = ethers.utils.parseEther(amount.toString());
      const tx = await this.contract.stakePlayerTokens(playerAddress, amountWei);
      await tx.wait();
    } catch (error) {
      console.error('Error staking player tokens:', error);
      throw error;
    }
  }

  async unstakePlayerTokens(stakeIndex: number): Promise<void> {
    try {
      const tx = await this.contract.unstakePlayerTokens(stakeIndex);
      await tx.wait();
    } catch (error) {
      console.error('Error unstaking player tokens:', error);
      throw error;
    }
  }

  async claimPlayerRewards(stakeIndex: number): Promise<void> {
    try {
      const tx = await this.contract.claimPlayerRewards(stakeIndex);
      await tx.wait();
    } catch (error) {
      console.error('Error claiming player rewards:', error);
      throw error;
    }
  }

  // ========== ENHANCED VIEW FUNCTIONS ==========

  async getActivePlayers(): Promise<string[]> {
    try {
      return await this.contract.getActivePlayers();
    } catch (error) {
      console.error('Error getting active players:', error);
      throw error;
    }
  }

  async getPlayerStats(playerAddress: string): Promise<PlayerStats> {
    try {
      const stats = await this.contract.getPlayerStats(playerAddress);
      return {
        lastWeekPPR: stats.lastWeekPPR.toNumber(),
        currentWeekPPR: stats.currentWeekPPR.toNumber(),
        totalBurned: ethers.utils.formatEther(stats.totalBurned),
        totalEmitted: ethers.utils.formatEther(stats.totalEmitted),
        marketCap: ethers.utils.formatEther(stats.marketCap),
        isActive: stats.isActive,
        lastWeekUpdate: stats.lastWeekUpdate.toNumber(),
        pprHistory: stats.pprHistory.map((p: any) => p.toNumber()),
        historyIndex: stats.historyIndex.toNumber(),
        totalPPR: stats.totalPPR.toNumber(),
        pprVariance: stats.pprVariance.toNumber(),
        averagePPR: stats.averagePPR.toNumber(),
        performanceScore: stats.performanceScore.toNumber()
      };
    } catch (error) {
      console.error('Error getting player stats:', error);
      throw error;
    }
  }

  async getUserPlayerStakes(userAddress: string): Promise<PlayerStakingPosition[]> {
    try {
      const stakes = await this.contract.getUserPlayerStakes(userAddress);
      return stakes.map((stake: any) => ({
        player: stake.player,
        amount: parseFloat(ethers.utils.formatEther(stake.amount)),
        startTime: stake.startTime.toNumber(),
        lockEndTime: stake.lockEndTime.toNumber(),
        lastRewardClaim: stake.lastRewardClaim.toNumber(),
        isActive: stake.isActive,
        performanceMultiplier: stake.performanceMultiplier.toNumber()
      }));
    } catch (error) {
      console.error('Error getting user stakes:', error);
      throw error;
    }
  }

  async getPlayerTotalStaked(playerAddress: string): Promise<number> {
    try {
      const total = await this.contract.getPlayerTotalStaked(playerAddress);
      return parseFloat(ethers.utils.formatEther(total));
    } catch (error) {
      console.error('Error getting player total staked:', error);
      throw error;
    }
  }

  async getWeekData(week: number): Promise<WeekData> {
    try {
      const weekData = await this.contract.getWeekData(week);
      return {
        totalPPR: weekData.totalPPR.toNumber(),
        totalBurnAmount: parseFloat(ethers.utils.formatEther(weekData.totalBurnAmount)),
        totalEmissionAmount: parseFloat(ethers.utils.formatEther(weekData.totalEmissionAmount)),
        stakingRewardsDistributed: parseFloat(ethers.utils.formatEther(weekData.stakingRewardsDistributed)),
        tradingFeesCollected: parseFloat(ethers.utils.formatEther(weekData.tradingFeesCollected)),
        leagueAveragePPR: weekData.leagueAveragePPR.toNumber(),
        leagueStandardDeviation: weekData.leagueStandardDeviation.toNumber(),
        isProcessed: weekData.isProcessed
      };
    } catch (error) {
      console.error('Error getting week data:', error);
      throw error;
    }
  }

  async getLeagueStats(week: number): Promise<LeagueStats> {
    try {
      const stats = await this.contract.getLeagueStats(week);
      return {
        totalActivePlayers: stats.totalActivePlayers.toNumber(),
        totalPPR: stats.totalPPR.toNumber(),
        averagePPR: stats.averagePPR.toNumber(),
        standardDeviation: stats.standardDeviation.toNumber(),
        totalVariance: stats.totalVariance.toNumber()
      };
    } catch (error) {
      console.error('Error getting league stats:', error);
      throw error;
    }
  }

  async getCurrentLeagueStats(): Promise<LeagueStats> {
    try {
      const stats = await this.contract.getCurrentLeagueStats();
      return {
        totalActivePlayers: stats.totalActivePlayers.toNumber(),
        totalPPR: stats.totalPPR.toNumber(),
        averagePPR: stats.averagePPR.toNumber(),
        standardDeviation: stats.standardDeviation.toNumber(),
        totalVariance: stats.totalVariance.toNumber()
      };
    } catch (error) {
      console.error('Error getting current league stats:', error);
      throw error;
    }
  }

  async getPerformanceScore(playerAddress: string): Promise<number> {
    try {
      const score = await this.contract.getPerformanceScore(playerAddress);
      return score.toNumber();
    } catch (error) {
      console.error('Error getting performance score:', error);
      throw error;
    }
  }

  async getStakingMultiplier(playerAddress: string): Promise<number> {
    try {
      const multiplier = await this.contract.getStakingMultiplier(playerAddress);
      return multiplier.toNumber();
    } catch (error) {
      console.error('Error getting staking multiplier:', error);
      throw error;
    }
  }

  async getSupplyInfo(): Promise<SupplyInfo> {
    try {
      const supply = await this.contract.getSupplyInfo();
      return {
        total: parseFloat(ethers.utils.formatEther(supply[0])),
        circulating: parseFloat(ethers.utils.formatEther(supply[1])),
        locked: parseFloat(ethers.utils.formatEther(supply[2]))
      };
    } catch (error) {
      console.error('Error getting supply info:', error);
      throw error;
    }
  }

  async getTreasuryInfo(): Promise<TreasuryInfo> {
    try {
      const treasury = await this.contract.getTreasuryInfo();
      return {
        treasury: parseFloat(ethers.utils.formatEther(treasury.treasury)),
        tradingFees: parseFloat(ethers.utils.formatEther(treasury.tradingFees))
      };
    } catch (error) {
      console.error('Error getting treasury info:', error);
      throw error;
    }
  }

  async calculateEnhancedStakingRewards(userAddress: string, stakeIndex: number): Promise<number> {
    try {
      const rewards = await this.contract.calculateEnhancedStakingRewards(userAddress, stakeIndex);
      return parseFloat(ethers.utils.formatEther(rewards));
    } catch (error) {
      console.error('Error calculating staking rewards:', error);
      throw error;
    }
  }

  // ========== CONTRACT STATE ==========

  async getCurrentWeek(): Promise<number> {
    try {
      return (await this.contract.currentWeek()).toNumber();
    } catch (error) {
      console.error('Error getting current week:', error);
      throw error;
    }
  }

  async getLastWeekUpdate(): Promise<number> {
    try {
      return (await this.contract.lastWeekUpdate()).toNumber();
    } catch (error) {
      console.error('Error getting last week update:', error);
      throw error;
    }
  }

  async getTotalTradingFees(): Promise<number> {
    try {
      const fees = await this.contract.totalTradingFees();
      return parseFloat(ethers.utils.formatEther(fees));
    } catch (error) {
      console.error('Error getting total trading fees:', error);
      throw error;
    }
  }

  // ========== ADMIN FUNCTIONS ==========

  async updateMarketCap(playerAddress: string, marketCap: number): Promise<void> {
    try {
      const marketCapWei = ethers.utils.parseEther(marketCap.toString());
      const tx = await this.contract.updateMarketCap(playerAddress, marketCapWei);
      await tx.wait();
    } catch (error) {
      console.error('Error updating market cap:', error);
      throw error;
    }
  }

  async pause(): Promise<void> {
    try {
      const tx = await this.contract.pause();
      await tx.wait();
    } catch (error) {
      console.error('Error pausing contract:', error);
      throw error;
    }
  }

  async unpause(): Promise<void> {
    try {
      const tx = await this.contract.unpause();
      await tx.wait();
    } catch (error) {
      console.error('Error unpausing contract:', error);
      throw error;
    }
  }

  // ========== UTILITY FUNCTIONS ==========

  async getTokenBalance(address: string): Promise<number> {
    try {
      const balance = await this.contract.balanceOf(address);
      return parseFloat(ethers.utils.formatEther(balance));
    } catch (error) {
      console.error('Error getting token balance:', error);
      throw error;
    }
  }

  async getAllowance(owner: string, spender: string): Promise<number> {
    try {
      const allowance = await this.contract.allowance(owner, spender);
      return parseFloat(ethers.utils.formatEther(allowance));
    } catch (error) {
      console.error('Error getting allowance:', error);
      throw error;
    }
  }

  async approve(spender: string, amount: number): Promise<void> {
    try {
      const amountWei = ethers.utils.parseEther(amount.toString());
      const tx = await this.contract.approve(spender, amountWei);
      await tx.wait();
    } catch (error) {
      console.error('Error approving tokens:', error);
      throw error;
    }
  }

  async transfer(to: string, amount: number): Promise<void> {
    try {
      const amountWei = ethers.utils.parseEther(amount.toString());
      const tx = await this.contract.transfer(to, amountWei);
      await tx.wait();
    } catch (error) {
      console.error('Error transferring tokens:', error);
      throw error;
    }
  }
}

// Enhanced analytics service for performance calculations
export class PerformanceAnalyticsService {
  static calculateStandardDeviation(values: number[]): number {
    if (values.length === 0) return 0;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
    
    return Math.sqrt(variance);
  }

  static calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    
    return squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
  }

  static calculatePerformanceRatio(playerScore: number, leagueAverage: number): number {
    if (leagueAverage === 0) return 100;
    return (playerScore / leagueAverage) * 100;
  }

  static getPerformanceTier(performanceRatio: number): string {
    if (performanceRatio >= 150) return 'Elite';
    if (performanceRatio >= 120) return 'Above Average';
    if (performanceRatio >= 100) return 'Average';
    if (performanceRatio >= 80) return 'Below Average';
    return 'Poor Performer';
  }

  static calculateBurnPercentage(performanceRatio: number): number {
    const baseRate = 5; // 5% base burn rate
    const maxMultiplier = 3; // Max 3x multiplier
    
    let multiplier = performanceRatio / 100;
    if (multiplier > maxMultiplier) multiplier = maxMultiplier;
    
    const burnPercentage = baseRate * multiplier;
    
    // Ensure within bounds (1-10%)
    if (burnPercentage > 10) return 10;
    if (burnPercentage < 1) return 1;
    
    return burnPercentage;
  }

  static calculateEmissionPercentage(performanceRatio: number): number {
    const baseRate = 1; // 1% base emission rate
    const maxMultiplier = 2; // Max 2x emission
    
    let multiplier = (100 - performanceRatio) / 100;
    if (multiplier > maxMultiplier) multiplier = maxMultiplier;
    
    const emissionPercentage = baseRate * multiplier;
    
    // Cap at 2% max emission
    if (emissionPercentage > 2) return 2;
    
    return emissionPercentage;
  }
} 