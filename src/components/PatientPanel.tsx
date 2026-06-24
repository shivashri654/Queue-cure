/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { QueueState, Token, Patient } from '../types';
import { getEstimatedWaitTime, getSortedDoctorQueue } from '../data';
import { 
  User, CheckCircle2, Clock, MapPin, EyeOff, FileText, Download, 
  Search, ShieldCheck, HeartPulse, Sparkles, HelpCircle, ArrowRight,
  Phone, Ticket, QrCode, AlertCircle, Activity
} from 'lucide-react';

export default function PatientPanel({ state, onUpdateState }: { state: QueueState, onUpdateState: (s: QueueState) => void }) {
  const [loginMethod, setLoginMethod] = useState<'mobile' | 'token' | 'qr'>('mobile');
  const [inputValue, setInputValue] = useState('');
  const [scanning, setScanning] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [activeToken, setActiveToken] = useState<Token | null>(null);
  const [patientData, setPatientData] = useState<Patient | null>(null);

  // Sync active token dynamically if state shifts in real-time
  useEffect(() => {
    if (activeToken) {
      const refreshed = state.tokens.find(t => t.id === activeToken.id);
      if (refreshed) {
        setActiveToken(refreshed);
        const patient = state.patients.find(p => p.id === refreshed.patientId);
        if (patient) setPatientData(patient);
      }
    }
  }, [state.tokens]);

  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg('');

    if (!inputValue.trim()) {
      setErrorMsg('Please enter a valid search key');
      return;
    }

    let foundToken: Token | null = null;

    if (loginMethod === 'mobile') {
      // Find patient by mobile first
      const patient = state.patients.find(p => p.mobile.replace(/\D/g, '') === inputValue.replace(/\D/g, ''));
      if (patient) {
        // Find their most recent active or completed token
        const tokensForPatient = state.tokens
          .filter(t => t.patientId === patient.id)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        
        if (tokensForPatient.length > 0) {
          foundToken = tokensForPatient[0];
        } else {
          setErrorMsg('Patient found, but no tokens registered for today.');
          return;
        }
      } else {
        setErrorMsg('No patient records match this mobile number.');
        return;
      }
    } else {
      // Token search
      foundToken = state.tokens.find(t => t.tokenNumber.toUpperCase() === inputValue.toUpperCase().trim());
      if (!foundToken) {
        setErrorMsg('Invalid Token Number. Search like "H-102".');
        return;
      }
    }

    if (foundToken) {
      setActiveToken(foundToken);
      const patient = state.patients.find(p => p.id === foundToken.patientId);
      if (patient) setPatientData(patient);
      
      // Update global context for this session if needed
      onUpdateState({
        ...state,
        activeTokenNumberForPatient: foundToken.tokenNumber
      });
    }
  };

  // Simulate scanning of a QR Code
  const triggerQrScan = () => {
    setScanning(true);
    setErrorMsg('');
    setTimeout(() => {
      // Simulating scan of a random waiting token (e.g. H-104)
      const waitingTokens = state.tokens.filter(t => t.status === 'Waiting');
      const scanTarget = waitingTokens.length > 0 ? waitingTokens[0] : state.tokens[state.tokens.length - 1];
      
      if (scanTarget) {
        setInputValue(scanTarget.tokenNumber);
        setLoginMethod('token');
        setScanning(false);
        setActiveToken(scanTarget);
        const patient = state.patients.find(p => p.id === scanTarget.patientId);
        if (patient) setPatientData(patient);
      } else {
        setScanning(false);
        setErrorMsg('Unable to locate an active QR code simulation. Try typing manually.');
      }
    }, 2000);
  };

  const handleLogout = () => {
    setActiveToken(null);
    setPatientData(null);
    setInputValue('');
    onUpdateState({
      ...state,
      activeTokenNumberForPatient: null
    });
  };

  // Dynamic values computation for the logged in patient
  const getQueueDetails = () => {
    if (!activeToken) return { tokensAhead: 0, waitTime: 0, currentTokenServing: 'None' };

    const queue = getSortedDoctorQueue(activeToken.doctorId, state.tokens, state.settings.autoReorderEmergency);
    const myIndex = queue.findIndex(t => t.id === activeToken.id);
    
    // Tokens strictly ahead in "Waiting" or "Called" state
    const tokensAhead = myIndex > 0 ? myIndex : 0;
    
    // Estimate wait time
    const waitTime = getEstimatedWaitTime(activeToken.id, state);

    // Current token being served by this doctor
    const servingToken = queue.find(t => t.status === 'In Consultation' || t.status === 'Called');

    return {
      tokensAhead,
      waitTime,
      currentTokenServing: servingToken ? servingToken.tokenNumber : 'None'
    };
  };

  const { tokensAhead, waitTime, currentTokenServing } = getQueueDetails();

  // Determine stage index for progress tracker
  // Stages: Registered -> Waiting -> Called -> In Consultation -> Completed
  const getStageIndex = (status: Token['status']): number => {
    switch (status) {
      case 'Waiting': return 1; // Stage 2
      case 'Called': return 2; // Stage 3
      case 'In Consultation': return 3; // Stage 4
      case 'Completed': return 4; // Stage 5
      case 'Cancelled': case 'Absent': return -1;
      default: return 0; // Registered
    }
  };

  const currentStageIndex = activeToken ? getStageIndex(activeToken.status) : 0;
  const stages = [
    { label: 'Registered', desc: 'Token created & logged' },
    { label: 'Waiting', desc: 'In active doctor queue' },
    { label: 'Called', desc: 'Proceed to consultation room' },
    { label: 'Consulting', desc: 'Active doctor session' },
    { label: 'Completed', desc: 'Prescription & reports ready' }
  ];

  // Helper to trigger a downloadable text file representing the digital prescription report PDF
  const triggerDownloadPrescription = () => {
    if (!activeToken || activeToken.status !== 'Completed') return;

    const fileContent = `
============================================================
           METROPOLIS CLINICAL HEALTHCARE SYSTEM
                  ELECTRONIC OUTPATIENT CARD
============================================================
Token Code: ${activeToken.tokenNumber}
Patient Name: ${activeToken.patientName}
Age / Gender: ${patientData?.age} Yrs / ${patientData?.gender}
Blood Group: ${patientData?.bloodGroup}
Mobile: ${patientData?.mobile}

Consultation Date: ${new Date(activeToken.completedAt || '').toLocaleString()}
Attending Physician: ${activeToken.doctorName}
Department / Desk: ${activeToken.department} / ${activeToken.roomNumber}
------------------------------------------------------------

CLINICAL SYMPTOMS RECORDED:
${activeToken.symptoms?.map(s => `- ${s}`).join('\n') || 'General Checkup'}

PROVISIONAL DIAGNOSIS:
${activeToken.diagnosis || 'Diagnosis Pending'}

ADVICE & INSTRUCTIONS:
${activeToken.advice || 'None provided'}

------------------------------------------------------------
DIGITAL PRESCRIPTION RX:
${activeToken.prescription?.map((p, idx) => `${idx + 1}. ${p.medicineName} --- Dosage: ${p.dosage} --- Duration: ${p.duration} (${p.foodInstructions})`).join('\n') || 'No medicinal prescription issued.'}

LAB & DIAGNOSTIC REQUESTS:
${activeToken.labRequests?.map(l => `- [ ] ${l}`).join('\n') || 'No lab requests.'}

------------------------------------------------------------
RECOMMENDED REVISIT:
Follow-Up Date: ${activeToken.followUpDate || 'As needed'}
Follow-Up Instructions: ${activeToken.followUpNotes || 'None'}

Thank you for trusting Metropolis. Get well soon!
============================================================
    `;

    const blob = new Blob([fileContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Metropolis_Prescription_${activeToken.tokenNumber}_${activeToken.patientName.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div id="patient-portal" className="p-4 md:p-6 max-w-4xl mx-auto min-h-[80vh] flex flex-col justify-start">
      
      {/* HEADER SECTION */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-5 mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-teal-500 text-white p-2.5 rounded-xl">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold tracking-tight text-slate-800 dark:text-slate-100">
              Patient Outpatient Portal
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono tracking-wide">
              METROPOLIS CLINICAL SECURITY & TRACKING SYSTEM
            </p>
          </div>
        </div>
        
        {activeToken && (
          <button 
            onClick={handleLogout}
            className="text-xs font-mono border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 px-4 py-2 rounded-xl transition font-semibold"
          >
            Exit Portal
          </button>
        )}
      </div>

      {/* LOGIN PORTAL (IF NO TOKEN ACTIVE) */}
      {!activeToken ? (
        <div className="max-w-md mx-auto w-full my-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl transition-all">
          <div className="text-center mb-6">
            <HeartPulse className="h-12 w-12 text-teal-500 mx-auto animate-pulse mb-3" />
            <h2 className="text-xl font-display font-bold text-slate-800 dark:text-slate-100">Access Your Live Token</h2>
            <p className="text-xs text-slate-500 mt-1.5 max-w-sm mx-auto">
              Track your queuing status, estimate your exact wait time, and download prescriptions securely.
            </p>
          </div>

          {/* Login Tabs */}
          <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl mb-6">
            <button
              onClick={() => { setLoginMethod('mobile'); setInputValue(''); setErrorMsg(''); }}
              className={`py-2 text-xs font-semibold rounded-lg transition-all ${loginMethod === 'mobile' ? 'bg-white dark:bg-slate-900 shadow text-teal-600 dark:text-teal-400' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <span className="flex items-center justify-center gap-1.5">
                <Phone className="h-3.5 w-3.5" />
                Mobile
              </span>
            </button>
            <button
              onClick={() => { setLoginMethod('token'); setInputValue(''); setErrorMsg(''); }}
              className={`py-2 text-xs font-semibold rounded-lg transition-all ${loginMethod === 'token' ? 'bg-white dark:bg-slate-900 shadow text-teal-600 dark:text-teal-400' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <span className="flex items-center justify-center gap-1.5">
                <Ticket className="h-3.5 w-3.5" />
                Token ID
              </span>
            </button>
            <button
              onClick={() => { setLoginMethod('qr'); setErrorMsg(''); }}
              className={`py-2 text-xs font-semibold rounded-lg transition-all ${loginMethod === 'qr' ? 'bg-white dark:bg-slate-900 shadow text-teal-600 dark:text-teal-400' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <span className="flex items-center justify-center gap-1.5">
                <QrCode className="h-3.5 w-3.5" />
                Scan QR
              </span>
            </button>
          </div>

          {/* FORM BODY */}
          {loginMethod !== 'qr' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-bold uppercase text-slate-500 dark:text-slate-400 mb-1.5">
                  {loginMethod === 'mobile' ? 'Enter Registered Mobile' : 'Enter Token Code'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    {loginMethod === 'mobile' ? <Phone className="h-4 w-4" /> : <Ticket className="h-4 w-4" />}
                  </div>
                  <input
                    type="text"
                    required
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder={loginMethod === 'mobile' ? 'e.g. 9876543210' : 'e.g. H-103'}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none dark:text-white"
                  />
                </div>
              </div>

              {errorMsg && (
                <div className="p-3 bg-red-50 dark:bg-red-950/10 border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-teal-500 hover:bg-teal-600 text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-teal-500/10 cursor-pointer"
              >
                <span>Access Clinical Dashboard</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          ) : (
            <div className="text-center space-y-4 py-4">
              <p className="text-xs text-slate-500">
                Aim your phone camera at the QR code printed on your clinic token slip or waiting room board.
              </p>
              
              <div className="relative mx-auto w-44 h-44 border-4 border-dashed border-teal-500/40 rounded-2xl flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950/40 overflow-hidden">
                {scanning ? (
                  <>
                    {/* Glowing animated scanline */}
                    <div className="absolute top-0 inset-x-0 h-1 bg-teal-400 qr-scan-line shadow-lg shadow-teal-400" />
                    <Activity className="h-10 w-10 text-teal-400 animate-pulse" />
                    <span className="text-[10px] font-mono font-semibold text-teal-400 mt-2 animate-pulse">
                      SCANNING CORE...
                    </span>
                  </>
                ) : (
                  <button 
                    onClick={triggerQrScan}
                    className="flex flex-col items-center justify-center gap-2 group cursor-pointer"
                  >
                    <QrCode className="h-12 w-12 text-slate-400 group-hover:text-teal-500 transition" />
                    <span className="text-[10px] font-mono font-bold text-slate-500 group-hover:text-teal-500 transition">
                      START CAMERA
                    </span>
                  </button>
                )}
              </div>

              {errorMsg && (
                <p className="text-xs text-red-500 mt-2 font-medium">{errorMsg}</p>
              )}
              
              <button 
                onClick={() => setLoginMethod('mobile')}
                className="text-xs font-semibold text-teal-500 hover:underline"
              >
                Cancel & Type Manually
              </button>
            </div>
          )}

          {/* Quick tips */}
          <div className="mt-6 border-t border-slate-100 dark:border-slate-800/80 pt-4 text-[11px] text-slate-400 flex items-center gap-2 justify-center">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <span>End-to-end encrypted clinical privacy standards.</span>
          </div>
        </div>
      ) : (
        /* ACTIVE PATIENT LIVE TRACKER PANEL */
        <div className="space-y-6">
          
          {/* TOP PATIENT BAR */}
          <div className="bg-gradient-to-r from-teal-500 to-blue-600 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-44 h-44 bg-white/5 rounded-full blur-2xl pointer-events-none" />
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-mono tracking-widest bg-white/10 text-teal-100 px-3 py-1 rounded-full uppercase font-bold">
                  Active Consultation Token
                </span>
                <h2 className="text-3xl font-display font-extrabold tracking-tight mt-2">
                  {patientData?.name}
                </h2>
                <div className="flex items-center gap-4 mt-2 text-sm text-teal-100">
                  <span>Age: <strong>{patientData?.age}</strong></span>
                  <span>•</span>
                  <span>Gender: <strong>{patientData?.gender}</strong></span>
                  <span>•</span>
                  <span>Blood Group: <strong className="bg-red-500 px-1.5 py-0.5 rounded text-white text-xs">{patientData?.bloodGroup}</strong></span>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 p-4 text-center md:text-right md:min-w-[150px] flex md:flex-col justify-between md:justify-center items-center md:items-end gap-2">
                <div>
                  <p className="text-xs text-teal-100 font-mono">YOUR TOKEN</p>
                  <p className="text-3xl font-display font-extrabold tracking-tight">{activeToken.tokenNumber}</p>
                </div>
                <span className="text-[10px] bg-emerald-500 text-white px-2.5 py-0.5 rounded-full font-bold">
                  {activeToken.type.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          {/* DYNAMIC PROGRESS TIMELINE TRACKER */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-md">
            <h3 className="text-sm font-mono text-slate-400 uppercase tracking-widest mb-6">Live Queue Milestone Tracker</h3>
            
            {activeToken.status === 'Cancelled' || activeToken.status === 'Absent' ? (
              <div className="p-4 bg-red-50 dark:bg-red-950/10 border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 rounded-2xl flex items-center gap-3">
                <AlertCircle className="h-6 w-6" />
                <div>
                  <p className="font-bold">Token Terminated ({activeToken.status})</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Your token was marked as {activeToken.status.toLowerCase()} by the attending staff. Please consult receptionist to reactivate.
                  </p>
                </div>
              </div>
            ) : (
              <div className="relative">
                {/* Connecting Track Line */}
                <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-100 dark:bg-slate-800 -translate-y-1/2 hidden md:block" />
                {/* Active connection colored */}
                <div 
                  className="absolute top-1/2 left-0 h-1 bg-gradient-to-r from-teal-400 to-blue-500 -translate-y-1/2 hidden md:block transition-all duration-1000"
                  style={{ width: `${(currentStageIndex / (stages.length - 1)) * 100}%` }}
                />

                {/* Milestones Container */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 relative z-10">
                  {stages.map((stg, index) => {
                    const isDone = index < currentStageIndex;
                    const isActive = index === currentStageIndex;
                    const isFuture = index > currentStageIndex;
                    
                    return (
                      <div key={stg.label} className="text-center flex flex-col items-center">
                        <div 
                          className={`h-10 w-10 rounded-full flex items-center justify-center transition-all duration-500 border-2 ${
                            isDone 
                              ? 'bg-teal-500 border-teal-500 text-white shadow-md shadow-teal-500/20' 
                              : isActive 
                                ? 'bg-blue-600 border-blue-600 text-white shadow-lg animate-pulse' 
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400'
                          }`}
                        >
                          {isDone ? (
                            <CheckCircle2 className="h-5 w-5" />
                          ) : (
                            <span className="font-mono text-xs font-bold">{index + 1}</span>
                          )}
                        </div>
                        <p className={`text-xs font-bold mt-2 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-300'}`}>
                          {stg.label}
                        </p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 hidden md:block">
                          {stg.desc}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* DETAILED QUEUE DIAGNOSTIC AND ESTIMATED WAITING CARDS */}
          {activeToken.status !== 'Completed' && activeToken.status !== 'Cancelled' && activeToken.status !== 'Absent' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Tokens Ahead Card */}
              <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 text-center flex flex-col justify-between">
                <p className="text-xs font-mono text-slate-400 uppercase tracking-widest">TOKENS AHEAD OF YOU</p>
                <div className="my-3">
                  <p className="text-4xl font-display font-extrabold text-slate-800 dark:text-slate-100">
                    {tokensAhead}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1">Patients actively waiting ahead</p>
                </div>
                <div className="text-xs bg-slate-200/50 dark:bg-slate-800/50 py-1 px-3 rounded-full text-slate-600 dark:text-slate-300 inline-block mx-auto">
                  Desk: {activeToken.roomNumber}
                </div>
              </div>

              {/* Dynamic Estimated Wait Card */}
              <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 text-center flex flex-col justify-between relative overflow-hidden">
                <p className="text-xs font-mono text-slate-400 uppercase tracking-widest">EST. WAITING TIME</p>
                <div className="my-3">
                  <p className="text-4xl font-display font-extrabold text-teal-600 dark:text-teal-400">
                    ~{waitTime} <span className="text-xs font-medium text-slate-400">MINS</span>
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1">AI predictive flow calculation</p>
                </div>
                <div className="text-[10px] text-slate-400 italic">
                  *Varies with emergency overrides
                </div>
              </div>

              {/* Attending Doctor */}
              <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 text-center flex flex-col justify-between">
                <p className="text-xs font-mono text-slate-400 uppercase tracking-widest">ATTENDING PHYSICIAN</p>
                <div className="my-3 text-center">
                  <p className="text-md font-semibold text-slate-800 dark:text-slate-200">{activeToken.doctorName}</p>
                  <p className="text-xs text-blue-500 font-medium font-mono mt-0.5">{activeToken.department.toUpperCase()}</p>
                </div>
                <div className="bg-teal-500/10 border border-teal-500/20 text-teal-600 dark:text-teal-400 text-[10px] font-semibold py-1 px-3 rounded-full inline-block mx-auto">
                  Serving: {currentTokenServing}
                </div>
              </div>

            </div>
          )}

          {/* HEALTH PRIORITY EMERGENCY DECOR MESSAGE */}
          {state.tokens.some(t => t.isEmergency && (t.status === 'Waiting' || t.status === 'Called')) && (
            <div className="bg-red-50 dark:bg-red-950/10 border-l-4 border-red-500 p-4 rounded-r-2xl flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5 animate-pulse" />
              <div>
                <p className="text-xs font-bold text-red-700 dark:text-red-400">Queue updated due to emergency medical priority</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  The clinic has prioritized critical cardiac or respiratory emergencies. Your position has adjusted automatically. We appreciate your empathy and support!
                </p>
              </div>
            </div>
          )}

          {/* BOTTOM SECTION: MEDICAL CARD PREVIEW (ENFORCING THE REQUIRED SECURITY RULE!) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
              <FileText className="h-5 w-5 text-slate-400" />
              <h4 className="text-sm font-mono text-slate-400 uppercase tracking-widest">Security-Locked Medical Records</h4>
            </div>

            {activeToken.status !== 'Completed' ? (
              /* SECURED LOCK STATE */
              <div className="py-8 text-center flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                <div className="bg-slate-200 dark:bg-slate-800 text-slate-500 p-4 rounded-full mb-3">
                  <EyeOff className="h-8 w-8 text-slate-400" />
                </div>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Records Locked During Consultation</p>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto leading-relaxed px-4">
                  "Consultation is currently in progress. Reports and prescriptions will be available after the doctor completes the consultation."
                </p>
                <div className="mt-4 flex items-center gap-1.5 text-[10px] font-mono text-teal-600 dark:text-teal-400 bg-teal-500/10 px-3 py-1 rounded-full border border-teal-500/20">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>HIPAA & EHR Privacy Protected</span>
                </div>
              </div>
            ) : (
              /* COMPLETED - REVEAL CLINICAL DATA & PRINT ACTIONS */
              <div className="space-y-6 animate-fade-in">
                
                {/* Diagnosis Summary Card */}
                <div className="bg-blue-50/40 dark:bg-blue-950/10 border border-blue-100 dark:border-blue-900/30 rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">PROVISIONAL DIAGNOSIS</span>
                    <span className="text-[10px] font-mono text-slate-400">RECORDS RELEASED</span>
                  </div>
                  <h5 className="text-md font-semibold text-slate-800 dark:text-slate-200">
                    {activeToken.diagnosis || "No core diagnosis recorded."}
                  </h5>
                  {activeToken.symptoms && activeToken.symptoms.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {activeToken.symptoms.map(s => (
                        <span key={s} className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] px-2 py-0.5 rounded">
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Prescription List */}
                <div>
                  <h5 className="text-xs font-mono font-bold text-slate-500 mb-2.5 uppercase">Prescribed Outpatient Treatment</h5>
                  <div className="border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden shadow-inner">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 border-b border-slate-100 dark:border-slate-800">
                          <th className="p-3">Medicine Name</th>
                          <th className="p-3">Dosage Schedule</th>
                          <th className="p-3">Duration</th>
                          <th className="p-3">Food Intake</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60">
                        {activeToken.prescription && activeToken.prescription.length > 0 ? (
                          activeToken.prescription.map((rx) => (
                            <tr key={rx.id} className="dark:text-slate-300">
                              <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">{rx.medicineName}</td>
                              <td className="p-3 font-mono">{rx.dosage}</td>
                              <td className="p-3">{rx.duration}</td>
                              <td className="p-3">
                                <span className="bg-teal-500/10 text-teal-600 dark:text-teal-400 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                                  {rx.foodInstructions}
                                </span>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4} className="p-3 text-center text-slate-400 italic">No medical drugs prescribed.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Lab diagnostic requests */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border border-slate-100 dark:border-slate-800 rounded-2xl p-4">
                    <h5 className="text-xs font-mono font-bold text-slate-500 mb-2 uppercase">Lab & Diagnostics Ordered</h5>
                    {activeToken.labRequests && activeToken.labRequests.length > 0 ? (
                      <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                        {activeToken.labRequests.map(lab => (
                          <li key={lab} className="flex items-center gap-2">
                            <span className="h-1.5 w-1.5 bg-blue-500 rounded-full" />
                            <span>{lab}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-slate-400 italic">No diagnostic labs ordered.</p>
                    )}
                  </div>

                  {/* Follow-up card */}
                  <div className="border border-slate-100 dark:border-slate-800 rounded-2xl p-4 bg-emerald-500/[0.01]">
                    <h5 className="text-xs font-mono font-bold text-slate-500 mb-2 uppercase">Scheduled Follow-Up</h5>
                    {activeToken.followUpDate ? (
                      <div>
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          Date: <strong className="text-teal-600 dark:text-teal-400 font-mono">{activeToken.followUpDate}</strong>
                        </p>
                        <p className="text-xs text-slate-500 mt-1">{activeToken.followUpNotes || "General physical evaluation check."}</p>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">Revisit only as needed.</p>
                    )}
                  </div>
                </div>

                {/* ACTION DIRECTIVES: DOWNLOAD PDF */}
                <div className="flex flex-wrap gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={triggerDownloadPrescription}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition flex items-center gap-1.5 shadow-lg shadow-blue-600/10 cursor-pointer"
                  >
                    <Download className="h-4 w-4" />
                    Download Medical Slip (PDF)
                  </button>
                  
                  {activeToken.reports && activeToken.reports.map(rep => (
                    <button
                      key={rep.id}
                      onClick={() => alert(`Downloading lab report attachment: ${rep.name}`)}
                      className="border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs px-4 py-2.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <FileText className="h-4 w-4 text-slate-400" />
                      Download {rep.type.toUpperCase()}: {rep.name.substring(0, 16)}...
                    </button>
                  ))}
                </div>

              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
