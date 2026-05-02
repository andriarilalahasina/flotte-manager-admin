import { useState, useEffect } from 'react';
import { 
  Car, 
  Plus, 
  Search, 
  MoreVertical, 
  FileText, 
  Wrench,
  ChevronRight,
  Filter,
  History
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { fleetService } from '../services/fleetService';
import { Vehicle, VehicleStatus, Assignment, Driver, MaintenanceRecord } from '../types';
import { cn } from '../lib/utils';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const vehicleSchema = z.object({
  licensePlate: z.string().min(1, 'Obligatoire'),
  model: z.string().min(1, 'Obligatoire'),
  year: z.string().optional(),
  engineNumber: z.string().optional(),
  lastMaintenance: z.string().optional(),
  status: z.enum(['active', 'maintenance', 'retired']).default('active'),
});

type VehicleFormData = z.infer<typeof vehicleSchema>;
import ImageUpload from './ui/ImageUpload';

export default function Vehicles() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [viewingMaintenance, setViewingMaintenance] = useState<Vehicle | null>(null);
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<VehicleStatus | 'all'>('active');
  const [photoUrl, setPhotoUrl] = useState('');
  const [regPhotoUrl, setRegPhotoUrl] = useState('');

  const { 
    register: registerEdit, 
    handleSubmit: handleEditSubmit, 
    formState: { errors: errorsEdit }, 
    reset: resetEdit 
  } = useForm<VehicleFormData>({ resolver: zodResolver(vehicleSchema) });

  const { 
    register: registerAdd, 
    handleSubmit: handleAddSubmit, 
    formState: { errors: errorsAdd }, 
    reset: resetAdd 
  } = useForm<VehicleFormData>({ resolver: zodResolver(vehicleSchema) });

  useEffect(() => {
    if (editingVehicle) {
      resetEdit({
        licensePlate: editingVehicle.licensePlate,
        model: editingVehicle.model,
        year: editingVehicle.year || '',
        engineNumber: editingVehicle.engineNumber || '',
        lastMaintenance: editingVehicle.lastMaintenance || '',
        status: editingVehicle.status
      });
      setPhotoUrl(editingVehicle.photoUrl || '');
      setRegPhotoUrl(editingVehicle.registrationPhotoUrl || '');
    }
  }, [editingVehicle, resetEdit]);

  useEffect(() => {
    if (isAdding) {
      resetAdd({});
      setPhotoUrl('');
      setRegPhotoUrl('');
    }
  }, [isAdding, resetAdd]);
  const [loading, setLoading] = useState(true);
  const [viewingGallery, setViewingGallery] = useState<Vehicle | null>(null);

  useEffect(() => {
    let vehiclesLoaded = false;
    let driversLoaded = false;
    
    const checkLoading = () => {
      if (vehiclesLoaded && driversLoaded) setLoading(false);
    };

    const unsubV = fleetService.subscribeVehicles((v) => { setVehicles(v); vehiclesLoaded = true; checkLoading(); });
    const unsubA = fleetService.subscribeAssignments(setAssignments);
    const unsubD = fleetService.subscribeDrivers((d) => { setDrivers(d); driversLoaded = true; checkLoading(); });
    
    return () => {
      unsubV();
      unsubA();
      unsubD();
    };
  }, []);

  useEffect(() => {
    if (viewingMaintenance) {
      return fleetService.subscribeMaintenance(viewingMaintenance.id, setMaintenanceRecords);
    } else {
      setMaintenanceRecords([]);
    }
  }, [viewingMaintenance]);

  const getCurrentDriver = (vehicleId: string) => {
    const activeAssignment = assignments.find(a => a.vehicleId === vehicleId && a.status === 'active');
    if (!activeAssignment) return null;
    return drivers.find(d => d.id === activeAssignment.driverId);
  };

  const getComputedVehicleStatus = (vehicle: Vehicle): VehicleStatus => {
    if (vehicle.status === 'maintenance' || vehicle.status === 'retired') return vehicle.status;
    const driver = getCurrentDriver(vehicle.id);
    if (!driver || driver.status !== 'active') return 'inactive';
    return 'active';
  };

  const filteredVehicles = vehicles
    .filter(v => {
      const licensePlate = v.licensePlate || '';
      const model = v.model || '';
      const matchesSearch = licensePlate.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           model.toLowerCase().includes(searchTerm.toLowerCase());
      const computedStatus = getComputedVehicleStatus(v);
      const matchesFilter = filterStatus === 'all' || computedStatus === filterStatus;
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      const plateA = a.licensePlate || '';
      const plateB = b.licensePlate || '';
      return plateA.localeCompare(plateB, undefined, { numeric: true, sensitivity: 'base' });
    });

  const formatDate = (dateStr: string | undefined | null) => {
    if (!dateStr) return 'N/A';
    try {
      return format(parseISO(dateStr), 'dd MMM yyyy', { locale: fr });
    } catch (e) {
      return 'N/A';
    }
  };

  const getStatusColor = (status: VehicleStatus) => {
    switch (status) {
      case 'active': return 'bg-green-50 text-green-700 border-green-100';
      case 'inactive': return 'bg-gray-50 text-gray-500 border-gray-200';
      case 'maintenance': return 'bg-[#FFF5F2] text-[#D97757] border-[#F2D7D0]';
      case 'retired': return 'bg-neutral-50 text-neutral-600 border-neutral-100';
      default: return 'bg-gray-50 text-gray-500 border-gray-200';
    }
  };

  const getStatusLabel = (status: VehicleStatus) => {
    switch (status) {
      case 'active': return 'Actif';
      case 'inactive': return 'Inactif';
      case 'maintenance': return 'Maintenance';
      case 'retired': return 'Retiré';
      default: return status;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-[#2D2A26]">Véhicules</h2>
          <p className="text-[#70695E] mt-1 text-sm font-medium">Gestion et suivi technique de la flotte</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="hidden sm:flex bg-[#829379] text-white px-6 py-3 rounded-xl items-center gap-2 font-semibold hover:bg-[#708266] transition-all shadow-md active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Ajouter un véhicule
        </button>
      </div>

      {/* FAB Mobile */}
      <button 
        onClick={() => setIsAdding(true)}
        className="fixed bottom-6 right-6 z-40 sm:hidden bg-[#829379] text-white p-4 rounded-full shadow-xl active:scale-95 transition-transform"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 bg-[#F0EDE4]/30 p-4 rounded-2xl border border-[#E2DDD1]">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9A9388] w-5 h-5" />
          <input 
            type="text" 
            placeholder="Immatriculation ou modèle..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-[#D9D4C7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#829379]/10 transition-all text-sm"
          />
        </div>
        <div className="flex flex-wrap gap-1 p-1 bg-[#F0EDE4] border border-[#E2DDD1] rounded-xl overflow-hidden">
          {(['all', 'active', 'inactive', 'maintenance', 'retired'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={cn(
                "px-3 py-2 flex-1 min-w-[60px] rounded-lg text-[10px] font-bold transition-all uppercase tracking-tight",
                filterStatus === status 
                  ? "bg-white text-[#2D2A26] shadow-sm" 
                  : "text-[#70695E] hover:text-[#2D2A26]"
              )}
            >
              {status === 'all' ? 'Tous' : getStatusLabel(status)}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading && vehicles.length === 0 ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white border border-[#E2DDD1] rounded-2xl overflow-hidden h-[340px] animate-pulse">
              <div className="h-32 bg-[#F0EDE4] w-full" />
              <div className="p-6 space-y-4">
                <div className="flex justify-between"><div className="w-10 h-10 bg-[#F0EDE4] rounded-xl" /><div className="w-16 h-6 bg-[#F0EDE4] rounded-full" /></div>
                <div className="space-y-2"><div className="h-5 bg-[#F0EDE4] rounded w-3/4" /><div className="h-4 bg-[#F0EDE4] rounded w-1/2" /></div>
                <div className="space-y-2 pt-4 border-t border-[#F0EDE4]"><div className="h-3 bg-[#F0EDE4] rounded w-full" /><div className="h-3 bg-[#F0EDE4] rounded w-full" /></div>
              </div>
            </div>
          ))
        ) : (
          <AnimatePresence mode="popLayout">
            {filteredVehicles.map((vehicle, i) => (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              key={vehicle.id}
              className="bg-white border border-[#E2DDD1] rounded-2xl overflow-hidden group hover:shadow-lg transition-all duration-300"
            >
              {vehicle.photoUrl && (
                <div className="h-32 w-full overflow-hidden border-b border-[#E2DDD1]">
                  <img 
                    src={vehicle.photoUrl} 
                    alt={vehicle.model} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 bg-[#F9F7F2] rounded-xl flex items-center justify-center text-[#829379] group-hover:bg-[#829379] group-hover:text-white transition-colors">
                    <Car className="w-5 h-5" />
                  </div>
                  <span className={cn(
                    "px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight border",
                    getStatusColor(getComputedVehicleStatus(vehicle))
                  )}>
                    {getStatusLabel(getComputedVehicleStatus(vehicle))}
                  </span>
                </div>

                <div className="mb-4">
                  <h3 className="text-lg font-bold text-[#2D2A26]">{vehicle.licensePlate}</h3>
                  <p className="text-sm text-[#70695E] font-medium">{vehicle.model} ({vehicle.year})</p>
                </div>

                <div className="space-y-2 pt-4 border-t border-[#F0EDE4]">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#9A9388]">Chauffeur actuel</span>
                    <span className="font-bold text-[#2D2A26]">
                      {getCurrentDriver(vehicle.id) ? (
                        `${getCurrentDriver(vehicle.id)?.firstName} ${getCurrentDriver(vehicle.id)?.lastName}`
                      ) : (
                        <span className="text-[#D97757]">Non assigné</span>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#9A9388]">Dernière Vidange</span>
                    <span className="font-semibold text-[#4A453E]">
                      {formatDate(vehicle.lastMaintenance)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="px-6 py-3 bg-[#F9F7F2] flex items-center justify-between border-t border-[#E2DDD1]">
                <div className="flex gap-3">
                  <button 
                    onClick={() => setViewingGallery(vehicle)}
                    className="text-[#9A9388] hover:text-[#829379] transition-colors"
                    title="Voir les photos"
                  >
                    <FileText className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setViewingMaintenance(vehicle)}
                    className="text-[#9A9388] hover:text-[#829379] transition-colors"
                    title="Historique des entretiens"
                  >
                    <History className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={async () => {
                      if (vehicle.status === 'maintenance') {
                         await fleetService.updateVehicle(vehicle.id, { status: 'active' });
                         toast.success("Véhicule de retour en service");
                      } else {
                         setViewingMaintenance(vehicle);
                      }
                    }}
                    className={cn(
                      "transition-colors",
                      vehicle.status === 'maintenance' ? "text-[#D97757]" : "text-[#9A9388] hover:text-[#D97757]"
                    )}
                    title={vehicle.status === 'maintenance' ? "Terminer la maintenance" : "Passer en maintenance"}
                  >
                    <Wrench className="w-4 h-4" />
                  </button>
                </div>
                <button 
                  onClick={() => setEditingVehicle(vehicle)}
                  className="text-[#829379] font-bold text-[10px] uppercase tracking-wider flex items-center gap-1 hover:gap-2 transition-all"
                >
                  Modifier
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        )}
      </div>

      {!loading && filteredVehicles.length === 0 && (
        <div className="py-20 text-center bg-white border border-dashed border-neutral-300 rounded-3xl flex flex-col items-center">
          <Car className="w-16 h-16 text-neutral-100 mb-4" />
          <h3 className="text-lg font-bold text-neutral-900">Aucun véhicule trouvé</h3>
          <p className="text-neutral-400 mb-6">Essayez de modifier vos filtres ou ajoutez un nouveau véhicule.</p>
          <button 
            onClick={() => setIsAdding(true)}
            className="bg-[#F0EDE4] text-[#2D2A26] px-6 py-3 rounded-xl font-bold hover:bg-[#E2DDD1] transition-colors"
          >
            Créer mon premier véhicule
          </button>
        </div>
      )}

      <AnimatePresence>
        {viewingMaintenance && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setViewingMaintenance(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative h-full w-full bg-white rounded-none sm:h-auto sm:w-full sm:max-w-2xl sm:rounded-[40px] p-5 sm:p-8 shadow-2xl overflow-y-auto sm:max-h-[90vh] flex flex-col"
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-[#2D2A26]">Historique Entretien</h2>
                  <p className="text-sm text-[#9A9388] font-medium">{viewingMaintenance.licensePlate} - {viewingMaintenance.model}</p>
                </div>
                <button onClick={() => setViewingMaintenance(null)} className="text-[#9A9388] hover:text-[#2D2A26]">
                  <Plus className="w-6 h-6 rotate-45" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                <div className="bg-[#F9F7F2] p-6 rounded-3xl border border-[#E2DDD1]">
                  <h3 className="text-xs font-bold text-[#829379] uppercase tracking-wider mb-4">Ajouter un record</h3>
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    const record = {
                      vehicleId: viewingMaintenance.id,
                      date: formData.get('date') as string,
                      type: formData.get('type') as any,
                      description: formData.get('description') as string,
                      cost: Number(formData.get('cost')),
                    };
                    try {
                      await fleetService.addMaintenanceRecord(record);
                      const updates: Partial<Vehicle> = {};
                      if (record.type === 'vidange') {
                        updates.lastMaintenance = record.date;
                      }
                      if (formData.get('setMaintenanceStatus') === 'on') {
                        updates.status = 'maintenance';
                      }
                      if (Object.keys(updates).length > 0) {
                        await fleetService.updateVehicle(viewingMaintenance.id, updates);
                      }
                      toast.success("Entretien enregistré avec succès");
                      (e.target as HTMLFormElement).reset();
                    } catch (error) {
                      toast.error("Erreur lors de l'enregistrement de l'entretien");
                    }
                  }} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <input name="date" required type="date" defaultValue={new Date().toISOString().split('T')[0]} className="px-4 py-2 bg-white border border-[#D9D4C7] rounded-xl text-xs focus:outline-none" />
                      <select name="type" required className="px-4 py-2 bg-white border border-[#D9D4C7] rounded-xl text-xs focus:outline-none">
                        <option value="vidange">Vidange</option>
                        <option value="revision">Révision</option>
                        <option value="reparation">Réparation</option>
                        <option value="autre">Autre</option>
                      </select>
                    </div>
                    <div>
                      <input name="cost" required type="number" placeholder="Coût (Ar)" className="w-full px-4 py-2 bg-white border border-[#D9D4C7] rounded-xl text-xs focus:outline-none" />
                    </div>
                    <textarea name="description" required placeholder="Détails des travaux (pièces changées, etc.)" className="w-full px-4 py-2 bg-white border border-[#D9D4C7] rounded-xl text-xs focus:outline-none h-20 resize-none"></textarea>
                    
                    <label className="flex items-center gap-2 text-[10px] uppercase font-bold text-[#D97757] tracking-wider cursor-pointer bg-[#FFF5F2] p-3 rounded-xl border border-[#F2D7D0]">
                      <input type="checkbox" name="setMaintenanceStatus" defaultChecked={viewingMaintenance.status !== 'maintenance'} className="w-4 h-4 rounded text-[#D97757] focus:ring-[#D97757]" />
                      Passer le véhicule en 'Maintenance' (Inactif)
                    </label>

                    <button type="submit" className="w-full py-3 bg-[#829379] text-white rounded-xl text-xs font-bold shadow-md active:scale-95 transition-all">Enregistrer l'entretien</button>
                  </form>
                </div>

                <div className="space-y-3">
                  {maintenanceRecords.map((record) => (
                    <div key={record.id} className="p-4 bg-white border border-[#E2DDD1] rounded-2xl flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-[#F0EDE4] flex items-center justify-center text-[#829379] shrink-0">
                        <Wrench className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-bold uppercase text-[#829379] tracking-wider">{record.type}</span>
                          <span className="text-[10px] font-bold text-[#9A9388]">{formatDate(record.date)}</span>
                        </div>
                        <p className="text-xs text-[#2D2A26] font-medium leading-relaxed">{record.description}</p>
                        <div className="flex items-center gap-4 mt-2">
                           <span className="text-[10px] font-bold text-[#D97757] bg-[#FFF5F2] px-2 py-0.5 rounded-full">{record.cost.toLocaleString()} Ar</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {maintenanceRecords.length === 0 && (
                    <p className="text-center py-10 text-[#9A9388] text-xs">Aucun historique disponible.</p>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingVehicle && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setEditingVehicle(null);
                setPhotoUrl('');
                setRegPhotoUrl('');
              }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative h-full w-full bg-white rounded-none sm:h-auto sm:w-full sm:max-w-lg sm:rounded-[40px] p-5 sm:p-8 shadow-2xl overflow-y-auto sm:max-h-[90vh]"
            >
              <h2 className="text-2xl font-bold mb-6">Modifier véhicule</h2>
              <form className="space-y-4" onSubmit={handleEditSubmit(async (data) => {
                try {
                  const vehicleData = {
                    ...data,
                    photoUrl: photoUrl || editingVehicle.photoUrl,
                    registrationPhotoUrl: regPhotoUrl || editingVehicle.registrationPhotoUrl,
                  };
                  await fleetService.updateVehicle(editingVehicle.id, vehicleData);
                  toast.success("Véhicule modifié avec succès");
                  setEditingVehicle(null);
                } catch (error) {
                  toast.error("Erreur lors de la modification du véhicule");
                }
              })}>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#9A9388] ml-1">Statut</label>
                    <select {...registerEdit('status')} className="w-full px-4 py-3 bg-[#F9F7F2] border border-[#D9D4C7] rounded-xl focus:outline-none">
                      <option value="active">Actif</option>
                      <option value="maintenance">En Entretien</option>
                      <option value="retired">Retiré</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#9A9388] ml-1">Immatriculation</label>
                    <input {...registerEdit('licensePlate')} type="text" className={cn("w-full px-4 py-3 bg-[#F9F7F2] border rounded-xl focus:outline-none", errorsEdit.licensePlate ? "border-red-500" : "border-[#D9D4C7]")} />
                    {errorsEdit.licensePlate && <p className="text-red-500 text-[10px] ml-1">{errorsEdit.licensePlate.message}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#9A9388] ml-1">Modèle</label>
                    <input {...registerEdit('model')} type="text" className={cn("w-full px-4 py-3 bg-[#F9F7F2] border rounded-xl focus:outline-none", errorsEdit.model ? "border-red-500" : "border-[#D9D4C7]")} />
                    {errorsEdit.model && <p className="text-red-500 text-[10px] ml-1">{errorsEdit.model.message}</p>}
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#9A9388] ml-1">Année</label>
                    <input {...registerEdit('year')} type="text" className="w-full px-4 py-3 bg-[#F9F7F2] border border-[#D9D4C7] rounded-xl focus:outline-none" />
                  </div>
                </div>
                
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#9A9388] ml-1">Dernier Entretien (Vidange)</label>
                  <input {...registerEdit('lastMaintenance')} type="date" className="w-full px-4 py-3 bg-[#F9F7F2] border border-[#D9D4C7] rounded-xl focus:outline-none" />
                </div>

                <div className="space-y-4 pt-4 border-t border-[#F0EDE4]">
                  <h4 className="text-xs font-bold text-[#829379] uppercase tracking-wider">Médias (Photos)</h4>
                  <ImageUpload 
                    label="Photo du véhicule"
                    value={photoUrl || editingVehicle.photoUrl}
                    onChange={setPhotoUrl}
                  />
                  <ImageUpload 
                    label="Photo Carte Grise"
                    value={regPhotoUrl || editingVehicle.registrationPhotoUrl}
                    onChange={setRegPhotoUrl}
                  />
                </div>

                <div className="flex gap-4 mt-8 pt-4">
                  <button 
                    type="button"
                    onClick={() => setEditingVehicle(null)}
                    className="flex-1 py-4 text-sm font-bold text-[#9A9388] hover:text-[#2D2A26] transition-colors"
                  >
                    Annuler
                  </button>
                  <button 
                    type="submit"
                    className="flex-[2] py-4 bg-[#829379] text-white rounded-2xl text-sm font-bold shadow-lg shadow-[#829379]/20 active:scale-95 transition-all"
                  >
                    Enregistrer les modifications
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Modal Placeholder (Simulated) */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsAdding(false);
                setPhotoUrl('');
                setRegPhotoUrl('');
              }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative h-full w-full bg-white rounded-none sm:h-auto sm:w-full sm:max-w-lg sm:rounded-[40px] p-5 sm:p-8 shadow-2xl overflow-y-auto sm:max-h-[90vh]"
            >
              <h2 className="text-2xl font-bold mb-6">Nouveau véhicule</h2>
              <form className="space-y-4" onSubmit={handleAddSubmit(async (data) => {
                try {
                  const vehicleData = {
                    ...data,
                    photoUrl: photoUrl,
                    registrationPhotoUrl: regPhotoUrl,
                  };
                  await fleetService.addVehicle(vehicleData as any);
                  toast.success("Véhicule ajouté avec succès");
                  setIsAdding(false); 
                } catch (error) {
                  toast.error("Erreur lors de l'ajout du véhicule");
                }
              })}>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#9A9388] ml-1">Immatriculation</label>
                    <input {...registerAdd('licensePlate')} type="text" placeholder="Ex: 1234 TAA" className={cn("w-full px-4 py-3 bg-[#F9F7F2] border rounded-xl focus:outline-none", errorsAdd.licensePlate ? "border-red-500" : "border-[#D9D4C7]")} />
                    {errorsAdd.licensePlate && <p className="text-red-500 text-[10px] ml-1">{errorsAdd.licensePlate.message}</p>}
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#9A9388] ml-1">Modèle</label>
                    <input {...registerAdd('model')} type="text" placeholder="Toyota Corolla" className={cn("w-full px-4 py-3 bg-[#F9F7F2] border rounded-xl focus:outline-none", errorsAdd.model ? "border-red-500" : "border-[#D9D4C7]")} />
                    {errorsAdd.model && <p className="text-red-500 text-[10px] ml-1">{errorsAdd.model.message}</p>}
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#9A9388] ml-1">Année</label>
                    <input {...registerAdd('year')} type="text" placeholder="2022" className="w-full px-4 py-3 bg-[#F9F7F2] border border-[#D9D4C7] rounded-xl focus:outline-none" />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#9A9388] ml-1">N° Moteur</label>
                    <input {...registerAdd('engineNumber')} type="text" placeholder="..." className="w-full px-4 py-3 bg-[#F9F7F2] border border-[#D9D4C7] rounded-xl focus:outline-none" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#9A9388] ml-1">Dernier Entretien (Vidange)</label>
                  <input {...registerAdd('lastMaintenance')} type="date" className="w-full px-4 py-3 bg-[#F9F7F2] border border-[#D9D4C7] rounded-xl focus:outline-none" />
                </div>

                <div className="space-y-4 pt-4 border-t border-[#F0EDE4]">
                  <h4 className="text-xs font-bold text-[#829379] uppercase tracking-wider">Médias (Photos)</h4>
                  <ImageUpload 
                    label="Photo du véhicule"
                    value={photoUrl}
                    onChange={setPhotoUrl}
                  />
                  <ImageUpload 
                    label="Photo Carte Grise / Papiers"
                    value={regPhotoUrl}
                    onChange={setRegPhotoUrl}
                  />
                </div>

                <div className="flex gap-4 mt-8 pt-4">
                  <button 
                    type="button"
                    onClick={() => setIsAdding(false)}
                    className="flex-1 py-4 text-sm font-bold text-[#9A9388] hover:text-[#2D2A26] transition-colors"
                  >
                    Annuler
                  </button>
                  <button 
                    type="submit"
                    className="flex-[2] py-4 bg-[#829379] text-white rounded-2xl text-sm font-bold shadow-lg shadow-[#829379]/20 active:scale-95 transition-all"
                  >
                    Enregistrer
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {viewingGallery && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setViewingGallery(null)}
              className="absolute inset-0 bg-black/90 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-4xl bg-transparent flex flex-col h-full max-h-[90vh] pointer-events-none"
            >
              <div className="flex justify-between items-center mb-6 pointer-events-auto">
                <h2 className="text-2xl font-bold text-white">Galerie Photos - {viewingGallery.licensePlate}</h2>
                <button onClick={() => setViewingGallery(null)} className="text-white/70 hover:text-white bg-white/10 p-2 rounded-full">
                  <Plus className="w-6 h-6 rotate-45" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto pointer-events-auto pr-2 pb-20">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {viewingGallery.photoUrl && (
                    <div className="bg-black/50 rounded-2xl overflow-hidden border border-white/10 flex flex-col">
                      <div className="p-3 bg-black/50 border-b border-white/10 text-white text-xs font-bold uppercase tracking-wider">Photo du Véhicule</div>
                      <a href={viewingGallery.photoUrl} target="_blank" rel="noreferrer" className="block relative group aspect-video bg-black">
                        <img src={viewingGallery.photoUrl} alt="Véhicule" className="w-full h-full object-contain" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"><Search className="text-white w-8 h-8" /></div>
                      </a>
                    </div>
                  )}
                  {viewingGallery.registrationPhotoUrl && (
                    <div className="bg-black/50 rounded-2xl overflow-hidden border border-white/10 flex flex-col">
                      <div className="p-3 bg-black/50 border-b border-white/10 text-white text-xs font-bold uppercase tracking-wider">Carte Grise</div>
                      <a href={viewingGallery.registrationPhotoUrl} target="_blank" rel="noreferrer" className="block relative group aspect-video bg-black">
                        <img src={viewingGallery.registrationPhotoUrl} alt="Carte Grise" className="w-full h-full object-contain" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"><Search className="text-white w-8 h-8" /></div>
                      </a>
                    </div>
                  )}
                </div>
                {!viewingGallery.photoUrl && !viewingGallery.registrationPhotoUrl && (
                  <div className="text-center py-20">
                    <FileText className="w-16 h-16 text-white/20 mx-auto mb-4" />
                    <p className="text-white/60 font-medium">Aucune photo enregistrée pour ce véhicule.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
