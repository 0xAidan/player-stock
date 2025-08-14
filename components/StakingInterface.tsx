'use client';

import { useState, useEffect } from 'react';

interface StakingPosition {
  amount: string;
  startTime: string;
  lockEndTime: string;
  lastRewardClaim: string;
  isActive: boolean;
}

interface StakingInterfaceProps {
  className?: string;
  contractAddress?: string;
}

export default function StakingInterface({ className = '', contractAddress }: StakingInterfaceProps) {
  const [stakeAmount, setStakeAmount] = useState<string>('');
  const [userBalance, setUserBalance] = useState<string>('0');
  const [stakingPosition, setStakingPosition] = useState<StakingPosition | null>(null);
  const [pendingRewards, setPendingRewards] = useState<string>('0');
  const [totalStaked, setTotalStaked] = useState<string>('0');
  const [totalTradingFees, setTotalTradingFees] = useState<string>('0');
  const [currentWeek, setCurrentWeek] = useState<string>('1');
  const [isLoading, setIsLoading] = useState(false);

  // Mock data for demonstration - replace with actual contract calls
  useEffect(() => {
    // Simulate loading contract data
    setUserBalance('1000000');
    setTotalStaked('5000000');
    setTotalTradingFees('25000');
    setCurrentWeek('3');
    
    // Mock staking position
    setStakingPosition({
      amount: '100000',
      startTime: '1704067200', // Dec 31, 2023
      lockEndTime: '1704672000', // Jan 7, 2024
      lastRewardClaim: '2',
      isActive: true
    });
    
    setPendingRewards('1250');
  }, []);

  const handleStake = async () => {
    if (!stakeAmount || parseFloat(stakeAmount) <= 0) {
      alert('Please enter a valid amount to stake');
      return;
    }

    setIsLoading(true);
    try {
      // Mock staking transaction
      console.log(`Staking ${stakeAmount} tokens`);
      
      // Simulate transaction delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update UI
      const newAmount = parseFloat(stakeAmount);
      const currentAmount = stakingPosition ? parseFloat(stakingPosition.amount) : 0;
      const newTotal = currentAmount + newAmount;
      
      setStakingPosition({
        amount: newTotal.toString(),
        startTime: stakingPosition?.startTime || Math.floor(Date.now() / 1000).toString(),
        lockEndTime: (Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60).toString(), // 7 days
        lastRewardClaim: currentWeek,
        isActive: true
      });
      
      setTotalStaked((parseFloat(totalStaked) + newAmount).toString());
      setUserBalance((parseFloat(userBalance) - newAmount).toString());
      setStakeAmount('');
      
      alert('Successfully staked tokens!');
    } catch (error) {
      console.error('Staking error:', error);
      alert('Failed to stake tokens. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnstake = async () => {
    if (!stakingPosition || !stakingPosition.isActive) {
      alert('No active staking position to unstake');
      return;
    }

    const lockEndTime = parseInt(stakingPosition.lockEndTime);
    const currentTime = Math.floor(Date.now() / 1000);
    
    if (currentTime < lockEndTime) {
      const remainingTime = lockEndTime - currentTime;
      const remainingDays = Math.ceil(remainingTime / (24 * 60 * 60));
      alert(`Lock period not ended. ${remainingDays} days remaining.`);
      return;
    }

    setIsLoading(true);
    try {
      // Mock unstaking transaction
      console.log('Unstaking tokens');
      
      // Simulate transaction delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Claim rewards first
      if (parseFloat(pendingRewards) > 0) {
        setUserBalance((parseFloat(userBalance) + parseFloat(pendingRewards)).toString());
        setPendingRewards('0');
      }
      
      // Return staked tokens
      const stakedAmount = parseFloat(stakingPosition.amount);
      setUserBalance((parseFloat(userBalance) + stakedAmount).toString());
      setTotalStaked((parseFloat(totalStaked) - stakedAmount).toString());
      setStakingPosition(null);
      
      alert('Successfully unstaked tokens and claimed rewards!');
    } catch (error) {
      console.error('Unstaking error:', error);
      alert('Failed to unstake tokens. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClaimRewards = async () => {
    if (parseFloat(pendingRewards) <= 0) {
      alert('No rewards to claim');
      return;
    }

    setIsLoading(true);
    try {
      // Mock claim transaction
      console.log(`Claiming ${pendingRewards} rewards`);
      
      // Simulate transaction delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update UI
      setUserBalance((parseFloat(userBalance) + parseFloat(pendingRewards)).toString());
      setPendingRewards('0');
      
      if (stakingPosition) {
        setStakingPosition({
          ...stakingPosition,
          lastRewardClaim: currentWeek
        });
      }
      
      alert('Successfully claimed rewards!');
    } catch (error) {
      console.error('Claim error:', error);
      alert('Failed to claim rewards. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(parseInt(timestamp) * 1000).toLocaleDateString();
  };

  const formatTokens = (amount: string) => {
    return parseFloat(amount).toLocaleString();
  };

  const isLockExpired = stakingPosition ? 
    Math.floor(Date.now() / 1000) >= parseInt(stakingPosition.lockEndTime) : false;

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Staking Dashboard</h2>
      
      {/* Protocol Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="text-sm text-blue-600">Total Staked</div>
          <div className="text-xl font-bold text-blue-800">
            {formatTokens(totalStaked)} PST
          </div>
        </div>
        
        <div className="bg-green-50 rounded-lg p-4">
          <div className="text-sm text-green-600">Trading Fees</div>
          <div className="text-xl font-bold text-green-800">
            {formatTokens(totalTradingFees)} PST
          </div>
        </div>
        
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="text-sm text-purple-600">Current Week</div>
          <div className="text-xl font-bold text-purple-800">
            Week {currentWeek}
          </div>
        </div>
      </div>

      {/* User Balance */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <div className="text-sm text-gray-600">Your Balance</div>
        <div className="text-2xl font-bold text-gray-800">
          {formatTokens(userBalance)} PST
        </div>
      </div>

      {/* Staking Position */}
      {stakingPosition && stakingPosition.isActive && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-yellow-800 mb-3">Active Staking Position</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-yellow-600">Staked Amount</div>
              <div className="text-lg font-bold text-yellow-800">
                {formatTokens(stakingPosition.amount)} PST
              </div>
            </div>
            
            <div>
              <div className="text-sm text-yellow-600">Lock End Date</div>
              <div className="text-lg font-bold text-yellow-800">
                {formatTime(stakingPosition.lockEndTime)}
              </div>
            </div>
            
            <div>
              <div className="text-sm text-yellow-600">Start Date</div>
              <div className="text-lg font-bold text-yellow-800">
                {formatTime(stakingPosition.startTime)}
              </div>
            </div>
            
            <div>
              <div className="text-sm text-yellow-600">Last Reward Claim</div>
              <div className="text-lg font-bold text-yellow-800">
                Week {stakingPosition.lastRewardClaim}
              </div>
            </div>
          </div>
          
          {!isLockExpired && (
            <div className="mt-3 p-2 bg-yellow-100 rounded text-yellow-700 text-sm">
              ⏰ Lock period active - cannot unstake until {formatTime(stakingPosition.lockEndTime)}
            </div>
          )}
        </div>
      )}

      {/* Pending Rewards */}
      {parseFloat(pendingRewards) > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-sm text-green-600">Pending Rewards</div>
              <div className="text-xl font-bold text-green-800">
                {formatTokens(pendingRewards)} PST
              </div>
            </div>
            
            <button
              onClick={handleClaimRewards}
              disabled={isLoading}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {isLoading ? 'Claiming...' : 'Claim Rewards'}
            </button>
          </div>
        </div>
      )}

      {/* Staking Actions */}
      <div className="space-y-4">
        {!stakingPosition?.isActive ? (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 mb-3">Stake Tokens</h3>
            
            <div className="flex gap-3">
              <input
                type="number"
                value={stakeAmount}
                onChange={(e) => setStakeAmount(e.target.value)}
                placeholder="Amount to stake"
                className="flex-1 px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              
              <button
                onClick={handleStake}
                disabled={isLoading || !stakeAmount || parseFloat(stakeAmount) <= 0}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? 'Staking...' : 'Stake'}
              </button>
            </div>
            
            <div className="text-xs text-blue-600 mt-2">
              Lock period: 7 days (NFL week) • Reward rate: 0.5% of trading fees
            </div>
          </div>
        ) : (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="font-semibold text-red-800 mb-3">Unstake Tokens</h3>
            
            <button
              onClick={handleUnstake}
              disabled={isLoading || !isLockExpired}
              className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              {isLoading ? 'Unstaking...' : isLockExpired ? 'Unstake & Claim Rewards' : 'Lock Period Active'}
            </button>
            
            <div className="text-xs text-red-600 mt-2">
              {isLockExpired ? 
                'Lock period ended - you can now unstake and claim rewards' : 
                'Must wait for lock period to end before unstaking'
              }
            </div>
          </div>
        )}
      </div>

      {/* Staking Benefits */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-semibold text-gray-800 mb-2">🎯 Staking Benefits</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Earn 0.5% of weekly trading fees as rewards</li>
          <li>• Rewards distributed proportionally to staked amount</li>
          <li>• Support protocol stability and long-term growth</li>
          <li>• 7-day lock period aligns with NFL week schedule</li>
          <li>• Automatic reward accumulation during lock period</li>
        </ul>
      </div>
    </div>
  );
} 