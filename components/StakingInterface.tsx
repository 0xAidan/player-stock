'use client';

import { useState, useEffect } from 'react';
import { Lock, Unlock, Coins, TrendingUp, TrendingDown } from 'lucide-react';
import { Player } from '@/lib/types';

interface PlayerStakingPosition {
  player: string;
  amount: number;
  startTime: number;
  lockEndTime: number;
  lastRewardClaim: number;
  isActive: boolean;
}

interface StakingInterfaceProps {
  players: Player[];
  userAddress?: string;
  onStake: (playerId: string, amount: number) => Promise<void>;
  onUnstake: (stakeIndex: number) => Promise<void>;
  onClaimRewards: (stakeIndex: number) => Promise<void>;
  getUserStakes: (userAddress: string) => Promise<PlayerStakingPosition[]>;
  getPendingRewards: (userAddress: string, stakeIndex: number) => Promise<number>;
  getPerformanceMultiplier: (playerId: string) => Promise<number>;
}

export default function StakingInterface({
  players,
  userAddress,
  onStake,
  onUnstake,
  onClaimRewards,
  getUserStakes,
  getPendingRewards,
  getPerformanceMultiplier
}: StakingInterfaceProps) {
  const [userStakes, setUserStakes] = useState<PlayerStakingPosition[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<string>('');
  const [stakeAmount, setStakeAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [performanceMultipliers, setPerformanceMultipliers] = useState<Record<string, number>>({});

  useEffect(() => {
    if (userAddress) {
      loadUserStakes();
      loadPerformanceMultipliers();
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

  const loadPerformanceMultipliers = async () => {
    if (!players || players.length === 0) return;
    
    const multipliers: Record<string, number> = {};
    for (const player of players) {
      try {
        const multiplier = await getPerformanceMultiplier(player.id);
        multipliers[player.id] = multiplier;
      } catch (err) {
        console.error(`Error loading multiplier for ${player.id}:`, err);
        multipliers[player.id] = 100; // Default to base multiplier
      }
    }
    setPerformanceMultipliers(multipliers);
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
    if (multiplier > 100) return 'text-green-600';
    if (multiplier < 100) return 'text-red-600';
    return 'text-gray-600';
  };

  const getMultiplierIcon = (multiplier: number) => {
    if (multiplier > 100) return <TrendingUp className="w-4 h-4" />;
    if (multiplier < 100) return <TrendingDown className="w-4 h-4" />;
    return null;
  };

  return (
    <div className="space-y-6">
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

          {/* Performance Multiplier Display */}
          {selectedPlayer && performanceMultipliers[selectedPlayer] && (
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Performance Multiplier:</span>
                <div className={`flex items-center space-x-1 font-semibold ${getMultiplierColor(performanceMultipliers[selectedPlayer])}`}>
                  {getMultiplierIcon(performanceMultipliers[selectedPlayer])}
                  <span>{performanceMultipliers[selectedPlayer]}%</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {performanceMultipliers[selectedPlayer] > 100 
                  ? 'Higher rewards due to good performance'
                  : performanceMultipliers[selectedPlayer] < 100
                  ? 'Lower rewards due to poor performance'
                  : 'Base reward rate'
                }
              </p>
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
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
              <div key={index} className="border border-gray-200 rounded-lg p-4">
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

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">Multiplier:</span>
                    <div className={`flex items-center space-x-1 font-semibold ${getMultiplierColor(performanceMultipliers[stake.player] || 100)}`}>
                      {getMultiplierIcon(performanceMultipliers[stake.player] || 100)}
                      <span>{performanceMultipliers[stake.player] || 100}%</span>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleClaimRewards(index)}
                      disabled={isProcessing}
                      className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50"
                    >
                      Claim Rewards
                    </button>
                    
                    {!isLocked(stake.lockEndTime) && (
                      <button
                        onClick={() => handleUnstake(index)}
                        disabled={isProcessing}
                        className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50"
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