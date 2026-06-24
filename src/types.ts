/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Doctor {
  id: string;
  name: string;
  department: string;
  roomNumber: string;
  status: 'Available' | 'Busy' | 'On Break' | 'Offline';
  rating: number;
  avatar: string;
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  mobile: string;
  address: string;
  bloodGroup: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
  medicalHistory: string;
  allergies: string;
}

export interface PrescriptionItem {
  id: string;
  medicineName: string;
  dosage: string; // e.g., "1-0-1", "500mg"
  duration: string; // e.g., "5 days"
  foodInstructions: 'Before Food' | 'After Food' | 'With Food' | 'Anytime';
}

export interface ReportFile {
  id: string;
  name: string;
  type: 'prescription' | 'lab' | 'scan';
  date: string;
  url: string; // Base64 or mock data URL
}

export interface Token {
  id: string;
  tokenNumber: string; // e.g. "P-101"
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  department: string;
  roomNumber: string;
  status: 'Waiting' | 'Called' | 'In Consultation' | 'Completed' | 'Cancelled' | 'Absent';
  type: 'Walk-in' | 'Appointment';
  isEmergency: boolean;
  emergencyReason?: string;
  notes?: string;
  createdAt: string;
  calledAt?: string;
  startedAt?: string;
  completedAt?: string;
  
  // Doctor consultation data (Only available when completed or active)
  symptoms?: string[];
  diagnosis?: string;
  advice?: string;
  prescription?: PrescriptionItem[];
  labRequests?: string[]; // e.g., ["Blood Test", "X-Ray"]
  reports?: ReportFile[];
  followUpDate?: string;
  followUpNotes?: string;
  
  // Patient feedback
  rating?: number; // 1-5
  feedbackText?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  role: 'Admin' | 'Receptionist' | 'Doctor' | 'Patient' | 'System';
  user: string;
  action: string;
  details: string;
}

export interface SystemSettings {
  averageConsultationTime: number; // in minutes
  enableSmsNotification: boolean;
  enableWhatsappNotification: boolean;
  voiceLanguage: 'en-US' | 'ta-IN' | 'hi-IN';
  voiceVolume: number;
  voicePitch: number;
  voiceRate: number;
  autoReorderEmergency: boolean;
}

// Initial mock data definitions
export interface QueueState {
  doctors: Doctor[];
  patients: Patient[];
  tokens: Token[];
  logs: AuditLog[];
  settings: SystemSettings;
  currentRole: 'Receptionist' | 'Doctor' | 'Patient' | 'Admin' | 'TV';
  activeDoctorId: string | null; // Selected doctor in Doctor module
  activeTokenNumberForPatient: string | null; // Entered in Patient Portal
  theme: 'light' | 'dark';
}
