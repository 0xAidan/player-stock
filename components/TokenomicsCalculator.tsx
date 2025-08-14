'use client';

import { useState } from 'react';

interface TokenomicsCalculatorProps {
  className?: string;
}

export default function TokenomicsCalculator({ className = '' }: TokenomicsCalculatorProps) {
  const [pprPoints, setPprPoints] = useState<number>(0);
  const [playerSupply, setPlayerSupply] = useState<number>(1000000);
  const [lastWeekPpr, setLastWeekPpr] = useState<number>(0);

  // Constants from smart contract
  const MAX_BURN_RATE_BPS = 100; // 1% max burn rate
  const MIN_PPR_FOR_BURN = 1;

  const calculateBurnRate = (ppr: number): number => {
    if (ppr < MIN_PPR_FOR_BURN) return 0;
    const calculatedRate = (ppr * 10) / 1000;
    return Math.min(MAX_BURN_RATE_BPS, calculatedRate);
  };

  const calculatePerformanceRatio = (current: number, last: number): number => {
    if (last === 0) return current; // First week
    return current > last ? current - last : last - current;
  };

  const calculateBurnAmount = (): number => {
    if (pprPoints < MIN_PPR_FOR_BURN) return 0;
    
    const burnRate = calculateBurnRate(pprPoints);
    const performanceRatio = calculatePerformanceRatio(pprPoints, lastWeekPpr);
    
    if (pprPoints <= lastWeekPpr) return 0; // Only burn on good weeks
    
    return (playerSupply * burnRate * performanceRatio) / 10000 / 100;
  };

  const calculateEmissionAmount = (): number => {
    if (pprPoints >= lastWeekPpr) return 0; // Only emit on bad weeks
    
    const burnRate = calculateBurnRate(pprPoints);
    const emissionRate = burnRate / 2;
    const performanceRatio = calculatePerformanceRatio(pprPoints, lastWeekPpr);
    
    return (playerSupply * emissionRate * performanceRatio) / 10000 / 100;
  };

  const burnRate = calculateBurnRate(pprPoints);
  const burnAmount = calculateBurnAmount();
  const emissionAmount = calculateEmissionAmount();
  const performanceRatio = calculatePerformanceRatio(pprPoints, lastWeekPpr);
  const isGoodWeek = pprPoints > lastWeekPpr;
  const isBadWeek = pprPoints < lastWeekPpr;
  const isSameWeek = pprPoints === lastWeekPpr;

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Tokenomics Calculator</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Current Week PPR Points
          </label>
          <input
            type="number"
            value={pprPoints}
            onChange={(e) => setPprPoints(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter PPR points"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Last Week PPR Points
          </label>
          <input
            type="number"
            value={lastWeekPpr}
            onChange={(e) => setLastWeekPpr(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter last week PPR"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Player Token Supply
          </label>
          <input
            type="number"
            value={playerSupply}
            onChange={(e) => setPlayerSupply(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter token supply"
          />
        </div>
      </div>

      {/* Results */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Calculation Results</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded p-3">
            <div className="text-sm text-gray-600">Burn Rate</div>
            <div className="text-xl font-bold text-red-600">
              {burnRate.toFixed(2)}%
            </div>
            <div className="text-xs text-gray-500">
              Max: {MAX_BURN_RATE_BPS / 100}%
            </div>
          </div>
          
          <div className="bg-white rounded p-3">
            <div className="text-sm text-gray-600">Performance Ratio</div>
            <div className="text-xl font-bold text-blue-600">
              {performanceRatio}
            </div>
            <div className="text-xs text-gray-500">
              {isGoodWeek ? 'Improvement' : isBadWeek ? 'Decline' : 'No Change'}
            </div>
          </div>
        </div>
      </div>

      {/* Tokenomics Impact */}
      <div className="space-y-4">
        <div className={`p-4 rounded-lg border-2 ${
          isGoodWeek ? 'border-green-200 bg-green-50' : 
          isBadWeek ? 'border-red-200 bg-red-50' : 
          'border-gray-200 bg-gray-50'
        }`}>
          <h4 className="font-semibold mb-2">
            {isGoodWeek ? '🔥 Good Week - Token Burn' : 
             isBadWeek ? '📈 Bad Week - Token Emission' : 
             '⚖️ Same Performance - No Change'}
          </h4>
          
          {isGoodWeek && (
            <div className="text-green-800">
              <div className="text-lg font-bold">
                Burn Amount: {burnAmount.toLocaleString()} tokens
              </div>
              <div className="text-sm">
                Supply reduction: {((burnAmount / playerSupply) * 100).toFixed(4)}%
              </div>
            </div>
          )}
          
          {isBadWeek && (
            <div className="text-red-800">
              <div className="text-lg font-bold">
                Emission Amount: {emissionAmount.toLocaleString()} tokens
              </div>
              <div className="text-sm">
                Supply increase: {((emissionAmount / playerSupply) * 100).toFixed(4)}%
              </div>
            </div>
          )}
          
          {isSameWeek && (
            <div className="text-gray-600">
              No supply change - performance unchanged
            </div>
          )}
        </div>

        {pprPoints === 0 && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="font-semibold text-yellow-800 mb-2">🏥 Injured Player Protection</h4>
            <p className="text-yellow-700 text-sm">
              Players with 0 PPR points (injured) experience no supply changes. 
              Price discovery continues naturally based on market demand.
            </p>
          </div>
        )}
      </div>

      {/* Formula Explanation */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-semibold text-blue-800 mb-2">📊 Formula Breakdown</h4>
        <div className="text-sm text-blue-700 space-y-1">
          <div><strong>Burn Rate:</strong> min(1%, (PPR × 10) ÷ 1000)</div>
          <div><strong>Burn Amount:</strong> Supply × Burn Rate × Performance Ratio ÷ 10,000 ÷ 100</div>
          <div><strong>Emission Rate:</strong> Burn Rate ÷ 2 (for bad weeks)</div>
          <div><strong>Performance Ratio:</strong> |Current PPR - Last Week PPR|</div>
        </div>
      </div>
    </div>
  );
} 