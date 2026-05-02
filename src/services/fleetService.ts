import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  onSnapshot, 
  query, 
  where 
} from 'firebase/firestore';
import { db } from '../firebase';
import { 
  Vehicle, 
  Driver, 
  Assignment, 
  Payment, 
  MaintenanceRecord, 
  Incident
} from '../types';

export const fleetService = {
  // Vehicles
  subscribeVehicles: (callback: (vehicles: Vehicle[]) => void) => {
    const q = query(collection(db, 'vehicles'));
    return onSnapshot(q, (snapshot) => {
      const vehicles = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Vehicle));
      callback(vehicles);
    });
  },

  addVehicle: async (vehicle: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newVehicle = {
        ...vehicle,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      const docRef = await addDoc(collection(db, 'vehicles'), newVehicle);
      return { id: docRef.id, ...newVehicle } as Vehicle;
    } catch (error) {
      console.error("Error adding vehicle:", error);
      throw new Error("Erreur lors de l'ajout du véhicule");
    }
  },

  updateVehicle: async (id: string, vehicle: Partial<Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>>) => {
    try {
      const docRef = doc(db, 'vehicles', id);
      await updateDoc(docRef, {
        ...vehicle,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error updating vehicle:", error);
      throw new Error("Erreur lors de la mise à jour du véhicule");
    }
  },

  // Drivers
  subscribeDrivers: (callback: (drivers: Driver[]) => void) => {
    const q = query(collection(db, 'drivers'));
    return onSnapshot(q, (snapshot) => {
      const drivers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Driver));
      callback(drivers);
    });
  },

  addDriver: async (driver: Omit<Driver, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newDriver = {
        ...driver,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      const docRef = await addDoc(collection(db, 'drivers'), newDriver);
      return { id: docRef.id, ...newDriver } as Driver;
    } catch (error) {
      console.error("Error adding driver:", error);
      throw new Error("Erreur lors de l'ajout du chauffeur");
    }
  },

  updateDriver: async (id: string, driver: Partial<Omit<Driver, 'id' | 'createdAt' | 'updatedAt'>>) => {
    try {
      const docRef = doc(db, 'drivers', id);
      await updateDoc(docRef, {
        ...driver,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error updating driver:", error);
      throw new Error("Erreur lors de la mise à jour du chauffeur");
    }
  },

  // Assignments
  subscribeAssignments: (callback: (assignments: Assignment[]) => void) => {
    const q = query(collection(db, 'assignments'));
    return onSnapshot(q, (snapshot) => {
      const assignments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Assignment));
      callback(assignments);
    });
  },

  assignVehicle: async (vehicleId: string, driverId: string, startDate: string) => {
    try {
      const newAssignment = {
        vehicleId,
        driverId,
        startDate,
        status: 'active',
        createdAt: new Date().toISOString()
      };
      const docRef = await addDoc(collection(db, 'assignments'), newAssignment);
      
      // Auto update driver/vehicle references
      await fleetService.updateDriver(driverId, { vehicleId });
      
      return { id: docRef.id, ...newAssignment } as Assignment;
    } catch (error) {
      console.error("Error assigning vehicle:", error);
      throw new Error("Erreur lors de l'assignation");
    }
  },

  unassignVehicle: async (assignmentId: string, vehicleId: string, driverId: string) => {
    try {
      const docRef = doc(db, 'assignments', assignmentId);
      await updateDoc(docRef, {
        status: 'completed',
        endDate: new Date().toISOString()
      });
      
      await fleetService.updateDriver(driverId, { vehicleId: undefined });
    } catch (error) {
      console.error("Error unassigning vehicle:", error);
      throw new Error("Erreur lors de la désassignation");
    }
  },

  // Payments
  subscribePayments: (callback: (payments: Payment[]) => void) => {
    const q = query(collection(db, 'payments'));
    return onSnapshot(q, (snapshot) => {
      const payments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Payment));
      callback(payments);
    });
  },

  addPayment: async (payment: Omit<Payment, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newPayment = {
        ...payment,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      const docRef = await addDoc(collection(db, 'payments'), newPayment);
      return { id: docRef.id, ...newPayment } as Payment;
    } catch (error) {
      console.error("Error adding payment:", error);
      throw new Error("Erreur lors de l'enregistrement du paiement");
    }
  },

  updatePayment: async (id: string, updates: Partial<Payment>) => {
    try {
      const docRef = doc(db, 'payments', id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error updating payment:", error);
      throw new Error("Erreur lors de la mise à jour du paiement");
    }
  },

  deletePayment: async (id: string) => {
    try {
      const docRef = doc(db, 'payments', id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error("Error deleting payment:", error);
      throw new Error("Erreur lors de la suppression du paiement");
    }
  },

  subscribeDriverPayments: (driverId: string, callback: (payments: Payment[]) => void) => {
    const q = query(collection(db, 'payments'), where('driverId', '==', driverId));
    return onSnapshot(q, (snapshot) => {
      const payments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Payment));
      callback(payments);
    });
  },

  // Maintenance
  subscribeMaintenance: (vehicleId: string, callback: (records: MaintenanceRecord[]) => void) => {
    const q = query(collection(db, 'maintenance'), where('vehicleId', '==', vehicleId));
    return onSnapshot(q, (snapshot) => {
      const records = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MaintenanceRecord));
      callback(records);
    });
  },

  subscribeAllMaintenance: (callback: (records: MaintenanceRecord[]) => void) => {
    const q = query(collection(db, 'maintenance'));
    return onSnapshot(q, (snapshot) => {
      const records = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MaintenanceRecord));
      callback(records);
    });
  },

  addMaintenanceRecord: async (record: Omit<MaintenanceRecord, 'id' | 'createdAt'>) => {
    try {
      const newRecord = {
        ...record,
        createdAt: new Date().toISOString()
      };
      const docRef = await addDoc(collection(db, 'maintenance'), newRecord);
      return { id: docRef.id, ...newRecord } as MaintenanceRecord;
    } catch (error) {
      console.error("Error adding maintenance:", error);
      throw new Error("Erreur lors de l'ajout de l'entretien");
    }
  },

  // Incidents
  subscribeIncidents: (driverId: string, callback: (incidents: Incident[]) => void) => {
    const q = query(collection(db, 'incidents'), where('driverId', '==', driverId));
    return onSnapshot(q, (snapshot) => {
      const incidents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Incident));
      callback(incidents);
    });
  },

  addIncident: async (incident: Omit<Incident, 'id' | 'createdAt'>) => {
    try {
      const newIncident = {
        ...incident,
        createdAt: new Date().toISOString()
      };
      const docRef = await addDoc(collection(db, 'incidents'), newIncident);
      return { id: docRef.id, ...newIncident } as Incident;
    } catch (error) {
      console.error("Error adding incident:", error);
      throw new Error("Erreur lors de l'ajout de l'incident");
    }
  },

  // Expenses
  subscribeExpenses: (callback: (expenses: any[]) => void) => {
    const q = query(collection(db, 'expenses'));
    return onSnapshot(q, (snapshot) => {
      const expenses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(expenses);
    });
  },

  addExpense: async (expense: any) => {
    try {
      const newExpense = {
        ...expense,
        createdAt: new Date().toISOString()
      };
      const docRef = await addDoc(collection(db, 'expenses'), newExpense);
      return { id: docRef.id, ...newExpense };
    } catch (error) {
      console.error("Error adding expense:", error);
      throw new Error("Erreur lors de l'ajout de la dépense");
    }
  },

  updateExpense: async (id: string, data: any) => {
    try {
      const docRef = doc(db, 'expenses', id);
      await updateDoc(docRef, data);
    } catch (error) {
      console.error("Error updating expense:", error);
      throw new Error("Erreur lors de la mise à jour de la dépense");
    }
  },

  deleteExpense: async (id: string) => {
    try {
      const docRef = doc(db, 'expenses', id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error("Error deleting expense:", error);
      throw new Error("Erreur lors de la suppression de la dépense");
    }
  }
};
