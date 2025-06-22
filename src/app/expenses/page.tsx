'use client';

import { useState, useEffect, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { P_TRANSACTIONS } from '@/lib/placeholder-data';
import type { Transaction } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO, formatISO } from 'date-fns';
import { 
    PiggyBank, Loader2, TrendingUp, TrendingDown, Save, PlusCircle, Trash2, 
    Plane, Shirt, UtensilsCrossed, ShoppingBag, Bolt, HeartPulse, Ticket, MoreHorizontal, Salad, Users 
} from 'lucide-react';

const LOCAL_STORAGE_KEY_BUDGET = 'lifeos_budget';
const LOCAL_STORAGE_KEY_TRANSACTIONS = 'lifeos_transactions';
const TRANSACTION_CATEGORIES = ["Food", "Travel", "Shopping", "Utilities", "Health", "Entertainment", "Income", "Groceries", "Social", "Clothing", "Other"];

const categoryDetails: Record<string, { icon: React.ElementType, color: string }> = {
    'Travel': { icon: Plane, color: 'bg-yellow-100 text-yellow-800' },
    'Clothing': { icon: Shirt, color: 'bg-pink-100 text-pink-800' },
    'Food': { icon: UtensilsCrossed, color: 'bg-rose-100 text-rose-800' },
    'Shopping': { icon: ShoppingBag, color: 'bg-blue-100 text-blue-800' },
    'Utilities': { icon: Bolt, color: 'bg-orange-100 text-orange-800' },
    'Health': { icon: HeartPulse, color: 'bg-red-100 text-red-800' },
    'Entertainment': { icon: Ticket, color: 'bg-purple-100 text-purple-800' },
    'Income': { icon: TrendingUp, color: 'bg-green-100 text-green-800' },
    'Groceries': { icon: Salad, color: 'bg-lime-100 text-lime-800' },
    'Social': { icon: Users, color: 'bg-cyan-100 text-cyan-800' },
    'Other': { icon: MoreHorizontal, color: 'bg-gray-100 text-gray-800' },
    'Transport': { icon: Plane, color: 'bg-yellow-100 text-yellow-800' }, // Alias for Travel
};


const formatCurrency = (amountInCents: number) => `${(amountInCents / 100).toFixed(0)}`;

export default function ExpensesPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [monthlyBudget, setMonthlyBudget] = useState(5000000); // Default: 50,000.00 in cents
  const [isLoading, setIsLoading] = useState(true);
  const [budgetInput, setBudgetInput] = useState('');

  const { toast } = useToast();

  useEffect(() => {
    try {
      const storedTransactions = localStorage.getItem(LOCAL_STORAGE_KEY_TRANSACTIONS);
      setTransactions(storedTransactions ? JSON.parse(storedTransactions) : P_TRANSACTIONS);

      const storedBudget = localStorage.getItem(LOCAL_STORAGE_KEY_BUDGET);
      const budget = storedBudget ? parseInt(storedBudget, 10) : 5000000;
      setMonthlyBudget(budget);
      setBudgetInput((budget / 100).toFixed(2));

    } catch (error) {
      console.error("Failed to load data from localStorage", error);
      toast({ variant: 'destructive', title: "Error", description: "Could not load saved data." });
    }
    setIsLoading(false);
  }, [toast]);

  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem(LOCAL_STORAGE_KEY_TRANSACTIONS, JSON.stringify(transactions));
      localStorage.setItem(LOCAL_STORAGE_KEY_BUDGET, monthlyBudget.toString());
    }
  }, [transactions, monthlyBudget, isLoading]);

  const { totalIncome, totalExpenses, remainingBudget, budgetProgress } = useMemo(() => {
    const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const remaining = monthlyBudget - expenses;
    const progress = monthlyBudget > 0 ? Math.max(0, Math.min(100, (expenses / monthlyBudget) * 100)) : 0;
    return { totalIncome: income, totalExpenses: expenses, remainingBudget: remaining, budgetProgress: progress };
  }, [transactions, monthlyBudget]);
  
   const groupedTransactions = useMemo(() => {
    const sorted = [...transactions].sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());
    return sorted.reduce((acc, txn) => {
      const dateKey = format(parseISO(txn.date), 'yyyy-MM-dd');
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(txn);
      return acc;
    }, {} as Record<string, Transaction[]>);
  }, [transactions]);

  const handleSetBudget = () => {
    const budgetValue = parseFloat(budgetInput);
    if (isNaN(budgetValue) || budgetValue < 0) {
      toast({ title: "Invalid Budget", description: "Please enter a valid positive number.", variant: "destructive" });
      return;
    }
    const budgetInCents = Math.round(budgetValue * 100);
    setMonthlyBudget(budgetInCents);
    toast({ title: "Budget Updated", description: `Monthly budget set to ${formatCurrency(budgetInCents)}.` });
  };
  
  const handleDeleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
    toast({ title: "Transaction Deleted", description: "The transaction has been removed." });
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-2">Loading financial settings...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-6">
            <StatCard title="Total Income" amount={totalIncome} icon={TrendingUp} variant="income" />
            <StatCard title="Total Spent" amount={totalExpenses} icon={TrendingDown} variant="expense" />
            <StatCard title="Monthly Budget" amount={monthlyBudget} icon={PiggyBank} />
            <StatCard title="Remaining" amount={remainingBudget} variant={remainingBudget >= 0 ? 'income' : 'expense'} />
        </div>

        <Card>
            <CardHeader className="py-4 sm:py-4">
                <CardTitle className="text-lg">Budget Progress</CardTitle>
                <CardDescription>You've spent {formatCurrency(totalExpenses)} of your {formatCurrency(monthlyBudget)} budget.</CardDescription>
            </CardHeader>
            <CardContent className="pt-0 sm:pt-0">
                <Progress value={budgetProgress} />
                <p className="text-right text-sm text-muted-foreground mt-2">{budgetProgress.toFixed(0)}%</p>
            </CardContent>
            <CardFooter className="pt-0 sm:pt-0">
                 <div className="w-full space-y-2">
                    <label htmlFor="monthly-budget-input" className="text-sm font-medium">Set Your Monthly Budget:</label>
                    <div className="flex gap-2">
                        <Input id="monthly-budget-input" type="number" placeholder="e.g., 50000.00" value={budgetInput} onChange={(e) => setBudgetInput(e.target.value)} />
                        <Button onClick={handleSetBudget}><Save className="mr-2 h-4 w-4" />Set Budget</Button>
                    </div>
                </div>
            </CardFooter>
        </Card>

        <Card>
            <CardHeader className="flex flex-row items-center justify-between py-3 sm:py-3">
                <CardTitle className="text-lg">Recent Transactions</CardTitle>
                <TransactionDialog onSave={(newTxn) => setTransactions(prev => [newTxn, ...prev])}>
                    <Button><PlusCircle className="mr-2 h-4 w-4" />Add Transaction</Button>
                </TransactionDialog>
            </CardHeader>
            <CardContent className="pt-0 sm:pt-0">
                 {Object.keys(groupedTransactions).length > 0 ? (
                    <div className="space-y-4">
                        {Object.entries(groupedTransactions).map(([date, txns]) => {
                            const dailyTotal = txns.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
                            
                            return (
                                <div key={date}>
                                    <div className="flex justify-between items-center text-sm font-medium text-muted-foreground px-3 py-2 border-b bg-muted/50 rounded-t-md">
                                        <span>{format(parseISO(date), 'dd MMM, EEEE')}</span>
                                        <span>Expenses: {formatCurrency(dailyTotal)}</span>
                                    </div>
                                    <ul className="divide-y border-x border-b rounded-b-md">
                                        {txns.map((txn) => {
                                            const { icon: Icon, color } = categoryDetails[txn.category] || categoryDetails['Other'];
                                            return (
                                                <li key={txn.id} className="flex items-center justify-between p-3 group hover:bg-muted/50">
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${color}`}>
                                                            <Icon className="h-5 w-5" />
                                                        </div>
                                                        <p className="font-semibold">{txn.description}</p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className={`font-bold text-lg ${txn.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                                            {txn.type === 'income' ? '+' : ''}
                                                            {txn.type === 'expense' ? '-' : ''}
                                                            {formatCurrency(txn.amount)}
                                                        </span>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleDeleteTransaction(txn.id)}>
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center text-muted-foreground h-24 flex items-center justify-center">
                        No transactions yet.
                    </div>
                )}
            </CardContent>
        </Card>

      </div>
    </AppLayout>
  );
}

function StatCard({ title, amount, icon: Icon, variant }: { title: string, amount: number, icon?: React.ElementType, variant?: 'income' | 'expense' }) {
    const amountColor = variant === 'income' ? 'text-green-600' : variant === 'expense' ? 'text-red-600' : '';
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 py-4 sm:py-4">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
            </CardHeader>
            <CardContent className="pt-0 sm:pt-0">
                <div className={`text-2xl font-bold ${amountColor}`}>{formatCurrency(Math.abs(amount))}</div>
            </CardContent>
        </Card>
    )
}

function TransactionDialog({ children, onSave }: { children: React.ReactNode, onSave: (transaction: Transaction) => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [category, setCategory] = useState('Food');
    const [type, setType] = useState<'income' | 'expense'>('expense');
    const { toast } = useToast();

    const handleSave = () => {
        if (!description.trim() || !amount.trim()) {
            toast({ title: "Missing Fields", description: "Please fill in description and amount.", variant: "destructive" });
            return;
        }
        const amountInCents = Math.round(parseFloat(amount) * 100);
        if (isNaN(amountInCents)) {
            toast({ title: "Invalid Amount", description: "Please enter a valid number.", variant: "destructive" });
            return;
        }

        const newTransaction: Transaction = {
            id: `txn-${Date.now()}`,
            date: formatISO(new Date(date)),
            description,
            category,
            type,
            amount: Math.abs(amountInCents),
        };
        
        onSave(newTransaction);
        toast({ title: "Transaction Added", description: `${newTransaction.description} has been added.` });
        
        // Reset form and close dialog
        setDescription('');
        setAmount('');
        setDate(format(new Date(), 'yyyy-MM-dd'));
        setCategory('Food');
        setType('expense');
        setIsOpen(false);
    };
    
    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add New Transaction</DialogTitle>
                    <DialogDescription>Enter transaction details. Click save when done.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <label htmlFor="date" className="text-right">Date</label>
                        <Input id="date" type="date" value={date} onChange={e => setDate(e.target.value)} className="col-span-3" />
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <label htmlFor="description" className="text-right">Description</label>
                        <Input id="description" value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g., Morning Coffee" className="col-span-3" />
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <label htmlFor="amount" className="text-right">Amount</label>
                        <Input id="amount" type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="e.g., 150.00" className="col-span-3" />
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <label htmlFor="category" className="text-right">Category</label>
                        <Select value={category} onValueChange={setCategory}>
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                            <SelectContent>
                                {TRANSACTION_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <label htmlFor="type" className="text-right">Type</label>
                         <Select value={type} onValueChange={(value) => setType(value as 'income' | 'expense')}>
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Select a type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="expense">Expense</SelectItem>
                                <SelectItem value="income">Income</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                    <Button onClick={handleSave}>Save Transaction</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
