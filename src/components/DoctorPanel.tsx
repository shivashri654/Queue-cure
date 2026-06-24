/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { QueueState, Token, Doctor, PrescriptionItem, ReportFile } from '../types';
import { getSortedDoctorQueue } from '../data';
import { 
  User, CheckCircle2, Clock, MapPin, Eye, FileText, Upload, 
  Settings, Play, Pause, Square, Plus, Trash2, ShieldAlert,
  Search, HeartPulse, Sparkles, HelpCircle, ArrowRight, UserCheck, Check,
  AlertTriangle, Stethoscope, ChevronRight, AlertCircle, FilePlus
} from 'lucide-react';

export default function DoctorPanel({ state, onUpdateState }: { state: QueueState, onUpdateState: (s: QueueState) => void }) {
  const [selectedDocId, setSelectedDocId] = useState(state.activeDoctorId || 'doc-1');
  
  // Local state for Active Consultation EHR form
  const [activeToken, setActiveToken] = useState<Token | null>(null);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Consultation clinical form states
  const [symptomInput, setSymptomInput] = useState('');
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [diagnosis, setDiagnosis] = useState('');
  const [advice, setAdvice] = useState('');
  
  // Prescription interactive rows
  const [medicines, setMedicines] = useState<Omit<PrescriptionItem, 'id'>[]>([
    { medicineName: '', dosage: '1-0-1', duration: '5 days', foodInstructions: 'After Food' }
  ]);
  
  // Lab requests checkboxes
  const [labs, setLabs] = useState({
    bloodTest: false,
    scan: false,
    xray: false,
    mri: false,
    other: false
  });
  
  // Follow up
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpNotes, setFollowUpNotes] = useState('');

  // Sync selected doctor back to parent context
  useEffect(() => {
    onUpdateState({
      ...state,
      activeDoctorId: selectedDocId
    });
  }, [selectedDocId]);

  const doctor = state.doctors.find(d => d.id === selectedDocId) || state.doctors[0];

  // Fetch the sorted active queue for this doctor
  const activeQueue = getSortedDoctorQueue(doctor.id, state.tokens, state.settings.autoReorderEmergency);
  const waitingPatients = activeQueue.filter(t => t.status === 'Waiting');
  const calledPatients = activeQueue.filter(t => t.status === 'Called');
  
  // Current patient being consulted
  const currentConsultingPatient = activeQueue.find(t => t.status === 'In Consultation');
  const nextPatientInQueue = waitingPatients[0] || null;

  // Track timer ticking
  useEffect(() => {
    if (timerActive) {
      timerRef.current = setInterval(() => {
        setTimerSeconds(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerActive]);

  // Sync state if there is an active consultation already running in parent (realtime update)
  useEffect(() => {
    if (currentConsultingPatient && (!activeToken || activeToken.id !== currentConsultingPatient.id)) {
      setActiveToken(currentConsultingPatient);
      // Initialize form if a token is active
      setSymptoms(currentConsultingPatient.symptoms || []);
      setDiagnosis(currentConsultingPatient.diagnosis || '');
      setAdvice(currentConsultingPatient.advice || '');
      setFollowUpDate(currentConsultingPatient.followUpDate || '');
      setFollowUpNotes(currentConsultingPatient.followUpNotes || '');
      
      if (currentConsultingPatient.prescription && currentConsultingPatient.prescription.length > 0) {
        setMedicines(currentConsultingPatient.prescription);
      } else {
        setMedicines([{ medicineName: '', dosage: '1-0-1', duration: '5 days', foodInstructions: 'After Food' }]);
      }
      
      const pLabs = currentConsultingPatient.labRequests || [];
      setLabs({
        bloodTest: pLabs.includes('Blood Test'),
        scan: pLabs.includes('Scan'),
        xray: pLabs.includes('X-Ray'),
        mri: pLabs.includes('MRI'),
        other: pLabs.includes('Other Diagnostics')
      });
      
      setTimerSeconds(0);
      setTimerActive(true);
    } else if (!currentConsultingPatient) {
      setActiveToken(null);
      setTimerActive(false);
      setTimerSeconds(0);
    }
  }, [currentConsultingPatient]);

  const handleStatusChange = (status: Doctor['status']) => {
    const updatedDoctors = state.doctors.map(d => {
      if (d.id === doctor.id) {
        return { ...d, status };
      }
      return d;
    });

    const log: Omit<Token, 'id'> = {
      // Simulate audit logs
    } as any;

    const newLogEntry = {
      id: 'log-' + Date.now(),
      timestamp: new Date().toISOString(),
      role: 'Doctor' as const,
      user: doctor.name,
      action: 'Status Updated',
      details: `${doctor.name} set status to ${status}`
    };

    onUpdateState({
      ...state,
      doctors: updatedDoctors,
      logs: [newLogEntry, ...state.logs]
    });
  };

  const handleCallPatient = (token: Token) => {
    const updatedTokens = state.tokens.map(t => {
      if (t.id === token.id) {
        return { 
          ...t, 
          status: 'Called' as const, 
          calledAt: new Date().toISOString() 
        };
      }
      return t;
    });

    const newLogEntry = {
      id: 'log-' + Date.now(),
      timestamp: new Date().toISOString(),
      role: 'Doctor' as const,
      user: doctor.name,
      action: 'Patient Called',
      details: `${doctor.name} called Token ${token.tokenNumber} (${token.patientName}) to ${doctor.roomNumber}`
    };

    onUpdateState({
      ...state,
      tokens: updatedTokens,
      logs: [newLogEntry, ...state.logs]
    });
  };

  const handleStartConsultation = (token: Token) => {
    const updatedTokens = state.tokens.map(t => {
      if (t.id === token.id) {
        return { 
          ...t, 
          status: 'In Consultation' as const, 
          startedAt: new Date().toISOString() 
        };
      }
      // Put any other "In Consultation" tokens to "Waiting" to avoid double consulting
      if (t.doctorId === doctor.id && t.status === 'In Consultation') {
        return { ...t, status: 'Waiting' as const };
      }
      return t;
    });

    const newLogEntry = {
      id: 'log-' + Date.now(),
      timestamp: new Date().toISOString(),
      role: 'Doctor' as const,
      user: doctor.name,
      action: 'Consultation Started',
      details: `Consultation started for ${token.patientName} (${token.tokenNumber})`
    };

    onUpdateState({
      ...state,
      tokens: updatedTokens,
      logs: [newLogEntry, ...state.logs]
    });

    // Local state setups
    setTimerSeconds(0);
    setTimerActive(true);
    setSymptoms([]);
    setDiagnosis('');
    setAdvice('');
    setMedicines([{ medicineName: '', dosage: '1-0-1', duration: '5 days', foodInstructions: 'After Food' }]);
    setLabs({ bloodTest: false, scan: false, xray: false, mri: false, other: false });
    setFollowUpDate('');
    setFollowUpNotes('');
  };

  const handlePauseTimer = () => {
    setTimerActive(false);
  };

  const handleResumeTimer = () => {
    setTimerActive(true);
  };

  // Medicine management
  const addMedicineRow = () => {
    setMedicines(prev => [...prev, { medicineName: '', dosage: '1-0-1', duration: '5 days', foodInstructions: 'After Food' }]);
  };

  const removeMedicineRow = (index: number) => {
    setMedicines(prev => prev.filter((_, idx) => idx !== index));
  };

  const updateMedicine = (index: number, field: keyof Omit<PrescriptionItem, 'id'>, value: string) => {
    setMedicines(prev => prev.map((med, idx) => {
      if (idx === index) {
        return { ...med, [field]: value };
      }
      return med;
    }));
  };

  // Symptom tags
  const addSymptomTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (symptomInput.trim() && !symptoms.includes(symptomInput.trim())) {
      setSymptoms(prev => [...prev, symptomInput.trim()]);
      setSymptomInput('');
    }
  };

  const removeSymptomTag = (tag: string) => {
    setSymptoms(prev => prev.filter(t => t !== tag));
  };

  // Simulate prescription file attach
  const handleMockReportUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'lab' | 'scan') => {
    if (!activeToken || !e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    const newReport: ReportFile = {
      id: 'rep-' + Date.now(),
      name: file.name,
      type,
      date: new Date().toISOString().split('T')[0],
      url: 'data:application/pdf;base64,JVBER...'
    };

    // Append report directly to activeToken state
    const updatedTokens = state.tokens.map(t => {
      if (t.id === activeToken.id) {
        const existingReports = t.reports || [];
        return {
          ...t,
          reports: [...existingReports, newReport]
        };
      }
      return t;
    });

    onUpdateState({
      ...state,
      tokens: updatedTokens
    });

    alert(`Successfully uploaded and attached diagnostic report "${file.name}" to outpatient record!`);
  };

  const handleEndConsultation = () => {
    if (!activeToken) return;

    // Collate selected labs
    const selectedLabs: string[] = [];
    if (labs.bloodTest) selectedLabs.push('Blood Test');
    if (labs.scan) selectedLabs.push('Scan');
    if (labs.xray) selectedLabs.push('X-Ray');
    if (labs.mri) selectedLabs.push('MRI');
    if (labs.other) selectedLabs.push('Other Diagnostics');

    // Build prescription list
    const processedMedicines: PrescriptionItem[] = medicines
      .filter(med => med.medicineName.trim() !== '')
      .map((med, idx) => ({
        id: `rx-${Date.now()}-${idx}`,
        ...med
      }));

    const updatedTokens = state.tokens.map(t => {
      if (t.id === activeToken.id) {
        return {
          ...t,
          status: 'Completed' as const,
          completedAt: new Date().toISOString(),
          symptoms,
          diagnosis: diagnosis || 'General physical checkup complete. Vital monitors normal.',
          advice,
          prescription: processedMedicines,
          labRequests: selectedLabs,
          followUpDate,
          followUpNotes
        };
      }
      return t;
    });

    const newLogEntry = {
      id: 'log-' + Date.now(),
      timestamp: new Date().toISOString(),
      role: 'Doctor' as const,
      user: doctor.name,
      action: 'Consultation Completed',
      details: `Completed prescription and diagnostic logs for ${activeToken.patientName} (${activeToken.tokenNumber})`
    };

    onUpdateState({
      ...state,
      tokens: updatedTokens,
      logs: [newLogEntry, ...state.logs]
    });

    // Reset local
    setActiveToken(null);
    setTimerActive(false);
    setTimerSeconds(0);
    alert('Consultation completed successfully! Digital prescription is uploaded to the Patient Portal in real-time.');
  };

  // Skip, cancel patient
  const handleCancelPatient = (token: Token) => {
    const updatedTokens = state.tokens.map(t => {
      if (t.id === token.id) {
        return { ...t, status: 'Cancelled' as const };
      }
      return t;
    });
    
    const newLog = {
      id: 'log-' + Date.now(),
      timestamp: new Date().toISOString(),
      role: 'Doctor' as const,
      user: doctor.name,
      action: 'Token Cancelled',
      details: `Doctor cancelled Token ${token.tokenNumber}`
    };

    onUpdateState({ ...state, tokens: updatedTokens, logs: [newLog, ...state.logs] });
  };

  const handleSkipPatient = (token: Token) => {
    const updatedTokens = state.tokens.map(t => {
      if (t.id === token.id) {
        return { ...t, status: 'Absent' as const };
      }
      return t;
    });

    const newLog = {
      id: 'log-' + Date.now(),
      timestamp: new Date().toISOString(),
      role: 'Doctor' as const,
      user: doctor.name,
      action: 'Patient Skipped / Absent',
      details: `Patient ${token.patientName} (Token ${token.tokenNumber}) marked as Absent`
    };

    onUpdateState({ ...state, tokens: updatedTokens, logs: [newLog, ...state.logs] });
  };

  // Format timer
  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Compare timer with average (10m = 600s)
  const isTimerOverAverage = timerSeconds > (state.settings.averageConsultationTime * 60);

  // Active patient data card lookup
  const activePatientProfile = activeToken 
    ? state.patients.find(p => p.id === activeToken.patientId) 
    : null;

  return (
    <div id="doctor-console" className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-4 md:p-6">
      
      {/* LEFT SIDEBAR: Doctor Metadata & Patient Queue (4 cols) */}
      <section className="lg:col-span-4 space-y-6">
        
        {/* DOCTOR SELECTION CARD */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <img 
              src={doctor.avatar} 
              alt={doctor.name}
              className="h-14 w-14 rounded-2xl object-cover ring-2 ring-slate-100 dark:ring-slate-800"
            />
            <div className="flex-grow">
              <span className="text-[10px] font-mono font-bold text-blue-500 uppercase">Consulting Office</span>
              <h2 className="text-lg font-display font-bold text-slate-800 dark:text-slate-100 truncate">{doctor.name}</h2>
              <p className="text-xs text-slate-500 font-medium">{doctor.department} • {doctor.roomNumber}</p>
            </div>
          </div>

          {/* Select Practicing Room Dropdown */}
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/80">
            <label className="block text-[10px] font-mono text-slate-400 mb-1.5 uppercase">Switch Consulting Cabin</label>
            <select
              value={selectedDocId}
              onChange={(e) => {
                setSelectedDocId(e.target.value);
                setActiveToken(null);
              }}
              className="w-full bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-xs rounded-xl px-3 py-2.5 focus:ring-1 focus:ring-blue-500 focus:outline-none dark:text-slate-300"
            >
              {state.doctors.map(d => (
                <option key={d.id} value={d.id}>{d.name} ({d.department})</option>
              ))}
            </select>
          </div>

          {/* DOCTOR AVAILABILITY PICKER */}
          <div className="mt-4 grid grid-cols-2 gap-2">
            <div>
              <span className="block text-[10px] font-mono text-slate-400 mb-1 uppercase">Desk Status</span>
              <select
                value={doctor.status}
                onChange={(e) => handleStatusChange(e.target.value as Doctor['status'])}
                className="w-full bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-xs rounded-xl px-2.5 py-2 font-bold focus:outline-none dark:text-slate-300"
              >
                <option value="Available">🟢 Available</option>
                <option value="Busy">🔴 Busy</option>
                <option value="On Break">🟡 Break</option>
                <option value="Offline">⚫ Offline</option>
              </select>
            </div>
            
            <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800 rounded-xl p-2 text-center flex flex-col justify-center">
              <span className="text-[10px] font-mono text-slate-400">TODAY'S DONE</span>
              <p className="text-lg font-display font-extrabold text-blue-600 dark:text-blue-400 mt-0.5">
                {state.tokens.filter(t => t.doctorId === doctor.id && t.status === 'Completed').length}
              </p>
            </div>
          </div>
        </div>

        {/* ACTIVE PATIENTS QUEUE CARD */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm flex flex-col min-h-[300px]">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 bg-blue-500 rounded-full" />
              <h3 className="text-xs font-mono text-slate-400 uppercase tracking-widest">Active Patients Queue</h3>
            </div>
            <span className="text-[10px] font-mono bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-bold px-2.5 py-0.5 rounded-full">
              {activeQueue.length} Active
            </span>
          </div>

          {activeQueue.length === 0 ? (
            <div className="flex-grow flex flex-col items-center justify-center text-slate-400 text-center p-8">
              <UserCheck className="h-10 w-10 text-slate-300 mb-2" />
              <p className="text-xs font-semibold">Queue list is clear</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Receptionist will check-in walk-ins soon.</p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
              
              {/* NOW CONSULTING PREVIEW IN QUEUE */}
              {activeQueue.map((t) => {
                const isConsulting = t.status === 'In Consultation';
                const isCalled = t.status === 'Called';
                
                return (
                  <div 
                    key={t.id} 
                    className={`p-3 border rounded-xl flex items-center justify-between transition-all ${
                      isConsulting 
                        ? 'border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/10 shadow-lg shadow-emerald-500/5' 
                        : isCalled 
                          ? 'border-amber-500 bg-amber-50/20 dark:bg-amber-950/10'
                          : t.isEmergency
                            ? 'border-red-500/40 bg-red-500/[0.02]'
                            : 'border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/20'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`text-sm font-mono font-extrabold px-2 py-0.5 rounded border ${
                        t.isEmergency 
                          ? 'bg-red-500/10 border-red-500/30 text-red-500' 
                          : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-blue-500 dark:text-blue-400'
                      }`}>
                        {t.tokenNumber}
                      </div>
                      <div className="max-w-[120px]">
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">{t.patientName}</p>
                        <p className="text-[10px] text-slate-400 truncate flex items-center gap-1">
                          {t.isEmergency && <span className="h-1.5 w-1.5 bg-red-500 rounded-full animate-ping" />}
                          {t.isEmergency ? 'Critical Care' : t.type}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {isConsulting ? (
                        <span className="text-[9px] font-mono bg-emerald-500 text-white px-2 py-0.5 rounded uppercase font-extrabold">
                          ACTIVE
                        </span>
                      ) : isCalled ? (
                        <button
                          onClick={() => handleStartConsultation(t)}
                          className="bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-semibold px-2.5 py-1 rounded-lg transition shadow cursor-pointer"
                        >
                          Start
                        </button>
                      ) : (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleCallPatient(t)}
                            className="bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-semibold px-2.5 py-1 rounded-lg transition cursor-pointer"
                          >
                            Call
                          </button>
                          <button
                            onClick={() => handleSkipPatient(t)}
                            className="text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800 p-1 rounded-md transition"
                            title="Mark Absent"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                  </div>
                );
              })}

            </div>
          )}
        </div>

      </section>

      {/* RIGHT WORKSPACE: Consultation & EHR Pad (8 cols) */}
      <section className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm min-h-[500px]">
        
        {!activeToken ? (
          /* IDLE STATE: CHOOSE PATIENT TO START */
          <div className="min-h-[450px] flex flex-col items-center justify-center text-center p-8">
            <div className="bg-slate-50 dark:bg-slate-950 p-6 rounded-full border border-dashed border-slate-200 dark:border-slate-800 mb-4 animate-pulse">
              <Stethoscope className="h-16 w-16 text-blue-400" />
            </div>
            
            <h3 className="text-xl font-display font-bold text-slate-800 dark:text-slate-200">Consultation Room Empty</h3>
            <p className="text-xs text-slate-400 max-w-sm mt-1">
              Ready to examine outpatients. Select any patient in the left queue roster and click **"Call"** or **"Start"** to initiate the electronic diagnostic flow.
            </p>

            {nextPatientInQueue && (
              <div className="mt-6 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-2xl p-4 max-w-sm flex items-center justify-between gap-4">
                <div className="text-left">
                  <span className="text-[10px] font-mono text-blue-600 dark:text-blue-400 font-bold">NEXT IN QUEUE</span>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{nextPatientInQueue.patientName} ({nextPatientInQueue.tokenNumber})</p>
                </div>
                <button
                  onClick={() => handleStartConsultation(nextPatientInQueue)}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-lg shadow-blue-600/10 transition cursor-pointer"
                >
                  Examine Now
                </button>
              </div>
            )}
          </div>
        ) : (
          /* ACTIVE CONSULTATION - THE EHR PAD WORKSPACE */
          <div className="space-y-6">
            
            {/* CONSULTATION ACTIVE TOP BAR */}
            <div className="bg-slate-950 rounded-2xl border border-slate-800 p-4 flex flex-col md:flex-row items-center justify-between gap-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
              
              <div className="flex items-center gap-3">
                <span className="text-2xl font-mono font-extrabold text-emerald-400 bg-emerald-950 border border-emerald-900 px-3.5 py-1.5 rounded-xl">
                  {activeToken.tokenNumber}
                </span>
                <div>
                  <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 border border-emerald-900 rounded font-bold uppercase tracking-wider">
                    Consulting Active
                  </span>
                  <h4 className="text-md font-bold text-slate-100 mt-1">{activeToken.patientName}</h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Age: {activePatientProfile?.age} • Gender: {activePatientProfile?.gender} • Blood: {activePatientProfile?.bloodGroup}
                  </p>
                </div>
              </div>

              {/* LIVE TIMER AND CONTROLS */}
              <div className="flex items-center gap-4 bg-slate-900/80 border border-slate-800 rounded-xl px-4 py-2">
                <div className="flex items-center gap-2">
                  <Clock className={`h-4.5 w-4.5 ${timerActive ? 'text-emerald-400 animate-spin' : 'text-slate-500'}`} />
                  <span className={`font-mono text-lg font-bold ${isTimerOverAverage ? 'text-amber-500' : 'text-slate-100'}`}>
                    {formatTimer(timerSeconds)}
                  </span>
                </div>
                
                <div className="h-4 w-[1px] bg-slate-800" />

                <div className="flex items-center gap-1.5">
                  {timerActive ? (
                    <button 
                      onClick={handlePauseTimer}
                      className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition"
                      title="Pause Consultation Timer"
                    >
                      <Pause className="h-4 w-4" />
                    </button>
                  ) : (
                    <button 
                      onClick={handleResumeTimer}
                      className="p-1 text-emerald-400 hover:text-emerald-300 hover:bg-slate-800 rounded transition"
                      title="Resume Timer"
                    >
                      <Play className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {isTimerOverAverage && (
                  <span className="text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded px-1.5 py-0.5 animate-pulse font-mono font-bold">
                    LONG CONSULT
                  </span>
                )}
              </div>
            </div>

            {/* PATIENT BRIEF BIOGRAPHY AND EMERGENCIES NOTES */}
            {activeToken.isEmergency && (
              <div className="bg-red-500/5 border border-red-500/30 rounded-xl p-4 text-xs flex items-start gap-2 text-red-400">
                <AlertTriangle className="h-5 w-5 shrink-0 text-red-500 animate-pulse" />
                <div>
                  <p className="font-bold">CRITICAL PRIORITY ALERTS - HIGH VITAL SIGNS</p>
                  <p className="mt-0.5 text-slate-300">{activeToken.notes || activeToken.emergencyReason}</p>
                </div>
              </div>
            )}

            {/* MAIN CLINICAL INPUT PANEL (TAB SYSTEM FOR EASY VIEW) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* MEDICAL HISTORY / EXAM PAD */}
              <div className="space-y-4">
                <div>
                  <h5 className="text-xs font-mono font-bold text-slate-500 mb-1 uppercase">EHR Medical Summary</h5>
                  <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800 rounded-xl p-3 text-xs space-y-1.5 text-slate-600 dark:text-slate-400">
                    <p>• Allergies: <strong className="text-red-500 font-semibold">{activePatientProfile?.allergies || 'None'}</strong></p>
                    <p>• Medical History: <strong>{activePatientProfile?.medicalHistory || 'No previous critical histories logged.'}</strong></p>
                  </div>
                </div>

                {/* Symptom Tags Pad */}
                <div>
                  <label className="block text-xs font-mono font-bold text-slate-500 mb-1.5 uppercase">Clinical Symptoms</label>
                  <form onSubmit={addSymptomTag} className="flex gap-2">
                    <input
                      type="text"
                      value={symptomInput}
                      onChange={(e) => setSymptomInput(e.target.value)}
                      placeholder="e.g. Dry Cough, High Fever"
                      className="flex-grow bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 text-xs px-3 py-2 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 dark:text-slate-300"
                    />
                    <button
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3.5 py-2 rounded-xl font-bold cursor-pointer"
                    >
                      Add
                    </button>
                  </form>

                  {/* Symptom tags rendering */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {symptoms.length === 0 ? (
                      <span className="text-[10px] text-slate-400 italic">No symptoms added. Type above.</span>
                    ) : (
                      symptoms.map(tag => (
                        <span key={tag} className="inline-flex items-center gap-1 text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-lg">
                          <span>{tag}</span>
                          <button type="button" onClick={() => removeSymptomTag(tag)} className="text-slate-400 hover:text-red-500 font-bold shrink-0 ml-1">
                            ×
                          </button>
                        </span>
                      ))
                    )}
                  </div>
                </div>

                {/* Provisional Diagnosis */}
                <div>
                  <label className="block text-xs font-mono font-bold text-slate-500 mb-1.5 uppercase">Primary Provisional Diagnosis</label>
                  <textarea
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    placeholder="Describe clinical findings and provisional disease diagnosis..."
                    rows={2}
                    className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 text-xs px-3 py-2 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 dark:text-slate-300"
                  />
                </div>

                {/* Clinical Advice */}
                <div>
                  <label className="block text-xs font-mono font-bold text-slate-500 mb-1.5 uppercase">General Physical Advice</label>
                  <textarea
                    value={advice}
                    onChange={(e) => setAdvice(e.target.value)}
                    placeholder="Special advice (diet, hydration, physical rest)..."
                    rows={2}
                    className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 text-xs px-3 py-2 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 dark:text-slate-300"
                  />
                </div>

              </div>

              {/* PRESCRIPTION MANAGEMENT PAD (RIGHT SUBWING) */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-mono font-bold text-slate-500 uppercase">Interactive Rx Prescription</label>
                  <button
                    type="button"
                    onClick={addMedicineRow}
                    className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Add Medicine Row</span>
                  </button>
                </div>

                {/* Interactive Medicine Rows */}
                <div className="border border-slate-100 dark:border-slate-800 rounded-2xl p-3 bg-slate-50/50 dark:bg-slate-950/20 max-h-[180px] overflow-y-auto space-y-2">
                  {medicines.map((med, index) => (
                    <div key={index} className="grid grid-cols-12 gap-1.5 items-center border-b border-slate-100 dark:border-slate-800/60 pb-2 last:border-0 last:pb-0">
                      <div className="col-span-4">
                        <input
                          type="text"
                          required
                          value={med.medicineName}
                          onChange={(e) => updateMedicine(index, 'medicineName', e.target.value)}
                          placeholder="Tab. Paracetamol"
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[10px] px-2 py-1 rounded-lg focus:outline-none dark:text-slate-300"
                        />
                      </div>
                      <div className="col-span-3">
                        <input
                          type="text"
                          value={med.dosage}
                          onChange={(e) => updateMedicine(index, 'dosage', e.target.value)}
                          placeholder="Dosage (1-0-1)"
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[10px] px-2 py-1 rounded-lg focus:outline-none dark:text-slate-300"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="text"
                          value={med.duration}
                          onChange={(e) => updateMedicine(index, 'duration', e.target.value)}
                          placeholder="5 days"
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[10px] px-2 py-1 rounded-lg focus:outline-none dark:text-slate-300"
                        />
                      </div>
                      <div className="col-span-2">
                        <select
                          value={med.foodInstructions}
                          onChange={(e) => updateMedicine(index, 'foodInstructions', e.target.value as any)}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[9px] px-1.5 py-1 rounded-lg focus:outline-none dark:text-slate-300"
                        >
                          <option value="After Food">After Food</option>
                          <option value="Before Food">Before Food</option>
                          <option value="With Food">With Food</option>
                          <option value="Anytime">Anytime</option>
                        </select>
                      </div>
                      <div className="col-span-1 text-center">
                        <button
                          type="button"
                          onClick={() => removeMedicineRow(index)}
                          className="text-slate-400 hover:text-red-500 p-0.5 rounded transition"
                          title="Remove Row"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* DIAGNOSTIC LABS AND SCAN REQUEST CHIPS */}
                <div>
                  <label className="block text-xs font-mono font-bold text-slate-500 mb-2 uppercase">Request Diagnostics / Labs</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                    <label className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 p-2 rounded-xl cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={labs.bloodTest} 
                        onChange={(e) => setLabs({...labs, bloodTest: e.target.checked})}
                        className="text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="dark:text-slate-300">Blood Profile</span>
                    </label>
                    <label className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 p-2 rounded-xl cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={labs.scan} 
                        onChange={(e) => setLabs({...labs, scan: e.target.checked})}
                        className="text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="dark:text-slate-300">Scan (Ultrasound)</span>
                    </label>
                    <label className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 p-2 rounded-xl cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={labs.xray} 
                        onChange={(e) => setLabs({...labs, xray: e.target.checked})}
                        className="text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="dark:text-slate-300">X-Ray Ortho</span>
                    </label>
                    <label className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 p-2 rounded-xl cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={labs.mri} 
                        onChange={(e) => setLabs({...labs, mri: e.target.checked})}
                        className="text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="dark:text-slate-300">MRI Brain/Spine</span>
                    </label>
                    <label className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 p-2 rounded-xl col-span-2 sm:col-span-1 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={labs.other} 
                        onChange={(e) => setLabs({...labs, other: e.target.checked})}
                        className="text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="dark:text-slate-300">Other Diagnostic</span>
                    </label>
                  </div>
                </div>

                {/* MOCK REPORT & DOCUMENT UPLOAD */}
                <div className="border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-4 bg-slate-50/30 dark:bg-slate-950/30">
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                    <Upload className="h-3.5 w-3.5 text-slate-400" />
                    <span>Attach Prescription PDF / Diagnostic Reports</span>
                  </p>
                  <p className="text-[10px] text-slate-400 mb-3">
                    Directly attach patient lab scan files so they become visible on patient portal.
                  </p>
                  
                  <div className="flex gap-2">
                    <label className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-center text-xs font-bold hover:bg-slate-50 cursor-pointer text-slate-600 dark:text-slate-300 flex items-center justify-center gap-1">
                      <FilePlus className="h-3.5 w-3.5 text-blue-500" />
                      <span>Upload Labs</span>
                      <input 
                        type="file" 
                        className="hidden" 
                        accept=".pdf,.png,.jpg"
                        onChange={(e) => handleMockReportUpload(e, 'lab')} 
                      />
                    </label>
                    
                    <label className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-center text-xs font-bold hover:bg-slate-50 cursor-pointer text-slate-600 dark:text-slate-300 flex items-center justify-center gap-1">
                      <Upload className="h-3.5 w-3.5 text-blue-500" />
                      <span>Upload Scans</span>
                      <input 
                        type="file" 
                        className="hidden" 
                        accept=".pdf,.png,.jpg"
                        onChange={(e) => handleMockReportUpload(e, 'scan')} 
                      />
                    </label>
                  </div>
                </div>

              </div>
            </div>

            {/* FOLLOW UP CLINIC MANAGEMENT */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-100 dark:border-slate-800/80 pt-4">
              <div>
                <label className="block text-xs font-mono font-bold text-slate-500 mb-1 uppercase">Recommended Revisit Date</label>
                <input
                  type="date"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 text-xs px-3 py-2 rounded-xl focus:outline-none dark:text-slate-300"
                />
              </div>
              
              <div>
                <label className="block text-xs font-mono font-bold text-slate-500 mb-1 uppercase">Follow-Up Notes / Pre-requisites</label>
                <input
                  type="text"
                  value={followUpNotes}
                  onChange={(e) => setFollowUpNotes(e.target.value)}
                  placeholder="e.g. Review with Fasting Blood Sugar report"
                  className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 text-xs px-3 py-2 rounded-xl focus:outline-none dark:text-slate-300"
                />
              </div>
            </div>

            {/* ACTION FOOTER DIRECTIVES */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCancelPatient(activeToken)}
                  className="text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 px-4 py-2.5 rounded-xl transition cursor-pointer"
                >
                  Cancel Token
                </button>
                <button
                  type="button"
                  onClick={() => handleSkipPatient(activeToken)}
                  className="text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 px-4 py-2.5 rounded-xl transition cursor-pointer"
                >
                  Patient Absent
                </button>
              </div>

              <button
                type="button"
                onClick={handleEndConsultation}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-6 py-2.5 rounded-xl shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 transition flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="h-4 w-4" />
                <span>Complete Consultation & Sync Rx</span>
              </button>
            </div>

          </div>
        )}

      </section>

    </div>
  );
}
