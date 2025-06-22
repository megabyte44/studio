
'use client';

import { useState, useEffect, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { P_TRANSACTIONS } from '@/lib/placeholder-data';
import type { Transaction } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO } from 'date-fns';
import { PiggyBank, Loader2, TrendingUp, TrendingDown, Save, PlusCircle, Pencil, Trash2 } from 'lucide-react';

const LOCAL_STORAGE_KEY_BUDGET = 'lifeos_budget';
const LOCAL_STORAGE_KEY_TRANSACTIONS = 'lifeos_transactions';
const TRANSACTION_CATEGORIES = ["Food", "Transport", "Shopping", "Utilities", "Health", "Entertainment", "Income", "Other"];

const formatCurrency = (amountInCents: number) => `$${(amountInCents / 100).toFixed(2)}`;

export default function ExpensesPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [monthlyBudget, setMonthlyBudget] = useState(200000); // Default: $2000.00 in cents
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [budgetInput, setBudgetInput] = useState('');

  const { toast } = useToast();

  useEffect(() => {
    try {
      const storedTransactions = localStorage.getItem(LOCAL_STORAGE_KEY_TRANSACTIONS);
      setTransactions(storedTransactions ? JSON.parse(storedTransactions) : P_TRANSACTIONS);

      const storedBudget = localStorage.getItem(LOCAL_STORAGE_KEY_BUDGET);
      const budget = storedBudget ? parseInt(storedBudget, 10) : 200000;
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
        <header className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary text-primary-foreground mx-auto mb-4">
                <PiggyBank className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-bold font-headline">Expense Tracker</h1>
            <p className="text-muted-foreground max-w-xl mx-auto">Track your income, expenses, and manage your budget with ease.</p>
        </header>

        <div className="grid grid-cols-2 gap-6">
            <StatCard title="Total Income" amount={totalIncome} icon={TrendingUp} variant="income" />
            <StatCard title="Total Spent" amount={totalExpenses} icon={TrendingDown} variant="expense" />
            <StatCard title="Monthly Budget" amount={monthlyBudget} icon={PiggyBank} />
            <StatCard title="Remaining" amount={remainingBudget} variant={remainingBudget >= 0 ? 'income' : 'expense'} />
        </div>

        <Card>
            <CardHeader>
                <CardTitle className="text-lg">Budget Progress</CardTitle>
                <CardDescription>You've spent {formatCurrency(totalExpenses)} of your {formatCurrency(monthlyBudget)} budget.</CardDescription>
            </CardHeader>
            <CardContent>
                <Progress value={budgetProgress} />
                <p className="text-right text-sm text-muted-foreground mt-2">{budgetProgress.toFixed(0)}%</p>
            </CardContent>
            <CardFooter>
                 <div className="w-full space-y-2">
                    <label htmlFor="monthly-budget-input" className="text-sm font-medium">Set Your Monthly Budget:</label>
                    <div className="flex gap-2">
                        <Input id="monthly-budget-input" type="number" placeholder="e.g., 2000.00" value={budgetInput} onChange={(e) => setBudgetInput(e.target.value)} />
                        <Button onClick={handleSetBudget}><Save className="mr-2 h-4 w-4" />Set Budget</Button>
                    </div>
                </div>
            </CardFooter>
        </Card>

        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div className="space-y-1.5">
                    <CardTitle className="text-lg">Recent Transactions</CardTitle>
                    <CardDescription>A log of your recent income and expenses.</CardDescription>
                </div>
                <TransactionDialog onSave={(newTxn) => setTransactions(prev => [newTxn, ...prev])}>
                    <Button><PlusCircle className="mr-2 h-4 w-4" />Add Transaction</Button>
                </TransactionDialog>
            </CardHeader>
            <CardContent>
                 <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.length > 0 ? transactions.map((txn) => (
                      <TableRow key={txn.id}>
                        <TableCell>{format(parseISO(txn.date), 'MMM dd, yyyy')}</TableCell>
                        <TableCell className="font-medium">{txn.description}</TableCell>
                        <TableCell><Badge variant={txn.type === 'income' ? 'default' : 'secondary'} className={txn.type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>{txn.category}</Badge></TableCell>
                        <TableCell className={`text-right font-medium ${txn.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                            {txn.type === 'income' ? '+' : '-'}{formatCurrency(txn.amount)}
                        </TableCell>
                        <TableCell className="text-center">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteTransaction(txn.id)}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </TableCell>
                      </TableRow>
                    )) : (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center text-muted-foreground h-24">No transactions yet.</TableCell>
                        </TableRow>
                    )}
                  </TableBody>
                </Table>
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
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
            </CardHeader>
            <CardContent>
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
                        <Input id="amount" type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="e.g., 4.50" className="col-span-3" />
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
