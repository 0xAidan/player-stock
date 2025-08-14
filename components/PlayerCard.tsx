'use client';

import { Player } from '@/lib/types';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface PlayerCardProps {
  player: Player;
  onTrade: (playerId: string) => void;
}

export default function PlayerCard({ player, onTrade }: PlayerCardProps) {
  const pprChange = player.currentPPR - player.lastWeekPPR;
  const priceChange = pprChange > 0 ? 'positive' : pprChange < 0 ? 'negative' : 'neutral';

  return (
    <div className="card-hover">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          {player.imageUrl && (
            <img 
              src={player.imageUrl} 
              alt={player.name}
              className="w-12 h-12 rounded-full"
            />
          )}
          <div>
            <h3 className="font-semibold text-lg">{player.name}</h3>
            <p className="text-sm text-gray-600">{player.team} • {player.position}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center space-x-1">
            {priceChange === 'positive' && <TrendingUp className="w-4 h-4 text-green-500" />}
            {priceChange === 'negative' && <TrendingDown className="w-4 h-4 text-red-500" />}
            {priceChange === 'neutral' && <Minus className="w-4 h-4 text-gray-500" />}
            <span className={`text-sm font-medium ${
              priceChange === 'positive' ? 'text-green-600' : 
              priceChange === 'negative' ? 'text-red-600' : 'text-gray-600'
            }`}>
              {pprChange > 0 ? '+' : ''}{pprChange} PPR
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-sm text-gray-600">Current PPR</p>
          <p className="font-semibold">{player.currentPPR}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Token Price</p>
          <p className="font-semibold">${player.tokenPrice.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Supply</p>
          <p className="font-semibold">{(player.tokenSupply / 1000000).toFixed(1)}M</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Burned</p>
          <p className="font-semibold text-green-600">{(player.totalBurned / 1000000).toFixed(1)}M</p>
        </div>
      </div>

      <button 
        onClick={() => onTrade(player.id)}
        className="w-full btn-primary"
      >
        Trade Tokens
      </button>
    </div>
  );
}