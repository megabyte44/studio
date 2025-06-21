'use client';

import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { P_EXPENSES } from '@/lib/placeholder-data';
import type { Expense } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, Loader2 } from 'lucide-react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { tagExpense } from '@/ai/flows/tag-expense';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO } from 'date-fns';

const expenseSchema = z.object({
  description: z.string().min(3, 'Description must be at least 3 characters'),
  amount: z.coerce.number().positive('Amount must be a positive number'),
});

type ExpenseFormData = z.infer<typeof expenseSchema>;

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#00C49F', '#FFBB28'];

function ExpenseForm({ onAddExpense }: { onAddExpense: (expense: Expense) => void }) {
  const [isSubmittingAi, setIsSubmittingAi] = useState(false);
  const { toast } = useToast();
  const form = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: { description: '', amount: undefined },
  });

  const onSubmit: SubmitHandler<ExpenseFormData> = async (data) => {
    setIsSubmittingAi(true);
    try {
      const { category } = await tagExpense(data);
      const newExpense: Expense = {
        id: new Date().toISOString(),
        ...data,
        category: category || 'Uncategorized',
        date: new Date().toISOString(),
      };
      onAddExpense(newExpense);
      form.reset();
      toast({ title: 'Expense Added', description: `Categorized as ${category}.` });
    } catch (error) {
      console.error('AI tagging failed', error);
      toast({
        variant: 'destructive',
        title: 'AI Tagging Error',
        description: 'Could not automatically tag expense. Please add manually.',
      });
    } finally {
      setIsSubmittingAi(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Add New Expense</CardTitle>
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
            <Button type="submit" className="w-full" disabled={isSubmittingAi}>
              {isSubmittingAi ? (
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
        <CardTitle className="font-headline">Spending Breakdown</CardTitle>
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
  const [expenses, setExpenses] = useState<Expense[]>(P_EXPENSES);

  const addExpense = (expense: Expense) => {
    setExpenses([expense, ...expenses]);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <header>
          <h1 className="text-3xl font-bold font-headline">Expense Tracker</h1>
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
                <CardTitle className="font-headline">Recent Transactions</CardTitle>
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
