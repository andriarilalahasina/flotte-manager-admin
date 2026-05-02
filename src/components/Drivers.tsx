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
import { toast } from 'sonner';
import { fleetService } from '../services/fleetService';
import { Driver, DriverStatus, Assignment, Vehicle, Incident, IncidentType, Severity, Payment } from '../types';
import { cn } from '../lib/utils';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import ImageUpload from './ui/ImageUpload';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const driverSchema = z.object({
  firstName: z.string().min(1, 'Obligatoire'),
  lastName: z.string().min(1, 'Obligatoire'),
  phone: z.string().min(1, 'Obligatoire'),
  phone2: z.string().optional(),
  address: z.string().optional(),
  idCardNumber: z.string().optional(),
  licenseNumber: z.string().optional(),
  dailyRent: z.preprocess((val) => Number(val), z.number().min(0)),
  status: z.enum(['active', 'suspended', 'inactive', 'dismissed']).default('active'),
});

type DriverFormData = z.infer<typeof driverSchema>;

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
  const [filterStatus, setFilterStatus] = useState<DriverStatus | 'all'>('active');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  
  // Image states for modals
  const [photoUrl, setPhotoUrl] = useState('');
  const [idCardPhotoUrl, setIdCardPhotoUrl] = useState('');
  const [idCardBackPhotoUrl, setIdCardBackPhotoUrl] = useState('');
  const [residenceCertPhotoUrl, setResidenceCertPhotoUrl] = useState('');
  const [licensePhotoUrl, setLicensePhotoUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [allPayments, setAllPayments] = useState<Payment[]>([]);
  const [sortBy, setSortBy] = useState<'name' | 'last_payment'>('name');
  const [viewingGallery, setViewingGallery] = useState<Driver | null>(null);

  const { 
    register: registerEdit, 
    handleSubmit: handleEditSubmit, 
    formState: { errors: errorsEdit }, 
    reset: resetEdit 
  } = useForm<DriverFormData>({ resolver: zodResolver(driverSchema) });

  const { 
    register: registerAdd, 
    handleSubmit: handleAddSubmit, 
    formState: { errors: errorsAdd }, 
    reset: resetAdd 
  } = useForm<DriverFormData>({ resolver: zodResolver(driverSchema) });

  useEffect(() => {
    if (editingDriver) {
      resetEdit({
        firstName: editingDriver.firstName,
        lastName: editingDriver.lastName,
        phone: editingDriver.phone,
        phone2: editingDriver.phone2 || '',
        address: editingDriver.address || '',
        idCardNumber: editingDriver.idCardNumber || '',
        licenseNumber: editingDriver.licenseNumber || '',
        dailyRent: editingDriver.dailyRent,
        status: editingDriver.status,
      });
      setPhotoUrl(editingDriver.photoUrl || '');
      setIdCardPhotoUrl(editingDriver.idCardPhotoUrl || '');
      setIdCardBackPhotoUrl(editingDriver.idCardBackPhotoUrl || '');
      setLicensePhotoUrl(editingDriver.licensePhotoUrl || '');
      setResidenceCertPhotoUrl(editingDriver.residenceCertPhotoUrl || '');
    }
  }, [editingDriver, resetEdit]);

  useEffect(() => {
    if (isAdding) {
      resetAdd({});
      setPhotoUrl('');
      setIdCardPhotoUrl('');
      setIdCardBackPhotoUrl('');
      setLicensePhotoUrl('');
      setResidenceCertPhotoUrl('');
    }
  }, [isAdding, resetAdd]);

  useEffect(() => {
    const handleClickOutside = () => setActiveMenuId(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    let driversLoaded = false;
    let vehiclesLoaded = false;
    let assignmentsLoaded = false;

    const checkLoading = () => {
      if (driversLoaded && vehiclesLoaded && assignmentsLoaded) setLoading(false);
    };

    const unsubD = fleetService.subscribeDrivers((d) => { setDrivers(d); driversLoaded = true; checkLoading(); });
    const unsubA = fleetService.subscribeAssignments((a) => { setAssignments(a); assignmentsLoaded = true; checkLoading(); });
    const unsubV = fleetService.subscribeVehicles((v) => { setVehicles(v); vehiclesLoaded = true; checkLoading(); });
    const unsubP = fleetService.subscribePayments((p) => { setAllPayments(p); });
    
    return () => {
      unsubD();
      unsubA();
      unsubV();
      unsubP();
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
  }).sort((a, b) => {
    if (sortBy === 'name') {
      return (a.firstName || '').localeCompare(b.firstName || '');
    } else {
      const paymentsA = allPayments.filter(p => p.driverId === a.id);
      const paymentsB = allPayments.filter(p => p.driverId === b.id);
      const lastA = paymentsA.length ? Math.max(...paymentsA.map(p => new Date(p.date).getTime())) : 0;
      const lastB = paymentsB.length ? Math.max(...paymentsB.map(p => new Date(p.date).getTime())) : 0;
      return lastB - lastA;
    }
  });

  const getTodayPayment = (driverId: string) => {
    const today = format(new Date(), 'yyyy-MM-dd');
    return allPayments.find(p => p.driverId === driverId && p.date.startsWith(today) && p.status === 'completed');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-[#2D2A26]">Chauffeurs</h2>
          <p className="text-[#70695E] mt-1 text-sm font-medium">Performance et gestion du capital humain</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="hidden sm:flex bg-[#829379] text-white px-6 py-3 rounded-xl items-center gap-2 font-semibold hover:bg-[#708266] transition-all shadow-md active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Nouveau chauffeur
        </button>
      </div>

      {/* FAB Mobile */}
      <button 
        onClick={() => setIsAdding(true)}
        className="fixed bottom-6 right-6 z-40 sm:hidden bg-[#829379] text-white p-4 rounded-full shadow-xl active:scale-95 transition-transform"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Filters & Sorting */}
      <div className="flex flex-col md:flex-row gap-4 bg-[#F0EDE4]/30 p-4 rounded-2xl border border-[#E2DDD1]">
        <div className="relative flex-[2]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9A9388] w-5 h-5" />
          <input 
            type="text" 
            placeholder="Nom ou téléphone..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-[#D9D4C7] rounded-xl focus:border-[#829379] focus:ring-1 focus:ring-[#829379] outline-none text-sm transition-all"
          />
        </div>
        <div className="flex-1 flex gap-2">
          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as DriverStatus | 'all')}
            className="flex-1 px-4 py-3 bg-white border border-[#D9D4C7] rounded-xl focus:border-[#829379] focus:ring-1 focus:ring-[#829379] outline-none text-sm font-bold text-[#70695E]"
          >
            <option value="all">Tous statuts</option>
            <option value="active">Actifs</option>
            <option value="suspended">Suspendus</option>
            <option value="inactive">Inactifs</option>
            <option value="dismissed">Renvoyés</option>
          </select>
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'name' | 'last_payment')}
            className="flex-1 px-4 py-3 bg-white border border-[#D9D4C7] rounded-xl focus:border-[#829379] focus:ring-1 focus:ring-[#829379] outline-none text-sm font-bold text-[#70695E]"
          >
            <option value="name">Trier par Nom</option>
            <option value="last_payment">Trier par Versement</option>
          </select>
        </div>
      </div>

      {/* Mobile Cards (Visible on small screens) */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {loading && drivers.length === 0 ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-3xl border border-[#E2DDD1] shadow-sm animate-pulse">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-[#F0EDE4]" />
                  <div className="space-y-2"><div className="w-24 h-4 bg-[#F0EDE4] rounded" /><div className="w-16 h-3 bg-[#F0EDE4] rounded" /></div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 py-4 border-y border-[#F0EDE4]">
                <div><div className="w-12 h-3 bg-[#F0EDE4] rounded mb-1" /><div className="w-20 h-4 bg-[#F0EDE4] rounded" /></div>
                <div><div className="w-12 h-3 bg-[#F0EDE4] rounded mb-1" /><div className="w-20 h-4 bg-[#F0EDE4] rounded" /></div>
              </div>
            </div>
          ))
        ) : (
        filteredDrivers.map((driver) => (
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
                      driver.status === 'dismissed' ? "bg-red-600 text-white shadow-sm" : "bg-neutral-100 text-neutral-600"
                    )}>
                      {driver.status}
                    </span>
                    <p className="text-[10px] text-[#9A9388] font-mono tracking-tighter truncate max-w-[120px]">{driver.address || driver.idCardNumber}</p>
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
                      <button onClick={() => { setViewingGallery(driver); setActiveMenuId(null); }} className="w-full px-4 py-3 text-left text-xs font-bold text-[#70695E] hover:bg-[#F9F7F2] flex items-center gap-3"><FileText className="w-4 h-4" /> VOIR LES PHOTOS</button>
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
              <div className="flex flex-col gap-1 text-[#70695E]">
                <div className="flex items-center gap-2">
                  <Phone className="w-3 h-3" />
                  <span className="text-xs font-medium">{driver.phone}</span>
                </div>
                {driver.phone2 && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3 h-3 opacity-0" />
                    <span className="text-xs font-medium">{driver.phone2}</span>
                  </div>
                )}
              </div>
              {getTodayPayment(driver.id) ? (
                <div className="bg-green-50 px-3 py-1.5 rounded-xl border border-green-100 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  <div className="text-right">
                    <p className="text-[8px] font-bold text-green-700 uppercase tracking-widest leading-none">Versement du jour</p>
                    <p className="text-xs font-bold text-green-800">{getTodayPayment(driver.id)?.amount.toLocaleString()} Ar</p>
                  </div>
                </div>
              ) : null}
            </div>
          </motion.div>
        )))}
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
                        <p className="text-[10px] text-[#9A9388] font-mono tracking-tighter truncate max-w-[150px]">{driver.address || driver.idCardNumber}</p>
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
                      driver.status === 'dismissed' ? "bg-red-600 text-white shadow-sm" : "bg-neutral-50 text-neutral-600"
                    )}>
                      {driver.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-semibold text-[#2D2A26]">{driver.dailyRent.toLocaleString()} Ar</p>
                  </td>
                  <td className="px-6 py-4 text-[#70695E]">
                    <span className="font-medium block">{driver.phone}</span>
                    {driver.phone2 && <span className="font-medium text-xs text-[#9A9388] block">{driver.phone2}</span>}
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
                                 setViewingGallery(driver);
                                 setActiveMenuId(null);
                               }}
                               className="w-full px-4 py-2 text-left text-xs font-bold text-[#70695E] hover:bg-[#F9F7F2] flex items-center gap-3 transition-colors"
                             >
                               <FileText className="w-4 h-4" />
                               VOIR LES PHOTOS
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
              className="relative h-full w-full bg-white rounded-none sm:h-auto sm:w-full sm:max-w-2xl sm:rounded-[40px] p-5 sm:p-8 shadow-2xl overflow-y-auto sm:max-h-[90vh] flex flex-col"
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
                    try {
                      await fleetService.addIncident(incident);
                      toast.success("Incident signalé avec succès");
                      (e.target as HTMLFormElement).reset();
                    } catch (error) {
                      toast.error("Erreur lors du signalement de l'incident");
                    }
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
              className="relative h-full w-full bg-white rounded-none sm:h-auto sm:w-full sm:max-w-2xl sm:rounded-[40px] p-5 sm:p-8 shadow-2xl overflow-y-auto sm:max-h-[90vh] flex flex-col"
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
                setIdCardBackPhotoUrl('');
                setLicensePhotoUrl('');
                setResidenceCertPhotoUrl('');
              }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative h-full w-full bg-white rounded-none sm:h-auto sm:w-full sm:max-w-lg sm:rounded-[40px] p-5 sm:p-8 shadow-2xl overflow-y-auto sm:max-h-[90vh]"
            >
              <h2 className="text-2xl font-bold mb-6 text-[#2D2A26]">Modifier chauffeur</h2>
              <form className="space-y-4" onSubmit={handleEditSubmit(async (data) => {
                try {
                  const driverData = {
                    ...data,
                    photoUrl: photoUrl || editingDriver.photoUrl || '',
                    idCardPhotoUrl: idCardPhotoUrl || editingDriver.idCardPhotoUrl || '',
                    idCardBackPhotoUrl: idCardBackPhotoUrl || editingDriver.idCardBackPhotoUrl || '',
                    licensePhotoUrl: licensePhotoUrl || editingDriver.licensePhotoUrl || '',
                    residenceCertPhotoUrl: residenceCertPhotoUrl || editingDriver.residenceCertPhotoUrl || '',
                  };
                  await fleetService.updateDriver(editingDriver.id, driverData);
                  toast.success("Chauffeur modifié avec succès");
                  setEditingDriver(null);
                } catch (error) {
                  toast.error("Erreur lors de la modification du chauffeur");
                }
              })}>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#9A9388] ml-1">Statut</label>
                    <select {...registerEdit('status')} className="w-full px-4 py-3 bg-[#F9F7F2] border border-[#D9D4C7] rounded-xl focus:outline-none">
                      <option value="active">Actif</option>
                      <option value="suspended">Suspendu</option>
                      <option value="inactive">Inactif</option>
                      <option value="dismissed">Renvoyé</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#9A9388] ml-1">Loyer Journalier (Ar)</label>
                    <input {...registerEdit('dailyRent')} type="number" className="w-full px-4 py-3 bg-[#F9F7F2] border border-[#D9D4C7] rounded-xl focus:outline-none" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#9A9388] ml-1">Prénom</label>
                    <input {...registerEdit('firstName')} type="text" className={cn("w-full px-4 py-3 bg-[#F9F7F2] border rounded-xl focus:outline-none", errorsEdit.firstName ? "border-red-500" : "border-[#D9D4C7]")} />
                    {errorsEdit.firstName && <p className="text-red-500 text-[10px] ml-1">{errorsEdit.firstName.message}</p>}
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#9A9388] ml-1">Nom</label>
                    <input {...registerEdit('lastName')} type="text" className={cn("w-full px-4 py-3 bg-[#F9F7F2] border rounded-xl focus:outline-none", errorsEdit.lastName ? "border-red-500" : "border-[#D9D4C7]")} />
                    {errorsEdit.lastName && <p className="text-red-500 text-[10px] ml-1">{errorsEdit.lastName.message}</p>}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#9A9388] ml-1">Adresse</label>
                  <input {...registerEdit('address')} type="text" className="w-full px-4 py-3 bg-[#F9F7F2] border border-[#D9D4C7] rounded-xl focus:outline-none" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#9A9388] ml-1">Téléphone 1</label>
                    <input {...registerEdit('phone')} type="tel" className={cn("w-full px-4 py-3 bg-[#F9F7F2] border rounded-xl focus:outline-none", errorsEdit.phone ? "border-red-500" : "border-[#D9D4C7]")} />
                    {errorsEdit.phone && <p className="text-red-500 text-[10px] ml-1">{errorsEdit.phone.message}</p>}
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#9A9388] ml-1">Téléphone 2</label>
                    <input {...registerEdit('phone2')} type="tel" className="w-full px-4 py-3 bg-[#F9F7F2] border border-[#D9D4C7] rounded-xl focus:outline-none" />
                  </div>
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
                      label="Photo CIN Recto"
                      value={idCardPhotoUrl || editingDriver.idCardPhotoUrl}
                      onChange={setIdCardPhotoUrl}
                    />
                    <ImageUpload 
                      label="Photo CIN Verso"
                      value={idCardBackPhotoUrl || editingDriver.idCardBackPhotoUrl}
                      onChange={setIdCardBackPhotoUrl}
                    />
                    <ImageUpload 
                      label="Certificat de Résidence"
                      value={residenceCertPhotoUrl || editingDriver.residenceCertPhotoUrl}
                      onChange={setResidenceCertPhotoUrl}
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
                setIdCardBackPhotoUrl('');
                setLicensePhotoUrl('');
                setResidenceCertPhotoUrl('');
              }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative h-full w-full bg-white rounded-none sm:h-auto sm:w-full sm:max-w-lg sm:rounded-[40px] p-5 sm:p-8 shadow-2xl overflow-y-auto sm:max-h-[90vh]"
            >
              <h2 className="text-2xl font-bold mb-6 text-[#2D2A26]">Nouveau chauffeur</h2>
              <form className="space-y-4" onSubmit={handleAddSubmit(async (data) => {
                try {
                  const driverData = {
                    ...data,
                    hireDate: new Date().toISOString(),
                    photoUrl: photoUrl,
                    idCardPhotoUrl: idCardPhotoUrl,
                    idCardBackPhotoUrl: idCardBackPhotoUrl,
                    licensePhotoUrl: licensePhotoUrl,
                    residenceCertPhotoUrl: residenceCertPhotoUrl,
                  };
                  await fleetService.addDriver(driverData as any);
                  toast.success("Chauffeur ajouté avec succès");
                  setIsAdding(false);
                } catch (error) {
                  toast.error("Erreur lors de l'ajout du chauffeur");
                }
              })}>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#9A9388] ml-1">Prénom</label>
                    <input {...registerAdd('firstName')} type="text" placeholder="Rakoto" className={cn("w-full px-4 py-3 bg-[#F9F7F2] border rounded-xl focus:outline-none", errorsAdd.firstName ? "border-red-500" : "border-[#D9D4C7]")} />
                    {errorsAdd.firstName && <p className="text-red-500 text-[10px] ml-1">{errorsAdd.firstName.message}</p>}
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#9A9388] ml-1">Nom</label>
                    <input {...registerAdd('lastName')} type="text" placeholder="Be" className={cn("w-full px-4 py-3 bg-[#F9F7F2] border rounded-xl focus:outline-none", errorsAdd.lastName ? "border-red-500" : "border-[#D9D4C7]")} />
                    {errorsAdd.lastName && <p className="text-red-500 text-[10px] ml-1">{errorsAdd.lastName.message}</p>}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#9A9388] ml-1">Adresse</label>
                  <input {...registerAdd('address')} type="text" className="w-full px-4 py-3 bg-[#F9F7F2] border border-[#D9D4C7] rounded-xl focus:outline-none" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#9A9388] ml-1">Téléphone 1</label>
                    <input {...registerAdd('phone')} type="tel" placeholder="034 ..." className={cn("w-full px-4 py-3 bg-[#F9F7F2] border rounded-xl focus:outline-none", errorsAdd.phone ? "border-red-500" : "border-[#D9D4C7]")} />
                    {errorsAdd.phone && <p className="text-red-500 text-[10px] ml-1">{errorsAdd.phone.message}</p>}
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#9A9388] ml-1">Téléphone 2</label>
                    <input {...registerAdd('phone2')} type="tel" placeholder="032 ..." className="w-full px-4 py-3 bg-[#F9F7F2] border border-[#D9D4C7] rounded-xl focus:outline-none" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#9A9388] ml-1">CIN</label>
                    <input {...registerAdd('idCardNumber')} type="text" placeholder="..." className="w-full px-4 py-3 bg-[#F9F7F2] border border-[#D9D4C7] rounded-xl focus:outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#9A9388] ml-1">Loyer Journalier (Ar)</label>
                    <input {...registerAdd('dailyRent')} type="number" placeholder="50000" className="w-full px-4 py-3 bg-[#F9F7F2] border border-[#D9D4C7] rounded-xl focus:outline-none" />
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
                      label="Photo CIN Recto"
                      value={idCardPhotoUrl}
                      onChange={setIdCardPhotoUrl}
                    />
                    <ImageUpload 
                      label="Photo CIN Verso"
                      value={idCardBackPhotoUrl}
                      onChange={setIdCardBackPhotoUrl}
                    />
                    <ImageUpload 
                      label="Certificat de Résidence"
                      value={residenceCertPhotoUrl}
                      onChange={setResidenceCertPhotoUrl}
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
                <h2 className="text-2xl font-bold text-white">Galerie Photos - {viewingGallery.firstName}</h2>
                <button onClick={() => setViewingGallery(null)} className="text-white/70 hover:text-white bg-white/10 p-2 rounded-full">
                  <Plus className="w-6 h-6 rotate-45" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto pointer-events-auto pr-2 pb-20">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {viewingGallery.photoUrl && (
                    <div className="bg-black/50 rounded-2xl overflow-hidden border border-white/10 flex flex-col">
                      <div className="p-3 bg-black/50 border-b border-white/10 text-white text-xs font-bold uppercase tracking-wider">Photo d'identité</div>
                      <a href={viewingGallery.photoUrl} target="_blank" rel="noreferrer" className="block relative group aspect-square bg-black">
                        <img src={viewingGallery.photoUrl} alt="Identité" className="w-full h-full object-contain" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"><Search className="text-white w-8 h-8" /></div>
                      </a>
                    </div>
                  )}
                  {viewingGallery.idCardPhotoUrl && (
                    <div className="bg-black/50 rounded-2xl overflow-hidden border border-white/10 flex flex-col">
                      <div className="p-3 bg-black/50 border-b border-white/10 text-white text-xs font-bold uppercase tracking-wider">CIN Recto</div>
                      <a href={viewingGallery.idCardPhotoUrl} target="_blank" rel="noreferrer" className="block relative group aspect-video bg-black">
                        <img src={viewingGallery.idCardPhotoUrl} alt="CIN Recto" className="w-full h-full object-contain" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"><Search className="text-white w-8 h-8" /></div>
                      </a>
                    </div>
                  )}
                  {viewingGallery.idCardBackPhotoUrl && (
                    <div className="bg-black/50 rounded-2xl overflow-hidden border border-white/10 flex flex-col">
                      <div className="p-3 bg-black/50 border-b border-white/10 text-white text-xs font-bold uppercase tracking-wider">CIN Verso</div>
                      <a href={viewingGallery.idCardBackPhotoUrl} target="_blank" rel="noreferrer" className="block relative group aspect-video bg-black">
                        <img src={viewingGallery.idCardBackPhotoUrl} alt="CIN Verso" className="w-full h-full object-contain" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"><Search className="text-white w-8 h-8" /></div>
                      </a>
                    </div>
                  )}
                  {viewingGallery.residenceCertPhotoUrl && (
                    <div className="bg-black/50 rounded-2xl overflow-hidden border border-white/10 flex flex-col">
                      <div className="p-3 bg-black/50 border-b border-white/10 text-white text-xs font-bold uppercase tracking-wider">Certificat de Résidence</div>
                      <a href={viewingGallery.residenceCertPhotoUrl} target="_blank" rel="noreferrer" className="block relative group aspect-video bg-black">
                        <img src={viewingGallery.residenceCertPhotoUrl} alt="Certificat" className="w-full h-full object-contain" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"><Search className="text-white w-8 h-8" /></div>
                      </a>
                    </div>
                  )}
                  {viewingGallery.licensePhotoUrl && (
                    <div className="bg-black/50 rounded-2xl overflow-hidden border border-white/10 flex flex-col">
                      <div className="p-3 bg-black/50 border-b border-white/10 text-white text-xs font-bold uppercase tracking-wider">Permis de Conduire</div>
                      <a href={viewingGallery.licensePhotoUrl} target="_blank" rel="noreferrer" className="block relative group aspect-video bg-black">
                        <img src={viewingGallery.licensePhotoUrl} alt="Permis" className="w-full h-full object-contain" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"><Search className="text-white w-8 h-8" /></div>
                      </a>
                    </div>
                  )}
                </div>
                {!viewingGallery.photoUrl && !viewingGallery.idCardPhotoUrl && !viewingGallery.idCardBackPhotoUrl && !viewingGallery.residenceCertPhotoUrl && !viewingGallery.licensePhotoUrl && (
                  <div className="text-center py-20">
                    <FileText className="w-16 h-16 text-white/20 mx-auto mb-4" />
                    <p className="text-white/60 font-medium">Aucune photo enregistrée pour ce chauffeur.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {!loading && filteredDrivers.length === 0 && (
        <div className="py-20 text-center bg-white border border-dashed border-neutral-300 rounded-[40px] flex flex-col items-center">
          <Users className="w-16 h-16 text-neutral-100 mb-4" />
          <h3 className="text-lg font-bold text-neutral-900 mb-2">Aucun chauffeur trouvé</h3>
          <p className="text-neutral-400 mb-6 text-sm max-w-sm">Vous n'avez pas encore de chauffeurs enregistrés ou aucun ne correspond à vos filtres.</p>
          <button 
            onClick={() => setIsAdding(true)}
            className="bg-[#F0EDE4] text-[#2D2A26] px-6 py-3 rounded-xl font-bold hover:bg-[#E2DDD1] transition-colors"
          >
            Ajouter un chauffeur
          </button>
        </div>
      )}
    </div>
  );
}
