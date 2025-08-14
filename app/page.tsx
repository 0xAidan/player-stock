import Link from 'next/link'
import { TrendingUp, Users, BarChart3, Wallet, Coins, Lock } from 'lucide-react'
import TokenomicsCalculator from '@/components/TokenomicsCalculator'


export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Player Stock
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100">
              Trade tokens representing your favorite NFL players with advanced tokenomics
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/players" 
                className="btn-primary text-lg px-8 py-3"
              >
                Browse Players
              </Link>
              <Link 
                href="/portfolio" 
                className="bg-white text-blue-600 hover:bg-gray-100 font-medium py-3 px-8 rounded-lg transition-colors text-lg"
              >
                View Portfolio
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Advanced Tokenomics System
          </h2>
          <p className="text-lg text-gray-600">
            A sophisticated system combining performance-based burns, staking rewards, and sustainable economics
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Player Tokens</h3>
            <p className="text-gray-600">50M tokens per player with dynamic supply based on PPR performance</p>
          </div>

          <div className="text-center">
            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Protocol Treasury</h3>
            <p className="text-gray-600">Treasury manages burns/emissions - your holdings are never touched</p>
          </div>

          <div className="text-center">
            <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Coins className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Safe Staking</h3>
            <p className="text-gray-600">Stake tokens safely with rewards from trading fees + treasury</p>
          </div>

          <div className="text-center">
            <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Performance Burns</h3>
            <p className="text-gray-600">Good PPR weeks trigger treasury burns, creating deflationary pressure</p>
          </div>

          <div className="text-center">
            <div className="bg-yellow-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-yellow-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">User Protection</h3>
            <p className="text-gray-600">Your token holdings are protected from burns/emissions</p>
          </div>

          <div className="text-center">
            <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Wallet className="w-8 h-8 text-indigo-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">DeFi Trading</h3>
            <p className="text-gray-600">Trade on Hyperliquid with full DeFi features and transparent economics</p>
          </div>
        </div>
      </div>

      {/* Tokenomics Calculator Section */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Tokenomics Calculator
            </h2>
            <p className="text-lg text-gray-600">
              See how PPR performance affects token supply and understand the burn/emission mechanics
            </p>
          </div>
          
          <TokenomicsCalculator className="max-w-4xl mx-auto" />
        </div>
      </div>

      {/* Staking Interface Section */}
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Staking Dashboard
            </h2>
            <p className="text-lg text-gray-600">
              Stake your tokens to earn rewards from trading fees and support protocol stability
            </p>
          </div>
          
          <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-8">
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Staking Coming Soon</h3>
              <p className="text-gray-600 mb-6">
                Player-specific staking with performance-based rewards will be available once the protocol is deployed.
              </p>
              <Link 
                href="/staking" 
                className="inline-block bg-blue-600 text-white hover:bg-blue-700 font-medium py-2 px-6 rounded-lg transition-colors"
              >
                View Staking Demo
              </Link>
              <div className="bg-gray-50 rounded-lg p-4 text-left">
                <h4 className="font-semibold mb-2">Features:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• <strong>Safe Staking:</strong> Your tokens remain protected</li>
                  <li>• <strong>Performance Rewards:</strong> 20% - 200% multipliers</li>
                  <li>• <strong>Treasury Funding:</strong> Rewards from trading fees + treasury</li>
                  <li>• <strong>7-day Lock:</strong> NFL week duration</li>
                  <li>• <strong>Frozen Multipliers:</strong> Lock in good rates early</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-blue-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Start Trading?
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            Join the future of sports trading with advanced tokenomics and DeFi features
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/players" 
              className="bg-white text-blue-600 hover:bg-gray-100 font-medium py-3 px-8 rounded-lg transition-colors text-lg"
            >
              Start Trading
            </Link>
            <Link 
              href="/portfolio" 
              className="border-2 border-white text-white hover:bg-white hover:text-blue-600 font-medium py-3 px-8 rounded-lg transition-colors text-lg"
            >
              View Portfolio
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
} 