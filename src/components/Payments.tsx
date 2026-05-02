import { useState, useEffect } from 'react';
import { 
  DollarSign, 
  Plus, 
  TrendingUp, 
  Search,
  Filter,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  User as UserIcon,
  AlertCircle,
  XCircle,
  CreditCard,
  Wallet,
  Banknote,
  MoreVertical,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { fleetService } from '../services/fleetService';
import { Payment, Driver, PaymentStatus, PaymentMethod, Assignment, Vehicle } from '../types';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '../lib/utils';

export default function Payments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<PaymentStatus | 'all'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [expandedPayment, setExpandedPayment] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [forceTableView, setForceTableView] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);

  useEffect(() => {
    const unsubP = fleetService.subscribePayments(setPayments);
    const unsubD = fleetService.subscribeDrivers(setDrivers);
    const unsubA = fleetService.subscribeAssignments(setAssignments);
    const unsubV = fleetService.subscribeVehicles(setVehicles);
    return () => {
      unsubP();
      unsubD();
      unsubA();
      unsubV();
    };
  }, []);

  const getDriver = (id: string) => drivers.find(d => d.id === id);
  const getDriverVehiclePlate = (driverId: string) => {
    const activeAssignment = assignments.find(a => a.driverId === driverId && a.status === 'active');
    if (activeAssignment) {
      const vehicle = vehicles.find(v => v.id === activeAssignment.vehicleId);
      return vehicle?.licensePlate || null;
    }
    return null;
  };

  const stats = {
    total: payments.filter(p => p.status === 'completed').reduce((acc, p) => acc + p.amount, 0),
    partial: payments.filter(p => p.status === 'partial').reduce((acc, p) => acc + p.amount, 0),
  };

  const filteredPayments = payments.filter(p => {
    const driver = getDriver(p.driverId);
    const driverMatch = driver ? `${driver.firstName} ${driver.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) : false;
    const statusMatch = filterStatus === 'all' || p.status === filterStatus;
    
    let dateMatch = true;
    if (startDate && p.date) {
      dateMatch = dateMatch && p.date >= startDate;
    }
    if (endDate && p.date) {
      dateMatch = dateMatch && p.date <= endDate;
    }
    
    return driverMatch && statusMatch && dateMatch;
  });

  const formatDate = (dateStr: string | undefined | null) => {
    if (!dateStr) return 'N/A';
    try {
      return format(parseISO(dateStr), 'dd MMM yyyy', { locale: fr });
    } catch (e) {
      return 'N/A';
    }
  };

  const getStatusConfig = (status: PaymentStatus) => {
    switch (status) {
      case 'completed': return { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100', label: 'Complet' };
      case 'pending': return { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100', label: 'En attente' };
      case 'late': return { icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100', label: 'Retard' };
      case 'partial': return { icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100', label: 'Non complet' };
      case 'cancelled': return { icon: XCircle, color: 'text-neutral-500', bg: 'bg-neutral-50', border: 'border-neutral-200', label: 'Annulé' };
      default: return { icon: AlertCircle, color: 'text-neutral-500', bg: 'bg-neutral-50', border: 'border-neutral-200', label: status };
    }
  };

  const getMethodIcon = (method?: PaymentMethod) => {
    switch (method) {
      case 'cash': return Banknote;
      case 'transfer': return CreditCard;
      case 'mobile_money': return Wallet;
      default: return Banknote;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-[#2D2A26]">Gestion Financière</h2>
          <p className="text-[#70695E] mt-1 text-sm font-medium">Suivi détaillé des encaissements et loyers</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="md:hidden bg-[#829379] text-white px-6 py-3 rounded-xl flex items-center gap-2 font-semibold hover:bg-[#708266] transition-all shadow-md active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Nouveau
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-[#E2DDD1] rounded-3xl p-6 shadow-sm">
          <p className="text-[10px] font-bold text-[#9A9388] uppercase tracking-widest mb-1">Total Encaissé (Complet)</p>
          <div className="flex items-center justify-between">
            <p className="text-2xl font-black text-[#2D2A26]">{stats.total.toLocaleString()} Ar</p>
            <div className="p-2 bg-green-50 rounded-xl">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white border border-[#E2DDD1] rounded-3xl p-6 shadow-sm">
          <p className="text-[10px] font-bold text-[#9A9388] uppercase tracking-widest mb-1">Total Non Complet</p>
          <div className="flex items-center justify-between">
            <p className="text-2xl font-black text-[#829379]">{stats.partial.toLocaleString()} Ar</p>
            <div className="p-2 bg-[#F0EDE4] rounded-xl">
              <Clock className="w-5 h-5 text-[#829379]" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-[#E2DDD1] rounded-[40px] p-6 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-[2]">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-[#9A9388] w-5 h-5" />
            <input 
              type="text" 
              placeholder="Rechercher un chauffeur..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-14 pr-4 py-4 bg-[#F9F7F2] border border-[#D9D4C7] rounded-2xl focus:outline-none text-sm font-medium"
            />
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 justify-between mb-8">
          <div className="flex gap-2 overflow-x-auto pb-2 flex-1">
            {(['all', 'completed', 'partial'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={cn(
                  "px-6 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all shrink-0",
                  filterStatus === status 
                    ? "bg-[#2D2A26] text-white shadow-lg" 
                    : "bg-[#F0EDE4] text-[#70695E] hover:bg-[#E2DDD1]"
                )}
              >
                {status === 'all' ? 'Tous les types' : getStatusConfig(status as PaymentStatus).label}
              </button>
            ))}
            {(startDate || endDate) && (
              <button 
                onClick={() => { setStartDate(''); setEndDate(''); }}
                className="px-6 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest bg-red-50 text-red-600 hover:bg-red-100 transition-all border border-red-100"
              >
                Réinitialiser
              </button>
            )}
          </div>
          <button 
            onClick={() => setForceTableView(!forceTableView)}
            className="md:hidden px-4 py-3 bg-white border border-[#E2DDD1] rounded-2xl text-[10px] font-bold uppercase tracking-widest text-[#70695E] hover:bg-[#F9F7F2] transition-colors shadow-sm self-start"
          >
            {forceTableView ? 'Vue Mobile' : 'Vue Ordinateur'}
          </button>
        </div>

        {/* Mobile View */}
        <div className={cn("space-y-3", forceTableView ? "hidden" : "md:hidden")}>
          {filteredPayments.map((payment) => {
            const driver = getDriver(payment.driverId);
            const config = getStatusConfig(payment.status);
            const isExpanded = expandedPayment === payment.id;
            const MethodIcon = getMethodIcon(payment.method);

            return (
              <motion.div
                layout
                key={payment.id}
                className={cn(
                  "border transition-all duration-300",
                  isExpanded ? "rounded-[32px] border-[#829379] bg-[#F9F7F2]/30 p-6" : "rounded-2xl border-transparent hover:border-[#E2DDD1] hover:bg-[#F9F7F2]/50 p-4"
                )}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center transition-colors shadow-sm shrink-0",
                      isExpanded ? "bg-white" : "bg-[#F0EDE4] group-hover:bg-white"
                    )}>
                      <UserIcon className="w-6 h-6 text-[#829379]" />
                    </div>
                    <div>
                      <h4 className="font-bold text-[#2D2A26] text-sm">{driver ? `${driver.firstName} ${driver.lastName}` : (payment.driverId === 'autre' ? 'Autre / Inconnu' : 'Inconnu')}</h4>
                      {getDriverVehiclePlate(payment.driverId) && (
                        <p className="text-[10px] text-[#829379] font-bold uppercase tracking-widest mt-0.5">{getDriverVehiclePlate(payment.driverId)}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                        <div className="flex items-center gap-1.5 overflow-hidden">
                          <config.icon className={cn("w-3 h-3", config.color)} />
                          <span className={cn("text-[10px] font-bold uppercase tracking-wider", config.color)}>
                            {config.label}
                          </span>
                        </div>
                        <span className="hidden sm:block w-1 h-1 rounded-full bg-[#E2DDD1]" />
                        <span className="text-[10px] text-[#9A9388] font-bold uppercase tracking-widest">
                          {formatDate(payment.date)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 pt-3 sm:pt-0 border-[#F0EDE4]">
                    <div className="text-left sm:text-right">
                      <p className="text-lg font-black text-[#2D2A26]">
                        {payment.amount.toLocaleString()} Ar
                      </p>
                      {payment.expectedAmount && payment.expectedAmount > payment.amount && (
                        <p className="text-[10px] font-bold text-[#D97757]">
                          Dû: {payment.expectedAmount.toLocaleString()} Ar
                        </p>
                      )}
                    </div>
                    <button 
                      onClick={() => setExpandedPayment(isExpanded ? null : payment.id)}
                      className={cn(
                        "p-2 rounded-xl bg-[#F0EDE4] text-[#70695E] hover:bg-[#E2DDD1] transition-transform",
                        isExpanded ? "rotate-180" : ""
                      )}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="pt-6 mt-6 border-t border-[#E2DDD1] grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div>
                          <p className="text-[10px] font-bold text-[#9A9388] uppercase tracking-widest mb-2">Méthode</p>
                          <div className="flex items-center gap-2">
                             <div className="p-1.5 bg-[#F0EDE4] rounded-lg">
                               <MethodIcon className="w-3.5 h-3.5 text-[#829379]" />
                             </div>
                             <span className="text-xs font-bold text-[#2D2A26] capitalize">
                               {payment.method === 'cash' ? 'Espèces' : payment.method === 'transfer' ? 'Virement' : 'Mobile Money'}
                             </span>
                          </div>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-[#9A9388] uppercase tracking-widest mb-2">Type</p>
                           <span className="px-2 py-1 bg-[#F0EDE4] text-[#70695E] rounded-lg text-[10px] font-bold uppercase tracking-wider">
                             {payment.type === 'rent' ? 'Loyer' : payment.type === 'deposit' ? 'Caution' : payment.type === 'fine' ? 'Amende' : 'Autre'}
                           </span>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-[#9A9388] uppercase tracking-widest mb-2">Référence</p>
                          <p className="text-xs font-mono text-[#2D2A26]">{payment.reference || 'N/A'}</p>
                        </div>
                      </div>
                      {payment.note && (
                        <div className="mt-4 p-4 bg-white/50 rounded-2xl border border-[#E2DDD1]">
                          <p className="text-[10px] font-bold text-[#9A9388] uppercase tracking-widest mb-1">Note</p>
                          <p className="text-xs text-[#70695E] leading-relaxed italic">{payment.note}</p>
                        </div>
                      )}
                      <div className="mt-6 pt-4 border-t border-[#E2DDD1] flex justify-end gap-2">
                        <button 
                          onClick={() => { setEditingPayment(payment); setIsAdding(true); }}
                          className="px-4 py-2 bg-[#F9F7F2] text-[#70695E] rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-[#E2DDD1]"
                        >
                          Modifier
                        </button>
                        <button 
                          onClick={async () => {
                            if (window.confirm('Voulez-vous vraiment supprimer ce paiement ? Cette action est irréversible.')) {
                              await fleetService.deletePayment(payment.id);
                            }
                          }}
                          className="px-4 py-2 bg-red-50 text-red-600 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-red-100"
                        >
                          Supprimer
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}

          {filteredPayments.length === 0 && (
            <div className="py-20 text-center">
              <DollarSign className="w-12 h-12 text-[#E2DDD1] mx-auto mb-3" />
              <p className="text-[#9A9388] font-medium">Aucun paiement correspondant</p>
            </div>
          )}
        </div>

        {/* Desktop Table */}
        <div className={cn("bg-white border border-[#E2DDD1] rounded-2xl overflow-hidden shadow-sm overflow-x-auto mt-6", forceTableView ? "block" : "hidden md:block")}>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F9F7F2] text-[#70695E] text-[10px] font-bold uppercase tracking-wider border-b border-[#E2DDD1]">
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Chauffeur</th>
                <th className="px-4 py-3 text-right">Montant Reçu</th>
                <th className="px-4 py-3 text-right">Montant Prévu</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Méthode</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-[#F0EDE4]">
              {/* Quick Add Row */}
              <tr className="bg-[#829379]/5 border-b-2 border-[#829379]/20">
                <td colSpan={8} className="p-0">
                  <form className="flex w-full items-center" onSubmit={async (e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    const amount = Number(formData.get('amount'));
                    const expectedAmount = Number(formData.get('expectedAmount')) || 26000;
                    let status: PaymentStatus = 'completed';
                    if (amount < expectedAmount) status = 'partial';
                    const paymentData = {
                      driverId: formData.get('driverId') as string,
                      amount, expectedAmount,
                      date: formData.get('date') as string || new Date().toISOString(),
                      status,
                      method: formData.get('method') as PaymentMethod,
                      type: formData.get('type') as any,
                      reference: '', note: ''
                    };
                    try {
                      await fleetService.addPayment(paymentData);
                      e.currentTarget.reset();
                    } catch (error) {
                      console.error(error);
                    }
                  }}>
                    <table className="w-full text-left">
                      <tbody>
                        <tr>
                          <td className="px-4 py-2 w-[120px]">
                            <input name="date" type="date" defaultValue={new Date().toISOString().split('T')[0]} required className="w-full bg-white border border-[#D9D4C7] rounded px-2 py-1.5 text-xs focus:outline-none focus:border-[#829379]" />
                          </td>
                          <td className="px-4 py-2 w-[200px]">
                            <select name="driverId" required className="w-full bg-white border border-[#D9D4C7] rounded px-2 py-1.5 text-xs focus:outline-none focus:border-[#829379]">
                              <option value="">Chauffeur...</option>
                              {drivers.filter(d => d.status === 'active').map(d => (
                                <option key={d.id} value={d.id}>{d.firstName} {d.lastName}</option>
                              ))}
                              <option value="autre">Autre / Inconnu</option>
                            </select>
                          </td>
                          <td className="px-4 py-2 w-[120px]">
                            <input name="amount" type="number" step="1000" placeholder="Ex: 26000" required className="w-full bg-white border border-[#D9D4C7] rounded px-2 py-1.5 text-xs text-right focus:outline-none focus:border-[#829379]" />
                          </td>
                          <td className="px-4 py-2 w-[120px]">
                            <input name="expectedAmount" type="number" step="1000" defaultValue={26000} required className="w-full bg-white border border-[#D9D4C7] rounded px-2 py-1.5 text-xs text-right focus:outline-none focus:border-[#829379]" />
                          </td>
                          <td className="px-4 py-2 w-[110px]">
                            <select name="type" required className="w-full bg-white border border-[#D9D4C7] rounded px-2 py-1.5 text-xs focus:outline-none focus:border-[#829379]">
                              <option value="rent">Loyer</option>
                              <option value="deposit">Caution</option>
                              <option value="fine">Amende</option>
                              <option value="other">Autre</option>
                            </select>
                          </td>
                          <td className="px-4 py-2 w-[120px]">
                            <select name="method" required className="w-full bg-white border border-[#D9D4C7] rounded px-2 py-1.5 text-xs focus:outline-none focus:border-[#829379]">
                              <option value="cash">Espèces</option>
                              <option value="mobile_money">Mobile Money</option>
                              <option value="transfer">Virement</option>
                            </select>
                          </td>
                          <td className="px-4 py-2 w-[100px]">
                            <span className="text-[10px] text-[#9A9388] font-medium italic">Auto</span>
                          </td>
                          <td className="px-4 py-2 w-[100px] text-center">
                            <button type="submit" className="bg-[#829379] text-white p-1.5 rounded hover:bg-[#708266] transition-colors shadow-sm" title="Ajouter">
                              <Plus className="w-4 h-4 mx-auto" />
                            </button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </form>
                </td>
              </tr>

              {/* Data Rows */}
              {filteredPayments.map((payment) => {
                const driver = getDriver(payment.driverId);
                const config = getStatusConfig(payment.status);
                const MethodIcon = getMethodIcon(payment.method);
                return (
                  <tr key={payment.id} className="hover:bg-[#F9F7F2]/50 transition-colors group">
                    <td className="px-4 py-3 text-xs font-medium text-[#70695E]">
                      {formatDate(payment.date)}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs font-bold text-[#2D2A26]">
                        <span className="font-bold">{driver ? `${driver.firstName} ${driver.lastName}` : (payment.driverId === 'autre' ? 'Autre / Inconnu' : 'Inconnu')}</span>
                      </p>
                      {getDriverVehiclePlate(payment.driverId) && (
                        <p className="text-[10px] text-[#829379] font-bold uppercase tracking-widest mt-0.5">{getDriverVehiclePlate(payment.driverId)}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs font-bold text-right text-[#2D2A26]">
                      {payment.amount.toLocaleString()} Ar
                    </td>
                    <td className="px-4 py-3 text-xs font-medium text-right text-[#9A9388]">
                      {payment.expectedAmount ? `${payment.expectedAmount.toLocaleString()} Ar` : '-'}
                      {payment.expectedAmount && payment.expectedAmount > payment.amount && (
                        <span className="block text-[10px] text-[#D97757] font-bold">
                          Reste: {(payment.expectedAmount - payment.amount).toLocaleString()} Ar
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-[#F0EDE4] text-[#70695E] rounded text-[9px] font-bold uppercase tracking-wider">
                        {payment.type === 'rent' ? 'Loyer' : payment.type === 'deposit' ? 'Caution' : payment.type === 'fine' ? 'Amende' : 'Autre'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                       <div className="flex items-center gap-1.5">
                         <MethodIcon className="w-3.5 h-3.5 text-[#829379]" />
                         <span className="text-[10px] font-bold text-[#2D2A26] capitalize">
                           {payment.method === 'cash' ? 'Espèces' : payment.method === 'transfer' ? 'Virement' : 'Mobile Money'}
                         </span>
                       </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className={cn("inline-flex items-center gap-1 px-2 py-1 rounded-full border", config.bg, config.border)}>
                        <config.icon className={cn("w-3 h-3", config.color)} />
                        <span className={cn("text-[9px] font-bold uppercase tracking-wider", config.color)}>
                          {config.label}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center relative">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedPayment(expandedPayment === payment.id ? null : payment.id);
                        }}
                        className="p-1.5 text-[#9A9388] hover:text-[#2D2A26] hover:bg-[#F0EDE4] rounded-lg transition-colors inline-flex opacity-0 group-hover:opacity-100"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      <AnimatePresence>
                        {expandedPayment === payment.id && (
                           <motion.div
                             initial={{ opacity: 0, scale: 0.95, y: -10 }}
                             animate={{ opacity: 1, scale: 1, y: 0 }}
                             exit={{ opacity: 0, scale: 0.95, y: -10 }}
                             className="absolute right-full mr-2 top-0 z-10 w-48 bg-white border border-[#E2DDD1] rounded-xl shadow-xl overflow-hidden py-2 text-left"
                             onClick={(e) => e.stopPropagation()}
                           >
                             <div className="px-4 py-2">
                               <p className="text-[10px] font-bold text-[#9A9388] uppercase tracking-widest mb-1">Référence</p>
                               <p className="text-xs font-mono text-[#2D2A26] truncate">{payment.reference || 'N/A'}</p>
                             </div>
                             {payment.note && (
                               <div className="px-4 py-2 border-t border-[#F0EDE4]">
                                 <p className="text-[10px] font-bold text-[#9A9388] uppercase tracking-widest mb-1">Note</p>
                                 <p className="text-xs text-[#70695E] line-clamp-3">{payment.note}</p>
                               </div>
                             )}
                             <div className="h-px bg-[#F0EDE4] my-1" />
                             <button
                               onClick={() => { setEditingPayment(payment); setIsAdding(true); setExpandedPayment(null); }}
                               className="w-full px-4 py-2 text-left text-xs font-bold text-[#2D2A26] hover:bg-[#F9F7F2] flex items-center gap-3 transition-colors"
                             >
                               <MoreVertical className="w-4 h-4" />
                               MODIFIER
                             </button>
                             <button
                               onClick={async () => {
                                 if (window.confirm('Voulez-vous vraiment supprimer ce paiement ?')) {
                                   await fleetService.deletePayment(payment.id);
                                 }
                                 setExpandedPayment(null);
                               }}
                               className="w-full px-4 py-2 text-left text-xs font-bold text-red-500 hover:bg-red-50 flex items-center gap-3 transition-colors"
                             >
                               <XCircle className="w-4 h-4" />
                               SUPPRIMER
                             </button>
                           </motion.div>
                        )}
                      </AnimatePresence>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredPayments.length === 0 && (
            <div className="py-12 text-center">
              <DollarSign className="w-12 h-12 text-[#E2DDD1] mx-auto mb-3" />
              <p className="text-[#9A9388] font-medium text-sm">Aucun paiement correspondant</p>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setIsAdding(false); setEditingPayment(null); }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[40px] p-5 sm:p-8 shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <h2 className="text-2xl font-black mb-8 text-[#2D2A26]">{editingPayment ? 'Modifier Paiement' : 'Nouveau Paiement'}</h2>
              <form className="space-y-6" onSubmit={async (e) => { 
                e.preventDefault(); 
                const formData = new FormData(e.currentTarget);
                const amount = Number(formData.get('amount'));
                const expectedAmount = Number(formData.get('expectedAmount')) || 26000;
                
                let status: PaymentStatus = 'completed';
                if (amount < expectedAmount) {
                  status = 'partial';
                }

                const paymentData = {
                  driverId: formData.get('driverId') as string,
                  amount: amount,
                  expectedAmount: expectedAmount,
                  date: formData.get('date') as string || new Date().toISOString(),
                  status: status,
                  method: formData.get('method') as PaymentMethod,
                  type: formData.get('type') as any,
                  reference: formData.get('reference') as string,
                  note: formData.get('note') as string
                };
                
                if (editingPayment) {
                  await fleetService.updatePayment(editingPayment.id, paymentData);
                } else {
                  await fleetService.addPayment(paymentData);
                }
                setIsAdding(false); 
                setEditingPayment(null);
              }}>
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#9A9388] ml-1">Chauffeur</label>
                    <select name="driverId" required defaultValue={editingPayment?.driverId || ''} className="w-full px-4 py-3 bg-[#F9F7F2] border border-[#D9D4C7] rounded-xl focus:outline-none font-medium">
                      <option value="">Sélectionner un chauffeur</option>
                      {drivers.filter(d => d.status === 'active' || d.id === editingPayment?.driverId).map(d => (
                        <option key={d.id} value={d.id}>{d.firstName} {d.lastName}</option>
                      ))}
                      <option value="autre">Autre / Inconnu</option>
                    </select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-[#9A9388] ml-1">Montant Reçu (Ar)</label>
                      <input name="amount" required type="number" step="1000" defaultValue={editingPayment?.amount || ''} className="w-full px-4 py-3 bg-[#F9F7F2] border border-[#D9D4C7] rounded-xl focus:outline-none font-medium" placeholder="Ex: 50000" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-[#9A9388] ml-1">Montant Prévu (Ar)</label>
                      <input name="expectedAmount" type="number" step="1000" defaultValue={editingPayment?.expectedAmount || 26000} className="w-full px-4 py-3 bg-[#F9F7F2] border border-[#D9D4C7] rounded-xl focus:outline-none font-medium" placeholder="Par défaut: 26000" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-[#9A9388] ml-1">Méthode</label>
                      <select name="method" required defaultValue={editingPayment?.method || 'cash'} className="w-full px-4 py-3 bg-[#F9F7F2] border border-[#D9D4C7] rounded-xl focus:outline-none font-medium">
                        <option value="cash">Espèces</option>
                        <option value="transfer">Virement</option>
                        <option value="mobile_money">Mobile Money</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-[#9A9388] ml-1">Type</label>
                      <select name="type" required defaultValue={editingPayment?.type || 'rent'} className="w-full px-4 py-3 bg-[#F9F7F2] border border-[#D9D4C7] rounded-xl focus:outline-none font-medium">
                        <option value="rent">Loyer</option>
                        <option value="deposit">Caution</option>
                        <option value="fine">Amende</option>
                        <option value="other">Autre</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-[#9A9388] ml-1">Date</label>
                      <input name="date" type="date" defaultValue={editingPayment?.date?.split('T')[0] || ''} className="w-full px-4 py-3 bg-[#F9F7F2] border border-[#D9D4C7] rounded-xl focus:outline-none font-medium" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-[#9A9388] ml-1">Référence / Bordereau</label>
                      <input name="reference" type="text" defaultValue={editingPayment?.reference || ''} className="w-full px-4 py-3 bg-[#F9F7F2] border border-[#D9D4C7] rounded-xl focus:outline-none font-medium" placeholder="Ex: TXN-1234..." />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#9A9388] ml-1">Notes</label>
                    <textarea name="note" defaultValue={editingPayment?.note || ''} className="w-full px-4 py-3 bg-[#F9F7F2] border border-[#D9D4C7] rounded-xl focus:outline-none font-medium h-24 resize-none" placeholder="Commentaires supplémentaires..."></textarea>
                  </div>
                </div>

                <div className="flex gap-4 mt-8 pt-4">
                  <button 
                    type="button"
                    onClick={() => { setIsAdding(false); setEditingPayment(null); }}
                    className="flex-1 py-4 text-sm font-bold text-[#9A9388] hover:text-[#2D2A26] transition-colors"
                  >
                    Annuler
                  </button>
                  <button 
                    type="submit"
                    className="flex-[2] py-4 bg-[#829379] text-white rounded-2xl text-sm font-bold shadow-lg shadow-[#829379]/20 active:scale-95 transition-all"
                  >
                    {editingPayment ? 'Enregistrer les modifications' : 'Enregistrer Transaction'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
