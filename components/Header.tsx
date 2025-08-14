'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import WalletConnect from './WalletConnect';

interface HeaderProps {
  userAddress?: string;
  onWalletConnect?: (address: string) => void;
  onWalletDisconnect?: () => void;
}

export default function Header({ 
  userAddress, 
  onWalletConnect, 
  onWalletDisconnect 
}: HeaderProps) {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'Home' },
    { href: '/players', label: 'Players' },
    { href: '/portfolio', label: 'Portfolio' },
  ];

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Navigation */}
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">PS</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Player Stock</span>
            </Link>

            {/* Navigation Links */}
            <nav className="hidden md:flex space-x-6">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    pathname === item.href
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Wallet Connection */}
          <div className="flex items-center space-x-4">
            <WalletConnect
              onConnect={onWalletConnect}
              onDisconnect={onWalletDisconnect}
            />
          </div>
        </div>
      </div>
    </header>
  );
} 