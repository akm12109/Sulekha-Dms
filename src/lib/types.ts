
export interface Driver {
  id: string;
  uid: string;
  name: string;
  avatarUrl: string;
  currentLocation: string;
  availability: string;
  assignedVehicleId?: string;
  licenseNumber: string;
  licenseExpiry: string;
  contact: string;
  email?: string; // Added for auth
}

export interface Parent {
    id: string;
    uid: string;
    name: string;
    email: string;
    avatarUrl: string;
    childName: string; // This could be deprecated in favor of studentIds
    nearestStop: string | null;
    assignedRouteId: string | null;
    studentIds?: string[];
}

export interface Student {
    id: string;
    uid: string;
    name: string;
    email?: string;
    fatherName: string;
    motherName: string;
    dob: string;
    class: string;
    rollNo: string;
    resultCardUrl?: string;
    parentId?: string;
}

export interface Teacher {
  id: string;
  uid: string;
  name: string;
  email: string;
  subjects: string[];
}

export interface Route {
  id: string;
  name: string;
  stops: string[];
}

export interface StopTimestamp {
  stop: string;
  arrivalTime?: string;
  departureTime?: string;
}

export interface Vehicle {
  id: string;
  model: string;
  licensePlate: string; // Registration No.
  chassisNumber?: string;
  imageUrl: string;
  currentLocation: string;
  maintenanceSchedule: string;
  isAvailable: boolean;
  maintenanceLogs: MaintenanceLog[];
  openingKmToday?: number;
  closingKmToday?: number;
  fitnessCertificateExpiry: string;
  insuranceExpiry: string;
  pollutionCertificateExpiry: string;
  routeId?: string;
  routeName?: string;
  route: string[];
  currentStopIndex: number;
  locationStatus: 'IN_TRANSIT' | 'AT_STOP' | 'ISSUE_REPORTED';
  statusNotes?: string;
  stopTimestamps: StopTimestamp[];
}

export interface MaintenanceLog {
  date: string;
  openingKm: number;
  closingKm: number;
  fuelLiters?: number;
  fuelCost?: number;
  maintenanceCost?: number;
  notes?: string;
}

export interface Assignment {
  driverId: string;
  vehicleId: string;
  reason: string;
}

export type UserRole = 'admin' | 'driver' | 'teacher' | 'parent' | 'student';

export interface Application {
  id: string;
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  status: 'pending' | 'approved' | 'rejected' | 'profile_incomplete';
  appliedDate: string;
  password?: string; // Temporarily store password for admin creation
  [key: string]: any; // Allow other fields from registration forms
}
