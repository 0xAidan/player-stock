import Link from 'next/link'
import { TrendingUp, Users, BarChart3, Wallet } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Player Stock
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-primary-100">
              Trade tokens representing your favorite NFL players on Hyperliquid
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
                className="bg-white text-primary-600 hover:bg-gray-100 font-medium py-3 px-8 rounded-lg transition-colors text-lg"
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
            How It Works
          </h2>
          <p className="text-lg text-gray-600">
            Each NFL player has a fixed supply of tokens. Performance affects token economics through burns and emissions.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="text-center">
            <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-primary-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Player Tokens</h3>
            <p className="text-gray-600">Each player has 50M tokens with dynamic supply based on performance</p>
          </div>

          <div className="text-center">
            <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-8 h-8 text-primary-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Performance Based</h3>
            <p className="text-gray-600">Good weeks = token burns, bad weeks = increased emissions</p>
          </div>

          <div className="text-center">
            <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="w-8 h-8 text-primary-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Real-time Data</h3>
            <p className="text-gray-600">Live NFL statistics drive token economics</p>
          </div>

          <div className="text-center">
            <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Wallet className="w-8 h-8 text-primary-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">DeFi Trading</h3>
            <p className="text-gray-600">Trade on Hyperliquid with full DeFi features</p>
          </div>
        </div>
      </div>
    </div>
  )
} 