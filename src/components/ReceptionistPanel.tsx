/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { QueueState, Token, Patient, Doctor } from '../types';
import { getSortedDoctorQueue, getEstimatedWaitTime } from '../data';
import { 
  User, CheckCircle2, Clock, MapPin, Printer, ShieldAlert,
  Search, Plus, Edit2, Trash2, Phone, QrCode, Ticket, Check,
  Activity, Sparkles, UserPlus, FileText, Settings, HeartPulse,
  AlertTriangle, Volume2, ArrowRightLeft, XCircle
} from 'lucide-react';
import { announceTokenCall } from '../utils/voice';

export default function ReceptionistPanel({ state, onUpdateState }: { state: QueueState, onUpdateState: (s: QueueState) => void }) {
  const [activeTab, setActiveTab] = useState<'register' | 'queue' | 'patients'>('register');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Registration Form States
  const [regName, setRegName] = useState('');
  const [regAge, setRegAge] = useState('');
  const [regGender, setRegGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [regMobile, setRegMobile] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [regBloodGroup, setRegBloodGroup] = useState<Patient['bloodGroup']>('O+');
  const [regDoctorId, setRegDoctorId] = useState('doc-1');
  const [regType, setRegType] = useState<Token['type']>('Walk-in');
  const [isEmergency, setIsEmergency] = useState(false);
  const [emergencyReason, setEmergencyReason] = useState('');
  const [specialNotes, setSpecialNotes] = useState('');
  
  // Printing slip states
  const [printedToken, setPrintedToken] = useState<Token | null>(null);
  const [isEditingPatient, setIsEditingPatient] = useState<string | null>(null);

  // RECEPT ACTION: Register & Check-in patient
  const handleRegisterPatient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regMobile.trim() || !regAge) return;

    const patientId = isEditingPatient || 'pat-' + Date.now();
    const targetDoctor = state.doctors.find(d => d.id === regDoctorId) || state.doctors[0];
    
    // Register Patient Card
    const newPatient: Patient = {
      id: patientId,
      name: regName.trim(),
      age: parseInt(regAge),
      gender: regGender,
      mobile: regMobile.trim(),
      address: regAddress.trim(),
      bloodGroup: regBloodGroup,
      medicalHistory: specialNotes,
      allergies: isEmergency ? 'EMERGENCY STATUS RECORDED: ' + emergencyReason : 'None'
    };

    // If we're editing an existing patient cards, just update the directory
    if (isEditingPatient) {
      const updatedPatients = state.patients.map(p => p.id === patientId ? newPatient : p);
      onUpdateState({
        ...state,
        patients: updatedPatients,
        logs: [{
          id: 'log-' + Date.now(),
          timestamp: new Date().toISOString(),
          role: 'Receptionist',
          user: 'Receptionist Desk 1',
          action: 'Patient Directory Updated',
          details: `Updated info for Patient: ${regName}`
        }, ...state.logs]
      });
      setIsEditingPatient(null);
      resetForm();
      setActiveTab('patients');
      alert('Patient details updated successfully!');
      return;
    }

    // Otherwise, generate a brand new TOKEN!
    const tokenNumber = 'H-' + (100 + state.tokens.length + 1);
    const newTokenId = 'tok-' + Date.now();
    const newToken: Token = {
      id: newTokenId,
      tokenNumber,
      patientId,
      patientName: regName.trim(),
      doctorId: regDoctorId,
      doctorName: targetDoctor.name,
      department: targetDoctor.department,
      roomNumber: targetDoctor.roomNumber,
      status: 'Waiting',
      type: regType,
      isEmergency,
      emergencyReason: isEmergency ? emergencyReason : undefined,
      notes: specialNotes.trim() || undefined,
      createdAt: new Date().toISOString()
    };

    const newPatientsList = state.patients.some(p => p.mobile === regMobile) 
      ? state.patients 
      : [...state.patients, newPatient];

    const updatedTokens = [...state.tokens, newToken];
    
    // Log Entry
    const logEntry = {
      id: 'log-' + Date.now(),
      timestamp: new Date().toISOString(),
      role: 'Receptionist' as const,
      user: 'Receptionist Desk 1',
      action: isEmergency ? 'Emergency Checked-in' : 'Patient Registered',
      details: `${regName} registered with Token ${tokenNumber} for ${targetDoctor.name}`
    };

    onUpdateState({
      ...state,
      patients: newPatientsList,
      tokens: updatedTokens,
      logs: [logEntry, ...state.logs]
    });

    // Load ticket printable modal
    setPrintedToken(newToken);
    resetForm();
  };

  const resetForm = () => {
    setRegName('');
    setRegAge('');
    setRegGender('Male');
    setRegMobile('');
    setRegAddress('');
    setRegBloodGroup('O+');
    setRegDoctorId('doc-1');
    setRegType('Walk-in');
    setIsEmergency(false);
    setEmergencyReason('');
    setSpecialNotes('');
    setIsEditingPatient(null);
  };

  const handleEditPatient = (pat: Patient) => {
    setIsEditingPatient(pat.id);
    setRegName(pat.name);
    setRegAge(pat.age.toString());
    setRegGender(pat.gender);
    setRegMobile(pat.mobile);
    setRegAddress(pat.address);
    setRegBloodGroup(pat.bloodGroup);
    setSpecialNotes(pat.medicalHistory);
    setActiveTab('register');
  };

  const handleDeletePatient = (id: string) => {
    if (!confirm('Are you sure you want to delete this patient profile? This will not affect active tokens.')) return;
    const updated = state.patients.filter(p => p.id !== id);
    onUpdateState({ ...state, patients: updated });
  };

  // RECEPT ACTION: Call Next Patient dynamically
  const handleCallNext = (doctorId: string) => {
    const queue = getSortedDoctorQueue(doctorId, state.tokens, state.settings.autoReorderEmergency);
    const nextWaiting = queue.find(t => t.status === 'Waiting');
    
    if (!nextWaiting) {
      alert('No patients waiting in this doctor queue!');
      return;
    }

    // Transition token status to 'Called'
    const updatedTokens = state.tokens.map(t => {
      if (t.id === nextWaiting.id) {
        return {
          ...t,
          status: 'Called' as const,
          calledAt: new Date().toISOString()
        };
      }
      return t;
    });

    const targetDoc = state.doctors.find(d => d.id === doctorId);

    const logEntry = {
      id: 'log-' + Date.now(),
      timestamp: new Date().toISOString(),
      role: 'Receptionist' as const,
      user: 'Receptionist Desk 1',
      action: 'Call Next Triggered',
      details: `Receptionist called Token ${nextWaiting.tokenNumber} to Room ${targetDoc?.roomNumber}`
    };

    onUpdateState({
      ...state,
      tokens: updatedTokens,
      logs: [logEntry, ...state.logs]
    });

    // Voice announcement immediately
    announceTokenCall(
      nextWaiting.tokenNumber,
      nextWaiting.patientName,
      targetDoc?.name || '',
      targetDoc?.roomNumber || '',
      state.settings
    );
  };

  // Token action triggers
  const handleRecallToken = (token: Token) => {
    announceTokenCall(
      token.tokenNumber,
      token.patientName,
      token.doctorName,
      token.roomNumber,
      state.settings
    );
    alert(`Recalling announcement for Token ${token.tokenNumber} successfully!`);
  };

  const handleSkipToken = (token: Token) => {
    const updated = state.tokens.map(t => t.id === token.id ? { ...t, status: 'Absent' as const } : t);
    onUpdateState({ ...state, tokens: updated });
  };

  const handleCancelToken = (token: Token) => {
    const updated = state.tokens.map(t => t.id === token.id ? { ...t, status: 'Cancelled' as const } : t);
    onUpdateState({ ...state, tokens: updated });
  };

  // Reassign token to different doctor
  const handleReassignToken = (tokenId: string, newDocId: string) => {
    const targetDoc = state.doctors.find(d => d.id === newDocId);
    if (!targetDoc) return;

    const updated = state.tokens.map(t => {
      if (t.id === tokenId) {
        return {
          ...t,
          doctorId: newDocId,
          doctorName: targetDoc.name,
          department: targetDoc.department,
          roomNumber: targetDoc.roomNumber
        };
      }
      return t;
    });

    const token = state.tokens.find(t => t.id === tokenId);

    onUpdateState({
      ...state,
      tokens: updated,
      logs: [{
        id: 'log-' + Date.now(),
        timestamp: new Date().toISOString(),
        role: 'Receptionist',
        user: 'Receptionist Desk 1',
        action: 'Token Reassigned',
        details: `Reassigned Token ${token?.tokenNumber} (${token?.patientName}) to ${targetDoc.name}`
      }, ...state.logs]
    });

    alert(`Successfully reassigned patient token to ${targetDoc.name}!`);
  };

  // Settings updates
  const handleAvgTimeChange = (mins: number) => {
    onUpdateState({
      ...state,
      settings: {
        ...state.settings,
        averageConsultationTime: mins
      }
    });
  };

  // Filter lists based on search
  const filteredPatients = state.patients.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.mobile.includes(searchQuery)
  );

  // Active Live Queues List
  const activeQueues = state.tokens.filter(t => t.status === 'Waiting' || t.status === 'Called' || t.status === 'In Consultation');

  // Today stats
  const totalPatientsCount = state.tokens.length;
  const averageWaitingTime = activeQueues.length * state.settings.averageConsultationTime;
  const completedCount = state.tokens.filter(t => t.status === 'Completed').length;
  const emergencyCount = state.tokens.filter(t => t.isEmergency).length;

  return (
    <div id="receptionist-dashboard" className="p-4 md:p-6 space-y-6">
      
      {/* QUEUE ANALYTICS BANNER */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-3xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono font-bold text-slate-400 block uppercase">Today's Registered</span>
            <p className="text-3xl font-display font-extrabold text-slate-800 dark:text-slate-100 mt-1">{totalPatientsCount}</p>
          </div>
          <div className="bg-blue-500/10 text-blue-500 p-3 rounded-2xl">
            <Ticket className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-3xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono font-bold text-slate-400 block uppercase">Est. Waiting Time</span>
            <p className="text-3xl font-display font-extrabold text-teal-600 dark:text-teal-400 mt-1">~{averageWaitingTime} m</p>
          </div>
          <div className="bg-teal-500/10 text-teal-500 p-3 rounded-2xl">
            <Clock className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-3xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono font-bold text-slate-400 block uppercase">Completed Consults</span>
            <p className="text-3xl font-display font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">{completedCount}</p>
          </div>
          <div className="bg-emerald-500/10 text-emerald-500 p-3 rounded-2xl">
            <CheckCircle2 className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-3xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono font-bold text-slate-400 block uppercase">Emergencies Today</span>
            <p className="text-3xl font-display font-extrabold text-red-600 dark:text-red-400 mt-1">{emergencyCount}</p>
          </div>
          <div className="bg-red-500/10 text-red-500 p-3 rounded-2xl">
            <ShieldAlert className="h-6 w-6 animate-pulse" />
          </div>
        </div>
      </div>

      {/* COMMAND CONTROL NAVIGATION */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 pb-px">
        <button
          onClick={() => setActiveTab('register')}
          className={`pb-3 text-sm font-semibold tracking-wide border-b-2 px-4 transition-all flex items-center gap-2 cursor-pointer ${activeTab === 'register' ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
        >
          <UserPlus className="h-4 w-4" />
          <span>Patient Registration & Check-in</span>
        </button>
        <button
          onClick={() => setActiveTab('queue')}
          className={`pb-3 text-sm font-semibold tracking-wide border-b-2 px-4 transition-all flex items-center gap-2 cursor-pointer ${activeTab === 'queue' ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
        >
          <Activity className="h-4 w-4" />
          <span>Active Queue Manager</span>
        </button>
        <button
          onClick={() => setActiveTab('patients')}
          className={`pb-3 text-sm font-semibold tracking-wide border-b-2 px-4 transition-all flex items-center gap-2 cursor-pointer ${activeTab === 'patients' ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
        >
          <User className="h-4 w-4" />
          <span>Outpatient Registry</span>
        </button>
      </div>

      {/* CORE WORKSPACE GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* TAB CONTENT: LEFT CORES (8 cols) */}
        <section className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm min-h-[450px]">
          
          {/* TAB 1: REGISTRATION FORM */}
          {activeTab === 'register' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                <h3 className="text-md font-display font-bold text-slate-800 dark:text-slate-200">
                  {isEditingPatient ? 'Modify Outpatient Directory Card' : 'New Outpatient Check-in Roster'}
                </h3>
                {isEditingPatient && (
                  <button onClick={resetForm} className="text-xs text-red-500 hover:underline">
                    Cancel Edit
                  </button>
                )}
              </div>

              <form onSubmit={handleRegisterPatient} className="space-y-5 text-xs">
                
                {/* Visual indicator of Emergency */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono font-bold text-slate-500 mb-1.5 uppercase">Patient Full Name *</label>
                    <input
                      type="text"
                      required
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="e.g. Arjun Kumar"
                      className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:text-slate-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono font-bold text-slate-500 mb-1.5 uppercase">Mobile Number *</label>
                    <input
                      type="tel"
                      required
                      value={regMobile}
                      onChange={(e) => setRegMobile(e.target.value)}
                      placeholder="e.g. 9876543210"
                      className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:text-slate-300"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-mono font-bold text-slate-500 mb-1.5 uppercase">Age *</label>
                    <input
                      type="number"
                      required
                      value={regAge}
                      onChange={(e) => setRegAge(e.target.value)}
                      placeholder="Yrs"
                      className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:text-slate-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono font-bold text-slate-500 mb-1.5 uppercase">Gender *</label>
                    <select
                      value={regGender}
                      onChange={(e) => setRegGender(e.target.value as any)}
                      className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:text-slate-300"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-mono font-bold text-slate-500 mb-1.5 uppercase">Blood Group</label>
                    <select
                      value={regBloodGroup}
                      onChange={(e) => setRegBloodGroup(e.target.value as any)}
                      className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:text-slate-300"
                    >
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-mono font-bold text-slate-500 mb-1.5 uppercase">Check-in Type</label>
                    <select
                      value={regType}
                      onChange={(e) => setRegType(e.target.value as any)}
                      className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:text-slate-300"
                    >
                      <option value="Walk-in">Walk-in Check</option>
                      <option value="Appointment">Scheduled Appt</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-slate-500 mb-1.5 uppercase">Home Address</label>
                  <input
                    type="text"
                    value={regAddress}
                    onChange={(e) => setRegAddress(e.target.value)}
                    placeholder="Residential address details"
                    className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:text-slate-300"
                  />
                </div>

                {/* DOCTOR SELECTION & CONSULTATION TYPE */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono font-bold text-slate-500 mb-1.5 uppercase">Select Target Doctor Desk</label>
                    <select
                      value={regDoctorId}
                      onChange={(e) => setRegDoctorId(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:text-slate-300"
                    >
                      {state.doctors.map(d => (
                        <option key={d.id} value={d.id}>{d.name} ({d.department}) - {d.status}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-mono font-bold text-slate-500 mb-1.5 uppercase">Clinical Special Notes</label>
                    <input
                      type="text"
                      value={specialNotes}
                      onChange={(e) => setSpecialNotes(e.target.value)}
                      placeholder="Allergies, general conditions, or physical observations"
                      className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:text-slate-300"
                    />
                  </div>
                </div>

                {/* EMERGENCY PRIORITY SWITCH */}
                <div className="border border-red-100 dark:border-red-900/30 rounded-2xl p-4 bg-red-500/[0.01]">
                  <label className="flex items-center gap-3.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isEmergency}
                      onChange={(e) => setIsEmergency(e.target.checked)}
                      className="h-4 w-4 text-red-600 border-slate-300 rounded focus:ring-red-500 focus:outline-none shrink-0"
                    />
                    <div>
                      <span className="text-xs font-bold text-red-600 dark:text-red-400 block uppercase tracking-wide">
                        ⚠️ Declare Critical Emergency Patient
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Bypasses clinical queue directly to top rank. Displays visual flashing badges.
                      </span>
                    </div>
                  </label>

                  {isEmergency && (
                    <div className="mt-3 animate-fade-in">
                      <label className="block text-[10px] font-mono text-red-500 mb-1 uppercase font-bold">Emergency Severity / Complaint Reason</label>
                      <input
                        type="text"
                        required
                        value={emergencyReason}
                        onChange={(e) => setEmergencyReason(e.target.value)}
                        placeholder="e.g. Sharp radiating chest pain, severe physical trauma, respiratory collapse"
                        className="w-full bg-white dark:bg-slate-950 border border-red-500/40 rounded-xl px-3 py-2 focus:outline-none dark:text-slate-300"
                      />
                    </div>
                  )}
                </div>

                {/* ACTION TRIGGER */}
                <button
                  type="submit"
                  className={`w-full text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2 shadow-lg cursor-pointer ${
                    isEmergency 
                      ? 'bg-red-600 hover:bg-red-700 shadow-red-600/10' 
                      : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/10'
                  }`}
                >
                  <Plus className="h-4.5 w-4.5" />
                  <span>{isEditingPatient ? 'Update Outpatient Card' : 'Generate Outpatient Token Check-in'}</span>
                </button>

              </form>
            </div>
          )}

          {/* TAB 2: ACTIVE QUEUE MANAGER */}
          {activeTab === 'queue' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-md font-display font-bold text-slate-800 dark:text-slate-200">Active Consulting Cabin Queues</h3>
                <span className="text-xs font-mono text-slate-400">REALTIME WORKSPACE RE-SYNCING</span>
              </div>

              {state.doctors.map(doc => {
                const docQueue = getSortedDoctorQueue(doc.id, state.tokens, state.settings.autoReorderEmergency);
                const isDocBreak = doc.status === 'On Break' || doc.status === 'Offline';
                
                return (
                  <div key={doc.id} className="border border-slate-100 dark:border-slate-800 rounded-2xl p-4 space-y-3.5 bg-slate-50/40 dark:bg-slate-950/20">
                    
                    {/* Header bar of Doc Cabin */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800/60 pb-2.5">
                      <div className="flex items-center gap-2.5">
                        <span className={`h-2.5 w-2.5 rounded-full ${isDocBreak ? 'bg-amber-400' : 'bg-emerald-500'}`} />
                        <div>
                          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{doc.name}</p>
                          <p className="text-[10px] text-slate-400 font-medium font-mono uppercase">{doc.department} • {doc.roomNumber}</p>
                        </div>
                      </div>

                      {/* Doctor direct triggers */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleCallNext(doc.id)}
                          className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3.5 py-1.5 rounded-xl font-bold transition flex items-center gap-1 cursor-pointer"
                        >
                          <Volume2 className="h-3.5 w-3.5" />
                          <span>Call Next Patient</span>
                        </button>
                        
                        <span className="text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2.5 py-1 rounded-lg">
                          {docQueue.length} Active in Line
                        </span>
                      </div>
                    </div>

                    {/* Patients in Cabin Queue */}
                    {docQueue.length === 0 ? (
                      <p className="text-xs text-slate-400 italic text-center py-2">Consulting desk is currently idle. No patients checked-in.</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {docQueue.map(tok => {
                          const isWaiting = tok.status === 'Waiting';
                          const isCalled = tok.status === 'Called';
                          const isConsulting = tok.status === 'In Consultation';
                          
                          return (
                            <div 
                              key={tok.id} 
                              className={`rounded-xl border p-3 flex flex-col justify-between transition-all text-xs ${
                                tok.isEmergency 
                                  ? 'border-red-500/30 bg-red-500/[0.01]' 
                                  : isConsulting
                                    ? 'border-emerald-500/40 bg-emerald-500/[0.01]'
                                    : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900'
                              }`}
                            >
                              <div className="flex justify-between items-start gap-1">
                                <div className="flex items-center gap-2">
                                  <span className={`font-mono text-sm font-extrabold px-2 py-0.5 rounded border ${
                                    tok.isEmergency 
                                      ? 'bg-red-500/10 border-red-500/30 text-red-500' 
                                      : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                                  }`}>
                                    {tok.tokenNumber}
                                  </span>
                                  <div>
                                    <p className="font-bold text-slate-800 dark:text-slate-100 truncate max-w-[120px]">{tok.patientName}</p>
                                    <p className="text-[10px] text-slate-400">{tok.type}</p>
                                  </div>
                                </div>

                                <span className={`text-[9px] font-mono px-2 py-0.5 rounded uppercase font-bold ${
                                  tok.status === 'In Consultation' 
                                    ? 'bg-emerald-500/10 text-emerald-500' 
                                    : tok.status === 'Called' 
                                      ? 'bg-amber-500/10 text-amber-500 animate-pulse' 
                                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                                }`}>
                                  {tok.status}
                                </span>
                              </div>

                              {/* Action Bar inside Card */}
                              <div className="border-t border-slate-50 dark:border-slate-800/80 mt-2.5 pt-2 flex items-center justify-between">
                                {/* Doctor Reassign Select */}
                                <select
                                  onChange={(e) => handleReassignToken(tok.id, e.target.value)}
                                  defaultValue={tok.doctorId}
                                  className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-1.5 py-0.5 text-[10px] dark:text-slate-400 focus:outline-none"
                                >
                                  {state.doctors.map(d => (
                                    <option key={d.id} value={d.id}>Reassign: {d.name.split(' ').pop()}</option>
                                  ))}
                                </select>

                                <div className="flex items-center gap-1">
                                  {isCalled && (
                                    <button
                                      onClick={() => handleRecallToken(tok)}
                                      className="text-[10px] font-bold text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/20 px-2 py-0.5 rounded transition cursor-pointer"
                                    >
                                      Recall Voice
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleSkipToken(tok)}
                                    className="text-[10px] font-bold text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 px-1.5 py-0.5 rounded transition cursor-pointer"
                                    title="Mark Patient Skipped / Absent"
                                  >
                                    Skip
                                  </button>
                                  <button
                                    onClick={() => handleCancelToken(tok)}
                                    className="text-[10px] font-bold text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 px-1.5 py-0.5 rounded transition cursor-pointer"
                                    title="Cancel Patient Token"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 3: OUTPATIENT REGISTRY INDEX */}
          {activeTab === 'patients' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-md font-display font-bold text-slate-800 dark:text-slate-200">Patient Outpatient Directory</h3>
                
                {/* Search Bar */}
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Search className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by Name or Mobile..."
                    className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 dark:text-slate-300 w-full sm:w-[220px]"
                  />
                </div>
              </div>

              {filteredPatients.length === 0 ? (
                <div className="py-12 text-center text-slate-400 italic">No registered patient profiles found matching criteria.</div>
              ) : (
                <div className="border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden shadow-inner text-xs">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 border-b border-slate-100 dark:border-slate-800">
                        <th className="p-3">Patient Name</th>
                        <th className="p-3">Contact</th>
                        <th className="p-3">Details (Age/Gender)</th>
                        <th className="p-3">Blood</th>
                        <th className="p-3">Medical Summary Notes</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60 dark:text-slate-300">
                      {filteredPatients.map(pat => (
                        <tr key={pat.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                          <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">{pat.name}</td>
                          <td className="p-3 font-mono">{pat.mobile}</td>
                          <td className="p-3">{pat.age} yrs • {pat.gender}</td>
                          <td className="p-3">
                            <span className="bg-red-500/10 text-red-500 font-bold px-1.5 py-0.5 rounded text-[10px]">
                              {pat.bloodGroup}
                            </span>
                          </td>
                          <td className="p-3 max-w-[200px] truncate" title={pat.medicalHistory}>{pat.medicalHistory || 'None'}</td>
                          <td className="p-3 text-right space-x-2">
                            <button
                              onClick={() => handleEditPatient(pat)}
                              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 hover:underline font-bold font-mono cursor-pointer"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeletePatient(pat.id)}
                              className="text-red-500 hover:text-red-700 hover:underline font-bold font-mono cursor-pointer"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </section>

        {/* TAB RIGHT: LIVE OPERATIONS LOG & SLIP PRINTING (4 cols) */}
        <section className="lg:col-span-4 space-y-6">
          
          {/* QUEUE CONTROL RULES / DYNAMIC SETTINGS CARD */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-widest block mb-3">Operational Directives</span>
            
            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-mono text-slate-500 mb-1.5 uppercase">Set Avg. Consultation duration</label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={5}
                    max={30}
                    step={1}
                    value={state.settings.averageConsultationTime}
                    onChange={(e) => handleAvgTimeChange(parseInt(e.target.value))}
                    className="flex-grow accent-blue-600"
                  />
                  <span className="font-mono font-bold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2 py-0.5 text-blue-600">
                    {state.settings.averageConsultationTime}m
                  </span>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950/40 rounded-xl p-3 border border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 space-y-1">
                <p className="font-bold text-slate-700 dark:text-slate-300">💡 Clinical Scheduling Strategy</p>
                <p>Adjusting average duration automatically recalibrates patient portal wait timers dynamically without page refresh.</p>
              </div>
            </div>
          </div>

          {/* ACTIVE QUEUE LOG AUDITS */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm flex flex-col h-[320px]">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-widest block border-b border-slate-100 dark:border-slate-800 pb-2 mb-3">Live System Activity logs</span>
            
            <div className="space-y-2.5 overflow-y-auto pr-1 flex-grow">
              {state.logs.map(log => (
                <div key={log.id} className="text-[10px] leading-relaxed border-b border-slate-50 dark:border-slate-800/40 pb-2 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between text-[9px] font-mono text-slate-400">
                    <span className="font-bold text-slate-600 dark:text-slate-300">{log.role.toUpperCase()}: {log.user}</span>
                    <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 mt-0.5 font-medium">
                    <strong className="text-slate-700 dark:text-slate-300">{log.action}: </strong>
                    {log.details}
                  </p>
                </div>
              ))}
            </div>
          </div>

        </section>

      </div>

      {/* TICKET PRINTABLE SLIP MODAL */}
      {printedToken && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white text-slate-900 rounded-3xl p-6 shadow-2xl max-w-sm w-full border border-slate-200 animate-scale-up">
            
            {/* Header branding */}
            <div className="text-center pb-4 border-b border-dashed border-slate-200">
              <div className="inline-flex items-center gap-1.5 bg-blue-100 text-blue-600 p-2 rounded-full mb-2">
                <HeartPulse className="h-5 w-5" />
              </div>
              <h4 className="text-sm font-display font-extrabold tracking-tight uppercase">METROPOLIS HEALTHCARE</h4>
              <p className="text-[9px] font-mono text-slate-400 uppercase mt-0.5">Checked-in Token Receipt</p>
            </div>

            {/* Receipt Body */}
            <div className="py-4 space-y-3.5 text-xs text-center">
              <div>
                <p className="text-[10px] font-mono text-slate-400 uppercase">Your Outpatient Code</p>
                <h3 className="text-5xl font-display font-extrabold text-blue-600 tracking-tight mt-1">{printedToken.tokenNumber}</h3>
              </div>

              <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 text-left space-y-1.5">
                <p className="text-slate-500">Patient: <strong className="text-slate-800">{printedToken.patientName}</strong></p>
                <p className="text-slate-500">Consultant: <strong className="text-slate-800">{printedToken.doctorName}</strong></p>
                <p className="text-slate-500">Desk Cabin: <strong className="text-slate-800">{printedToken.roomNumber} ({printedToken.department})</strong></p>
                <p className="text-slate-500">Est. Wait: <strong className="text-teal-600">~{getEstimatedWaitTime(printedToken.id, state)} mins</strong></p>
                <p className="text-slate-500">Time: <strong className="text-slate-600 font-mono text-[10px]">{new Date(printedToken.createdAt).toLocaleString()}</strong></p>
              </div>

              {/* BARCODE / QR SIMULATION */}
              <div className="flex flex-col items-center justify-center gap-1 bg-white p-3 border border-slate-100 rounded-2xl mx-auto w-32 shadow-inner">
                <QrCode className="h-20 w-20 text-slate-800" />
                <span className="text-[8px] font-mono tracking-widest text-slate-400 font-bold">SCAN PORTAL LINK</span>
              </div>
            </div>

            {/* Print trigger actions */}
            <div className="flex gap-2 border-t border-dashed border-slate-200 pt-4 mt-2">
              <button
                onClick={() => {
                  window.print();
                }}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-xl text-xs flex items-center justify-center gap-1 shadow-lg shadow-blue-600/10 cursor-pointer"
              >
                <Printer className="h-4 w-4" />
                <span>Print Ticket</span>
              </button>
              <button
                onClick={() => setPrintedToken(null)}
                className="flex-1 border border-slate-200 hover:bg-slate-50 text-slate-500 font-semibold py-2 rounded-xl text-xs cursor-pointer"
              >
                Done
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
