'use client';

import { useState, useEffect } from 'react';
import PlayerCard from '@/components/PlayerCard';
import TradingModal from '@/components/TradingModal';
import { Player } from '@/lib/types';

// Mock data for development
const mockPlayers: Player[] = [
  {
    id: '1',
    name: 'Christian McCaffrey',
    team: 'SF',
    position: 'RB',
    currentPPR: 25.8,
    lastWeekPPR: 22.3,
    tokenSupply: 50000000,
    tokenPrice: 1.25,
    totalBurned: 2500000,
    totalEmitted: 0,
    isActive: true
  },
  {
    id: '2',
    name: 'Tyreek Hill',
    team: 'MIA',
    position: 'WR',
    currentPPR: 28.1,
    lastWeekPPR: 30.2,
    tokenSupply: 50000000,
    tokenPrice: 0.95,
    totalBurned: 0,
    totalEmitted: 1500000,
    isActive: true
  },
  {
    id: '3',
    name: 'Patrick Mahomes',
    team: 'KC',
    position: 'QB',
    currentPPR: 24.5,
    lastWeekPPR: 21.8,
    tokenSupply: 50000000,
    tokenPrice: 1.15,
    totalBurned: 1800000,
    totalEmitted: 0,
    isActive: true
  }
];

export default function PlayersPage() {
  const [players, setPlayers] = useState<Player[]>(mockPlayers);
  const [loading, setLoading] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [isTradingModalOpen, setIsTradingModalOpen] = useState(false);
  const [userAddress, setUserAddress] = useState<string>('');

  useEffect(() => {
    // In the future, this will fetch real data from your API
    setPlayers(mockPlayers);
  }, []);

  const handleTrade = (playerId: string) => {
    const player = players.find(p => p.id === playerId);
    if (player) {
      setSelectedPlayer(player);
      setIsTradingModalOpen(true);
    }
  };

  const handleTradeExecution = async (
    playerId: string, 
    type: 'buy' | 'sell', 
    amount: number, 
    price: number
  ) => {
    // TODO: Implement actual trading logic with Hyperliquid
    console.log(`Executing ${type} trade:`, {
      playerId,
      amount,
      price,
      total: amount * price,
      userAddress
    });

    // Simulate transaction delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // For now, just show a success message
    alert(`${type === 'buy' ? 'Bought' : 'Sold'} ${amount} tokens for $${(amount * price).toFixed(2)}`);
  };

  const handleWalletConnect = (address: string) => {
    setUserAddress(address);
  };

  const handleWalletDisconnect = () => {
    setUserAddress('');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">NFL Player Tokens</h1>
        {userAddress && (
          <div className="text-sm text-gray-600">
            Connected: {userAddress.slice(0, 6)}...{userAddress.slice(-4)}
          </div>
        )}
      </div>
      
      {loading ? (
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {players.map((player) => (
            <PlayerCard key={player.id} player={player} onTrade={handleTrade} />
          ))}
        </div>
      )}

      {/* Trading Modal */}
      {selectedPlayer && (
        <TradingModal
          player={selectedPlayer}
          isOpen={isTradingModalOpen}
          onClose={() => {
            setIsTradingModalOpen(false);
            setSelectedPlayer(null);
          }}
          onTrade={handleTradeExecution}
          userAddress={userAddress}
        />
      )}
    </div>
  );
}