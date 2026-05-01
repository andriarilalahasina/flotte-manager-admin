import { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Phone, 
  CreditCard, 
  Calendar,
  Star,
  Award,
  AlertCircle,
  MoreVertical,
  FileText,
  Car,
  ShieldAlert,
  History
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { fleetService } from '../services/fleetService';
import { Driver, DriverStatus, Assignment, Vehicle, Incident, IncidentType, Severity, Payment } from '../types';
import { cn } from '../lib/utils';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import ImageUpload from './ui/ImageUpload';

export default function Drivers() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [viewingIncidents, setViewingIncidents] = useState<Driver | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [viewingPayments, setViewingPayments] = useState<Driver | null>(null);
  const [driverPayments, setDriverPayments] = useState<Payment[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<DriverStatus | 'all'>('all');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  
  // Image states for modals
  const [photoUrl, setPhotoUrl] = useState('');
  const [idCardPhotoUrl, setIdCardPhotoUrl] = useState('');
  const [licensePhotoUrl, setLicensePhotoUrl] = useState('');

  useEffect(() => {
    const handleClickOutside = () => setActiveMenuId(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    const unsubD = fleetService.subscribeDrivers(setDrivers);
    const unsubA = fleetService.subscribeAssignments(setAssignments);
    const unsubV = fleetService.subscribeVehicles(setVehicles);
    return () => {
      unsubD();
      unsubA();
      unsubV();
    };
  }, []);

  useEffect(() => {
    if (viewingIncidents) {
      return fleetService.subscribeIncidents(viewingIncidents.id, setIncidents);
    } else {
      setIncidents([]);
    }
  }, [viewingIncidents]);

  useEffect(() => {
    if (viewingPayments) {
      return fleetService.subscribeDriverPayments(viewingPayments.id, setDriverPayments);
    } else {
      setDriverPayments([]);
    }
  }, [viewingPayments]);

  const getCurrentVehicle = (driverId: string) => {
    const activeAssignment = assignments.find(a => a.driverId === driverId && a.status === 'active');
    if (!activeAssignment) return null;
    return vehicles.find(v => v.id === activeAssignment.vehicleId);
  };

  const filteredDrivers = drivers.filter(d => {
    const firstName = d.firstName || '';
    const lastName = d.lastName || '';
    const phone = d.phone || '';
    const fullName = `${firstName} ${lastName}`.toLowerCase();
    const matchesSearch = fullName.includes(searchTerm.toLowerCase()) || 
                          phone.includes(searchTerm);
    const matchesFilter = filterStatus === 'all' || d.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-[#2D2A26]">Chauffeurs</h2>
          <p className="text-[#70695E] mt-1 text-sm font-medium">Performance et gestion du capital humain</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-[#829379] text-white px-6 py-3 rounded-xl flex items-center gap-2 font-semibold hover:bg-[#708266] transition-all shadow-md active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Nouveau chauffeur
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 bg-[#F0EDE4]/30 p-4 rounded-2xl border border-[#E2DDD1]">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9A9388] w-5 h-5" />
          <input 
            type="text" 
            placeholder="Nom ou téléphone..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-[#D9D4C7] rounded-xl focus:outline-none text-sm"
          />
        </div>
        {/* ... (filter buttons same as before) */}
        <div className="flex flex-wrap gap-1 p-1 bg-[#F0EDE4] border border-[#E2DDD1] rounded-xl overflow-hidden">
          {(['all', 'active', 'suspended', 'inactive', 'dismissed'] as const).map((status) => (
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
              {status === 'all' ? 'Tous' : status}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile Cards (Visible on small screens) */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {filteredDrivers.map((driver) => (
          <motion.div 
            key={driver.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-6 rounded-3xl border border-[#E2DDD1] shadow-sm relative overflow-hidden"
          >
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                {driver.photoUrl ? (
                  <div className="w-16 h-16 rounded-2xl overflow-hidden border border-[#D9D4C7] shadow-sm">
                    <img src={driver.photoUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-[#829379] text-white text-xl flex items-center justify-center font-bold uppercase shadow-sm">
                    {(driver.firstName?.[0] || '')}{(driver.lastName?.[0] || '')}
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-bold text-[#2D2A26]">{driver.firstName} {driver.lastName}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-widest",
                      driver.status === 'active' ? "bg-green-100 text-green-700" : 
                      driver.status === 'suspended' ? "bg-red-100 text-red-700" : 
                      driver.status === 'dismissed' ? "bg-black text-white" : "bg-neutral-100 text-neutral-600"
                    )}>
                      {driver.status}
                    </span>
                    <p className="text-[10px] text-[#9A9388] font-mono tracking-tighter">{driver.idCardNumber}</p>
                  </div>
                </div>
              </div>
              <div className="absolute top-4 right-4">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveMenuId(activeMenuId === driver.id ? null : driver.id);
                  }}
                  className={cn(
                    "p-2 rounded-xl transition-all duration-200",
                    activeMenuId === driver.id 
                      ? "bg-[#2D2A26] text-white shadow-lg rotate-90" 
                      : "bg-[#F0EDE4] text-[#70695E] hover:text-[#2D2A26]"
                  )}
                >
                  <MoreVertical className="w-5 h-5" />
                </button>
                <AnimatePresence>
                  {activeMenuId === driver.id && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 10 }}
                      className="absolute right-0 top-full mt-2 z-20 w-48 bg-white border border-[#E2DDD1] rounded-2xl shadow-xl overflow-hidden py-2"
                    >
                      {/* Action buttons same as table */}
                      <button onClick={() => { setViewingIncidents(driver); setActiveMenuId(null); }} className="w-full px-4 py-3 text-left text-xs font-bold text-red-500 hover:bg-red-50 flex items-center gap-3"><ShieldAlert className="w-4 h-4" /> INCIDENTS</button>
                      <button onClick={() => { setViewingPayments(driver); setActiveMenuId(null); }} className="w-full px-4 py-3 text-left text-xs font-bold text-[#829379] hover:bg-[#F9F7F2] flex items-center gap-3"><CreditCard className="w-4 h-4" /> PAIEMENTS</button>
                      <button onClick={() => { if (driver.licensePhotoUrl) window.open(driver.licensePhotoUrl, '_blank'); setActiveMenuId(null); }} className="w-full px-4 py-3 text-left text-xs font-bold text-[#70695E] hover:bg-[#F9F7F2] flex items-center gap-3"><FileText className="w-4 h-4" /> VOIR PERMIS</button>
                      <div className="h-px bg-[#F0EDE4] my-2" />
                      <button onClick={() => { setEditingDriver(driver); setActiveMenuId(null); }} className="w-full px-4 py-3 text-left text-xs font-bold text-[#2D2A26] hover:bg-[#F9F7F2] flex items-center gap-3"><MoreVertical className="w-4 h-4" /> MODIFIER</button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 py-4 border-y border-[#F0EDE4]">
              <div>
                <p className="text-[10px] font-bold text-[#9A9388] uppercase tracking-widest mb-1">Véhicule</p>
                {getCurrentVehicle(driver.id) ? (
                  <div className="flex items-center gap-2">
                    <Car className="w-3 h-3 text-[#829379]" />
                    <span className="text-xs font-bold text-[#2D2A26]">{getCurrentVehicle(driver.id)?.licensePlate}</span>
                  </div>
                ) : (
                  <span className="text-xs font-bold text-[#9A9388]">Aucun</span>
                )}
              </div>
              <div>
                <p className="text-[10px] font-bold text-[#9A9388] uppercase tracking-widest mb-1">Loyer</p>
                <p className="text-xs font-bold text-[#2D2A26]">{driver.dailyRent.toLocaleString()} Ar / jour</p>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#70695E]">
                <Phone className="w-3 h-3" />
                <span className="text-xs font-medium">{driver.phone}</span>
              </div>
              <button 
                onClick={() => setViewingPayments(driver)}
                className="text-[10px] font-bold text-[#829379] uppercase tracking-widest flex items-center gap-1"
              >
                Versements
                <History className="w-3 h-3" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Drivers List (Desktop Table) */}
      <div className="hidden md:block bg-white border border-[#E2DDD1] rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[#F9F7F2] text-[#70695E] text-[10px] font-bold uppercase tracking-wider">
                <th className="px-8 py-4">Chauffeur</th>
                <th className="px-6 py-4">Véhicule</th>
                <th className="px-6 py-4">Statut</th>
                <th className="px-6 py-4">Loyer / Jour</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-[#F0EDE4]">
              {filteredDrivers.map((driver) => (
                <tr key={driver.id} className="hover:bg-[#F9F7F2]/50 transition-colors group">
                  <td className="px-8 py-4">
                    <div className="flex items-center gap-3">
                      {driver.photoUrl ? (
                         <div className="w-10 h-10 rounded-full overflow-hidden border border-[#D9D4C7]">
                           <img src={driver.photoUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                         </div>
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-[#829379] text-white text-[10px] flex items-center justify-center font-bold uppercase">
                          {(driver.firstName?.[0] || '')}{(driver.lastName?.[0] || '')}
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-[#2D2A26]">{driver.firstName} {driver.lastName}</p>
                        <p className="text-[10px] text-[#9A9388] font-mono tracking-tighter">{driver.idCardNumber}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {getCurrentVehicle(driver.id) ? (
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-[#F9F7F2] flex items-center justify-center text-[#829379]">
                          <Car className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-bold text-[#2D2A26]">{getCurrentVehicle(driver.id)?.licensePlate}</span>
                      </div>
                    ) : (
                      <span className="text-[10px] font-bold text-[#9A9388] uppercase tracking-widest">Aucun</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tight",
                      driver.status === 'active' ? "bg-green-50 text-green-700" : 
                      driver.status === 'suspended' ? "bg-red-50 text-red-700" : 
                      driver.status === 'dismissed' ? "bg-red-100 text-red-900" : "bg-neutral-50 text-neutral-600"
                    )}>
                      {driver.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-semibold text-[#2D2A26]">{driver.dailyRent.toLocaleString()} Ar</p>
                  </td>
                  <td className="px-6 py-4 text-[#70695E]">
                    <span className="font-medium">{driver.phone}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="relative flex justify-end pr-4">
                       <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuId(activeMenuId === driver.id ? null : driver.id);
                        }}
                        className={cn(
                          "p-2 rounded-xl transition-all duration-200",
                          activeMenuId === driver.id 
                            ? "bg-[#2D2A26] text-white shadow-lg rotate-90" 
                            : "text-[#9A9388] hover:bg-[#F0EDE4] hover:text-[#2D2A26]"
                        )}
                        title="Actions"
                       >
                          <MoreVertical className="w-5 h-5" />
                       </button>

                       <AnimatePresence>
                         {activeMenuId === driver.id && (
                           <motion.div
                             initial={{ opacity: 0, scale: 0.95, y: -10 }}
                             animate={{ opacity: 1, scale: 1, y: 0 }}
                             exit={{ opacity: 0, scale: 0.95, y: -10 }}
                             className="absolute right-full mr-2 top-0 z-10 w-48 bg-white border border-[#E2DDD1] rounded-2xl shadow-xl overflow-hidden py-2"
                             onClick={(e) => e.stopPropagation()}
                           >
                             <button
                               onClick={() => {
                                 setViewingIncidents(driver);
                                 setActiveMenuId(null);
                               }}
                               className="w-full px-4 py-2 text-left text-xs font-bold text-red-500 hover:bg-red-50 flex items-center gap-3 transition-colors"
                             >
                               <ShieldAlert className="w-4 h-4" />
                               INCIDENTS
                             </button>
                             <button
                               onClick={() => {
                                 setViewingPayments(driver);
                                 setActiveMenuId(null);
                               }}
                               className="w-full px-4 py-2 text-left text-xs font-bold text-[#829379] hover:bg-[#F9F7F2] flex items-center gap-3 transition-colors"
                             >
                               <CreditCard className="w-4 h-4" />
                               PAIEMENTS
                             </button>
                             <button
                               onClick={() => {
                                 if (driver.licensePhotoUrl) {
                                   window.open(driver.licensePhotoUrl, '_blank');
                                 } else {
                                   alert('Aucune photo de permis enregistrée.');
                                 }
                                 setActiveMenuId(null);
                               }}
                               className="w-full px-4 py-2 text-left text-xs font-bold text-[#70695E] hover:bg-[#F9F7F2] flex items-center gap-3 transition-colors"
                             >
                               <FileText className="w-4 h-4" />
                               VOIR PERMIS
                             </button>
                             <div className="h-px bg-[#F0EDE4] my-2" />
                             <button
                               onClick={() => {
                                 setEditingDriver(driver);
                                 setActiveMenuId(null);
                               }}
                               className="w-full px-4 py-2 text-left text-xs font-bold text-[#2D2A26] hover:bg-[#F9F7F2] flex items-center gap-3 transition-colors"
                             >
                               <MoreVertical className="w-4 h-4" />
                               MODIFIER
                             </button>
                           </motion.div>
                         )}
                       </AnimatePresence>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {viewingIncidents && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setViewingIncidents(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[40px] p-5 sm:p-8 shadow-2xl max-h-[90vh] flex flex-col"
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-[#2D2A26]">Dossier Incidents</h2>
                  <p className="text-sm text-[#9A9388] font-medium">{viewingIncidents.firstName} {viewingIncidents.lastName}</p>
                </div>
                <button onClick={() => setViewingIncidents(null)} className="text-[#9A9388] hover:text-[#2D2A26]">
                  <Plus className="w-6 h-6 rotate-45" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-6 pr-2">
                <div className="bg-red-50 p-6 rounded-3xl border border-red-100">
                  <h3 className="text-xs font-bold text-red-600 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Signaler un incident
                  </h3>
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    const incident = {
                      driverId: viewingIncidents.id,
                      date: formData.get('date') as string,
                      type: formData.get('type') as IncidentType,
                      description: formData.get('description') as string,
                      severity: formData.get('severity') as Severity
                    };
                    await fleetService.addIncident(incident);
                    (e.target as HTMLFormElement).reset();
                  }} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-red-400 uppercase ml-1">Type</label>
                        <select name="type" required className="w-full px-4 py-2 bg-white border border-red-100 rounded-xl text-xs focus:outline-none">
                          <option value="accident">Accident</option>
                          <option value="fine">Contravention</option>
                          <option value="payment_delay">Retard de paiement</option>
                          <option value="unmotivated_inactivity">Inactivité non motivée</option>
                          <option value="useless_maintenance">Entretien inutile</option>
                          <option value="other">Autre</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-red-400 uppercase ml-1">Gravité</label>
                        <select name="severity" required className="w-full px-4 py-2 bg-white border border-red-100 rounded-xl text-xs focus:outline-none">
                          <option value="low">Faible</option>
                          <option value="medium">Moyenne</option>
                          <option value="high">Élevée</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-red-400 uppercase ml-1">Date</label>
                      <input name="date" required type="date" className="w-full px-4 py-2 bg-white border border-red-100 rounded-xl text-xs focus:outline-none" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-red-400 uppercase ml-1">Description</label>
                      <textarea name="description" required placeholder="Détails de l'incident..." className="w-full px-4 py-2 bg-white border border-red-100 rounded-xl text-xs focus:outline-none h-20 resize-none"></textarea>
                    </div>
                    <button type="submit" className="w-full py-3 bg-red-500 text-white rounded-xl text-xs font-bold shadow-md active:scale-95 transition-all">Signaler</button>
                  </form>
                </div>

                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-[#9A9388] uppercase tracking-widest px-2">Historique</h3>
                  {incidents.map((incident) => (
                    <div key={incident.id} className="p-4 bg-white border border-[#E2DDD1] rounded-2xl flex items-start gap-4">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                        incident.severity === 'high' ? "bg-red-50 text-red-500" :
                        incident.severity === 'medium' ? "bg-amber-50 text-amber-500" : "bg-blue-50 text-blue-500"
                      )}>
                        <ShieldAlert className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className={cn(
                            "text-[10px] font-bold uppercase tracking-wider",
                            incident.severity === 'high' ? "text-red-600" :
                            incident.severity === 'medium' ? "text-amber-600" : "text-blue-600"
                          )}>
                            {incident.type === 'accident' ? 'Accident' : 
                             incident.type === 'fine' ? 'Contravention' :
                             incident.type === 'payment_delay' ? 'Retard de payement' :
                             incident.type === 'unmotivated_inactivity' ? 'Inactivité non motivée' :
                             incident.type === 'useless_maintenance' ? 'Entretien inutile' : 'Autre'}
                          </span>
                          <span className="text-[10px] font-bold text-[#9A9388]">{format(parseISO(incident.date), 'dd MMM yyyy', { locale: fr })}</span>
                        </div>
                        <p className="text-xs text-[#2D2A26] font-medium leading-relaxed">{incident.description}</p>
                      </div>
                    </div>
                  ))}
                  {incidents.length === 0 && (
                    <div className="text-center py-10 opacity-50">
                      <ShieldAlert className="w-10 h-10 mx-auto mb-2 text-[#9A9388]" />
                      <p className="text-xs font-medium text-[#9A9388]">Aucun incident signalé à ce jour.</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {viewingPayments && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setViewingPayments(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[40px] p-5 sm:p-8 shadow-2xl max-h-[90vh] flex flex-col"
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-[#2D2A26]">Historique des Versements</h2>
                  <p className="text-sm text-[#9A9388] font-medium">{viewingPayments.firstName} {viewingPayments.lastName}</p>
                </div>
                <button onClick={() => setViewingPayments(null)} className="text-[#9A9388] hover:text-[#2D2A26]">
                  <Plus className="w-6 h-6 rotate-45" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                {driverPayments.map((payment) => (
                  <div key={payment.id} className="p-4 bg-white border border-[#E2DDD1] rounded-2xl flex items-center justify-between group hover:bg-[#F9F7F2]/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center transition-colors shadow-sm",
                        payment.status === 'completed' ? "bg-green-50 text-green-600" : "bg-blue-50 text-blue-600"
                      )}>
                        <CreditCard className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-[#2D2A26]">{payment.amount.toLocaleString()} Ar</p>
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-widest",
                            payment.status === 'completed' ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
                          )}>
                            {payment.status === 'completed' ? 'Complet' : 'Non complet'}
                          </span>
                        </div>
                        <p className="text-[10px] text-[#9A9388] font-bold uppercase tracking-widest mt-0.5">
                          {format(parseISO(payment.date), 'dd MMMM yyyy', { locale: fr })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-[#70695E] uppercase tracking-wider">
                        {payment.method === 'cash' ? 'Espèces' : payment.method === 'transfer' ? 'Virement' : 'Mobile Money'}
                      </p>
                      {payment.type === 'rent' && <p className="text-[10px] text-[#829379] font-bold uppercase mt-1">Loyer</p>}
                    </div>
                  </div>
                ))}
                {driverPayments.length === 0 && (
                  <div className="text-center py-20 opacity-50">
                    <History className="w-10 h-10 mx-auto mb-2 text-[#9A9388]" />
                    <p className="text-xs font-medium text-[#9A9388]">Aucun paiement enregistré pour ce chauffeur.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editingDriver && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setEditingDriver(null);
                setPhotoUrl('');
                setIdCardPhotoUrl('');
                setLicensePhotoUrl('');
              }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[40px] p-5 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <h2 className="text-2xl font-bold mb-6 text-[#2D2A26]">Modifier chauffeur</h2>
              <form className="space-y-4" onSubmit={async (e) => { 
                e.preventDefault(); 
                const formData = new FormData(e.currentTarget);
                const driverData = {
                  firstName: (formData.get('firstName') || '') as string,
                  lastName: (formData.get('lastName') || '') as string,
                  phone: (formData.get('phone') || '') as string,
                  idCardNumber: (formData.get('idCardNumber') || '') as string,
                  licenseNumber: (formData.get('licenseNumber') || '') as string,
                  dailyRent: Number(formData.get('dailyRent') || 0),
                  status: (formData.get('status') || 'active') as DriverStatus,
                  photoUrl: photoUrl || editingDriver.photoUrl || '',
                  idCardPhotoUrl: idCardPhotoUrl || editingDriver.idCardPhotoUrl || '',
                  licensePhotoUrl: licensePhotoUrl || editingDriver.licensePhotoUrl || '',
                };
                await fleetService.updateDriver(editingDriver.id, driverData);
                setEditingDriver(null);
                setPhotoUrl('');
                setIdCardPhotoUrl('');
                setLicensePhotoUrl('');
              }}>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#9A9388] ml-1">Statut</label>
                    <select name="status" defaultValue={editingDriver.status} className="w-full px-4 py-3 bg-[#F9F7F2] border border-[#D9D4C7] rounded-xl focus:outline-none">
                      <option value="active">Actif</option>
                      <option value="suspended">Suspendu</option>
                      <option value="inactive">Inactif</option>
                      <option value="dismissed">Renvoyé</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#9A9388] ml-1">Loyer Journalier (Ar)</label>
                    <input name="dailyRent" defaultValue={editingDriver.dailyRent} type="number" className="w-full px-4 py-3 bg-[#F9F7F2] border border-[#D9D4C7] rounded-xl focus:outline-none" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#9A9388] ml-1">Prénom</label>
                    <input name="firstName" defaultValue={editingDriver.firstName} required type="text" className="w-full px-4 py-3 bg-[#F9F7F2] border border-[#D9D4C7] rounded-xl focus:outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#9A9388] ml-1">Nom</label>
                    <input name="lastName" defaultValue={editingDriver.lastName} required type="text" className="w-full px-4 py-3 bg-[#F9F7F2] border border-[#D9D4C7] rounded-xl focus:outline-none" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#9A9388] ml-1">Téléphone</label>
                  <input name="phone" defaultValue={editingDriver.phone} required type="tel" className="w-full px-4 py-3 bg-[#F9F7F2] border border-[#D9D4C7] rounded-xl focus:outline-none" />
                </div>

                <div className="space-y-4 pt-4 border-t border-[#F0EDE4]">
                  <h4 className="text-xs font-bold text-[#829379] uppercase tracking-wider">Médias (Photos)</h4>
                  <ImageUpload 
                    label="Photo d'identité"
                    value={photoUrl || editingDriver.photoUrl}
                    onChange={setPhotoUrl}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <ImageUpload 
                      label="Photo CIN"
                      value={idCardPhotoUrl || editingDriver.idCardPhotoUrl}
                      onChange={setIdCardPhotoUrl}
                    />
                    <ImageUpload 
                      label="Photo Permis"
                      value={licensePhotoUrl || editingDriver.licensePhotoUrl}
                      onChange={setLicensePhotoUrl}
                    />
                  </div>
                </div>

                <div className="flex gap-4 mt-8 pt-4">
                  <button 
                    type="button"
                    onClick={() => setEditingDriver(null)}
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
                setIdCardPhotoUrl('');
                setLicensePhotoUrl('');
              }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[40px] p-5 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <h2 className="text-2xl font-bold mb-6 text-[#2D2A26]">Nouveau chauffeur</h2>
              <form className="space-y-4" onSubmit={async (e) => { 
                e.preventDefault(); 
                const formData = new FormData(e.currentTarget);
                const driverData = {
                  firstName: (formData.get('firstName') || '') as string,
                  lastName: (formData.get('lastName') || '') as string,
                  phone: (formData.get('phone') || '') as string,
                  idCardNumber: (formData.get('idCardNumber') || '') as string,
                  licenseNumber: (formData.get('licenseNumber') || '') as string,
                  dailyRent: Number(formData.get('dailyRent') || 0),
                  status: 'active' as DriverStatus,
                  hireDate: new Date().toISOString(),
                  photoUrl: photoUrl,
                  idCardPhotoUrl: idCardPhotoUrl,
                  licensePhotoUrl: licensePhotoUrl,
                };
                await fleetService.addDriver(driverData as any);
                setIsAdding(false);
                setPhotoUrl('');
                setIdCardPhotoUrl('');
                setLicensePhotoUrl('');
              }}>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#9A9388] ml-1">Prénom</label>
                    <input name="firstName" required type="text" placeholder="Rakoto" className="w-full px-4 py-3 bg-[#F9F7F2] border border-[#D9D4C7] rounded-xl focus:outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#9A9388] ml-1">Nom</label>
                    <input name="lastName" required type="text" placeholder="Be" className="w-full px-4 py-3 bg-[#F9F7F2] border border-[#D9D4C7] rounded-xl focus:outline-none" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#9A9388] ml-1">Téléphone</label>
                  <input name="phone" required type="tel" placeholder="034 ..." className="w-full px-4 py-3 bg-[#F9F7F2] border border-[#D9D4C7] rounded-xl focus:outline-none" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#9A9388] ml-1">CIN</label>
                    <input name="idCardNumber" type="text" placeholder="..." className="w-full px-4 py-3 bg-[#F9F7F2] border border-[#D9D4C7] rounded-xl focus:outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#9A9388] ml-1">Loyer Journalier (Ar)</label>
                    <input name="dailyRent" type="number" placeholder="50000" className="w-full px-4 py-3 bg-[#F9F7F2] border border-[#D9D4C7] rounded-xl focus:outline-none" />
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-[#F0EDE4]">
                  <h4 className="text-xs font-bold text-[#829379] uppercase tracking-wider">Médias (Photos)</h4>
                  <ImageUpload 
                    label="Photo d'identité"
                    value={photoUrl}
                    onChange={setPhotoUrl}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <ImageUpload 
                      label="Photo CIN"
                      value={idCardPhotoUrl}
                      onChange={setIdCardPhotoUrl}
                    />
                    <ImageUpload 
                      label="Photo Permis"
                      value={licensePhotoUrl}
                      onChange={setLicensePhotoUrl}
                    />
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
                    Enregistrer
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {filteredDrivers.length === 0 && (
        <div className="py-20 text-center bg-white border border-dashed border-neutral-300 rounded-[40px]">
          <Users className="w-16 h-16 text-neutral-100 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-neutral-900">Aucun chauffeur trouvé</h3>
        </div>
      )}
    </div>
  );
}
