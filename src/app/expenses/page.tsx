'use client';

import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { P_EXPENSES } from '@/lib/placeholder-data';
import type { Expense } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, Loader2 } from 'lucide-react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const expenseSchema = z.object({
  description: z.string().min(3, 'Description must be at least 3 characters'),
  amount: z.coerce.number().positive('Amount must be a positive number'),
  category: z.string({ required_error: 'Please select a category.' }).min(1, 'Please select a category.'),
});

type ExpenseFormData = z.infer<typeof expenseSchema>;

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#00C49F', '#FFBB28'];
const CATEGORIES = ['Food', 'Transport', 'Health', 'Groceries', 'Shopping', 'Social', 'Entertainment', 'Utilities', 'Other'];


function ExpenseForm({ onAddExpense }: { onAddExpense: (expense: Expense) => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const form = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: { description: '', amount: undefined, category: undefined },
  });

  const onSubmit: SubmitHandler<ExpenseFormData> = (data) => {
    setIsSubmitting(true);
    
    const newExpense: Expense = {
      id: new Date().toISOString(),
      ...data,
      date: new Date().toISOString(),
    };
    onAddExpense(newExpense);
    form.reset();
    toast({ title: 'Expense Added', description: 'Your new expense has been recorded.' });
    
    setIsSubmitting(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl font-bold font-headline">Add New Expense</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Morning coffee" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount ($)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="e.g., 4.50" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <PlusCircle className="mr-2 h-4 w-4" />
              )}
              Add Expense
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

function ExpenseChart({ expenses }: { expenses: Expense[] }) {
  const data = expenses.reduce((acc, expense) => {
    const existingCategory = acc.find(item => item.name === expense.category);
    if (existingCategory) {
      existingCategory.value += expense.amount;
    } else {
      acc.push({ name: expense.category, value: expense.amount });
    }
    return acc;
  }, [] as { name: string; value: number }[]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl font-bold font-headline">Spending Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <PieChart>
              <Pie data={data} cx="50%" cy="50%" labelLine={false} outerRadius={80} fill="#8884d8" dataKey="value" nameKey="name" label={(entry) => entry.name}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    try {
      const storedExpenses = localStorage.getItem('lifeos_expenses');
      setExpenses(storedExpenses ? JSON.parse(storedExpenses) : P_EXPENSES);
    } catch (error) {
      console.error("Failed to load expenses from localStorage", error);
      setExpenses(P_EXPENSES);
    }
    setIsInitialLoad(false);
  }, []);

  useEffect(() => {
    if (!isInitialLoad) {
      localStorage.setItem('lifeos_expenses', JSON.stringify(expenses));
    }
  }, [expenses, isInitialLoad]);


  const addExpense = (expense: Expense) => {
    setExpenses([expense, ...expenses]);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <header>
          <h1 className="text-2xl font-bold font-headline">Expense Tracker</h1>
          <p className="text-muted-foreground">Keep an eye on your spending.</p>
        </header>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 space-y-6">
            <ExpenseForm onAddExpense={addExpense} />
            <ExpenseChart expenses={expenses} />
          </div>
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl font-bold font-headline">Recent Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expenses.map((expense) => (
                      <TableRow key={expense.id}>
                        <TableCell className="font-medium">{expense.description}</TableCell>
                        <TableCell>{expense.category}</TableCell>
                        <TableCell>{format(parseISO(expense.date), 'MMM dd, yyyy')}</TableCell>
                        <TableCell className="text-right">${expense.amount.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
