
'use client';

import type { Patient, Appointment, Prescription, StoredUser, MedicalAnalysis } from './types';

const PATIENTS_KEY = 'emr-patients';
const APPOINTMENTS_KEY = 'emr-appointments';
const PRESCRIPTIONS_KEY = 'emr-prescriptions';
const USERS_KEY = 'emr-users';
const ANALYSES_KEY = 'emr-analyses';


// Predefined list of doctor names to be assigned to new users.
const DOCTOR_NAMES = [
  "Dr. Emily Carter",
  "Dr. Ben Adams",
  "Dr. Olivia Chen",
  "Dr. Marcus Rodriguez",
  "Dr. Sofia Garcia",
  "Dr. Leo Kim",
  "Dr. Isabella Rossi",
  "Dr. Ethan Williams"
];

function safelyParseJSON<T>(jsonString: string | null, defaultValue: T): T {
  if (jsonString === null) {
    return defaultValue;
  }
  try {
    return JSON.parse(jsonString) as T;
  } catch (error) {
    console.error("Error parsing JSON from localStorage:", error);
    return defaultValue;
  }
}

// ====================================================================
// Users (Global)
// ====================================================================

export const getUsers = (): StoredUser[] => {
  if (typeof window !== 'undefined') {
    const usersJson = localStorage.getItem(USERS_KEY);
    return safelyParseJSON<StoredUser[]>(usersJson, []);
  }
  return [];
};

export const saveUsers = (users: StoredUser[]): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }
};

export const addUser = (user: Omit<StoredUser, 'id' | 'createdAt' | 'name'>): StoredUser => {
  const users = getUsers();
  const existingUser = users.find(u => u && u.doctorId && u.doctorId.toLowerCase() === user.doctorId.toLowerCase());
  if (existingUser) {
    throw new Error('An account with this Doctor ID already exists.');
  }

  // Assign a name from the predefined list based on the number of users.
  const assignedName = DOCTOR_NAMES[users.length % DOCTOR_NAMES.length];

  const newUser: StoredUser = {
    ...user,
    id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    name: assignedName,
    createdAt: new Date().toISOString(),
  };
  saveUsers([...users, newUser]);
  return newUser;
};

export const findUser = (credentials: Omit<StoredUser, 'id' | 'createdAt' | 'name'>): StoredUser | null => {
    const users = getUsers();
    const user = users.find(u => u && u.doctorId && u.doctorId.toLowerCase() === credentials.doctorId.toLowerCase() && u.password === credentials.password);
    return user || null;
}

// ====================================================================
// Internal Helpers for Doctor-Specific Data
// ====================================================================

const _getAllItems = <T>(key: string): T[] => {
  if (typeof window !== 'undefined') {
    const json = localStorage.getItem(key);
    return safelyParseJSON<T[]>(json, []);
  }
  return [];
};

const _saveAllItems = <T>(key: string, items: T[]): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(key, JSON.stringify(items));
  }
};


// ====================================================================
// Patients (Doctor-Specific)
// ====================================================================

export const getPatients = (doctorId: string): Patient[] => {
  const allPatients = _getAllItems<Patient>(PATIENTS_KEY);
  return allPatients.filter(p => p.doctorId === doctorId);
};

export const getPatientById = (patientId: string): Patient | undefined => {
    const allPatients = _getAllItems<Patient>(PATIENTS_KEY);
    return allPatients.find(p => p.id === patientId);
}

export const addPatient = (patient: Omit<Patient, 'id' | 'createdAt' | 'doctorId'>, doctorId: string): Patient => {
  const allPatients = _getAllItems<Patient>(PATIENTS_KEY);
  const newPatient: Patient = {
    ...patient,
    doctorId,
    id: `patient-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    createdAt: new Date().toISOString(),
  };
  _saveAllItems(PATIENTS_KEY, [...allPatients, newPatient]);
  return newPatient;
};

export const updatePatient = (updatedPatient: Patient): void => {
  const allPatients = _getAllItems<Patient>(PATIENTS_KEY);
  const updatedList = allPatients.map(p => p.id === updatedPatient.id ? updatedPatient : p);
  _saveAllItems(PATIENTS_KEY, updatedList);
};

export const deletePatient = (patientId: string): void => {
  // 1. Delete the patient
  const allPatients = _getAllItems<Patient>(PATIENTS_KEY);
  const updatedPatients = allPatients.filter(p => p.id !== patientId);
  _saveAllItems(PATIENTS_KEY, updatedPatients);

  // 2. Cascade delete appointments for that patient
  const allAppointments = _getAllItems<Appointment>(APPOINTMENTS_KEY);
  const updatedAppointments = allAppointments.filter(a => a.patientId !== patientId);
  _saveAllItems(APPOINTMENTS_KEY, updatedAppointments);

  // 3. Cascade delete prescriptions for that patient
  const allPrescriptions = _getAllItems<Prescription>(PRESCRIPTIONS_KEY);
  const updatedPrescriptions = allPrescriptions.filter(p => p.patientId !== patientId);
  _saveAllItems(PRESCRIPTIONS_KEY, updatedPrescriptions);

  // 4. Cascade delete medical analyses for that patient
  const allAnalyses = _getAllItems<MedicalAnalysis>(ANALYSES_KEY);
  const updatedAnalyses = allAnalyses.filter(a => a.patientId !== patientId);
  _saveAllItems(ANALYSES_KEY, updatedAnalyses);
};

// ====================================================================
// Appointments (Doctor-Specific)
// ====================================================================

export const getAppointments = (doctorId: string): Appointment[] => {
  const allAppointments = _getAllItems<Appointment>(APPOINTMENTS_KEY);
  return allAppointments.filter(a => a.doctorId === doctorId);
};

export const getAppointmentsByPatient = (patientId: string): Appointment[] => {
    const allAppointments = _getAllItems<Appointment>(APPOINTMENTS_KEY);
    return allAppointments.filter(a => a.patientId === patientId);
}

export const addAppointment = (appointment: Omit<Appointment, 'id' | 'createdAt' | 'doctorId'>, doctorId: string): Appointment => {
  const allAppointments = _getAllItems<Appointment>(APPOINTMENTS_KEY);
  const newAppointment: Appointment = {
    ...appointment,
    doctorId,
    id: `appt-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    createdAt: new Date().toISOString(),
  };
  _saveAllItems(APPOINTMENTS_KEY, [...allAppointments, newAppointment]);
  return newAppointment;
};

export const updateAppointment = (updatedAppointment: Appointment): void => {
  const allAppointments = _getAllItems<Appointment>(APPOINTMENTS_KEY);
  const updatedList = allAppointments.map(a => a.id === updatedAppointment.id ? updatedAppointment : a);
  _saveAllItems(APPOINTMENTS_KEY, updatedList);
};

export const deleteAppointment = (appointmentId: string): void => {
  const allAppointments = _getAllItems<Appointment>(APPOINTMENTS_KEY);
  const updatedList = allAppointments.filter(a => a.id !== appointmentId);
  _saveAllItems(APPOINTMENTS_KEY, updatedList);
};


// ====================================================================
// Prescriptions (Doctor-Specific)
// ====================================================================

export const getPrescriptions = (doctorId: string): Prescription[] => {
  const allPrescriptions = _getAllItems<Prescription>(PRESCRIPTIONS_KEY);
  return allPrescriptions.filter(p => p.doctorId === doctorId);
};

export const getPrescriptionsByPatient = (patientId: string): Prescription[] => {
    const allPrescriptions = _getAllItems<Prescription>(PRESCRIPTIONS_KEY);
    return allPrescriptions.filter(p => p.patientId === patientId);
}

export const addPrescription = (prescription: Omit<Prescription, 'id' | 'createdAt' | 'doctorId'>, doctorId: string): Prescription => {
  const allPrescriptions = _getAllItems<Prescription>(PRESCRIPTIONS_KEY);
  const newPrescription: Prescription = {
    ...prescription,
    doctorId,
    id: `presc-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    createdAt: new Date().toISOString(),
  };
  _saveAllItems(PRESCRIPTIONS_KEY, [...allPrescriptions, newPrescription]);
  return newPrescription;
};

export const updatePrescription = (updatedPrescription: Prescription): void => {
  const allPrescriptions = _getAllItems<Prescription>(PRESCRIPTIONS_KEY);
  const updatedList = allPrescriptions.map(p => p.id === updatedPrescription.id ? updatedPrescription : p)
  _saveAllItems(PRESCRIPTIONS_KEY, updatedList);
};

export const deletePrescription = (prescriptionId: string): void => {
  const allPrescriptions = _getAllItems<Prescription>(PRESCRIPTIONS_KEY);
  const updatedList = allPrescriptions.filter(p => p.id !== prescriptionId)
  _saveAllItems(PRESCRIPTIONS_KEY, updatedList);
};

// ====================================================================
// Medical Analyses (Doctor-Specific)
// ====================================================================

export const getAnalysesByPatient = (patientId: string): MedicalAnalysis[] => {
  const allAnalyses = _getAllItems<MedicalAnalysis>(ANALYSES_KEY);
  return allAnalyses.filter(a => a.patientId === patientId);
};

export const addAnalysis = (analysis: Omit<MedicalAnalysis, 'id' | 'createdAt' | 'doctorId'>, doctorId: string): MedicalAnalysis => {
  const allAnalyses = _getAllItems<MedicalAnalysis>(ANALYSES_KEY);
  const newAnalysis: MedicalAnalysis = {
    ...analysis,
    doctorId,
    id: `analysis-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    createdAt: new Date().toISOString(),
  };
  _saveAllItems(ANALYSES_KEY, [...allAnalyses, newAnalysis]);
  return newAnalysis;
};

export const deleteAnalysis = (analysisId: string): void => {
    const allAnalyses = _getAllItems<MedicalAnalysis>(ANALYSES_KEY);
    const updatedAnalyses = allAnalyses.filter(a => a.id !== analysisId);
    _saveAllItems(ANALYSES_KEY, updatedAnalyses);
};
