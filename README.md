# Player Stock - NFL Player Token Trading Platform

A decentralized application that allows users to trade tokens representing NFL players on the Hyperliquid protocol. Each player has a fixed supply of 50 million tokens with dynamic economics based on weekly PPR performance.

## Features

- **Player Tokens**: Each NFL player has 50M tokens with dynamic supply
- **Performance-Based Economics**: Good weeks trigger token burns, bad weeks increase emissions
- **Real-time NFL Data**: Live statistics drive token economics
- **DeFi Trading**: Full trading functionality on Hyperliquid
- **Portfolio Management**: Track your player token holdings

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Smart Contracts**: Solidity, Hardhat, OpenZeppelin
- **Blockchain**: Hyperliquid Protocol
- **Data**: NFL API integration
- **State Management**: React Query, Wagmi

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- MetaMask or other Web3 wallet

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd player-stock
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Add your API keys: 