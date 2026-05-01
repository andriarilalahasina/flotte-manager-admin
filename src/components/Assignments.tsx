import { useState, useEffect } from 'react';
import { 
  CalendarCheck, 
  Plus, 
  ArrowRight, 
  Car, 
  User,
  History,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { fleetService } from '../services/fleetService';
import { Assignment, Vehicle, Driver } from '../types';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '../lib/utils';

export default function Assignments() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    const unsubA = fleetService.subscribeAssignments(setAssignments);
    const unsubV = fleetService.subscribeVehicles(setVehicles);
    const unsubD = fleetService.subscribeDrivers(setDrivers);
    return () => {
      unsubA();
      unsubV();
      unsubD();
    };
  }, []);

  const getVehicle = (id: string) => vehicles.find(v => v.id === id);
  const getDriver = (id: string) => drivers.find(d => d.id === id);

  const formatDate = (dateStr: string | undefined | null) => {
    if (!dateStr) return 'N/A';
    try {
      return format(parseISO(dateStr), 'dd MMM yyyy', { locale: fr });
    } catch (e) {
      return 'N/A';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-[#2D2A26]">Assignations</h2>
          <p className="text-[#70695E] mt-1 text-sm font-medium">Liaison opérationnelle véhicules & chauffeurs</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-[#829379] text-white px-6 py-3 rounded-xl flex items-center gap-2 font-semibold hover:bg-[#708266] transition-all shadow-md active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Nouvelle assignation
        </button>
      </div>

      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAdding(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[40px] p-8 shadow-2xl"
            >
              <h2 className="text-2xl font-bold mb-6 text-[#2D2A26]">Nouvelle Assignation</h2>
              <form className="space-y-4" onSubmit={async (e) => { 
                e.preventDefault(); 
                const formData = new FormData(e.currentTarget);
                const data = {
                  vehicleId: formData.get('vehicleId') as string,
                  driverId: formData.get('driverId') as string,
                  startDate: formData.get('startDate') as string,
                  status: 'active' as const
                };
                await fleetService.assignVehicle(data.vehicleId, data.driverId, data.startDate);
                setIsAdding(false); 
              }}>
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#9A9388] ml-1">Véhicule</label>
                    <select name="vehicleId" required className="w-full px-4 py-3 bg-[#F9F7F2] border border-[#D9D4C7] rounded-xl focus:outline-none">
                      <option value="">Sélectionner un véhicule</option>
                      {vehicles.filter(v => v.status === 'active').map(v => (
                        <option key={v.id} value={v.id}>{v.licensePlate} - {v.model}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#9A9388] ml-1">Chauffeur</label>
                    <select name="driverId" required className="w-full px-4 py-3 bg-[#F9F7F2] border border-[#D9D4C7] rounded-xl focus:outline-none">
                      <option value="">Sélectionner un chauffeur</option>
                      {drivers.filter(d => d.status === 'active').map(d => (
                        <option key={d.id} value={d.id}>{d.firstName} {d.lastName}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#9A9388] ml-1">Date de début</label>
                    <input name="startDate" required type="date" className="w-full px-4 py-3 bg-[#F9F7F2] border border-[#D9D4C7] rounded-xl focus:outline-none" />
                  </div>
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
                    Confirmer l'assignation
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {assignments.map((assignment) => {
          const vehicle = getVehicle(assignment.vehicleId);
          const driver = getDriver(assignment.driverId);
          
          return (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={assignment.id}
              className="bg-white border border-[#E2DDD1] rounded-2xl p-6 hover:shadow-md transition-all border-l-4 border-l-[#829379]"
            >
              <div className="flex items-center justify-between mb-6">
                 <div className="flex items-center gap-2">
                   < CalendarCheck className="w-4 h-4 text-[#9A9388]" />
                   <span className="text-[10px] font-bold text-[#9A9388] uppercase tracking-wider">
                     Depuis le {formatDate(assignment.startDate)}
                   </span>
                 </div>
                 <span className={cn(
                    "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tight",
                    assignment.status === 'active' ? "bg-green-50 text-green-700" : "bg-neutral-50 text-neutral-500"
                 )}>
                   {assignment.status}
                 </span>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex-1 w-full">
                  <p className="text-[10px] font-bold text-[#9A9388] uppercase tracking-widest mb-2">Chauffeur</p>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-[#F9F7F2] rounded-xl flex items-center justify-center text-[#829379] font-bold shrink-0">
                      {driver?.firstName?.[0] || driver?.lastName?.[0] || '?'}
                    </div>
                    <p className="font-semibold text-[#2D2A26] truncate">{driver ? `${driver.firstName} ${driver.lastName}` : 'Inconnu'}</p>
                  </div>
                </div>

                <div className="w-8 flex items-center justify-center rotate-90 sm:rotate-0 my-2 sm:my-0">
                  <ArrowRight className="w-4 h-4 text-[#E2DDD1]" />
                </div>

                <div className="flex-1 w-full text-left sm:text-right">
                  <p className="text-[10px] font-bold text-[#9A9388] uppercase tracking-widest mb-2">Véhicule</p>
                  <div className="flex items-center sm:justify-end gap-3">
                    <p className="font-semibold text-[#2D2A26] truncate">{vehicle ? vehicle.licensePlate : 'Inconnu'}</p>
                    <div className="w-9 h-9 bg-[#F9F7F2] rounded-xl flex items-center justify-center text-[#829379] shrink-0">
                      <Car className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-[#F0EDE4] flex items-center justify-between">
                <div className="flex items-center gap-2 text-[#9A9388]">
                  <History className="w-4 h-4" />
                  <span className="text-[10px] font-semibold uppercase">Log d'activité</span>
                </div>
                {assignment.status === 'active' ? (
                  <button 
                    onClick={async () => {
                      if (confirm('Voulez-vous vraiment clôturer cette assignation ?')) {
                        await fleetService.unassignVehicle(assignment.id, assignment.vehicleId, assignment.driverId);
                      }
                    }}
                    className="text-xs font-bold text-[#D97757] hover:underline transition-all"
                  >
                    Clôturer l'assignation
                  </button>
                ) : (
                  <span className="text-xs font-bold text-[#9A9388]">Assignation terminée</span>
                )}
              </div>
            </motion.div>
          );
        })}

        {assignments.length === 0 && (
          <div className="lg:col-span-2 py-20 text-center bg-white border border-dashed border-neutral-300 rounded-[40px]">
            <CalendarCheck className="w-16 h-16 text-neutral-100 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-neutral-900">Aucune assignation en cours</h3>
          </div>
        )}
      </div>
    </div>
  );
}
