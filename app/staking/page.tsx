'use client';

import { useState, useEffect } from 'react';
import StakingInterface from '@/components/StakingInterface';
import { Player, PlayerStakingPosition } from '@/lib/types';

// Mock data for demonstration - replace with actual data fetching
const mockPlayers: Player[] = [
  {
    id: '1',
    name: 'Patrick Mahomes',
    team: 'Kansas City Chiefs',
    position: 'QB',
    currentPPR: 25.5,
    lastWeekPPR: 22.3,
    tokenSupply: 1000000,
    tokenPrice: 1.25,
    totalBurned: 50000,
    totalEmitted: 0,
    isActive: true
  },
  {
    id: '2',
    name: 'Christian McCaffrey',
    team: 'San Francisco 49ers',
    position: 'RB',
    currentPPR: 28.7,
    lastWeekPPR: 30.2,
    tokenSupply: 800000,
    tokenPrice: 1.45,
    totalBurned: 40000,
    totalEmitted: 20000,
    isActive: true
  },
  {
    id: '3',
    name: 'Tyreek Hill',
    team: 'Miami Dolphins',
    position: 'WR',
    currentPPR: 24.1,
    lastWeekPPR: 26.8,
    tokenSupply: 600000,
    tokenPrice: 1.15,
    totalBurned: 30000,
    totalEmitted: 15000,
    isActive: true
  }
];

export default function StakingPage() {
  const [userAddress, setUserAddress] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);

  // Mock functions - replace with actual contract calls
  const handleStake = async (playerId: string, amount: number) => {
    console.log(`Staking ${amount} tokens for player ${playerId}`);
    // Simulate transaction delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    return Promise.resolve();
  };

  const handleUnstake = async (stakeIndex: number) => {
    console.log(`Unstaking stake at index ${stakeIndex}`);
    await new Promise(resolve => setTimeout(resolve, 2000));
    return Promise.resolve();
  };

  const handleClaimRewards = async (stakeIndex: number) => {
    console.log(`Claiming rewards for stake at index ${stakeIndex}`);
    await new Promise(resolve => setTimeout(resolve, 1000));
    return Promise.resolve();
  };

  const getUserStakes = async (address: string): Promise<PlayerStakingPosition[]> => {
    // Mock staking data
    return [
      {
        player: '1',
        amount: 1000,
        startTime: Math.floor(Date.now() / 1000) - 3 * 24 * 60 * 60, // 3 days ago
        lockEndTime: Math.floor(Date.now() / 1000) + 4 * 24 * 60 * 60, // 4 days from now
        lastRewardClaim: 1,
        isActive: true
      },
      {
        player: '2',
        amount: 500,
        startTime: Math.floor(Date.now() / 1000) - 8 * 24 * 60 * 60, // 8 days ago
        lockEndTime: Math.floor(Date.now() / 1000) - 1 * 24 * 60 * 60, // 1 day ago (unlocked)
        lastRewardClaim: 1,
        isActive: true
      }
    ];
  };

  const getPendingRewards = async (address: string, stakeIndex: number): Promise<number> => {
    // Mock pending rewards
    return stakeIndex === 0 ? 25.5 : 12.3;
  };

  const getPerformanceMultiplier = async (playerId: string): Promise<number> => {
    // Mock performance multipliers
    const multipliers: Record<string, number> = {
      '1': 150, // Good performance
      '2': 80,  // Poor performance
      '3': 100  // Base performance
    };
    return multipliers[playerId] || 100;
  };

  // Mock wallet connection
  useEffect(() => {
    // Simulate wallet connection
    const mockConnect = () => {
      setUserAddress('0x1234567890123456789012345678901234567890');
      setIsConnected(true);
    };

    // Auto-connect for demo
    setTimeout(mockConnect, 1000);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Player Staking Dashboard
          </h1>
          <p className="text-lg text-gray-600">
            Stake individual player tokens to earn performance-based rewards
          </p>
        </div>

        {/* Wallet Connection Status */}
        <div className="mb-8">
          <div className={`max-w-md mx-auto p-4 rounded-lg ${
            isConnected ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'
          }`}>
            <div className="flex items-center justify-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${
                isConnected ? 'bg-green-500' : 'bg-yellow-500'
              }`}></div>
              <span className={`font-medium ${
                isConnected ? 'text-green-800' : 'text-yellow-800'
              }`}>
                {isConnected ? 'Wallet Connected' : 'Connecting Wallet...'}
              </span>
            </div>
            {isConnected && (
              <p className="text-sm text-green-600 mt-1 text-center">
                {userAddress.slice(0, 6)}...{userAddress.slice(-4)}
              </p>
            )}
          </div>
        </div>

        {/* Staking Interface */}
        <StakingInterface
          players={mockPlayers}
          userAddress={userAddress}
          onStake={handleStake}
          onUnstake={handleUnstake}
          onClaimRewards={handleClaimRewards}
          getUserStakes={getUserStakes}
          getPendingRewards={getPendingRewards}
          getPerformanceMultiplier={getPerformanceMultiplier}
        />

        {/* Info Section */}
        <div className="mt-12 max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold mb-4">How Player Staking Works</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Performance Multipliers</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Good performance: 100% - 200% rewards</li>
                  <li>• Poor performance: 20% - 100% rewards</li>
                  <li>• Base rate: 0.5% of staked amount per week</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Staking Rules</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• 7-day lock period (NFL week duration)</li>
                  <li>• Stake individual player tokens</li>
                  <li>• Rewards from 0.25% trading fees</li>
                  <li>• Automatic reward accumulation</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 