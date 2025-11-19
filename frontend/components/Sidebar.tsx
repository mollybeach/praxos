'use client';

import { useState } from 'react';
import Image from 'next/image';

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export function Sidebar({ activeSection, onSectionChange }: SidebarProps) {
  return (
    <div className="hidden md:block w-64 bg-slate-900 border-r border-slate-800 h-screen fixed left-0 top-0 overflow-y-auto">
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 relative">
            <Image
              src="/praxos_favicon.jpeg"
              alt="Praxos Logo"
              width={40}
              height={40}
              className="object-cover"
            />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Praxos</h1>
            <p className="text-xs text-slate-400">Liquidity Protocol</p>
          </div>
        </div>
      </div>

      <nav className="p-4 space-y-6">
        <div>
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-3">
            Platform
          </h3>
          <ul className="space-y-1">
            <li>
              <button
                onClick={() => onSectionChange('dashboard')}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                  activeSection === 'dashboard'
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                Dashboard
              </button>
            </li>
            <li>
              <button
                onClick={() => onSectionChange('portfolio')}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                  activeSection === 'portfolio'
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                Portfolio
              </button>
            </li>
            <li>
              <button
                onClick={() => onSectionChange('trading')}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center justify-between ${
                  activeSection === 'trading'
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <span>Trading</span>
                <span className="text-xs bg-slate-800 px-2 py-0.5 rounded">Soon</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => onSectionChange('watchlist')}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center justify-between ${
                  activeSection === 'watchlist'
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <span>Watchlist</span>
                <span className="text-xs bg-slate-800 px-2 py-0.5 rounded">Soon</span>
              </button>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-3">
            Resources
          </h3>
          <ul className="space-y-1">
            <li>
              <button
                onClick={() => onSectionChange('academy')}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center justify-between ${
                  activeSection === 'academy'
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <span>Academy</span>
                <span className="text-xs bg-slate-800 px-2 py-0.5 rounded">Soon</span>
              </button>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-3">
            Account
          </h3>
          <ul className="space-y-1">
            <li>
              <button
                onClick={() => onSectionChange('profile')}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center justify-between ${
                  activeSection === 'profile'
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <span>Profile</span>
                <span className="text-xs bg-slate-800 px-2 py-0.5 rounded">Soon</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => onSectionChange('wallet')}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center justify-between ${
                  activeSection === 'wallet'
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <span>Wallet</span>
                <span className="text-xs bg-slate-800 px-2 py-0.5 rounded">Soon</span>
              </button>
            </li>
          </ul>
        </div>
      </nav>

      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-800">
        <button className="w-full text-left px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-800 flex items-center gap-3">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>Preferences</span>
        </button>
      </div>
    </div>
  );
}

