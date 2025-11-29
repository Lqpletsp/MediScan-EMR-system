
export interface StoredUser {
  id: string;
  name: string;
  doctorId: string;
  password: string; // In a real app, this would be a hash.
  createdAt: string;
}

export interface Patient {
  id: string;
  doctorId: string;
  name: string;
  dateOfBirth: string;
  gender: 'Male' | 'Female' | 'Other';
  contact: string;
  address: string;
  medicalHistory: string[];
  createdAt: string; // ISO date string
}

export interface Appointment {
  id:string;
  doctorId: string;
  patientId: string;
  patientName: string; // Should match a name from Patient[]
  doctorName: string;
  date: string; // yyyy-MM-dd
  time: string; // HH:MM
  reason: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled';
  createdAt: string; // ISO date string
}

export interface Prescription {
  id: string;
  doctorId: string;
  patientId: string;
  patientName: string; // Should match a name from Patient[]
  doctorName: string;
  date: string; // yyyy-MM-dd
  medication: string;
  dosage: string;
  frequency: string;
  notes?: string;
  createdAt: string; // ISO date string
}

// Keeping for reference, but new MedicalAnalysis type is preferred
export interface MedicalImageRecord {
  id: string;
  patientName: string;
  imageName: string;
  imageUrl: string; // This would be a URL to the stored image or a data URI
  uploadDate: string; // yyyy-MM-dd
  aiDiagnosis?: {
    summary: string;
    potentialConditions: string;
    relevantFindings: string;
  };
}

export interface MedicalAnalysis {
  id: string;
  patientId: string;
  doctorId: string;
  createdAt: string; // ISO date string
  originalImageDataUri: string;
  analysisType: 'Dental X-ray' | 'Standard';
  analysisOutput: any; // Using `any` to accommodate both result types
  imagingModality: string;
  patientDetails: string;
}


export interface ReportData {
  appointmentsPerMonth: { month: string; count: number }[];
  patientDemographics: { gender: string; count: number; fill: string }[];
}

export interface AuthFormValues {
  doctorId: string;
  password: string;
}
