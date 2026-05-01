import { 
  Vehicle, 
  Driver, 
  Assignment, 
  Payment, 
  MaintenanceRecord, 
  Incident
} from '../types';

// Helper to manage localStorage
const getLocalData = <T>(key: string, initialData: T[]): T[] => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : initialData;
};

const setLocalData = <T>(key: string, data: T[]) => {
  localStorage.setItem(key, JSON.stringify(data));
};

// Initial Sample Data
const INITIAL_VEHICLES: Vehicle[] = [
  { id: 'v1', licensePlate: '1234 TAB', model: 'Sprinter 313', status: 'active', currentKm: 125000, insuranceExpiry: '2026-12-01', lastMaintenance: '2025-01-15', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'v2', licensePlate: '5678 TAD', model: 'Sprinter 515', status: 'active', currentKm: 85000, insuranceExpiry: '2026-06-20', lastMaintenance: '2025-02-10', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'v3', licensePlate: '9012 TAE', model: 'L300', status: 'maintenance', currentKm: 210000, insuranceExpiry: '2025-05-30', lastMaintenance: '2024-11-20', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

const INITIAL_DRIVERS: Driver[] = [
  { id: 'd1', firstName: 'Jean', lastName: 'Ralamboson', phone: '034 00 000 01', status: 'active', licenseNumber: 'LP-12345', licenseExpiry: '2028-10-12', vehicleId: 'v1', dailyRent: 50000, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'd2', firstName: 'Andry', lastName: 'Rakoto', phone: '034 00 000 02', status: 'active', licenseNumber: 'LP-67890', licenseExpiry: '2027-05-15', vehicleId: 'v2', dailyRent: 50000, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

const INITIAL_PAYMENTS: Payment[] = [
  { id: 'p1', driverId: 'd1', vehicleId: 'v1', amount: 50000, date: new Date().toISOString(), status: 'paid', createdAt: new Date().toISOString() },
  { id: 'p2', driverId: 'd2', vehicleId: 'v2', amount: 50000, date: new Date().toISOString(), status: 'paid', createdAt: new Date().toISOString() },
];

const listeners: Record<string, Function[]> = {
  vehicles: [],
  drivers: [],
  assignments: [],
  payments: [],
  maintenance: [],
  incidents: []
};

const notify = (key: string) => {
  const data = getLocalData(key, []);
  listeners[key].forEach(callback => callback(data));
};

export const fleetService = {
  // Vehicles
  subscribeVehicles: (callback: (vehicles: Vehicle[]) => void) => {
    listeners.vehicles.push(callback);
    callback(getLocalData('vehicles', INITIAL_VEHICLES));
    return () => {
      listeners.vehicles = listeners.vehicles.filter(c => c !== callback);
    };
  },

  addVehicle: async (vehicle: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>) => {
    const data = getLocalData('vehicles', INITIAL_VEHICLES);
    const newVehicle = {
      ...vehicle,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    } as Vehicle;
    setLocalData('vehicles', [...data, newVehicle]);
    notify('vehicles');
    return newVehicle;
  },

  updateVehicle: async (id: string, vehicle: Partial<Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>>) => {
    const data = getLocalData('vehicles', INITIAL_VEHICLES);
    const updated = data.map(v => v.id === id ? { ...v, ...vehicle, updatedAt: new Date().toISOString() } : v);
    setLocalData('vehicles', updated);
    notify('vehicles');
  },

  // Drivers
  subscribeDrivers: (callback: (drivers: Driver[]) => void) => {
    listeners.drivers.push(callback);
    callback(getLocalData('drivers', INITIAL_DRIVERS));
    return () => {
      listeners.drivers = listeners.drivers.filter(c => c !== callback);
    };
  },

  addDriver: async (driver: Omit<Driver, 'id' | 'createdAt' | 'updatedAt'>) => {
    const data = getLocalData('drivers', INITIAL_DRIVERS);
    const newDriver = {
      ...driver,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    } as Driver;
    setLocalData('drivers', [...data, newDriver]);
    notify('drivers');
    return newDriver;
  },

  updateDriver: async (id: string, driver: Partial<Omit<Driver, 'id' | 'createdAt' | 'updatedAt'>>) => {
    const data = getLocalData('drivers', INITIAL_DRIVERS);
    const updated = data.map(d => d.id === id ? { ...d, ...driver, updatedAt: new Date().toISOString() } : d);
    setLocalData('drivers', updated);
    notify('drivers');
  },

  // Assignments
  subscribeAssignments: (callback: (assignments: Assignment[]) => void) => {
    listeners.assignments.push(callback);
    callback(getLocalData('assignments', []));
    return () => {
      listeners.assignments = listeners.assignments.filter(c => c !== callback);
    };
  },

  assignVehicle: async (vehicleId: string, driverId: string, startDate: string) => {
    const data = getLocalData('assignments', []);
    const newAssignment = {
      id: Math.random().toString(36).substr(2, 9),
      vehicleId,
      driverId,
      startDate,
      status: 'active',
      createdAt: new Date().toISOString()
    } as Assignment;
    setLocalData('assignments', [...data, newAssignment]);
    
    // Auto update driver/vehicle references
    await fleetService.updateDriver(driverId, { vehicleId });
    
    notify('assignments');
    return newAssignment;
  },

  unassignVehicle: async (assignmentId: string, vehicleId: string, driverId: string) => {
    const data = getLocalData('assignments', []);
    const updated = data.map(a => a.id === assignmentId ? { ...a, status: 'completed', endDate: new Date().toISOString() } : a);
    setLocalData('assignments', updated);
    
    await fleetService.updateDriver(driverId, { vehicleId: undefined });
    
    notify('assignments');
  },

  // Payments
  subscribePayments: (callback: (payments: Payment[]) => void) => {
    listeners.payments.push(callback);
    callback(getLocalData('payments', INITIAL_PAYMENTS));
    return () => {
      listeners.payments = listeners.payments.filter(c => c !== callback);
    };
  },

  addPayment: async (payment: Omit<Payment, 'id' | 'createdAt' | 'updatedAt'>) => {
    const data = getLocalData('payments', INITIAL_PAYMENTS);
    const newPayment = {
      ...payment,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    } as Payment;
    setLocalData('payments', [...data, newPayment]);
    notify('payments');
    return newPayment;
  },

  updatePayment: async (id: string, updates: Partial<Payment>) => {
    const data = getLocalData('payments', INITIAL_PAYMENTS);
    const updated = data.map(p => p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p);
    setLocalData('payments', updated);
    notify('payments');
  },

  subscribeDriverPayments: (driverId: string, callback: (payments: Payment[]) => void) => {
    const data = getLocalData('payments', INITIAL_PAYMENTS);
    callback(data.filter(p => p.driverId === driverId));
    // Implementation of simple persistent listener for filters is omitted for simplicity in this mock
    return () => {};
  },

  // Maintenance
  subscribeMaintenance: (vehicleId: string, callback: (records: MaintenanceRecord[]) => void) => {
    const data = getLocalData('maintenance', []);
    callback(data.filter(m => m.vehicleId === vehicleId));
    return () => {};
  },

  subscribeAllMaintenance: (callback: (records: MaintenanceRecord[]) => void) => {
    listeners.maintenance.push(callback);
    callback(getLocalData('maintenance', []));
    return () => {
      listeners.maintenance = listeners.maintenance.filter(c => c !== callback);
    };
  },

  addMaintenanceRecord: async (record: Omit<MaintenanceRecord, 'id' | 'createdAt'>) => {
    const data = getLocalData('maintenance', []);
    const newRecord = {
      ...record,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString()
    } as MaintenanceRecord;
    setLocalData('maintenance', [...data, newRecord]);
    notify('maintenance');
    return newRecord;
  },

  // Incidents
  subscribeIncidents: (driverId: string, callback: (incidents: Incident[]) => void) => {
    const data = getLocalData('incidents', []);
    callback(data.filter(i => i.driverId === driverId));
    return () => {};
  },

  addIncident: async (incident: Omit<Incident, 'id' | 'createdAt'>) => {
    const data = getLocalData('incidents', []);
    const newIncident = {
      ...incident,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString()
    } as Incident;
    setLocalData('incidents', [...data, newIncident]);
    notify('incidents');
    return newIncident;
  }
};
