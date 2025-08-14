'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Coins, Activity } from 'lucide-react';
import { Portfolio, Trade } from '@/lib/types';

// Mock portfolio data
const mockPortfolio: Portfolio[] = [
  {
    playerId: '1',
    tokensOwned: 1000,
    averagePrice: 1.20,
    totalValue: 1250,
    profitLoss: 50
  },
  {
    playerId: '2',
    tokensOwned: 500,
    averagePrice: 1.00,
    totalValue: 475,
    profitLoss: -25
  }
];

// Mock trading history
const mockTrades: Trade[] = [
  {
    id: '1',
    playerId: '1',
    type: 'buy',
    amount: 500,
    price: 1.20,
    timestamp: new Date('2024-01-15T10:30:00Z'),
    txHash: '0x123...abc'
  },
  {
    id: '2',
    playerId: '2',
    type: 'sell',
    amount: 200,
    price: 0.95,
    timestamp: new Date('2024-01-14T15:45:00Z'),
    txHash: '0x456...def'
  }
];

export default function PortfolioPage() {
  const [portfolio, setPortfolio] = useState<Portfolio[]>(mockPortfolio);
  const [trades, setTrades] = useState<Trade[]>(mockTrades);
  const [loading, setLoading] = useState(false);
  const [userAddress, setUserAddress] = useState<string>('');

  useEffect(() => {
    // In the future, this will fetch real portfolio data
    setPortfolio(mockPortfolio);
    setTrades(mockTrades);
  }, []);

  const totalValue = portfolio.reduce((sum, item) => sum + item.totalValue, 0);
  const totalProfitLoss = portfolio.reduce((sum, item) => sum + item.profitLoss, 0);
  const totalTokens = portfolio.reduce((sum, item) => sum + item.tokensOwned, 0);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Portfolio</h1>
        {userAddress && (
          <p className="text-gray-600">Connected: {formatAddress(userAddress)}</p>
        )}
      </div>

      {/* Portfolio Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Value</p>
              <p className="text-2xl font-bold">${totalValue.toFixed(2)}</p>
            </div>
            <DollarSign className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total P&L</p>
              <p className={`text-2xl font-bold ${totalProfitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {totalProfitLoss >= 0 ? '+' : ''}${totalProfitLoss.toFixed(2)}
              </p>
            </div>
            {totalProfitLoss >= 0 ? (
              <TrendingUp className="w-8 h-8 text-green-600" />
            ) : (
              <TrendingDown className="w-8 h-8 text-red-600" />
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Tokens</p>
              <p className="text-2xl font-bold">{totalTokens.toLocaleString()}</p>
            </div>
            <Coins className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Positions</p>
              <p className="text-2xl font-bold">{portfolio.length}</p>
            </div>
            <Activity className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Holdings */}
      <div className="bg-white rounded-lg shadow-sm mb-8">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Holdings</h2>
        </div>
        <div className="p-6">
          {portfolio.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No holdings yet. Start trading to build your portfolio!</p>
          ) : (
            <div className="space-y-4">
              {portfolio.map((item) => (
                <div key={item.playerId} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-semibold">Player {item.playerId}</h3>
                    <p className="text-sm text-gray-600">
                      {item.tokensOwned.toLocaleString()} tokens @ ${item.averagePrice.toFixed(2)} avg
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">${item.totalValue.toFixed(2)}</p>
                    <p className={`text-sm ${item.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {item.profitLoss >= 0 ? '+' : ''}${item.profitLoss.toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Trading History */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Trading History</h2>
        </div>
        <div className="p-6">
          {trades.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No trades yet.</p>
          ) : (
            <div className="space-y-4">
              {trades.map((trade) => (
                <div key={trade.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className={`w-3 h-3 rounded-full ${trade.type === 'buy' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <div>
                      <h3 className="font-semibold">
                        {trade.type === 'buy' ? 'Bought' : 'Sold'} {trade.amount.toLocaleString()} tokens
                      </h3>
                      <p className="text-sm text-gray-600">
                        Player {trade.playerId} @ ${trade.price.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">${(trade.amount * trade.price).toFixed(2)}</p>
                    <p className="text-sm text-gray-600">{formatDate(trade.timestamp)}</p>
                    {trade.txHash && (
                      <p className="text-xs text-blue-600 font-mono">{trade.txHash}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 