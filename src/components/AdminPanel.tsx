/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { QueueState, Doctor, Patient, Token, AuditLog, SystemSettings } from '../types';
import { generateQueueAIInsights } from '../data';
import { 
  ShieldCheck, Settings, Users, BarChart3, HelpCircle, Sparkles, Plus,
  Trash2, Mail, Phone, Clock, AlertTriangle, ShieldAlert, CheckCircle,
  Activity, ArrowUpRight, TrendingUp, Info, UserCheck, Stethoscope, RefreshCw
} from 'lucide-react';

export default function AdminPanel({ state, onUpdateState }: { state: QueueState, onUpdateState: (s: QueueState) => void }) {
  const [activeAdminSubTab, setActiveAdminSubTab] = useState<'analytics' | 'doctors' | 'settings'>('analytics');
  
  // Doctor create/edit form
  const [docName, setDocName] = useState('');
  const [docDept, setDocDept] = useState('General Medicine');
  const [docRoom, setDocRoom] = useState('Room 106');
  
  // Analytics State
  const aiInsights = generateQueueAIInsights(state);

  // Trigger Doctor Add
  const handleAddDoctor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docName.trim()) return;

    const newDoctor: Doctor = {
      id: 'doc-' + Date.now(),
      name: docName.trim(),
      department: docDept,
      roomNumber: docRoom.trim(),
      status: 'Available',
      rating: 5.0,
      avatar: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=256&h=256&q=80'
    };

    onUpdateState({
      ...state,
      doctors: [...state.doctors, newDoctor],
      logs: [{
        id: 'log-' + Date.now(),
        timestamp: new Date().toISOString(),
        role: 'Admin',
        user: 'Systems Administrator',
        action: 'Doctor Appointed',
        details: `Appointed Dr. ${docName} to ${docDept} (${docRoom})`
      }, ...state.logs]
    });

    setDocName('');
    setDocRoom('Room ' + (101 + state.doctors.length + 1));
    alert('New Doctor cabin added and operationalized successfully!');
  };

  const handleDeleteDoctor = (id: string) => {
    if (state.doctors.length <= 2) {
      alert('Error: Minimal active clinical staff safety margins reached. Cannot delete further.');
      return;
    }
    if (!confirm('Are you sure you want to remove this Doctor cabin from the registry?')) return;
    
    const updated = state.doctors.filter(d => d.id !== id);
    onUpdateState({ ...state, doctors: updated });
  };

  // Toggle settings
  const handleToggleSetting = (key: keyof SystemSettings) => {
    onUpdateState({
      ...state,
      settings: {
        ...state.settings,
        [key]: !state.settings[key]
      }
    });
  };

  // Calculate Doctor load metrics
  const getDoctorLoadStats = () => {
    return state.doctors.map(doc => {
      const completed = state.tokens.filter(t => t.doctorId === doc.id && t.status === 'Completed').length;
      const waiting = state.tokens.filter(t => t.doctorId === doc.id && t.status === 'Waiting').length;
      const consulting = state.tokens.filter(t => t.doctorId === doc.id && t.status === 'In Consultation').length;
      return {
        ...doc,
        completed,
        waiting,
        consulting,
        totalCheckedInToday: completed + waiting + consulting
      };
    });
  };

  const docStats = getDoctorLoadStats();

  return (
    <div id="admin-workspace" className="p-4 md:p-6 space-y-6">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-5 gap-3">
        <div>
          <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full uppercase tracking-widest">
            🛡️ Administrative Control Room
          </span>
          <h2 className="text-xl font-display font-bold text-slate-800 dark:text-slate-100 mt-2">
            Hospital Analytics & Operational Management
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Configure queues, audit clinicians, and query dynamic clinical metrics.</p>
        </div>

        {/* Action Toggle Tab */}
        <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl text-xs font-semibold sm:shrink-0">
          <button
            onClick={() => setActiveAdminSubTab('analytics')}
            className={`px-4 py-2 rounded-xl transition ${activeAdminSubTab === 'analytics' ? 'bg-white dark:bg-slate-900 shadow text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Clinical Analytics
          </button>
          <button
            onClick={() => setActiveAdminSubTab('doctors')}
            className={`px-4 py-2 rounded-xl transition ${activeAdminSubTab === 'doctors' ? 'bg-white dark:bg-slate-900 shadow text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Manage Clinicians
          </button>
          <button
            onClick={() => setActiveAdminSubTab('settings')}
            className={`px-4 py-2 rounded-xl transition ${activeAdminSubTab === 'settings' ? 'bg-white dark:bg-slate-900 shadow text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:text-slate-700'}`}
          >
            System Settings
          </button>
        </div>
      </div>

      {/* CORE ADMIN VIEW: ANALYTICS */}
      {activeAdminSubTab === 'analytics' && (
        <div className="space-y-6">
          
          {/* ADVANCED AI ADVISORY CENTER */}
          <div className="bg-gradient-to-r from-blue-950/60 to-slate-900/60 border border-blue-500/30 rounded-3xl p-6 relative overflow-hidden text-white shadow-lg shadow-blue-950/10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
            
            <div className="flex items-center gap-2.5 text-blue-300 font-display font-bold text-xs tracking-wider uppercase mb-4">
              <Sparkles className="h-5 w-5 text-yellow-300 animate-pulse" />
              <span>Metropolis AI Clinical Operations Engine</span>
              <span className="ml-auto bg-yellow-400/20 text-yellow-300 border border-yellow-400/30 text-[9px] px-2 py-0.5 rounded-full font-bold">
                PREDICTIVE INSIGHTS ONLINE
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* AI Wait time predictive analysis */}
              <div className="space-y-2 text-xs">
                <span className="font-mono text-blue-300 font-bold block uppercase tracking-wide">Queue Flow Analytics</span>
                <div className="bg-slate-950/40 rounded-2xl p-4 border border-blue-500/10 space-y-2">
                  <p className="text-slate-300">Congestion: <strong className="text-white font-semibold">{aiInsights.trafficPattern}</strong></p>
                  <p className="text-slate-300">Wait Efficiency score: <strong className="text-emerald-400 font-mono">{aiInsights.queueEfficiency}% Optimum</strong></p>
                  <p className="text-slate-300">Peak Hour Slot Forecast: <strong className="text-slate-200 font-mono text-[10px]">{aiInsights.peakTimesForecast}</strong></p>
                </div>
              </div>

              {/* AI Staff recommendations */}
              <div className="space-y-2 text-xs">
                <span className="font-mono text-blue-300 font-bold block uppercase tracking-wide">Congestion Recommendations</span>
                <div className="bg-slate-950/40 rounded-2xl p-4 border border-blue-500/10 space-y-2">
                  <p className="text-slate-300">Active Queue Pressure: <strong className={`${aiInsights.recommendAdditionalStaff ? 'text-red-400 animate-pulse' : 'text-slate-200'}`}>
                    {aiInsights.recommendAdditionalStaff ? 'HEAVY CONGESTION' : 'BALANCED LOAD'}
                  </strong></p>
                  <p className="text-slate-300">Open Backup consulting Cabin: <strong>{aiInsights.recommendAdditionalStaff ? 'RECOMMENDED' : 'NOT REQUIRED'}</strong></p>
                  <p className="text-slate-300">Doctor-to-Patient margin: <strong className="text-slate-200 font-semibold">{state.tokens.length} : {state.doctors.length}</strong></p>
                </div>
              </div>

              {/* AI Recommendations Bulletins */}
              <div className="space-y-2 text-xs md:border-l md:border-blue-500/20 md:pl-6">
                <span className="font-mono text-blue-300 font-bold block uppercase tracking-wide">Realtime AI Directives</span>
                <div className="space-y-2 max-h-[110px] overflow-y-auto pr-1">
                  {aiInsights.recommendations.map((rec, index) => (
                    <div key={index} className="flex gap-2 text-slate-300">
                      <span className="text-yellow-400 font-bold font-mono">▸</span>
                      <p className="leading-relaxed">{rec}</p>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>

          {/* DYNAMIC SVG DATA CHARTS GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* HOURLY PATIENT TRAFFIC CHART (7 cols) */}
            <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                <div>
                  <h3 className="text-sm font-display font-bold text-slate-800 dark:text-slate-200">Patient Check-in Hourly Traffic</h3>
                  <p className="text-[10px] text-slate-400">Total volume grouped across hourly clinics</p>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-blue-500 font-semibold font-mono">
                  <TrendingUp className="h-4 w-4" />
                  <span>PEAK SLOT: 10:00 - 12:00</span>
                </div>
              </div>

              {/* Custom SVG Bar Chart */}
              <div className="h-64 w-full relative flex items-end justify-between px-4 pb-8 pt-4">
                
                {/* Horizontal Guide Gridlines */}
                <div className="absolute inset-x-0 top-4 border-t border-slate-100 dark:border-slate-800/60" />
                <div className="absolute inset-x-0 top-1/4 border-t border-slate-100 dark:border-slate-800/60" />
                <div className="absolute inset-x-0 top-2/4 border-t border-slate-100 dark:border-slate-800/60" />
                <div className="absolute inset-x-0 top-3/4 border-t border-slate-100 dark:border-slate-800/60" />
                <div className="absolute inset-x-0 bottom-8 border-b-2 border-slate-200 dark:border-slate-800" />

                {/* Simulated Data Bars */}
                {[
                  { label: '08 AM', val: 2, height: '20%' },
                  { label: '09 AM', val: 5, height: '50%' },
                  { label: '10 AM', val: 9, height: '90%', peak: true },
                  { label: '11 AM', val: 8, height: '80%', peak: true },
                  { label: '12 PM', val: 4, height: '40%' },
                  { label: '01 PM', val: 1, height: '10%' },
                  { label: '02 PM', val: 3, height: '30%' },
                  { label: '03 PM', val: 6, height: '60%' },
                  { label: '04 PM', val: 7, height: '70%' },
                  { label: '05 PM', val: 4, height: '40%' },
                ].map((bar, idx) => (
                  <div key={idx} className="flex-grow flex flex-col items-center h-full justify-end relative group px-1">
                    
                    {/* Hover Volume Popup */}
                    <div className="opacity-0 group-hover:opacity-100 absolute -top-2 bg-slate-950 text-white text-[9px] font-bold px-2 py-0.5 rounded transition font-mono z-10 pointer-events-none">
                      {bar.val} Patients
                    </div>

                    {/* The Bar */}
                    <div 
                      className={`w-full max-w-[28px] rounded-t-lg transition-all duration-1000 origin-bottom hover:scale-110 shadow-lg ${
                        bar.peak 
                          ? 'bg-blue-600 dark:bg-blue-500 shadow-blue-600/15' 
                          : 'bg-slate-300 dark:bg-slate-800 hover:bg-blue-400'
                      }`}
                      style={{ height: bar.height }}
                    />

                    {/* X Axis label */}
                    <span className="absolute bottom-1 text-[9px] font-mono font-bold text-slate-400">
                      {bar.label}
                    </span>

                  </div>
                ))}

              </div>
            </div>

            {/* CLINIC DEPARTMENT CONGESTION HEATMAP (5 cols) */}
            <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm">
              <span className="text-xs font-mono text-slate-400 uppercase tracking-widest block mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">
                Floor Congestion Heatmap
              </span>

              <div className="space-y-3.5">
                {[
                  { dept: 'Cardiology (Desk 101)', load: 'Critical Priority (Heavy)', count: state.tokens.filter(t => t.department === 'Cardiology' && t.status === 'Waiting').length, color: 'bg-red-500', barW: 'w-4/5' },
                  { dept: 'Pediatrics (Desk 102)', load: 'Moderate Flow', count: state.tokens.filter(t => t.department === 'Pediatrics' && t.status === 'Waiting').length, color: 'bg-amber-500', barW: 'w-2/5' },
                  { dept: 'Orthopedics (Desk 103)', load: 'On Break / Offline Penalty', count: state.tokens.filter(t => t.department === 'Orthopedics' && t.status === 'Waiting').length, color: 'bg-slate-400', barW: 'w-1/5' },
                  { dept: 'General Medicine (Desk 104)', load: 'Normal Stable Flow', count: state.tokens.filter(t => t.department === 'General Medicine' && t.status === 'Waiting').length, color: 'bg-emerald-500', barW: 'w-3/5' }
                ].map((heat, idx) => (
                  <div key={idx} className="space-y-1.5 text-xs">
                    <div className="flex justify-between font-semibold">
                      <span className="dark:text-slate-300">{heat.dept}</span>
                      <span className="font-mono text-slate-500 dark:text-slate-400 font-bold">{heat.count} in line</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden flex">
                      <div className={`h-full ${heat.color} rounded-full`} style={{ width: `${Math.max(10, heat.count * 20)}%` }} />
                    </div>
                    <p className="text-[10px] text-slate-400 italic mt-0.5">{heat.load}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* CLINICIAN SCORECARD SUMMARY */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-widest block border-b border-slate-100 dark:border-slate-800 pb-2 mb-4">
              Physician Performance & Clinic Log Scorecard
            </span>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              {docStats.map(doc => (
                <div key={doc.id} className="border border-slate-100 dark:border-slate-800 rounded-2xl p-4 space-y-3.5 bg-slate-50/40 dark:bg-slate-950/20">
                  <div className="flex items-center gap-2.5">
                    <img src={doc.avatar} alt={doc.name} className="h-10 w-10 rounded-xl object-cover ring-2 ring-slate-100 dark:ring-slate-800" />
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-200">{doc.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono font-medium">{doc.department.toUpperCase()}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-2 rounded-xl">
                      <span className="text-[9px] font-mono text-slate-400 block uppercase">WAITING</span>
                      <strong className="text-blue-500 text-sm font-mono">{doc.waiting}</strong>
                    </div>
                    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-2 rounded-xl">
                      <span className="text-[9px] font-mono text-slate-400 block uppercase">ACTIVE</span>
                      <strong className="text-emerald-500 text-sm font-mono">{doc.consulting}</strong>
                    </div>
                    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-2 rounded-xl">
                      <span className="text-[9px] font-mono text-slate-400 block uppercase">DONE</span>
                      <strong className="text-slate-500 text-sm font-mono">{doc.completed}</strong>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>Clinical Satisfaction Rating:</span>
                    <strong className="text-yellow-500 font-bold font-mono">⭐ {doc.rating.toFixed(1)} / 5.0</strong>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* CORE ADMIN VIEW: DOCTORS CONFIG DIRECTORY */}
      {activeAdminSubTab === 'doctors' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Appointment/Add doctor form (5 cols) */}
          <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-widest block border-b border-slate-100 dark:border-slate-800 pb-2">
              Appoint New Doctor Desk
            </span>

            <form onSubmit={handleAddDoctor} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-mono font-bold text-slate-500 mb-1.5 uppercase">Doctor Full Name</label>
                <input
                  type="text"
                  required
                  value={docName}
                  onChange={(e) => setDocName(e.target.value)}
                  placeholder="e.g. Dr. Rajesh Pillai"
                  className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:text-slate-300"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-slate-500 mb-1.5 uppercase">Clinical Department</label>
                <select
                  value={docDept}
                  onChange={(e) => setDocDept(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 focus:outline-none dark:text-slate-300"
                >
                  <option value="General Medicine">General Medicine</option>
                  <option value="Cardiology">Cardiology</option>
                  <option value="Pediatrics">Pediatrics</option>
                  <option value="Orthopedics">Orthopedics</option>
                  <option value="Dermatology">Dermatology</option>
                  <option value="Neurology">Neurology</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-slate-500 mb-1.5 uppercase">Room Desk Number</label>
                <input
                  type="text"
                  required
                  value={docRoom}
                  onChange={(e) => setDocRoom(e.target.value)}
                  placeholder="e.g. Cabin 106"
                  className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:text-slate-300"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-bold transition shadow shadow-blue-600/10 cursor-pointer"
              >
                Appoint & Provision Cabin
              </button>
            </form>
          </div>

          {/* Doctors Listing (7 cols) */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-widest block border-b border-slate-100 dark:border-slate-800 pb-2">
              Practicing Clinical Staff Directory
            </span>

            <div className="space-y-3.5 max-h-[360px] overflow-y-auto pr-1">
              {state.doctors.map(d => (
                <div key={d.id} className="border border-slate-100 dark:border-slate-800/80 rounded-2xl p-3 flex items-center justify-between text-xs bg-slate-50/40 dark:bg-slate-950/20">
                  <div className="flex items-center gap-3">
                    <img src={d.avatar} alt={d.name} className="h-10 w-10 rounded-xl object-cover" />
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-200">{d.name}</p>
                      <p className="text-[10px] text-slate-400 font-medium">{d.department} • {d.roomNumber}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-mono bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded font-bold">
                      ⭐ {d.rating.toFixed(1)}
                    </span>
                    <button
                      onClick={() => handleDeleteDoctor(d.id)}
                      className="text-red-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition"
                      title="De-appoint Doctor"
                    >
                      <Trash2 className="h-4.5 w-4.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* CORE ADMIN VIEW: SYSTEM SETTINGS */}
      {activeAdminSubTab === 'settings' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
          <span className="text-xs font-mono text-slate-400 uppercase tracking-widest block border-b border-slate-100 dark:border-slate-800 pb-2">
            Global Clinic Configurations
          </span>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            
            {/* Notification Gateways Config */}
            <div className="space-y-4">
              <h4 className="font-bold text-slate-800 dark:text-slate-300 uppercase tracking-wide text-[11px] font-mono">Real-time Notification Gateways</h4>
              
              <div className="space-y-3">
                <label className="flex items-center gap-3 bg-slate-50 dark:bg-slate-950/40 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={state.settings.enableSmsNotification}
                    onChange={() => handleToggleSetting('enableSmsNotification')}
                    className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <div>
                    <span className="font-bold dark:text-slate-200 block">Sms Twilio Gateway API Integration</span>
                    <span className="text-[10px] text-slate-400">Broadcasting queue proximity triggers (3 remaining) instantly to patient phone.</span>
                  </div>
                </label>
 
                <label className="flex items-center gap-3 bg-slate-50 dark:bg-slate-950/40 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={state.settings.enableWhatsappNotification}
                    onChange={() => handleToggleSetting('enableWhatsappNotification')}
                    className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <div>
                    <span className="font-bold dark:text-slate-200 block">WhatsApp Outbound Notifications</span>
                    <span className="text-[10px] text-slate-400">Outbound transmission of medical drug prescriptions upon doctor completion.</span>
                  </div>
                </label>
              </div>
            </div>
 
            {/* Token announcement routing rules */}
            <div className="space-y-4">
              <h4 className="font-bold text-slate-800 dark:text-slate-300 uppercase tracking-wide text-[11px] font-mono">Announce & Priority Strategies</h4>
              
              <div className="space-y-3">
                <label className="flex items-center gap-3 bg-slate-50 dark:bg-slate-950/40 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={state.settings.autoReorderEmergency}
                    onChange={() => handleToggleSetting('autoReorderEmergency')}
                    className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <div>
                    <span className="font-bold dark:text-slate-200 block">Emergency Automatic Queue Override</span>
                    <span className="text-[10px] text-slate-400">If enabled, checked-in emergencies jump priority index instantly ahead of regular outpatients.</span>
                  </div>
                </label>

                {/* Voice Announcement Language configuration */}
                <div className="bg-slate-50 dark:bg-slate-950/40 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <span className="font-bold dark:text-slate-200 block">Default Announcement Voice Language</span>
                  <p className="text-[10px] text-slate-400 mb-1">Synthesizes and broadcasts token calls in the selected locale.</p>
                  
                  <select
                    value={state.settings.voiceLanguage}
                    onChange={(e) => {
                      onUpdateState({
                        ...state,
                        settings: {
                          ...state.settings,
                          voiceLanguage: e.target.value as any
                        }
                      });
                    }}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 font-bold focus:outline-none dark:text-slate-300"
                  >
                    <option value="en-US">🇬🇧 English Speech Synthesizer</option>
                    <option value="ta-IN">🇮🇳 Tamil Speech (அடையாள எண்)</option>
                    <option value="hi-IN">🇮🇳 Hindi Speech (टोकन नंबर)</option>
                  </select>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
