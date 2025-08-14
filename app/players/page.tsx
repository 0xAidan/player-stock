'use client';

import { useState, useEffect } from 'react';
import PlayerCard from '@/components/PlayerCard';
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

export default function PlayersPage(