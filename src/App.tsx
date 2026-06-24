/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { QueueState } from './types';
import { getInitialState, broadcastUpdate, subscribeToSync } from './data';
import LiveSimulator from './components/LiveSimulator';
import { HeartPulse, Sun, Moon, Info } from 'lucide-react';

export default function App() {
  const [state, setState] = useState<QueueState>(getInitialState());

  // Subscribe to real-time synchronization across multiple browser tabs or splits
  useEffect(() => {
    const unsubscribe = subscribeToSync((syncedState) => {
      setState(syncedState);
    });
    return () => unsubscribe();
  }, []);

  // Update theme class on HTML element when state.theme changes
  useEffect(() => {
    const root = window.document.documentElement;
    if (state.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [state.theme]);

  const handleUpdateState = (newState: QueueState) => {
    setState(newState);
    broadcastUpdate(newState); // Writes to LocalStorage and fires BroadcastChannel update instantly!
  };

  const toggleTheme = () => {
    handleUpdateState({
      ...state,
      theme: state.theme === 'light' ? 'dark' : 'light'
    });
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans ${state.theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-[#f1f5f9] text-[#0f172a]'}`}>
      
      {/* ENTERPRISE DESIGN HEADER */}
      <header className={`h-16 px-6 flex items-center justify-between shadow-sm z-10 border-b shrink-0 ${
        state.theme === 'dark' 
          ? 'bg-slate-900 border-slate-800 text-white shadow-slate-950/20' 
          : 'bg-white border-slate-200 text-slate-900'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center relative shrink-0">
            <div className="w-6 h-1.5 bg-white rounded-full"></div>
            <div className="w-1.5 h-6 bg-white rounded-full absolute"></div>
          </div>
          <span className={`text-lg sm:text-xl font-bold tracking-tight ${state.theme === 'dark' ? 'text-slate-100' : 'text-slate-800'}`}>
            MEDIPULSE <span className={`font-normal text-xs sm:text-sm ${state.theme === 'dark' ? 'text-slate-400' : 'text-slate-400'}`}>| SmartQueue Enterprise</span>
          </span>
        </div>
        
        <div className="flex items-center gap-4 sm:gap-6">
          <div className={`hidden md:flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border ${
            state.theme === 'dark' 
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
              : 'bg-green-50 text-green-700 border-green-200'
          }`}>
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            System Synchronized
          </div>

          <button 
            onClick={toggleTheme}
            className="flex items-center gap-1.5 text-xs font-semibold hover:text-blue-500 transition-colors cursor-pointer"
          >
            {state.theme === 'dark' ? (
              <>
                <Sun className="h-4 w-4 text-yellow-400" />
                <span className="hidden sm:inline">Light Theme</span>
              </>
            ) : (
              <>
                <Moon className="h-4 w-4 text-slate-500" />
                <span className="hidden sm:inline">Dark Theme</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* RENDER THE CENTRAL SIMULATOR FRAME */}
      <div className="flex-grow overflow-hidden flex flex-col">
        <LiveSimulator state={state} onUpdateState={handleUpdateState} />
      </div>

      {/* ENTERPRISE DESIGN FOOTER */}
      <footer className={`h-10 px-6 flex items-center justify-between text-[10px] font-semibold tracking-wide border-t shrink-0 z-10 ${
        state.theme === 'dark' 
          ? 'bg-slate-900 border-slate-800 text-slate-400' 
          : 'bg-slate-900 border-slate-800 text-slate-400'
      }`}>
        <div>
          Connected to Primary Database: <span className="text-blue-400 font-bold">db-hospital-alpha-04</span>
        </div>
        <div className="hidden md:flex gap-4">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span> SMS Gateway Online
          </span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span> Voice Engine Ready
          </span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span> Real-time Sync Active
          </span>
        </div>
        <div>Ver. 4.8.2-Enterprise</div>
      </footer>

    </div>
  );
}
