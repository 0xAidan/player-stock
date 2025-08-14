'use client';

import { useState, useEffect } from 'react';
import { Lock, Unlock, Coins, TrendingUp, TrendingDown, BarChart3, Target } from 'lucide-react';
import { Player } from '@/lib/types';

interface PlayerStakingPosition {
  player: string;
  amount: number;
  startTime: number;
  lockEndTime: number;
  lastRewardClaim: number;
  isActive: boolean;
  performanceMultiplier: number; // Frozen multiplier at stake time
}

interface LeagueStats {
  totalActivePlayers: number;
  totalPPR: number;
  averagePPR: number;
  standardDeviation: number;
  totalVariance: number;
}

interface SupplyInfo {
  total: number;
  circulating: number;
  locked: number;
}

interface TreasuryInfo {
  treasury: number;
  tradingFees: number;
}

interface StakingInterfaceProps {
  players: Player[];
  userAddress?: string;
  onStake: (playerId: string, amount: number) => Promise<void>;
  onUnstake: (stakeIndex: number) => Promise<void>;
  onClaimRewards: (stakeIndex: number) => Promise<void>;
  getUserStakes: (userAddress: string) => Promise<PlayerStakingPosition[]>;
  getPendingRewards: (userAddress: string, stakeIndex: number) => Promise<number>;
  getStakingMultiplier: (playerId: string) => Promise<number>;
  getPerformanceScore: (playerId: string) => Promise<number>;
  getCurrentLeagueStats: () => Promise<LeagueStats>;
  getSupplyInfo: () => Promise<SupplyInfo>;
  getTreasuryInfo: () => Promise<TreasuryInfo>;
}

export default function StakingInterface({
  players,
  userAddress,
  onStake,
  onUnstake,
  onClaimRewards,
  getUserStakes,
  getPendingRewards,
  getStakingMultiplier,
  getPerformanceScore,
  getCurrentLeagueStats,
  getSupplyInfo,
  getTreasuryInfo
}: StakingInterfaceProps) {
  const [userStakes, setUserStakes] = useState<PlayerStakingPosition[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<string>('');
  const [stakeAmount, setStakeAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [stakingMultipliers, setStakingMultipliers] = useState<Record<string, number>>({});
  const [performanceScores, setPerformanceScores] = useState<Record<string, number>>({});
  const [leagueStats, setLeagueStats] = useState<LeagueStats | null>(null);
  const [supplyInfo, setSupplyInfo] = useState<SupplyInfo | null>(null);
  const [treasuryInfo, setTreasuryInfo] = useState<TreasuryInfo | null>(null);

  useEffect(() => {
    if (userAddress) {
      loadUserStakes();
      loadPerformanceData();
      loadSupplyInfo();
      loadTreasuryInfo();
    }
  }, [userAddress]);

  const loadUserStakes = async () => {
    if (!userAddress) return;
    try {
      const stakes = await getUserStakes(userAddress);
      setUserStakes(stakes);
    } catch (err) {
      console.error('Error loading stakes:', err);
    }
  };

  const loadPerformanceData = async () => {
    if (!players || players.length === 0) return;
    
    try {
      // Load staking multipliers
      const multipliers: Record<string, number> = {};
      const scores: Record<string, number> = {};
      
      for (const player of players) {
        try {
          const multiplier = await getStakingMultiplier(player.id);
          const score = await getPerformanceScore(player.id);
          multipliers[player.id] = multiplier;
          scores[player.id] = score;
        } catch (err) {
          console.error(`Error loading data for ${player.id}:`, err);
          multipliers[player.id] = 100; // Default to base multiplier
          scores[player.id] = 0;
        }
      }
      
      setStakingMultipliers(multipliers);
      setPerformanceScores(scores);
      
      // Load league stats
      const league = await getCurrentLeagueStats();
      setLeagueStats(league);
    } catch (err) {
      console.error('Error loading performance data:', err);
    }
  };

  const loadSupplyInfo = async () => {
    try {
      const supply = await getSupplyInfo();
      setSupplyInfo(supply);
    } catch (err) {
      console.error('Error loading supply info:', err);
    }
  };

  const loadTreasuryInfo = async () => {
    try {
      const treasury = await getTreasuryInfo();
      setTreasuryInfo(treasury);
    } catch (err) {
      console.error('Error loading treasury info:', err);
    }
  };

  const handleStake = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userAddress || !selectedPlayer) {
      setError('Please connect wallet and select a player');
      return;
    }

    const numAmount = parseFloat(stakeAmount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      await onStake(selectedPlayer, numAmount);
      setStakeAmount('');
      setSelectedPlayer('');
      await loadUserStakes();
      await loadSupplyInfo(); // Refresh supply info after staking
    } catch (err: any) {
      setError(err.message || 'Staking failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUnstake = async (stakeIndex: number) => {
    if (!userAddress) return;
    
    setIsProcessing(true);
    setError('');

    try {
      await onUnstake(stakeIndex);
      await loadUserStakes();
      await loadSupplyInfo(); // Refresh supply info after unstaking
    } catch (err: any) {
      setError(err.message || 'Unstaking failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClaimRewards = async (stakeIndex: number) => {
    if (!userAddress) return;
    
    setIsProcessing(true);
    setError('');

    try {
      await onClaimRewards(stakeIndex);
      await loadUserStakes();
    } catch (err: any) {
      setError(err.message || 'Claiming rewards failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const getPlayerName = (playerId: string) => {
    if (!players) return 'Unknown Player';
    const player = players.find(p => p.id === playerId);
    return player ? player.name : 'Unknown Player';
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  const isLocked = (lockEndTime: number) => {
    return Date.now() / 1000 < lockEndTime;
  };

  const getMultiplierColor = (multiplier: number) => {
    if (multiplier >= 150) return 'text-purple-600'; // Elite tier
    if (multiplier >= 120) return 'text-blue-600'; // Above average
    if (multiplier >= 100) return 'text-green-600'; // Average
    if (multiplier >= 80) return 'text-yellow-600'; // Below average
    return 'text-red-600'; // Poor performer
  };

  const getMultiplierIcon = (multiplier: number) => {
    if (multiplier >= 150) return <Target className="w-4 h-4" />; // Elite
    if (multiplier >= 120) return <TrendingUp className="w-4 h-4" />; // Above average
    if (multiplier >= 100) return <BarChart3 className="w-4 h-4" />; // Average
    if (multiplier >= 80) return <TrendingDown className="w-4 h-4" />; // Below average
    return <TrendingDown className="w-4 h-4" />; // Poor
  };

  const getMultiplierTier = (multiplier: number) => {
    if (multiplier >= 150) return 'Elite';
    if (multiplier >= 120) return 'Above Average';
    if (multiplier >= 100) return 'Average';
    if (multiplier >= 80) return 'Below Average';
    return 'Poor Performer';
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toFixed(0);
  };

  const formatPercentage = (num: number) => {
    return (num / 100).toFixed(1) + '%';
  };

  return (
    <div className="space-y-6">
      {/* Supply Overview */}
      {supplyInfo && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2" />
            Supply Overview
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{formatNumber(supplyInfo.total)}</div>
              <div className="text-sm text-gray-600">Total Supply</div>
            </div>
            <div className="bg-white rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{formatNumber(supplyInfo.circulating)}</div>
              <div className="text-sm text-gray-600">Circulating</div>
            </div>
            <div className="bg-white rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{formatNumber(supplyInfo.locked)}</div>
              <div className="text-sm text-gray-600">Locked (Staked)</div>
            </div>
          </div>
        </div>
      )}

      {/* Treasury Overview */}
      {treasuryInfo && (
        <div className="bg-gradient-to-r from-green-50 to-yellow-50 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <Coins className="w-5 h-5 mr-2" />
            Protocol Treasury System
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{formatNumber(treasuryInfo.treasury)}</div>
              <div className="text-sm text-gray-600">Treasury Balance</div>
              <div className="text-xs text-gray-500 mt-1">Funds for burns/emissions</div>
            </div>
            <div className="bg-white rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">{formatNumber(treasuryInfo.tradingFees)}</div>
              <div className="text-sm text-gray-600">Trading Fees</div>
              <div className="text-xs text-gray-500 mt-1">0.25% per trade</div>
            </div>
          </div>
          <div className="mt-4 bg-white rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-2">How the Treasury System Works:</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <div>• <strong>Good Performance:</strong> Treasury burns tokens (deflationary)</div>
              <div>• <strong>Poor Performance:</strong> Treasury receives emissions (inflationary, limited)</div>
              <div>• <strong>Staking Rewards:</strong> Funded by trading fees + treasury</div>
              <div>• <strong>User Protection:</strong> Your holdings are never touched</div>
            </div>
          </div>
        </div>
      )}

      {/* League Statistics */}
      {leagueStats && (
        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <Target className="w-5 h-5 mr-2" />
            League Statistics
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-blue-600">{leagueStats.totalActivePlayers}</div>
              <div className="text-xs text-gray-600">Active Players</div>
            </div>
            <div className="bg-white rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-green-600">{leagueStats.averagePPR.toFixed(1)}</div>
              <div className="text-xs text-gray-600">Avg PPR</div>
            </div>
            <div className="bg-white rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-purple-600">{leagueStats.standardDeviation.toFixed(1)}</div>
              <div className="text-xs text-gray-600">Std Dev</div>
            </div>
            <div className="bg-white rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-orange-600">{formatNumber(leagueStats.totalVariance)}</div>
              <div className="text-xs text-gray-600">Total Variance</div>
            </div>
          </div>
        </div>
      )}

      {/* Staking Form */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4">Stake Player Tokens</h2>
        
        <form onSubmit={handleStake} className="space-y-4">
          {/* Player Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Player
            </label>
            <select
              value={selectedPlayer}
              onChange={(e) => setSelectedPlayer(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              disabled={!players || players.length === 0}
            >
              <option value="">
                {!players || players.length === 0 ? "No players available" : "Choose a player..."}
              </option>
              {players && players.map((player) => (
                <option key={player.id} value={player.id}>
                  {player.name} ({player.team}) - {player.position}
                </option>
              ))}
            </select>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount to Stake
            </label>
            <div className="relative">
              <input
                type="number"
                value={stakeAmount}
                onChange={(e) => setStakeAmount(e.target.value)}
                placeholder="0.00"
                step="0.01"
                min="0"
                className="w-full p-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <div className="absolute right-3 top-3">
                <Coins className="w-5 h-5 text-gray-400" />
              </div>
            </div>
          </div>

          {/* Enhanced Performance Display */}
          {selectedPlayer && stakingMultipliers[selectedPlayer] && (
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Performance Score:</span>
                    <div className="font-semibold text-blue-600">
                      {performanceScores[selectedPlayer]?.toFixed(1) || '0.0'}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Staking Multiplier:</span>
                    <div className={`flex items-center space-x-1 font-semibold ${getMultiplierColor(stakingMultipliers[selectedPlayer])}`}>
                      {getMultiplierIcon(stakingMultipliers[selectedPlayer])}
                      <span>{formatPercentage(stakingMultipliers[selectedPlayer])}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">Tier:</div>
                  <div className={`font-semibold ${getMultiplierColor(stakingMultipliers[selectedPlayer])}`}>
                    {getMultiplierTier(stakingMultipliers[selectedPlayer])}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {stakingMultipliers[selectedPlayer] >= 150 
                      ? 'Elite performers get maximum rewards'
                      : stakingMultipliers[selectedPlayer] >= 120
                      ? 'Above average performance rewarded'
                      : stakingMultipliers[selectedPlayer] >= 100
                      ? 'Average performance - standard rewards'
                      : stakingMultipliers[selectedPlayer] >= 80
                      ? 'Below average - reduced rewards'
                      : 'Poor performance - minimal rewards'
                    }
                  </div>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="text-xs text-gray-600">
                  <strong>Reward Source:</strong> Trading fees + Treasury funds (your tokens are safe)
                </div>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!selectedPlayer || !stakeAmount || isProcessing || !userAddress}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {isProcessing ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Processing...
              </div>
            ) : (
              'Stake Tokens'
            )}
          </button>
        </form>
      </div>

      {/* Active Stakes */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4">Your Staked Positions</h2>
        
        {userStakes.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No active stakes</p>
        ) : (
          <div className="space-y-4">
            {userStakes.map((stake, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-semibold">{getPlayerName(stake.player)}</h3>
                    <p className="text-sm text-gray-600">
                      {stake.amount.toFixed(2)} tokens staked
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {isLocked(stake.lockEndTime) ? (
                      <Lock className="w-5 h-5 text-red-500" />
                    ) : (
                      <Unlock className="w-5 h-5 text-green-500" />
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                  <div>
                    <span className="text-gray-600">Started:</span>
                    <p>{formatTime(stake.startTime)}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Lock Ends:</span>
                    <p>{formatTime(stake.lockEndTime)}</p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-3 mb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">Frozen Multiplier:</span>
                      <div className={`flex items-center space-x-1 font-semibold ${getMultiplierColor(stake.performanceMultiplier)}`}>
                        {getMultiplierIcon(stake.performanceMultiplier)}
                        <span>{formatPercentage(stake.performanceMultiplier)}</span>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {getMultiplierTier(stake.performanceMultiplier)}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Multiplier locked at stake time - won't change during stake period
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Current Performance Score: {performanceScores[stake.player]?.toFixed(1) || '0.0'}
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleClaimRewards(index)}
                      disabled={isProcessing}
                      className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50 transition-colors"
                    >
                      Claim Rewards
                    </button>
                    
                    {!isLocked(stake.lockEndTime) && (
                      <button
                        onClick={() => handleUnstake(index)}
                        disabled={isProcessing}
                        className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50 transition-colors"
                      >
                        Unstake
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 