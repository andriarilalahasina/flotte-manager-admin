export type VehicleStatus = 'active' | 'maintenance' | 'retired';
export type DriverStatus = 'active' | 'suspended' | 'inactive' | 'dismissed';
export type AssignmentStatus = 'active' | 'completed';
export type MaintenanceType = 'vidange' | 'revision' | 'reparation' | 'autre';
export type Severity = 'low' | 'medium' | 'high';

export interface Vehicle {
  id: string;
  licensePlate: string;
  model: string;
  year?: string;
  engineNumber?: string;
  insuranceExpiry: string; // ISO Date
  lastMaintenance: string; // ISO Date
  nextMaintenanceKm?: number;
  mileage?: number;
  currentKm?: number;
  status: VehicleStatus;
  photoUrl?: string;
  registrationPhotoUrl?: string;
  paperworkUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Driver {
  id: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  phone: string;
  idCardNumber?: string;
  licenseNumber: string;
  licenseExpiry: string;
  hireDate?: string; // ISO Date
  status: DriverStatus;
  dailyRent?: number;
  photoUrl?: string;
  idCardPhotoUrl?: string;
  licensePhotoUrl?: string;
  notes?: string;
  vehicleId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Assignment {
  id: string;
  vehicleId: string;
  driverId: string;
  startDate: string; // ISO Date
  endDate?: string; // ISO Date
  status: AssignmentStatus;
  createdAt: string;
}

export type PaymentStatus = 'pending' | 'completed' | 'paid' | 'late' | 'partial' | 'cancelled';
export type PaymentMethod = 'cash' | 'transfer' | 'mobile_money';

export interface Payment {
  id: string;
  driverId: string;
  vehicleId?: string;
  assignmentId?: string;
  amount: number;
  expectedAmount?: number;
  date: string; // ISO Date
  status: PaymentStatus;
  method?: PaymentMethod;
  reference?: string;
  note?: string;
  type?: 'rent' | 'deposit' | 'fine' | 'other';
  createdAt: string;
  updatedAt?: string;
}

export interface MaintenanceRecord {
  id: string;
  vehicleId: string;
  date: string; // ISO Date
  description: string;
  cost: number;
  kilometers?: number;
  type: MaintenanceType;
  createdAt: string;
}

export type IncidentType = 'accident' | 'fine' | 'payment_delay' | 'unmotivated_inactivity' | 'useless_maintenance' | 'other';

export interface Incident {
  id: string;
  driverId: string;
  date: string; // ISO Date
  type: IncidentType;
  description: string;
  severity: Severity;
  createdAt: string;
}
