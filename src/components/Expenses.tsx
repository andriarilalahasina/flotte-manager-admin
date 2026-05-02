import { useState, useEffect } from 'react';
import { 
  Receipt, 
  Plus, 
  Search, 
  MoreVertical, 
  XCircle,
  Building2,
  Users,
  Megaphone,
  Scale,
  Monitor,
  HelpCircle,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { fleetService } from '../services/fleetService';
import { Expense, ExpenseCategory } from '../types';
import { cn } from '../lib/utils';
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { fr } from 'date-fns/locale';

const CATEGORY_CONFIG: Record<ExpenseCategory, { label: string; icon: any; color: string; bgColor: string }> = {
  office: { label: 'Bureau & Locaux', icon: Building2, color: 'text-blue-600', bgColor: 'bg-blue-50' },
  salary: { label: 'Salaires & Primes', icon: Users, color: 'text-purple-600', bgColor: 'bg-purple-50' },
  marketing: { label: 'Marketing & Pub', icon: Megaphone, color: 'text-pink-600', bgColor: 'bg-pink-50' },
  legal: { label: 'Juridique & Admin', icon: Scale, color: 'text-amber-600', bgColor: 'bg-amber-50' },
  equipment: { label: 'Équipement', icon: Monitor, color: 'text-cyan-600', bgColor: 'bg-cyan-50' },
  other: { label: 'Autre', icon: HelpCircle, color: 'text-gray-600', bgColor: 'bg-gray-50' }
};

export default function Expenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<ExpenseCategory | 'all'>('all');
  const [expandedExpense, setExpandedExpense] = useState<string | null>(null);
  
  const [isAdding, setIsAdding] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [forceTableView, setForceTableView] = useState(false);

  // Quick Add State
  const [quickAddData, setQuickAddData] = useState({
    amount: '',
    category: '' as ExpenseCategory | '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    const unsub = fleetService.subscribeExpenses(setExpenses);
    return () => unsub();
  }, []);

  const filteredExpenses = expenses
    .filter(e => {
      const matchesSearch = e.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           (e.reference || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterCategory === 'all' || e.category === filterCategory;
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const currentMonthExpenses = expenses.filter(e => {
    const date = parseISO(e.date);
    const now = new Date();
    return isWithinInterval(date, { start: startOfMonth(now), end: endOfMonth(now) });
  });

  const totalCurrentMonth = currentMonthExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Find biggest category this month
  const categoryTotals = currentMonthExpenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {} as Record<string, number>);
  
  let biggestCategory = null;
  let biggestCategoryAmount = 0;
  Object.entries(categoryTotals).forEach(([cat, amount]) => {
    if (amount > biggestCategoryAmount) {
      biggestCategoryAmount = amount;
      biggestCategory = cat as ExpenseCategory;
    }
  });

  const formatDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), 'dd MMM yyyy', { locale: fr });
    } catch (e) {
      return dateStr;
    }
  };

  const handleQuickAdd = async () => {
    if (!quickAddData.amount || !quickAddData.category || !quickAddData.description) {
      toast.error("Veuillez remplir les champs obligatoires (Catégorie, Montant, Description)");
      return;
    }

    try {
      await fleetService.addExpense({
        amount: Number(quickAddData.amount),
        category: quickAddData.category,
        description: quickAddData.description,
        date: quickAddData.date,
        reference: ''
      });
      toast.success("Dépense ajoutée avec succès");
      setQuickAddData({
        amount: '',
        category: '',
        description: '',
        date: new Date().toISOString().split('T')[0]
      });
    } catch (error) {
      toast.error("Erreur lors de l'ajout");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-[#2D2A26]">Frais Généraux</h2>
          <p className="text-[#70695E] mt-1 text-sm font-medium">Suivi des dépenses de fonctionnement de l'entreprise</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="hidden sm:flex bg-[#829379] text-white px-6 py-3 rounded-xl items-center gap-2 font-semibold hover:bg-[#708266] transition-all shadow-md active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Nouvelle Dépense
        </button>
      </div>

      {/* FAB Mobile */}
      <button 
        onClick={() => setIsAdding(true)}
        className="fixed bottom-6 right-6 z-40 sm:hidden bg-[#829379] text-white p-4 rounded-full shadow-xl active:scale-95 transition-transform"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-[#E2DDD1] rounded-3xl p-6 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-[#9A9388] uppercase tracking-widest mb-1">Total ce mois</p>
            <p className="text-3xl font-black text-[#2D2A26]">{totalCurrentMonth.toLocaleString()} Ar</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#F0EDE4] flex items-center justify-center text-[#829379]">
            <Receipt className="w-6 h-6" />
          </div>
        </div>
        <div className="bg-white border border-[#E2DDD1] rounded-3xl p-6 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-[#9A9388] uppercase tracking-widest mb-1">Pôle de dépense principal</p>
            {biggestCategory ? (
              <div className="flex items-center gap-2 mt-1">
                <span className={cn("px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider", CATEGORY_CONFIG[biggestCategory].bgColor, CATEGORY_CONFIG[biggestCategory].color)}>
                  {CATEGORY_CONFIG[biggestCategory].label}
                </span>
                <span className="text-lg font-bold text-[#2D2A26]">{biggestCategoryAmount.toLocaleString()} Ar</span>
              </div>
            ) : (
              <p className="text-lg font-medium text-[#70695E]">Aucune dépense ce mois</p>
            )}
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#F9F7F2] flex items-center justify-center text-[#D97757]">
            <Monitor className="w-6 h-6" />
          </div>
        </div>
      </div>

      <div className="bg-white border border-[#E2DDD1] rounded-[40px] p-6 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-[2]">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-[#9A9388] w-5 h-5" />
            <input 
              type="text" 
              placeholder="Rechercher une dépense (description, réf)..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-14 pr-4 py-4 bg-[#F9F7F2] border border-[#D9D4C7] rounded-2xl focus:outline-none text-sm font-medium"
            />
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-between mb-8">
          <div className="flex gap-2 overflow-x-auto pb-2 flex-1">
            <button
              onClick={() => setFilterCategory('all')}
              className={cn(
                "px-6 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all shrink-0",
                filterCategory === 'all' ? "bg-[#2D2A26] text-white shadow-lg" : "bg-[#F0EDE4] text-[#70695E] hover:bg-[#E2DDD1]"
              )}
            >
              Toutes les catégories
            </button>
            {(Object.keys(CATEGORY_CONFIG) as ExpenseCategory[]).map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={cn(
                  "px-6 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all shrink-0 flex items-center gap-2",
                  filterCategory === cat ? "bg-[#2D2A26] text-white shadow-lg" : "bg-[#F0EDE4] text-[#70695E] hover:bg-[#E2DDD1]"
                )}
              >
                {CATEGORY_CONFIG[cat].label}
              </button>
            ))}
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
          {filteredExpenses.map((expense) => {
            const config = CATEGORY_CONFIG[expense.category] || CATEGORY_CONFIG.other;
            const isExpanded = expandedExpense === expense.id;

            return (
              <motion.div
                layout
                key={expense.id}
                className={cn(
                  "border transition-all duration-300 relative overflow-hidden",
                  isExpanded ? "rounded-[32px] border-[#829379] bg-[#F9F7F2]/30 p-6" : "rounded-2xl border-transparent hover:border-[#E2DDD1] hover:bg-[#F9F7F2]/50 p-4"
                )}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center transition-colors shadow-sm shrink-0",
                      config.bgColor, config.color
                    )}>
                      <config.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-[#2D2A26] text-sm line-clamp-1">{expense.description}</h4>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                        <span className={cn("text-[10px] font-bold uppercase tracking-wider", config.color)}>
                          {config.label}
                        </span>
                        <span className="hidden sm:block w-1 h-1 rounded-full bg-[#E2DDD1]" />
                        <span className="text-[10px] text-[#9A9388] font-bold uppercase tracking-widest">
                          {formatDate(expense.date)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 pt-3 sm:pt-0 border-[#F0EDE4]">
                    <div className="text-left sm:text-right">
                      <p className="text-lg font-black text-[#2D2A26]">
                        {expense.amount.toLocaleString()} Ar
                      </p>
                    </div>
                    <button 
                      onClick={() => setExpandedExpense(isExpanded ? null : expense.id)}
                      className="p-2 rounded-xl bg-[#F0EDE4] text-[#70695E] hover:bg-[#E2DDD1] transition-colors"
                    >
                      <MoreVertical className="w-4 h-4" />
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
                      <div className="pt-6 mt-6 border-t border-[#E2DDD1] flex gap-2 justify-end">
                        <button 
                          onClick={() => { setEditingExpense(expense); setIsAdding(true); }}
                          className="px-4 py-2 bg-[#F9F7F2] text-[#70695E] rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-[#E2DDD1]"
                        >
                          Modifier
                        </button>
                        <button 
                          onClick={async () => {
                            if (window.confirm('Supprimer cette dépense ?')) {
                              await fleetService.deleteExpense(expense.id);
                            }
                          }}
                          className="px-4 py-2 bg-red-50 text-red-600 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-red-100 flex items-center gap-2"
                        >
                          <XCircle className="w-3 h-3" />
                          Supprimer
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        {/* Desktop Table View */}
        <div className={cn("bg-white border border-[#E2DDD1] rounded-2xl overflow-hidden shadow-sm overflow-x-auto mt-6", forceTableView ? "block" : "hidden md:block")}>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F9F7F2] text-[#70695E] text-[10px] font-bold uppercase tracking-wider border-b border-[#E2DDD1]">
                <th className="px-4 py-3 w-[140px]">Date</th>
                <th className="px-4 py-3 w-[180px]">Catégorie</th>
                <th className="px-4 py-3 min-w-[200px]">Description</th>
                <th className="px-4 py-3 w-[150px] text-right">Montant</th>
                <th className="px-4 py-3 w-[80px] text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0EDE4]">
              {/* Quick Add Row */}
              <tr className="bg-[#F9F7F2]/50 hover:bg-[#F9F7F2] transition-colors">
                <td className="px-4 py-2">
                  <input 
                    type="date"
                    value={quickAddData.date}
                    onChange={(e) => setQuickAddData({...quickAddData, date: e.target.value})}
                    className="w-full p-2 bg-transparent border border-[#E2DDD1] rounded-lg focus:outline-none text-[#2D2A26] font-medium text-xs"
                  />
                </td>
                <td className="px-4 py-2">
                  <select 
                    value={quickAddData.category}
                    onChange={(e) => setQuickAddData({...quickAddData, category: e.target.value as any})}
                    className="w-full p-2 bg-transparent border border-[#E2DDD1] rounded-lg focus:outline-none text-[#2D2A26] font-medium text-xs"
                  >
                    <option value="">Sélectionner...</option>
                    {(Object.keys(CATEGORY_CONFIG) as ExpenseCategory[]).map(cat => (
                      <option key={cat} value={cat}>{CATEGORY_CONFIG[cat].label}</option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-2">
                  <input 
                    type="text" 
                    placeholder="Description de la dépense..."
                    value={quickAddData.description}
                    onChange={(e) => setQuickAddData({...quickAddData, description: e.target.value})}
                    onKeyDown={(e) => e.key === 'Enter' && handleQuickAdd()}
                    className="w-full p-2 bg-transparent border border-[#E2DDD1] rounded-lg focus:outline-none placeholder:text-[#9A9388] font-medium text-xs"
                  />
                </td>
                <td className="px-4 py-2">
                  <div className="relative">
                    <input 
                      type="number" 
                      placeholder="0"
                      value={quickAddData.amount}
                      onChange={(e) => setQuickAddData({...quickAddData, amount: e.target.value})}
                      onKeyDown={(e) => e.key === 'Enter' && handleQuickAdd()}
                      className="w-full p-2 pr-8 bg-transparent border border-[#E2DDD1] rounded-lg focus:outline-none text-right font-bold text-[#2D2A26] text-xs"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#9A9388]">Ar</span>
                  </div>
                </td>
                <td className="px-4 py-2 text-center">
                  <button 
                    onClick={handleQuickAdd}
                    className="p-2 bg-[#829379] text-white rounded-lg hover:bg-[#708266] transition-colors"
                    title="Ajouter"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>

              {/* Data Rows */}
              {filteredExpenses.map((expense) => {
                const config = CATEGORY_CONFIG[expense.category] || CATEGORY_CONFIG.other;
                const isExpanded = expandedExpense === expense.id;

                return (
                  <tr key={expense.id} className="hover:bg-[#F9F7F2]/50 transition-colors group relative">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-[#9A9388]" />
                        <span className="text-xs text-[#70695E] font-medium">{formatDate(expense.date)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className={cn("inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider", config.bgColor, config.color)}>
                        <config.icon className="w-3 h-3" />
                        {config.label}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs font-medium text-[#2D2A26] line-clamp-1">{expense.description}</p>
                      {expense.reference && <p className="text-[10px] text-[#9A9388] mt-0.5">Réf: {expense.reference}</p>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-bold text-[#2D2A26] text-sm">{expense.amount.toLocaleString()} Ar</span>
                    </td>
                    <td className="px-4 py-3 text-center relative">
                      <button 
                        onClick={() => setExpandedExpense(isExpanded ? null : expense.id)}
                        className="p-1.5 text-[#9A9388] hover:text-[#2D2A26] hover:bg-[#F0EDE4] rounded-lg transition-colors"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      
                      <AnimatePresence>
                        {isExpanded && (
                           <motion.div
                             initial={{ opacity: 0, scale: 0.95, y: -10 }}
                             animate={{ opacity: 1, scale: 1, y: 0 }}
                             exit={{ opacity: 0, scale: 0.95, y: -10 }}
                             className="absolute right-10 top-2 w-48 bg-white rounded-2xl shadow-xl border border-[#E2DDD1] overflow-hidden z-20"
                           >
                             <button
                               onClick={() => { setEditingExpense(expense); setIsAdding(true); setExpandedExpense(null); }}
                               className="w-full px-4 py-3 text-left text-xs font-bold text-[#2D2A26] hover:bg-[#F9F7F2] flex items-center gap-3 transition-colors border-b border-[#F0EDE4]"
                             >
                               MODIFIER
                             </button>
                             <button
                               onClick={async () => {
                                 if (window.confirm('Voulez-vous vraiment supprimer cette dépense ?')) {
                                   await fleetService.deleteExpense(expense.id);
                                 }
                                 setExpandedExpense(null);
                               }}
                               className="w-full px-4 py-3 text-left text-xs font-bold text-red-500 hover:bg-red-50 flex items-center gap-3 transition-colors"
                             >
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
          {filteredExpenses.length === 0 && (
            <div className="py-12 text-center">
              <Receipt className="w-12 h-12 text-[#E2DDD1] mx-auto mb-3" />
              <p className="text-[#9A9388] font-medium text-sm">Aucune dépense enregistrée</p>
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
              onClick={() => { setIsAdding(false); setEditingExpense(null); }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[40px] p-5 sm:p-8 shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <h2 className="text-2xl font-black mb-8 text-[#2D2A26]">{editingExpense ? 'Modifier Dépense' : 'Nouvelle Dépense'}</h2>
              <form className="space-y-6" onSubmit={async (e) => { 
                e.preventDefault(); 
                const formData = new FormData(e.currentTarget);
                
                const expenseData = {
                  category: formData.get('category') as ExpenseCategory,
                  amount: Number(formData.get('amount')),
                  date: formData.get('date') as string,
                  description: formData.get('description') as string,
                  reference: formData.get('reference') as string
                };
                
                try {
                  if (editingExpense) {
                    await fleetService.updateExpense(editingExpense.id, expenseData);
                    toast.success("Dépense modifiée avec succès");
                  } else {
                    await fleetService.addExpense(expenseData);
                    toast.success("Dépense enregistrée");
                  }
                  setIsAdding(false); 
                  setEditingExpense(null);
                } catch (error) {
                  toast.error("Une erreur est survenue");
                }
              }}>
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#9A9388] ml-1">Catégorie</label>
                    <select name="category" required defaultValue={editingExpense?.category || ''} className="w-full px-4 py-3 bg-[#F9F7F2] border border-[#D9D4C7] rounded-xl focus:outline-none font-medium">
                      <option value="">Sélectionner une catégorie</option>
                      {(Object.keys(CATEGORY_CONFIG) as ExpenseCategory[]).map(cat => (
                        <option key={cat} value={cat}>{CATEGORY_CONFIG[cat].label}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-[#9A9388] ml-1">Date</label>
                      <input name="date" required type="date" defaultValue={editingExpense?.date || new Date().toISOString().split('T')[0]} className="w-full px-4 py-3 bg-[#F9F7F2] border border-[#D9D4C7] rounded-xl focus:outline-none font-medium text-sm" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-[#9A9388] ml-1">Montant (Ar)</label>
                      <input name="amount" required type="number" defaultValue={editingExpense?.amount} placeholder="0" className="w-full px-4 py-3 bg-[#F9F7F2] border border-[#D9D4C7] rounded-xl focus:outline-none font-black text-lg text-[#2D2A26]" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#9A9388] ml-1">Description</label>
                    <input name="description" required type="text" defaultValue={editingExpense?.description} placeholder="Ex: Achat fournitures de bureau" className="w-full px-4 py-3 bg-[#F9F7F2] border border-[#D9D4C7] rounded-xl focus:outline-none font-medium text-sm" />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#9A9388] ml-1">Référence (Optionnel)</label>
                    <input name="reference" type="text" defaultValue={editingExpense?.reference} placeholder="N° Facture, Reçu..." className="w-full px-4 py-3 bg-[#F9F7F2] border border-[#D9D4C7] rounded-xl focus:outline-none font-medium text-sm font-mono" />
                  </div>
                </div>

                <div className="flex gap-4 mt-8 pt-4 border-t border-[#F0EDE4]">
                  <button 
                    type="button"
                    onClick={() => { setIsAdding(false); setEditingExpense(null); }}
                    className="flex-1 py-4 text-sm font-bold text-[#9A9388] hover:text-[#2D2A26] transition-colors"
                  >
                    Annuler
                  </button>
                  <button 
                    type="submit"
                    className="flex-[2] py-4 bg-[#829379] text-white rounded-2xl text-sm font-bold shadow-lg shadow-[#829379]/20 active:scale-95 transition-all"
                  >
                    {editingExpense ? 'Mettre à jour' : 'Enregistrer'}
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
