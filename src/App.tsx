/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { GameProvider } from './context/GameContext';
import GameMap from './components/GameMap';
import GameSidebar from './components/GameSidebar';
import { APIProvider } from '@vis.gl/react-google-maps';

export default function App() {
  const [apiKey, setApiKey] = useState<string>('');
  const [isKeyLoaded, setIsKeyLoaded] = useState(false);

  useEffect(() => {
    const storedKey = localStorage.getItem('google_maps_api_key');
    const envKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    
    if (storedKey) {
      setApiKey(storedKey);
    } else if (envKey) {
      setApiKey(envKey);
    }
    setIsKeyLoaded(true);
  }, []);

  const handleSaveKey = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const key = formData.get('apiKey') as string;
    if (key.trim()) {
      localStorage.setItem('google_maps_api_key', key.trim());
      setApiKey(key.trim());
    }
  };

  if (!isKeyLoaded) {
    return null;
  }

  if (!apiKey) {
    return (
      <div className="flex items-center justify-center min-h-screen w-screen bg-slate-900 p-8 relative overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-blue-600/30 rounded-full mix-blend-screen filter blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-emerald-600/20 rounded-full mix-blend-screen filter blur-[100px] animate-pulse" style={{ animationDelay: '2s' }}></div>
        
        <div className="bg-white/10 backdrop-blur-xl p-10 rounded-3xl shadow-2xl border border-white/20 max-w-md w-full relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
            </div>
            <h2 className="text-3xl font-extrabold text-white tracking-tight">GeoSeeker</h2>
          </div>
          
          <p className="text-slate-300 mb-8 leading-relaxed">
            Welcome to the ultimate global hide-and-seek. To start playing, please provide your Google Maps API Key.
          </p>
          
          <form onSubmit={handleSaveKey} className="space-y-5">
            <div>
              <label htmlFor="apiKey" className="block text-sm font-medium text-slate-300 mb-2">
                API Key
              </label>
              <input
                type="text"
                id="apiKey"
                name="apiKey"
                required
                className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-600 text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                placeholder="AIzaSy..."
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98]"
            >
              Save & Play
            </button>
          </form>
          
          <div className="mt-8 text-sm text-slate-400 bg-slate-800/50 p-5 rounded-xl border border-slate-700/50">
            <p className="font-semibold text-slate-300 mb-3">How to get a key:</p>
            <ol className="list-decimal list-inside space-y-2">
              <li>Go to the <a href="https://console.cloud.google.com/google/maps-apis/api-list" target="_blank" rel="noreferrer" className="text-blue-400 hover:text-blue-300 hover:underline transition-colors">Google Cloud Console</a>.</li>
              <li>Enable "Maps JavaScript API" and "Street View Static API".</li>
              <li>Create credentials to get an API key.</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  return (
    <GameProvider>
      <APIProvider apiKey={apiKey}>
        <div className="flex h-screen w-screen bg-slate-50 overflow-hidden">
          {/* Sidebar */}
          <div className="w-[400px] h-full flex-shrink-0 z-20 shadow-2xl shadow-slate-300/50 bg-white">
            <GameSidebar />
          </div>

          {/* Main Map Area */}
          <div className="flex-1 h-full relative p-4 bg-slate-100/50">
            <div className="w-full h-full rounded-2xl overflow-hidden shadow-sm border border-slate-200/60 bg-white relative">
              <GameMap />
            </div>
          </div>
        </div>
      </APIProvider>
    </GameProvider>
  );
}

