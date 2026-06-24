/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Doctor, Patient, Token, AuditLog, SystemSettings, QueueState } from './types';

export const INITIAL_DOCTORS: Doctor[] = [
  {
    id: 'doc-1',
    name: 'Dr. Arvind Swamy',
    department: 'Cardiology',
    roomNumber: 'Room 101',
    status: 'Available',
    rating: 4.9,
    avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=256&h=256&q=80',
  },
  {
    id: 'doc-2',
    name: 'Dr. Priya Nair',
    department: 'Pediatrics',
    roomNumber: 'Room 102',
    status: 'Busy',
    rating: 4.8,
    avatar: 'https://images.unsplash.com/photo-1594824813573-246434e33963?auto=format&fit=crop&w=256&h=256&q=80',
  },
  {
    id: 'doc-3',
    name: 'Dr. Rajesh Kumar',
    department: 'Orthopedics',
    roomNumber: 'Room 103',
    status: 'On Break',
    rating: 4.7,
    avatar: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=256&h=256&q=80',
  },
  {
    id: 'doc-4',
    name: 'Dr. Meera Sen',
    department: 'General Medicine',
    roomNumber: 'Room 104',
    status: 'Available',
    rating: 4.6,
    avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=256&h=256&q=80',
  },
  {
    id: 'doc-5',
    name: 'Dr. Clara Hughes',
    department: 'Dermatology',
    roomNumber: 'Room 105',
    status: 'Offline',
    rating: 4.5,
    avatar: 'https://images.unsplash.com/photo-1527613426441-4da17471b66d?auto=format&fit=crop&w=256&h=256&q=80',
  }
];

export const INITIAL_PATIENTS: Patient[] = [
  {
    id: 'pat-1',
    name: 'Arjun Kumar',
    age: 42,
    gender: 'Male',
    mobile: '9876543210',
    address: '12, Gandhi Street, Chennai',
    bloodGroup: 'O+',
    medicalHistory: 'Hypertension under medication',
    allergies: 'Penicillin'
  },
  {
    id: 'pat-2',
    name: 'Shalini Roy',
    age: 28,
    gender: 'Female',
    mobile: '9123456789',
    address: 'Block 4B, Greenwood Apts, Chennai',
    bloodGroup: 'A+',
    medicalHistory: 'None',
    allergies: 'None'
  },
  {
    id: 'pat-3',
    name: 'Devendra Sharma',
    age: 61,
    gender: 'Male',
    mobile: '9444556677',
    address: '89, Nehru Nagar, Coimbatore',
    bloodGroup: 'B+',
    medicalHistory: 'Type 2 Diabetes, Coronary Artery Disease',
    allergies: 'Sulfa Drugs'
  },
  {
    id: 'pat-4',
    name: 'Lakshmi Priya',
    age: 5,
    gender: 'Female',
    mobile: '9333112244',
    address: '14, Temple Road, Madurai',
    bloodGroup: 'O-',
    medicalHistory: 'Asthma history',
    allergies: 'Dust, Pollen'
  },
  {
    id: 'pat-5',
    name: 'Amit Verma',
    age: 35,
    gender: 'Male',
    mobile: '9666224455',
    address: '56A, Lake View Enclave, Chennai',
    bloodGroup: 'AB+',
    medicalHistory: 'None',
    allergies: 'NSAIDs'
  },
  {
    id: 'pat-6',
    name: 'Rohan Deshmukh',
    age: 19,
    gender: 'Male',
    mobile: '9777112233',
    address: '22, Main Street, Coimbatore',
    bloodGroup: 'A-',
    medicalHistory: 'Migraine',
    allergies: 'None'
  }
];

export const INITIAL_TOKENS: Token[] = [
  {
    id: 'tok-1',
    tokenNumber: 'H-101',
    patientId: 'pat-1',
    patientName: 'Arjun Kumar',
    doctorId: 'doc-1',
    doctorName: 'Dr. Arvind Swamy',
    department: 'Cardiology',
    roomNumber: 'Room 101',
    status: 'Completed',
    type: 'Appointment',
    isEmergency: false,
    createdAt: '2026-06-23T08:30:00Z',
    calledAt: '2026-06-23T08:50:00Z',
    startedAt: '2026-06-23T08:52:00Z',
    completedAt: '2026-06-23T09:12:00Z',
    symptoms: ['Chest tightness', 'Mild breathlessness on climbing stairs'],
    diagnosis: 'Angina stable. Cardiovascular profile borderline.',
    advice: 'Perform treadmill test (TMT) next week. Take medication regularly.',
    prescription: [
      { id: 'rx-1', medicineName: 'Tab. Aspirin 75mg', dosage: '0-1-0', duration: '30 days', foodInstructions: 'After Food' },
      { id: 'rx-2', medicineName: 'Tab. Atorvastatin 10mg', dosage: '0-0-1', duration: '30 days', foodInstructions: 'After Food' }
    ],
    labRequests: ['Treadmill Test (TMT)', 'Lipid Profile Screen'],
    reports: [
      {
        id: 'rep-1',
        name: 'Electrocardiogram_ECG_Report.pdf',
        type: 'scan',
        date: '2026-06-23',
        url: 'data:application/pdf;base64,JVBER...'
      },
      {
        id: 'rep-2',
        name: 'Doctor_Prescription_Cardiology.pdf',
        type: 'prescription',
        date: '2026-06-23',
        url: 'data:application/pdf;base64,JVBER...'
      }
    ],
    followUpDate: '2026-06-30',
    followUpNotes: 'Review with TMT and blood reports',
    rating: 5,
    feedbackText: 'Very experienced doctor. Spoke kindly and explained the reports.'
  },
  {
    id: 'tok-2',
    tokenNumber: 'H-102',
    patientId: 'pat-2',
    patientName: 'Shalini Roy',
    doctorId: 'doc-2',
    doctorName: 'Dr. Priya Nair',
    department: 'Pediatrics',
    roomNumber: 'Room 102',
    status: 'In Consultation',
    type: 'Walk-in',
    isEmergency: false,
    createdAt: '2026-06-23T09:00:00Z',
    calledAt: '2026-06-23T09:20:00Z',
    startedAt: '2026-06-23T09:22:00Z'
  },
  {
    id: 'tok-3',
    tokenNumber: 'H-103',
    patientId: 'pat-3',
    patientName: 'Devendra Sharma',
    doctorId: 'doc-1',
    doctorName: 'Dr. Arvind Swamy',
    department: 'Cardiology',
    roomNumber: 'Room 101',
    status: 'Waiting',
    type: 'Walk-in',
    isEmergency: true,
    emergencyReason: 'Severe crushing chest pain radiating to left arm',
    notes: 'EMERGENCY - Critical vitals (BP 160/95, SpO2 93%). Bring cardiac stretcher immediately.',
    createdAt: '2026-06-23T09:15:00Z'
  },
  {
    id: 'tok-4',
    tokenNumber: 'H-104',
    patientId: 'pat-4',
    patientName: 'Lakshmi Priya',
    doctorId: 'doc-2',
    doctorName: 'Dr. Priya Nair',
    department: 'Pediatrics',
    roomNumber: 'Room 102',
    status: 'Waiting',
    type: 'Walk-in',
    isEmergency: false,
    notes: 'High fever (103 F), dry cough, lethargic.',
    createdAt: '2026-06-23T09:22:00Z'
  },
  {
    id: 'tok-5',
    tokenNumber: 'H-105',
    patientId: 'pat-5',
    patientName: 'Amit Verma',
    doctorId: 'doc-4',
    doctorName: 'Dr. Meera Sen',
    department: 'General Medicine',
    roomNumber: 'Room 104',
    status: 'Called',
    type: 'Appointment',
    isEmergency: false,
    createdAt: '2026-06-23T09:10:00Z',
    calledAt: '2026-06-23T09:24:00Z'
  },
  {
    id: 'tok-6',
    tokenNumber: 'H-106',
    patientId: 'pat-6',
    patientName: 'Rohan Deshmukh',
    doctorId: 'doc-4',
    doctorName: 'Dr. Meera Sen',
    department: 'General Medicine',
    roomNumber: 'Room 104',
    status: 'Waiting',
    type: 'Walk-in',
    isEmergency: false,
    createdAt: '2026-06-23T09:28:00Z'
  }
];

export const INITIAL_LOGS: AuditLog[] = [
  {
    id: 'log-1',
    timestamp: '2026-06-23T08:30:00Z',
    role: 'Receptionist',
    user: 'Sita Ram',
    action: 'Patient Registered',
    details: 'Arjun Kumar registered with Token H-101 for Dr. Arvind Swamy'
  },
  {
    id: 'log-2',
    timestamp: '2026-06-23T08:52:00Z',
    role: 'Doctor',
    user: 'Dr. Arvind Swamy',
    action: 'Consultation Started',
    details: 'Started consultation for Arjun Kumar (H-101)'
  },
  {
    id: 'log-3',
    timestamp: '2026-06-23T09:12:00Z',
    role: 'Doctor',
    user: 'Dr. Arvind Swamy',
    action: 'Consultation Completed',
    details: 'Completed consultation, written prescription & requested TMT for Arjun Kumar (H-101)'
  },
  {
    id: 'log-4',
    timestamp: '2026-06-23T09:15:00Z',
    role: 'Receptionist',
    user: 'Sita Ram',
    action: 'Emergency Declared',
    details: 'Devendra Sharma registered under CRITICAL EMERGENCY (H-103) for Dr. Arvind Swamy. Reason: Chest pain.'
  },
  {
    id: 'log-5',
    timestamp: '2026-06-23T09:24:00Z',
    role: 'Doctor',
    user: 'Dr. Meera Sen',
    action: 'Patient Called',
    details: 'Called Token H-105 (Amit Verma) to Room 104'
  }
];

export const DEFAULT_SETTINGS: SystemSettings = {
  averageConsultationTime: 10,
  enableSmsNotification: true,
  enableWhatsappNotification: true,
  voiceLanguage: 'en-US',
  voiceVolume: 0.9,
  voicePitch: 1.0,
  voiceRate: 0.9,
  autoReorderEmergency: true
};

const STORAGE_KEY = 'smart_hospital_queue_state_v1';
const SYNC_CHANNEL_NAME = 'smart_hospital_queue_sync_channel';

// Singleton BroadcastChannel for real-time synchronization
let syncChannel: BroadcastChannel | null = null;
if (typeof window !== 'undefined') {
  try {
    syncChannel = new BroadcastChannel(SYNC_CHANNEL_NAME);
  } catch (e) {
    console.warn('BroadcastChannel not supported in this environment.', e);
  }
}

export function getInitialState(): QueueState {
  if (typeof window === 'undefined') {
    return {
      doctors: INITIAL_DOCTORS,
      patients: INITIAL_PATIENTS,
      tokens: INITIAL_TOKENS,
      logs: INITIAL_LOGS,
      settings: DEFAULT_SETTINGS,
      currentRole: 'Receptionist',
      activeDoctorId: 'doc-1',
      activeTokenNumberForPatient: null,
      theme: 'light',
    };
  }

  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      // Ensure key properties exist
      if (parsed.doctors && parsed.patients && parsed.tokens) {
        return parsed;
      }
    } catch (e) {
      console.error('Failed to parse stored state, resetting to defaults.', e);
    }
  }

  const defaultState: QueueState = {
    doctors: INITIAL_DOCTORS,
    patients: INITIAL_PATIENTS,
    tokens: INITIAL_TOKENS,
    logs: INITIAL_LOGS,
    settings: DEFAULT_SETTINGS,
    currentRole: 'Receptionist',
    activeDoctorId: 'doc-1',
    activeTokenNumberForPatient: null,
    theme: 'light',
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultState));
  return defaultState;
}

export function saveState(state: QueueState): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function broadcastUpdate(state: QueueState): void {
  saveState(state);
  if (syncChannel) {
    syncChannel.postMessage({ type: 'SYNC_STATE', state });
  }
}

export function subscribeToSync(callback: (state: QueueState) => void): () => void {
  if (!syncChannel) return () => {};

  const handleMessage = (event: MessageEvent) => {
    if (event.data && event.data.type === 'SYNC_STATE') {
      callback(event.data.state);
    }
  };

  syncChannel.addEventListener('message', handleMessage);
  
  // Also sync on storage change (for other tabs that don't share the channel contexts)
  const handleStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY && event.newValue) {
      try {
        const state = JSON.parse(event.newValue);
        callback(state);
      } catch (e) {
        // Ignore parse errors
      }
    }
  };
  window.addEventListener('storage', handleStorage);

  return () => {
    if (syncChannel) {
      syncChannel.removeEventListener('message', handleMessage);
    }
    window.removeEventListener('storage', handleStorage);
  };
}

// ==========================================
// PREDICTIVE & ALGORITHMIC AI UTILITIES
// ==========================================

/**
 * Calculates dynamic patient queue position and remaining tokens ahead for a given doctor.
 * Emergencies bypass regular items.
 */
export function getSortedDoctorQueue(doctorId: string, tokens: Token[], autoReorderEmergency: boolean = true): Token[] {
  const docTokens = tokens.filter(t => t.doctorId === doctorId && (t.status === 'Waiting' || t.status === 'Called' || t.status === 'In Consultation'));
  
  // Sort: 
  // 1. In Consultation goes first
  // 2. Called goes second
  // 3. Waiting goes third, sorted by:
  //    - Emergency flag (if autoReorderEmergency is on)
  //    - Creation time
  return [...docTokens].sort((a, b) => {
    const statusPriority = { 'In Consultation': 1, 'Called': 2, 'Waiting': 3 };
    const priorityA = statusPriority[a.status as 'In Consultation' | 'Called' | 'Waiting'] || 4;
    const priorityB = statusPriority[b.status as 'In Consultation' | 'Called' | 'Waiting'] || 4;
    
    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }
    
    // Both are in the same status. If Waiting, check emergency
    if (a.status === 'Waiting' && b.status === 'Waiting') {
      if (autoReorderEmergency) {
        if (a.isEmergency && !b.isEmergency) return -1;
        if (!a.isEmergency && b.isEmergency) return 1;
      }
    }
    
    // Sort by creation time
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });
}

/**
 * AI-driven Wait Time Prediction
 * Uses current doctor state, remaining tokens ahead, emergency impacts,
 * doctor's break schedules, and peak hours weight.
 */
export function getEstimatedWaitTime(tokenId: string, state: QueueState): number {
  const token = state.tokens.find(t => t.id === tokenId);
  if (!token || token.status === 'Completed' || token.status === 'Cancelled' || token.status === 'Absent') {
    return 0;
  }
  
  if (token.status === 'In Consultation') {
    return 0; // Already in
  }
  
  if (token.status === 'Called') {
    return 1; // It's literally their turn now
  }
  
  const doctor = state.doctors.find(d => d.id === token.doctorId);
  if (!doctor) return 30; // fallback
  
  // Get sorted queue for this doctor
  const queue = getSortedDoctorQueue(token.doctorId, state.tokens, state.settings.autoReorderEmergency);
  
  // Find index of this token in the active queue
  const myIndex = queue.findIndex(t => t.id === tokenId);
  if (myIndex === -1) return 20; // fallback
  
  // Count tokens ahead that are active or waiting
  const tokensAhead = queue.slice(0, myIndex);
  
  // Base time: average consultation time per token ahead
  const avgTime = state.settings.averageConsultationTime || 10;
  let totalTime = tokensAhead.length * avgTime;
  
  // Add time for the current patient being consulted if any
  const currentConsulting = queue.find(t => t.status === 'In Consultation');
  if (currentConsulting) {
    // assume roughly half of consultation time remains
    totalTime += Math.round(avgTime * 0.5);
  } else {
    // if no one is in consultation, first waiting takes just average consultation time
    totalTime += 0;
  }
  
  // Peak Hour factor (10:00 - 12:00 or 16:00 - 18:00 increases flow congestion by 20%)
  const hour = new Date().getHours();
  const isPeakHour = (hour >= 10 && hour < 12) || (hour >= 16 && hour < 18);
  if (isPeakHour) {
    totalTime = Math.round(totalTime * 1.2);
  }
  
  // Doctor availability modifiers
  if (doctor.status === 'On Break') {
    totalTime += 15; // add break penalty
  } else if (doctor.status === 'Offline') {
    totalTime += 45; // significant delay
  }
  
  // Emergency weight penalty for regular patients:
  // For each emergency that might register later, we could predict, but we stick to actual emergencies ahead
  const emergenciesAhead = tokensAhead.filter(t => t.isEmergency).length;
  // Emergencies already accounted for in tokensAhead sort order, but they require high care (1.5x avgTime)
  totalTime += emergenciesAhead * Math.round(avgTime * 0.5);
  
  return totalTime < 0 ? 0 : totalTime;
}

/**
 * AI Recommendation & Flow Insights Generator
 * Analyzes traffic pattern, doctor performance, congestion, and outputs rich insights
 */
export function generateQueueAIInsights(state: QueueState) {
  const activeTokens = state.tokens.filter(t => t.status === 'Waiting' || t.status === 'Called' || t.status === 'In Consultation');
  const completedToday = state.tokens.filter(t => t.status === 'Completed').length;
  const emergencies = state.tokens.filter(t => t.isEmergency).length;
  
  // Calculate average wait time today across all completed tokens
  const completedTokensWithWait = state.tokens.filter(t => t.status === 'Completed' && t.startedAt && t.createdAt);
  let avgWait = 14; // default baseline
  if (completedTokensWithWait.length > 0) {
    const totalWaitMs = completedTokensWithWait.reduce((sum, t) => {
      const wait = new Date(t.startedAt!).getTime() - new Date(t.createdAt).getTime();
      return sum + wait;
    }, 0);
    avgWait = Math.round((totalWaitMs / completedTokensWithWait.length) / 60000);
  }
  
  const hour = new Date().getHours();
  const isPeakHour = (hour >= 10 && hour < 12) || (hour >= 16 && hour < 18);
  
  // Doctor busy states
  const busyDoctors = state.doctors.filter(d => d.status === 'Busy').length;
  const totalDoctors = state.doctors.length;
  const breakDoctors = state.doctors.filter(d => d.status === 'On Break' || d.status === 'Offline').length;
  
  const recommendations: string[] = [];
  let queueEfficiency = 85; // percentage score
  let peakHourAlert = false;
  let recommendStaff = false;
  
  if (isPeakHour) {
    peakHourAlert = true;
    queueEfficiency -= 15;
    recommendations.push('Currently experiencing peak-hour traffic (10 AM - 12 PM slot). Recommend holding breaks for General Medicine.');
  }
  
  // Analyze specific doctor loads
  state.doctors.forEach(doc => {
    const docWaiting = state.tokens.filter(t => t.doctorId === doc.id && t.status === 'Waiting').length;
    if (docWaiting >= 4) {
      queueEfficiency -= 5;
      recommendations.push(`High load detected for ${doc.name} (${doc.department}) with ${docWaiting} patients waiting. Suggest dynamic re-routing of minor complaints.`);
    }
    if (doc.status === 'On Break' && docWaiting >= 3) {
      recommendations.push(`ALERT: ${doc.name} is On Break but has ${docWaiting} patients in queue. Urge immediate resume.`);
    }
  });

  if (activeTokens.length > 8 && breakDoctors > 0) {
    recommendStaff = true;
    recommendations.push('High general queue pressure. Advise opening Backup Consulting Room 6 to handle general walk-ins.');
  }
  
  if (emergencies > 0) {
    recommendations.push(`Emergency Override active: ${emergencies} critical case(s) prioritized in Cardiology/Pediatrics. Routine patient delays expected.`);
  }

  // Fallbacks if list is empty
  if (recommendations.length === 0) {
    recommendations.push('All queues operating at optimum efficiency. Vitals and flows normal.');
    recommendations.push('Average wait time stable at ' + avgWait + ' mins. Staff allocation is balanced.');
  }

  return {
    queueEfficiency: Math.max(20, Math.min(100, queueEfficiency)),
    avgWaitingTime: avgWait,
    isPeakHour: peakHourAlert,
    recommendAdditionalStaff: recommendStaff || activeTokens.length > 10,
    recommendations,
    trafficPattern: isPeakHour ? 'Heavy Congestion' : activeTokens.length > 6 ? 'Moderate Flow' : 'Light / Stable',
    peakTimesForecast: '10:00 AM - 12:30 PM & 04:30 PM - 06:30 PM'
  };
}

// Simulate SMS / WhatsApp Send Action with beautiful system logs
export function sendMockNotification(token: Token, type: 'TokenCreated' | 'PatientsRemaining' | 'Called' | 'Completed' | 'FollowUp', state: QueueState, logAction: (text: string) => void): string {
  let text = '';
  switch (type) {
    case 'TokenCreated':
      text = `TOKEN CREATED: Dear ${token.patientName}, your token is ${token.tokenNumber} for ${token.doctorName} in ${token.department}. Est. wait: ${getEstimatedWaitTime(token.id, state)} mins.`;
      break;
    case 'PatientsRemaining':
      text = `3 PATIENTS REMAINING: Dear ${token.patientName}, only 3 patients are ahead of you in the ${token.department} queue. Please be ready outside ${token.roomNumber}.`;
      break;
    case 'Called':
      text = `PATIENT CALLED: Dear ${token.patientName}, your turn has arrived! Please proceed immediately to ${token.roomNumber} for ${token.doctorName}.`;
      break;
    case 'Completed':
      text = `CONSULTATION COMPLETED: Dear ${token.patientName}, your prescription is ready. Access reports in the Patient Portal using Token ${token.tokenNumber}. Get well soon!`;
      break;
    case 'FollowUp':
      text = `FOLLOW-UP REMINDER: Reminder for ${token.patientName}: Your follow-up with ${token.doctorName} is scheduled on ${token.followUpDate || 'next week'}.`;
      break;
  }
  
  // Log inside the audit logs
  logAction(`Notification Broadcasted via SMS & WhatsApp: ${text}`);
  return text;
}
