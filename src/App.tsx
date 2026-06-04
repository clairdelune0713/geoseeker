/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { GameProvider } from './context/GameContext';
import GameMap from './components/GameMap';
import GameSidebar from './components/GameSidebar';
import { APIProvider } from '@vis.gl/react-google-maps';

export default function App() {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('geoseeker_theme') === 'dark');

  useEffect(() => {
    localStorage.setItem('geoseeker_theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  if (!apiKey) {
    return (
      <div className="flex items-center justify-center min-h-screen w-screen bg-slate-900 p-8 relative overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-blue-600/30 rounded-full mix-blend-screen filter blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-emerald-600/20 rounded-full mix-blend-screen filter blur-[100px] animate-pulse" style={{ animationDelay: '2s' }}></div>
        
        <div className="bg-white/10 backdrop-blur-xl p-10 rounded-3xl shadow-2xl border border-white/20 max-w-md w-full relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
            </div>
            <h2 className="text-3xl font-extrabold text-white tracking-tight">GeoDawg</h2>
          </div>
          
          <p className="text-slate-300 mb-8 leading-relaxed">
            Google Maps is not configured. Add a Google Maps API key to your .env file, then restart the dev server.
          </p>

          <div className="mt-8 text-sm text-slate-400 bg-slate-800/50 p-5 rounded-xl border border-slate-700/50">
            <p className="font-semibold text-slate-300 mb-3">Expected env variable:</p>
            <code className="block text-slate-300">VITE_GOOGLE_MAPS_API_KEY</code>
            <p className="mt-3">The app also accepts GOOGLE_MAPS_API_KEY as a fallback.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <GameProvider>
        <APIProvider apiKey={apiKey}>
          <div className="flex h-screen w-screen bg-slate-100 dark:bg-slate-950 overflow-hidden transition-colors">
            <div className="w-[392px] h-full flex-shrink-0 z-20 shadow-xl shadow-slate-300/40 dark:shadow-black/40 bg-white dark:bg-slate-950">
              <GameSidebar isDarkMode={isDarkMode} onToggleDarkMode={() => setIsDarkMode(value => !value)} />
            </div>

            <div className="flex-1 h-full relative p-3 bg-slate-100 dark:bg-slate-950">
              <div className="w-full h-full rounded-lg overflow-hidden shadow-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 relative">
                <GameMap />
              </div>
            </div>
          </div>
        </APIProvider>
      </GameProvider>
    </div>
  );
}
