import { useState, useEffect } from 'react';
import { 
  Car, 
  Users, 
  TrendingUp, 
  AlertTriangle,
  Calendar,
  Clock,
  CheckCircle2,
  Wrench,
  Receipt
} from 'lucide-react';
import { motion } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend,
  BarProps
} from 'recharts';
import { fleetService } from '../services/fleetService';
import { Vehicle, Driver, Payment, MaintenanceRecord, Expense, Assignment } from '../types';
import { format, isAfter, addDays, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '../lib/utils';

export default function Dashboard() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceRecord[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);

  useEffect(() => {
    const unsubV = fleetService.subscribeVehicles(setVehicles);
    const unsubD = fleetService.subscribeDrivers(setDrivers);
    const unsubP = fleetService.subscribePayments(setPayments);
    const unsubM = fleetService.subscribeAllMaintenance(setMaintenance);
    const unsubE = fleetService.subscribeExpenses(setExpenses);
    const unsubA = fleetService.subscribeAssignments(setAssignments);
    return () => {
      unsubV();
      unsubD();
      unsubP();
      unsubM();
      unsubE();
      unsubA();
    };
  }, []);

  const totalRevenue = payments.reduce((acc, p) => acc + p.amount, 0);
  const totalExpenses = maintenance.reduce((acc, m) => acc + (m.cost || 0), 0);
  const totalOtherExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);
  const netProfit = totalRevenue - totalExpenses - totalOtherExpenses;

  const getCurrentDriver = (vehicleId: string) => {
    const activeAssignment = assignments.find(a => a.vehicleId === vehicleId && a.status === 'active');
    if (!activeAssignment) return null;
    return drivers.find(d => d.id === activeAssignment.driverId);
  };

  const getComputedVehicleStatus = (vehicle: Vehicle) => {
    if (vehicle.status === 'maintenance' || vehicle.status === 'retired') return vehicle.status;
    const driver = getCurrentDriver(vehicle.id);
    if (!driver || driver.status !== 'active') return 'inactive';
    return 'active';
  };

  const activeVehicles = vehicles.filter(v => getComputedVehicleStatus(v) === 'active').length;
  const maintenanceNeeded = vehicles.filter(v => getComputedVehicleStatus(v) === 'maintenance').length;
  
  const safeFormat = (dateStr: string | undefined | null, formatStr: string) => {
    if (!dateStr) return 'N/A';
    try {
      const date = parseISO(dateStr);
      if (isNaN(date.getTime())) return 'N/A';
      return format(date, formatStr, { locale: fr });
    } catch (e) {
      return 'N/A';
    }
  };

  // Alerts
  const getPaymentAlerts = () => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sun, 1 = Mon, 2 = Tue, 3 = Wed, 4 = Thu, 5 = Fri, 6 = Sat
    
    // Only check on Tuesday (2), Thursday (4) and Saturday (6)
    if (![2, 4, 6].includes(dayOfWeek)) return [];

    const todayStr = format(today, 'yyyy-MM-dd');
    const activeDrivers = drivers.filter(d => d.status === 'active');
    
    return activeDrivers.filter(driver => {
      const hasPaidToday = payments.some(p => 
        p.driverId === driver.id && 
        p.date.startsWith(todayStr)
      );
      return !hasPaidToday;
    }).map(driver => ({
      type: 'd-payment',
      title: `Paiement en attente : ${driver.firstName} ${driver.lastName}`,
      date: today.toISOString(),
      priority: 'high'
    }));
  };

  const alerts = [
    ...vehicles.filter(v => {
      if (!v.insuranceExpiry) return false;
      try {
        const exp = parseISO(v.insuranceExpiry);
        if (isNaN(exp.getTime())) return false;
        return isAfter(addDays(new Date(), 30), exp);
      } catch (e) { return false; }
    }).map(v => ({ 
      type: 'v-insurance', 
      title: `Assurance expirée : ${v.licensePlate}`, 
      date: v.insuranceExpiry,
      priority: 'high'
    })),
    ...vehicles.filter(v => {
      if (!v.lastMaintenance) return false;
      try {
        const maintenanceDate = parseISO(v.lastMaintenance);
        if (isNaN(maintenanceDate.getTime())) return false;
        return isAfter(new Date(), addDays(maintenanceDate, 21));
      } catch (e) { return false; }
    }).map(v => ({ 
      type: 'v-maintenance', 
      title: `Vidange à prévoir : ${v.licensePlate}`, 
      date: v.lastMaintenance,
      priority: 'medium'
    })),
    ...getPaymentAlerts()
  ].sort((a, b) => {
    try {
      const da = parseISO(a.date).getTime();
      const db = parseISO(b.date).getTime();
      return (isNaN(da) ? 0 : da) - (isNaN(db) ? 0 : db);
    } catch(e) { return 0; }
  });

  // Chart data: Group by date and sum amounts
  interface ChartEntry { name: string; revenue: number; expenses: number; rawDate: string; }
  const chartData = (Object.values(
    [...payments, ...maintenance].reduce((acc, item) => {
      const dateKey = safeFormat(item.date, 'yyyy-MM-dd');
      if (dateKey === 'N/A') return acc;
      
      if (!acc[dateKey]) {
        acc[dateKey] = { 
          name: safeFormat(item.date, 'dd MMM'), 
          revenue: 0, 
          expenses: 0,
          rawDate: dateKey 
        };
      }
      
      if ('amount' in item && !('category' in item)) { // Payment
        acc[dateKey].revenue += (item as Payment).amount;
      } else if ('cost' in item) { // Maintenance
        acc[dateKey].expenses += (item as MaintenanceRecord).cost || 0;
      } else if ('category' in item) { // Expense
        acc[dateKey].expenses += (item as Expense).amount;
      }
      
      return acc;
    }, {} as Record<string, ChartEntry>)
  ) as ChartEntry[])
  .sort((a, b) => a.rawDate.localeCompare(b.rawDate))
  .slice(-10); // Show last 10 days with activity

  const stats = [
    { label: 'Flotte Active', value: `${activeVehicles} / ${vehicles.length}`, icon: Car, color: 'text-[#829379]', bg: 'bg-[#F0EDE4]' },
    { label: 'Chauffeurs Actifs', value: drivers.filter(d => d.status === 'active').length, icon: Users, color: 'text-[#829379]', bg: 'bg-[#F0EDE4]' },
    { label: 'Entretien', value: `${totalExpenses.toLocaleString()} Ar`, icon: Wrench, color: 'text-[#D97757]', bg: 'bg-[#FFF5F2]' },
    { label: 'Frais Généraux', value: `${totalOtherExpenses.toLocaleString()} Ar`, icon: Receipt, color: 'text-[#C18C5D]', bg: 'bg-[#FEF9EC]' },
    { label: 'Bénéfice Net', value: `${netProfit.toLocaleString()} Ar`, icon: TrendingUp, color: 'text-[#829379]', bg: 'bg-[#F0EDE4]' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-[#2D2A26]">Aperçu Global</h2>
        <p className="text-[#70695E] mt-1 text-sm font-medium">Statistiques et alertes de la flotte</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={stat.label}
            className="p-5 bg-white border border-[#E2DDD1] rounded-2xl shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-2">
              <p className="text-[10px] font-bold text-[#9A9388] uppercase tracking-wider">{stat.label}</p>
              <stat.icon className={cn("w-4 h-4", stat.color)} />
            </div>
            <p className="text-2xl font-bold text-[#2D2A26]">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white border border-[#E2DDD1] rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-semibold text-[#2D2A26]">État des Paiements</h3>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0EDE4" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9A9388' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9A9388' }} />
                <Tooltip 
                  cursor={{ fill: '#F9F7F2' }}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #E2DDD1', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '20px' }} />
                <Bar dataKey="revenue" name="Revenus" fill="#829379" radius={[4, 4, 0, 0]} barSize={24} />
                <Bar dataKey="expenses" name="Dépenses" fill="#D97757" radius={[4, 4, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Alerts & Notifications */}
        <div className="bg-white border border-[#E2DDD1] rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-2 h-2 rounded-full bg-[#D97757]" />
            <h3 className="font-semibold text-[#2D2A26] text-sm">Alertes Prioritaires</h3>
          </div>
          
          <div className="space-y-3">
            {alerts.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle2 className="w-10 h-10 text-[#829379]/20 mx-auto mb-3" />
                <p className="text-[#9A9388] text-xs">Tout est en règle</p>
              </div>
            ) : (
              alerts.map((alert, i) => (
                <div key={i} className="flex gap-3 items-start p-3 rounded-xl hover:bg-[#F9F7F2] transition-colors border border-transparent hover:border-[#E2DDD1] group">
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                    alert.priority === 'high' ? "bg-[#FFF5F2] text-[#D97757]" : "bg-[#FEF9EC] text-[#B3934B]"
                  )}>
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-[#2D2A26] line-clamp-1">{alert.title}</h4>
                    <p className="text-[10px] text-[#9A9388] mt-0.5">
                      {safeFormat(alert.date, 'dd MMM yyyy')}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          <button className="w-full mt-6 py-3 border border-[#D9D4C7] rounded-xl text-xs font-semibold text-[#70695E] hover:bg-[#F9F7F2] transition-colors">
            Historique Complet
          </button>
        </div>
      </div>
    </div>
  );
}
