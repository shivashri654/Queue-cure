/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { QueueState, Token } from '../types';
import { Volume2, AlertTriangle, Calendar, Clock, Activity, ShieldAlert, HeartPulse, Sparkles } from 'lucide-react';
import { announceTokenCall } from '../utils/voice';

const HEALTH_TIPS = [
  "Stay Hydrated: Drink at least 8-10 glasses of water daily to maintain electrolyte balance.",
  "Check Your Posture: Sit up straight to relieve pressure on your spine and neck muscles.",
  "Prevent Fever Spreads: Wash your hands with soap for at least 20 seconds regularly.",
  "Annual Screening: Keep track of blood pressure and sugar levels to prevent silent cardiovascular issues.",
  "Mindful Breathing: Take 5 deep breaths during waiting times to lower blood cortisol and heart rate."
];

const HOSPITAL_ANNOUNCEMENTS = [
  { id: 1, title: "Free Pediatric Health Camp", text: "This Sunday from 9:00 AM to 1:00 PM. Consultation, vitamins, and general checkup.", level: "info" },
  { id: 2, title: "Mask Mandate in Pediatric Ward", text: "To protect vulnerable infants, mask-wearing is strictly required in Room 102 wing.", level: "warning" },
  { id: 3, title: "Cardiac Helpline active 24/7", text: "In case of sudden chest pain, alert the desk immediately or call Extension 100.", level: "emergency" }
];

export default function WaitingRoomPanel({ state, onUpdateState }: { state: QueueState, onUpdateState: (s: QueueState) => void }) {
  const [time, setTime] = useState(new Date());
  const [tipIndex, setTipIndex] = useState(0);
  const [callingToken, setCallingToken] = useState<Token | null>(null);
  const [voiceMuted, setVoiceMuted] = useState(true);
  const prevTokensRef = useRef<Token[]>(state.tokens);

  // Clock tick
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Health tip rotation
  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex(prev => (prev + 1) % HEALTH_TIPS.length);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // Helper to enable voice and test speak
  const enableVoice = () => {
    setVoiceMuted(false);
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      const text = "Voice announcements enabled.";
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = state.settings.voiceLanguage;
      utterance.volume = state.settings.voiceVolume;
      utterance.pitch = state.settings.voicePitch;
      utterance.rate = state.settings.voiceRate;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    }
  };

  const disableVoice = () => {
    setVoiceMuted(true);
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  };

  const handleUnmuteAndSpeak = () => {
    setVoiceMuted(false);
    if (callingToken) {
      announceTokenCall(
        callingToken.tokenNumber,
        callingToken.patientName,
        callingToken.doctorName,
        callingToken.roomNumber,
        state.settings
      );
    }
  };

  // Watch for newly CALLED tokens to trigger full-screen audio-visual announcement effects
  useEffect(() => {
    const prevTokens = prevTokensRef.current;
    
    // Find tokens that just transitioned to 'Called'
    const newlyCalled = state.tokens.find(t => {
      const prev = prevTokens.find(p => p.id === t.id);
      return t.status === 'Called' && (!prev || prev.status !== 'Called');
    });

    // Update the ref so subsequent updates track accurately
    prevTokensRef.current = state.tokens;

    if (newlyCalled) {
      setCallingToken(newlyCalled);
      
      // Perform speech announcement if not muted
      if (!voiceMuted) {
        announceTokenCall(
          newlyCalled.tokenNumber,
          newlyCalled.patientName,
          newlyCalled.doctorName,
          newlyCalled.roomNumber,
          state.settings
        );
      }

      // Auto clear call popup after 7 seconds
      const timeout = setTimeout(() => {
        setCallingToken(null);
      }, 7500);

      return () => clearTimeout(timeout);
    }
  }, [state.tokens, state.settings, voiceMuted]);

  // Extract active screens
  const activeConsulting = state.tokens.filter(t => t.status === 'In Consultation');
  const calledTokens = state.tokens.filter(t => t.status === 'Called');
  
  // Combine called and consulting for primary board
  const activeConsultingOrCalled = [...calledTokens, ...activeConsulting].slice(0, 4);

  // Next 10 waiting tokens
  const waitingTokens = state.tokens
    .filter(t => t.status === 'Waiting')
    .sort((a, b) => {
      // Emergency priority
      if (state.settings.autoReorderEmergency) {
        if (a.isEmergency && !b.isEmergency) return -1;
        if (!a.isEmergency && b.isEmergency) return 1;
      }
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    })
    .slice(0, 10);

  // Active Emergencies
  const emergencyTokens = state.tokens.filter(t => t.isEmergency && (t.status === 'Waiting' || t.status === 'Called'));

  // Queue Statistics
  const totalWaitingCount = state.tokens.filter(t => t.status === 'Waiting').length;
  const inConsultationCount = state.tokens.filter(t => t.status === 'In Consultation' || t.status === 'Called').length;
  const completedCount = state.tokens.filter(t => t.status === 'Completed').length;

  return (
    <div id="waiting-room-display" className="min-h-screen bg-slate-950 text-white font-sans p-6 relative overflow-hidden flex flex-col justify-between">
      
      {/* Dynamic Token Calling Overlay Flash Screen */}
      {callingToken && (
        <div className="absolute inset-0 bg-blue-900/95 z-50 flex flex-col items-center justify-center text-center p-8 animate-fade-in border-8 border-yellow-400">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(253,224,71,0.15)_0%,transparent_100%)] animate-pulse" />
          <div className="absolute inset-x-0 top-0 h-4 bg-yellow-400 animate-bounce" />
          
          <div className="bg-yellow-400 text-slate-950 rounded-full p-6 mb-6 shadow-2xl animate-bounce">
            <Volume2 className="h-20 w-20" />
          </div>
          
          <p className="text-xl font-mono uppercase tracking-widest text-yellow-300 font-bold mb-2">NOW CALLING TOKEN</p>
          
          <h1 className="text-9xl font-display font-extrabold text-white tracking-tight drop-shadow-lg mb-4 animate-pulse">
            {callingToken.tokenNumber}
          </h1>
          
          <div className="max-w-3xl bg-slate-950/80 rounded-2xl border-2 border-yellow-400/30 p-8 shadow-2xl">
            <p className="text-3xl font-semibold text-slate-300 mb-2">{callingToken.patientName}</p>
            <p className="text-4xl font-bold text-yellow-400 mb-4">{callingToken.doctorName}</p>
            <div className="inline-flex items-center gap-3 bg-red-600 text-white text-3xl font-bold px-8 py-4 rounded-xl shadow-lg">
              <Sparkles className="h-8 w-8 text-yellow-300 animate-spin" />
              PROCEED TO: {callingToken.roomNumber}
            </div>
            <p className="text-sm font-mono text-slate-500 mt-4 tracking-wider">DEPARTMENT: {callingToken.department.toUpperCase()}</p>
          </div>

          {/* Voice status/control inside calling overlay */}
          <div className="mt-6 flex flex-col items-center gap-2">
            {voiceMuted ? (
              <button
                onClick={handleUnmuteAndSpeak}
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-sm px-6 py-2.5 rounded-xl transition flex items-center gap-2 shadow-lg shadow-amber-500/10 cursor-pointer"
              >
                <Volume2 className="h-4 w-4 animate-bounce" />
                <span>Hear Voice Call Announcement</span>
              </button>
            ) : (
              <button
                onClick={() => announceTokenCall(
                  callingToken.tokenNumber,
                  callingToken.patientName,
                  callingToken.doctorName,
                  callingToken.roomNumber,
                  state.settings
                )}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-5 py-2 rounded-xl transition flex items-center gap-2 shadow-lg shadow-blue-600/10 cursor-pointer"
              >
                <Volume2 className="h-3.5 w-3.5" />
                <span>Repeat Voice Call</span>
              </button>
            )}
          </div>
          
          {callingToken.isEmergency && (
            <div className="mt-6 flex items-center gap-3 bg-red-500/20 border-2 border-red-500 text-red-400 px-6 py-3 rounded-full animate-pulse">
              <AlertTriangle className="h-6 w-6" />
              <span className="font-bold tracking-wider">CRITICAL MEDICAL PRIORITY</span>
            </div>
          )}
        </div>
      )}

      {/* Grid background decor */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />

      {/* HEADER: Digital Clock, Logo, Header Statistics */}
      <header id="waiting-room-header" className="flex flex-col md:flex-row items-center justify-between border-b border-slate-800 pb-4 z-10">
        <div className="flex items-center gap-4">
          <div className="bg-blue-600 p-3 rounded-xl shadow-inner shadow-blue-400">
            <HeartPulse className="h-8 w-8 text-white animate-pulse" />
          </div>
          <div>
            <h1 className="text-3xl font-display font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-sky-300">
              METROPOLIS HEALTHCARE
            </h1>
            <p className="text-xs font-mono tracking-widest text-blue-400 uppercase">SMART QUEUE OPERATIONS SCREEN</p>
          </div>
        </div>

        {/* Live Clock & Info */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mt-4 md:mt-0">
          {/* Voice Announcement Toggle */}
          <button
            onClick={voiceMuted ? enableVoice : disableVoice}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-semibold text-xs transition border cursor-pointer ${
              voiceMuted
                ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border-amber-500/30 animate-pulse'
                : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
            }`}
          >
            <Volume2 className={`h-4 w-4 ${!voiceMuted && 'animate-bounce'}`} />
            <span>{voiceMuted ? 'Muted (Tap to Unmute TV Voice)' : 'TV Voice Enabled'}</span>
          </button>

          <div className="flex items-center gap-6 bg-slate-900/80 border border-slate-800 px-6 py-3 rounded-2xl">
            <div className="flex items-center gap-2 text-slate-400">
              <Calendar className="h-5 w-5 text-blue-500" />
              <span className="font-medium text-sm">
                {time.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
            <div className="h-6 w-[1px] bg-slate-800" />
            <div className="flex items-center gap-2 font-mono font-bold text-2xl text-blue-400">
              <Clock className="h-5 w-5 text-blue-500" />
              <span>{time.toLocaleTimeString()}</span>
            </div>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT SPLIT GRID */}
      <main id="waiting-room-main" className="grid grid-cols-1 lg:grid-cols-12 gap-6 my-6 flex-grow z-10 overflow-hidden">
        
        {/* LEFT COLUMN: NOW CONSULTING MAIN DISPLAY (8 cols) */}
        <section className="lg:col-span-8 flex flex-col justify-between gap-6">
          
          {/* NOW CONSULTING SECTION */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden flex-grow flex flex-col">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 bg-emerald-500 rounded-full animate-ping" />
                <h2 className="text-lg font-display font-bold tracking-wider text-emerald-400 uppercase">Now Consulting Rooms</h2>
              </div>
              <span className="text-xs font-mono text-slate-500">REALTIME SYNC ACTIVE</span>
            </div>

            {activeConsultingOrCalled.length === 0 ? (
              <div className="flex-grow flex flex-col items-center justify-center text-slate-500 p-8 text-center">
                <Activity className="h-16 w-16 mb-4 text-slate-600 animate-pulse" />
                <p className="text-xl font-medium">All Consultation Rooms Idle</p>
                <p className="text-sm text-slate-600 max-w-sm mt-1">Receptionist or Doctors will call waiting patients shortly. Please check your token status.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-grow">
                {activeConsultingOrCalled.map((tok) => {
                  const isCalled = tok.status === 'Called';
                  return (
                    <div 
                      key={tok.id} 
                      className={`relative rounded-2xl border p-5 flex flex-col justify-between transition-all duration-500 shadow-lg ${
                        isCalled 
                          ? 'bg-amber-950/40 border-amber-500/60 shadow-amber-500/5 animate-pulse' 
                          : 'bg-slate-950/60 border-slate-800 shadow-slate-950'
                      }`}
                    >
                      {/* Highlight Corner Bar */}
                      <div className={`absolute top-0 left-0 w-3 h-full rounded-l-2xl ${
                        isCalled ? 'bg-amber-500' : 'bg-emerald-500'
                      }`} />

                      <div className="pl-3 flex justify-between items-start">
                        <div>
                          <span className={`text-xs font-mono px-3 py-1 rounded-full uppercase tracking-widest font-bold ${
                            isCalled ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'
                          }`}>
                            {tok.status.toUpperCase()}
                          </span>
                          <h3 className="text-5xl font-display font-extrabold tracking-tight text-white mt-3">
                            {tok.tokenNumber}
                          </h3>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-mono text-slate-500 uppercase">Consultation</span>
                          <p className="text-xl font-bold text-blue-400 mt-1">{tok.roomNumber}</p>
                        </div>
                      </div>

                      <div className="pl-3 pt-4 border-t border-slate-800/80 mt-4 flex justify-between items-end">
                        <div>
                          <p className="text-xs font-mono text-slate-500">PATIENT</p>
                          <p className="text-lg font-semibold text-slate-200 truncate max-w-[180px]">{tok.patientName}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-mono text-slate-500 uppercase">DOCTOR</p>
                          <p className="text-md font-medium text-blue-300">{tok.doctorName}</p>
                          <p className="text-xs text-slate-400 font-mono">{tok.department}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* EMERGENCY HIGH-PRIORITY PANEL & COGNITIVE SUMMARY */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            
            {/* Active Emergency Panel (Red) (7 cols) */}
            <div className="md:col-span-7 bg-red-950/30 border border-red-900/60 rounded-3xl p-5 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-2xl pointer-events-none" />
              
              <div className="flex items-center gap-2 text-red-400 font-display font-bold text-sm tracking-wider uppercase mb-3">
                <ShieldAlert className="h-5 w-5 animate-bounce" />
                <span>Critical Priority Alerts</span>
                {emergencyTokens.length > 0 && (
                  <span className="ml-auto bg-red-600 text-white text-xs px-2.5 py-0.5 rounded-full animate-pulse">
                    {emergencyTokens.length} ACTIVE
                  </span>
                )}
              </div>

              {emergencyTokens.length === 0 ? (
                <div className="py-6 flex flex-col items-center justify-center text-slate-600 text-center">
                  <HeartPulse className="h-10 w-10 mb-2 text-slate-800" />
                  <p className="text-sm font-medium">No critical emergencies waiting.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[140px] overflow-y-auto">
                  {emergencyTokens.map(tok => (
                    <div key={tok.id} className="bg-red-950/50 border border-red-800/40 rounded-xl p-3 flex items-center justify-between pulse-ring-emergency">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl font-mono font-extrabold text-red-400 bg-red-950 px-3 py-1 rounded-lg border border-red-900/40">
                          {tok.tokenNumber}
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-slate-200">{tok.patientName}</p>
                          <p className="text-xs text-red-300 font-mono truncate max-w-[200px]" title={tok.emergencyReason}>
                            {tok.emergencyReason || "Immediate care requested"}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-mono text-red-400 bg-red-900/30 px-2 py-0.5 rounded border border-red-900">
                          PRIORITY
                        </span>
                        <p className="text-xs text-slate-300 font-bold mt-1">{tok.roomNumber}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Waiting Room Analytics Indicators (5 cols) */}
            <div className="md:col-span-5 bg-slate-900/60 border border-slate-800 rounded-3xl p-5 flex flex-col justify-between gap-4">
              <span className="text-xs font-mono text-slate-500 uppercase tracking-widest block">Display Stats</span>
              
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-2.5 text-center">
                  <span className="text-xs font-mono text-blue-400">WAITING</span>
                  <p className="text-2xl font-display font-extrabold text-white mt-1">{totalWaitingCount}</p>
                </div>
                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-2.5 text-center">
                  <span className="text-xs font-mono text-emerald-400">ACTIVE</span>
                  <p className="text-2xl font-display font-extrabold text-white mt-1">{inConsultationCount}</p>
                </div>
                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-2.5 text-center">
                  <span className="text-xs font-mono text-slate-500">DONE</span>
                  <p className="text-2xl font-display font-extrabold text-slate-400 mt-1">{completedCount}</p>
                </div>
              </div>

              <div className="bg-blue-950/20 border border-blue-900/30 rounded-xl p-3 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-mono text-blue-400">EST. GENERAL WAIT</p>
                  <p className="text-sm font-semibold text-slate-200 mt-0.5">Dynamic Load Calculation</p>
                </div>
                <span className="text-lg font-mono font-bold text-blue-400 bg-blue-950/80 px-2.5 py-1 rounded-lg border border-blue-900/50">
                  ~{totalWaitingCount * 10} min
                </span>
              </div>
            </div>

          </div>

        </section>

        {/* RIGHT COLUMN: QUEUE TIMELINE (NEXT 10 TOKENS) (4 cols) */}
        <section className="lg:col-span-4 flex flex-col gap-6">
          
          {/* Waiting Queue List */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-5 flex-grow flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 bg-blue-500 rounded-full" />
                <h2 className="text-md font-display font-bold tracking-wider text-blue-400 uppercase">Upcoming Tokens Queue</h2>
              </div>
              <span className="text-xs font-mono text-slate-500">NEXT 10</span>
            </div>

            {waitingTokens.length === 0 ? (
              <div className="flex-grow flex flex-col items-center justify-center text-slate-600 p-8 text-center my-auto">
                <HeartPulse className="h-12 w-12 mb-3 text-slate-800" />
                <p className="text-sm font-medium">No patients currently waiting.</p>
                <p className="text-xs text-slate-700 mt-1">Registrations will appear instantly.</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[360px] lg:max-h-[440px] overflow-y-auto pr-1 flex-grow">
                {waitingTokens.map((tok, index) => (
                  <div 
                    key={tok.id} 
                    className={`bg-slate-950/80 border rounded-xl p-3 flex items-center justify-between transition-all hover:border-slate-700 ${
                      tok.isEmergency 
                        ? 'border-red-900/80 bg-red-950/10' 
                        : 'border-slate-800/80'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="font-mono text-xs text-slate-600 w-5">
                        #{index + 1}
                      </div>
                      <div className={`text-lg font-mono font-extrabold px-2.5 py-1 rounded-lg border ${
                        tok.isEmergency 
                          ? 'bg-red-500/20 text-red-400 border-red-500/30' 
                          : 'bg-slate-900 text-blue-400 border-slate-800'
                      }`}>
                        {tok.tokenNumber}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-200 truncate max-w-[130px]">{tok.patientName}</p>
                        <p className="text-[10px] text-slate-500 truncate max-w-[130px]">{tok.doctorName} ({tok.department})</p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                        tok.isEmergency 
                          ? 'bg-red-500/20 text-red-400' 
                          : tok.type === 'Appointment'
                            ? 'bg-blue-500/10 text-blue-400'
                            : 'bg-slate-800 text-slate-400'
                      }`}>
                        {tok.isEmergency ? 'Emergency' : tok.type}
                      </span>
                      <p className="text-[10px] text-slate-500 font-mono mt-1">Est: {index * 10 + 10}m</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Hospital Announcements Slider Widget */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-5">
            <span className="text-xs font-mono text-slate-500 uppercase tracking-widest block mb-2">Hospital Bulletin</span>
            <div className="space-y-3">
              {HOSPITAL_ANNOUNCEMENTS.map((ann) => (
                <div key={ann.id} className={`p-3 rounded-xl border text-xs ${
                  ann.level === 'emergency' 
                    ? 'bg-red-950/20 border-red-900/40 text-red-300' 
                    : ann.level === 'warning'
                      ? 'bg-amber-950/10 border-amber-900/30 text-amber-300'
                      : 'bg-slate-950/80 border-slate-800/80 text-slate-300'
                }`}>
                  <p className="font-semibold text-white flex items-center gap-1.5 mb-1">
                    {ann.level === 'emergency' && <ShieldAlert className="h-3.5 w-3.5 text-red-400 animate-pulse" />}
                    {ann.title}
                  </p>
                  <p className="leading-relaxed text-slate-400">{ann.text}</p>
                </div>
              ))}
            </div>
          </div>

        </section>

      </main>

      {/* FOOTER: Health Awareness Tip Ticker */}
      <footer id="waiting-room-footer" className="border-t border-slate-900 pt-4 mt-auto z-10">
        <div className="bg-blue-950/20 border border-blue-900/30 rounded-2xl p-4 flex flex-col md:flex-row items-center gap-4">
          <div className="flex items-center gap-2 text-blue-400 font-display font-bold uppercase tracking-wider text-xs shrink-0">
            <Sparkles className="h-5 w-5 text-yellow-300 animate-pulse" />
            <span>Health & Wellness awareness:</span>
          </div>
          <div className="h-4 w-[1px] bg-blue-900/50 hidden md:block" />
          <p className="text-sm font-medium text-slate-300 italic flex-grow animate-fade-in key={tipIndex}">
            "{HEALTH_TIPS[tipIndex]}"
          </p>
          <div className="text-right text-[10px] font-mono text-slate-500 hidden md:block">
            TIPS CHANGE EVERY 10S
          </div>
        </div>
      </footer>

    </div>
  );
}
