'use client';

import { useState } from 'react';
import { X, TrendingUp, TrendingDown, DollarSign, Coins } from 'lucide-react';
import { Player } from '@/lib/types';

interface TradingModalProps {
  player: Player;
  isOpen: boolean;
  onClose: () => void;
  onTrade: (playerId: string, type: 'buy' | 'sell', amount: number, price: number) => void;
  userAddress?: string;
}

export default function TradingModal({ 
  player, 
  isOpen, 
  onClose, 
  onTrade, 
  userAddress 
}: TradingModalProps) {
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [amount, setAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userAddress) {
      setError('Please connect your wallet first');
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      await onTrade(player.id, tradeType, numAmount, player.tokenPrice);
      onClose();
      setAmount('');
    } catch (err: any) {
      setError(err.message || 'Transaction failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const totalCost = parseFloat(amount) * player.tokenPrice;
  const isValidAmount = !isNaN(parseFloat(amount)) && parseFloat(amount) > 0;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Trade {player.name}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Player Info */}
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">{player.name}</h3>
              <p className="text-sm text-gray-600">{player.team} • {player.position}</p>
            </div>
            <div className="text-right">
              <p className="font-semibold">${player.tokenPrice.toFixed(2)}</p>
              <p className="text-sm text-gray-600">per token</p>
            </div>
          </div>
        </div>

        {/* Trade Type Toggle */}
        <div className="flex bg-gray-100 rounded-lg p-1 mb-4">
          <button
            onClick={() => setTradeType('buy')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              tradeType === 'buy'
                ? 'bg-green-500 text-white'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <TrendingUp className="w-4 h-4 inline mr-2" />
            Buy
          </button>
          <button
            onClick={() => setTradeType('sell')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              tradeType === 'sell'
                ? 'bg-red-500 text-white'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <TrendingDown className="w-4 h-4 inline mr-2" />
            Sell
          </button>
        </div>

        {/* Trading Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount of Tokens
            </label>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                step="0.01"
                min="0"
                className="input-field"
                disabled={isProcessing}
              />
              <div className="absolute right-3 top-2.5">
                <Coins className="w-4 h-4 text-gray-400" />
              </div>
            </div>
          </div>

          {/* Cost/Value Display */}
          {isValidAmount && (
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  {tradeType === 'buy' ? 'Total Cost:' : 'Total Value:'}
                </span>
                <div className="flex items-center space-x-1">
                  <DollarSign className="w-4 h-4 text-blue-600" />
                  <span className="font-semibold text-blue-600">
                    {totalCost.toFixed(2)}
                  </span>
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

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn-secondary"
              disabled={isProcessing}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isValidAmount || isProcessing || !userAddress}
              className={`flex-1 ${
                tradeType === 'buy' ? 'btn-success' : 'btn-danger'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isProcessing ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </div>
              ) : (
                `${tradeType === 'buy' ? 'Buy' : 'Sell'} Tokens`
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 