/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { QueueState } from '../types';
import ReceptionistPanel from './ReceptionistPanel';
import DoctorPanel from './DoctorPanel';
import PatientPanel from './PatientPanel';
import WaitingRoomPanel from './WaitingRoomPanel';
import AdminPanel from './AdminPanel';
import { 
  Monitor, Columns2, LayoutGrid, Layers, HeartPulse, Sparkles,
  UserCheck, Stethoscope, Tv, Settings, User, AlertCircle
} from 'lucide-react';

export default function LiveSimulator({ 
  state, 
  onUpdateState 
}: { 
  state: QueueState, 
  onUpdateState: (s: QueueState) => void 
}) {
  const [layoutMode, setLayoutMode] = useState<'single' | 'splitscreen' | 'quad'>('splitscreen');
  
  // Tab states when in Single layout
  const [singleTab, setSingleTab] = useState<'reception' | 'doctor' | 'patient' | 'tv' | 'admin'>('reception');
  
  // Tab assignments in Splitscreen layout
  const [splitLeft, setSplitLeft] = useState<'reception' | 'doctor' | 'patient' | 'tv' | 'admin'>('doctor');
  const [splitRight, setSplitRight] = useState<'reception' | 'doctor' | 'patient' | 'tv' | 'admin'>('tv');

  const renderPanel = (type: 'reception' | 'doctor' | 'patient' | 'tv' | 'admin', frameId: string) => {
    switch (type) {
      case 'reception':
        return (
          <div className="h-full overflow-y-auto bg-slate-50 dark:bg-slate-950/20">
            <ReceptionistPanel state={state} onUpdateState={onUpdateState} />
          </div>
        );
      case 'doctor':
        return (
          <div className="h-full overflow-y-auto bg-slate-50 dark:bg-slate-950/20">
            <DoctorPanel state={state} onUpdateState={onUpdateState} />
          </div>
        );
      case 'patient':
        return (
          <div className="h-full overflow-y-auto bg-slate-50 dark:bg-slate-950/20">
            <PatientPanel state={state} onUpdateState={onUpdateState} />
          </div>
        );
      case 'tv':
        return (
          <div className="h-full overflow-y-auto bg-slate-950 text-white">
            <WaitingRoomPanel state={state} onUpdateState={onUpdateState} />
          </div>
        );
      case 'admin':
        return (
          <div className="h-full overflow-y-auto bg-slate-50 dark:bg-slate-950/20">
            <AdminPanel state={state} onUpdateState={onUpdateState} />
          </div>
        );
    }
  };

  return (
    <div id="simulator-frame" className="flex-1 flex flex-col overflow-hidden bg-[#f1f5f9] dark:bg-slate-950">
      
      {/* SIMULATOR CONTROL BAR */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-3 shrink-0 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3 z-20">
        
        {/* Clinic branding logo */}
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 text-white p-2 rounded-xl shadow shadow-blue-600/20 animate-pulse">
            <HeartPulse className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-md font-display font-extrabold text-slate-800 dark:text-slate-100 tracking-tight uppercase">
              METROPOLIS HEALTH <span className="font-normal text-slate-400">| SmartQueue</span>
            </h1>
            <span className="text-[9px] font-mono font-bold tracking-widest text-blue-600 uppercase block">
              Simulated Real-time Synchronizer
            </span>
          </div>
        </div>

        {/* Layout Select Buttons */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl gap-0.5 text-xs font-semibold">
          <button
            onClick={() => setLayoutMode('single')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer ${layoutMode === 'single' ? 'bg-white dark:bg-slate-900 shadow text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Monitor className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Single Screen</span>
          </button>
          
          <button
            onClick={() => setLayoutMode('splitscreen')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer ${layoutMode === 'splitscreen' ? 'bg-white dark:bg-slate-900 shadow text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Columns2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Ops Splitscreen</span>
          </button>

          <button
            onClick={() => setLayoutMode('quad')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer ${layoutMode === 'quad' ? 'bg-white dark:bg-slate-900 shadow text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Quad Grid</span>
          </button>
        </div>

        {/* Active emergencies alert ribbon */}
        {state.tokens.some(t => t.isEmergency && (t.status === 'Waiting' || t.status === 'Called')) && (
          <div className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/30 text-red-500 text-[10px] font-mono px-3 py-1 rounded-full animate-pulse">
            <AlertCircle className="h-3.5 w-3.5 animate-bounce" />
            <span>CRITICAL CLINICAL OVERRIDE ACTIVE</span>
          </div>
        )}

        {/* Tab Selection depending on Layout Mode */}
        {layoutMode === 'single' && (
          <div className="flex flex-wrap bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px] font-bold">
            <button
              onClick={() => setSingleTab('reception')}
              className={`px-3 py-1.5 rounded-lg cursor-pointer ${singleTab === 'reception' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Reception
            </button>
            <button
              onClick={() => setSingleTab('doctor')}
              className={`px-3 py-1.5 rounded-lg cursor-pointer ${singleTab === 'doctor' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Doctor Cabin
            </button>
            <button
              onClick={() => setSingleTab('patient')}
              className={`px-3 py-1.5 rounded-lg cursor-pointer ${singleTab === 'patient' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Patient Portal
            </button>
            <button
              onClick={() => setSingleTab('tv')}
              className={`px-3 py-1.5 rounded-lg cursor-pointer ${singleTab === 'tv' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Waiting Room TV
            </button>
            <button
              onClick={() => setSingleTab('admin')}
              className={`px-3 py-1.5 rounded-lg cursor-pointer ${singleTab === 'admin' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Admin Office
            </button>
          </div>
        )}

      </div>

      {/* CORE CANVAS */}
      <div className="flex-grow overflow-hidden relative">
        
        {/* SINGLE LAYOUT SCREEN */}
        {layoutMode === 'single' && (
          <div className="h-full animate-fade-in overflow-hidden">
            {renderPanel(singleTab, 'single-frame')}
          </div>
        )}

        {/* SPLITSCREEN LAYOUT */}
        {layoutMode === 'splitscreen' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 dark:divide-slate-800 h-full animate-fade-in overflow-hidden">
            
            {/* Left Screen */}
            <div className="flex flex-col h-full bg-white dark:bg-slate-900 overflow-hidden">
              <div className="bg-slate-50 dark:bg-slate-950 px-4 py-2 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-slate-500 shrink-0">
                <span>LEFT SIMULATOR FRAME</span>
                <select
                  value={splitLeft}
                  onChange={(e) => setSplitLeft(e.target.value as any)}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2.5 py-1 rounded-lg text-[10px] focus:outline-none dark:text-slate-300"
                >
                  <option value="reception">Reception Desk</option>
                  <option value="doctor">Doctor Office</option>
                  <option value="patient">Patient Portal</option>
                  <option value="tv">Waiting Room TV</option>
                  <option value="admin">Admin Office</option>
                </select>
              </div>
              <div className="flex-grow overflow-hidden">
                {renderPanel(splitLeft, 'left-split-frame')}
              </div>
            </div>

            {/* Right Screen */}
            <div className="flex flex-col h-full bg-white dark:bg-slate-900 overflow-hidden">
              <div className="bg-slate-50 dark:bg-slate-950 px-4 py-2 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-slate-500 shrink-0">
                <span>RIGHT SIMULATOR FRAME</span>
                <select
                  value={splitRight}
                  onChange={(e) => setSplitRight(e.target.value as any)}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2.5 py-1 rounded-lg text-[10px] focus:outline-none dark:text-slate-300"
                >
                  <option value="reception">Reception Desk</option>
                  <option value="doctor">Doctor Office</option>
                  <option value="patient">Patient Portal</option>
                  <option value="tv">Waiting Room TV</option>
                  <option value="admin">Admin Office</option>
                </select>
              </div>
              <div className="flex-grow overflow-hidden">
                {renderPanel(splitRight, 'right-split-frame')}
              </div>
            </div>

          </div>
        )}

        {/* QUAD GRID LAYOUT (2x2 grid) */}
        {layoutMode === 'quad' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 dark:divide-slate-800 h-full animate-fade-in overflow-hidden">
            
            {/* Top Row splits */}
            <div className="grid grid-rows-2 h-full divide-y divide-slate-200 dark:divide-slate-800 overflow-hidden">
              
              {/* Box 1: Reception */}
              <div className="flex flex-col h-full overflow-hidden">
                <div className="bg-slate-100 dark:bg-slate-950 px-4 py-1.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-[10px] font-bold text-slate-500 shrink-0">
                  <span>FRAME A: PATIENT RECEPTIONIST CHECK-IN</span>
                  <span className="text-[9px] text-blue-500 font-bold">Walk-ins desk</span>
                </div>
                <div className="flex-grow overflow-hidden">
                  {renderPanel('reception', 'quad-a')}
                </div>
              </div>

              {/* Box 2: Patient Portal */}
              <div className="flex flex-col h-full overflow-hidden">
                <div className="bg-slate-100 dark:bg-slate-950 px-4 py-1.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-[10px] font-bold text-slate-500 shrink-0">
                  <span>FRAME B: PATIENT OUTPATIENT PORTAL</span>
                  <span className="text-[9px] text-blue-500 font-bold">Secure EHR release</span>
                </div>
                <div className="flex-grow overflow-hidden">
                  {renderPanel('patient', 'quad-b')}
                </div>
              </div>

            </div>

            {/* Bottom Row splits */}
            <div className="grid grid-rows-2 h-full divide-y divide-slate-200 dark:divide-slate-800 overflow-hidden">
              
              {/* Box 3: Doctor Cabin */}
              <div className="flex flex-col h-full overflow-hidden">
                <div className="bg-slate-100 dark:bg-slate-950 px-4 py-1.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-[10px] font-bold text-slate-500 shrink-0">
                  <span>FRAME C: DOCTOR OUTPATIENT CONSULTATION</span>
                  <span className="text-[9px] text-blue-500 font-bold">EHR pad with live timer</span>
                </div>
                <div className="flex-grow overflow-hidden">
                  {renderPanel('doctor', 'quad-c')}
                </div>
              </div>

              {/* Box 4: Waiting TV */}
              <div className="flex flex-col h-full overflow-hidden">
                <div className="bg-slate-100 dark:bg-slate-950 px-4 py-1.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-[10px] font-bold text-slate-500 shrink-0">
                  <span>FRAME D: WAITING ROOM TV ANNOUNCEMENT DISPLAY</span>
                  <span className="text-[9px] text-blue-500 font-bold">Voice synthesis broadcasts</span>
                </div>
                <div className="flex-grow overflow-hidden">
                  {renderPanel('tv', 'quad-d')}
                </div>
              </div>

            </div>

          </div>
        )}

      </div>

    </div>
  );
}
