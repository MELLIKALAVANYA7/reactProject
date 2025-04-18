import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    LineChart,
    Line,
} from 'recharts';
import { CalendarIcon, Plus, Edit, Trash2, CheckCircle, AlertTriangle, Banknote, PieChart as PieChartIcon, TrendingUp, ListChecks } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { AnimatePresence, motion } from 'framer-motion';

// --- Types ---
interface Transaction {
    id: string;
    date: Date;
    category: string;
    description: string;
    amount: number;
}

interface Budget {
    category: string;
    amount: number;
}

// --- Constants ---
const CATEGORIES = [
    'Food',
    'Housing',
    'Transportation',
    'Entertainment',
    'Utilities',
    'Healthcare',
    'Clothing',
    'Savings',
    'Other',
];

const CATEGORY_COLORS = [
    '#1f77b4',
    '#ff7f0e',
    '#2ca02c',
    '#d62728',
    '#9467bd',
    '#8c564b',
    '#e377c2',
    '#7f7f7f',
    '#bcbd22',
    '#17becf',
];

// --- Helper Functions ---
const formatDate = (date: Date) => format(date, 'yyyy-MM-dd');

// --- Components ---

// Reusable Form Components
const FormInput = ({ label, id, value, onChange, placeholder, error }: { label: string; id: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; placeholder?: string; error?: string }) => (
    <div className="space-y-1">
        <Label htmlFor={id}>{label}</Label>
        <Input
            id={id}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className={cn(error && "border-red-500")}
        />
        {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
);

const FormDateInput = ({ label, id, date, onSelect, error }: { label: string; id: string; date?: Date; onSelect: (date?: Date) => void; error?: string }) => (
    <div className="space-y-1">
        <Label htmlFor={id}>{label}</Label>
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant={"outline"}
                    className={cn(
                        "w-full justify-start text-left font-normal",
                        !date && "text-muted-foreground",
                        error && "border-red-500"
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? formatDate(date) : <span>Pick a date</span>}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                    mode="single"
                    selected={date}
                    onSelect={onSelect}
                    initialFocus
                />
            </PopoverContent>
        </Popover>
        {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
);

const FormSelect = ({ label, id, value, onChange, options, error }: { label: string; id: string; value: string; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void; options: string[]; error?: string }) => (
    <div className="space-y-1">
        <Label htmlFor={id}>{label}</Label>
        <select
            id={id}
            value={value}
            onChange={onChange}
            className={cn(
                "w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500",
                "text-gray-900",
                error && "border-red-500"
            )}
        >
            <option value="">Select a category</option>
            {options.map((option) => (
                <option key={option} value={option}>
                    {option}
                </option>
            ))}
        </select>
        {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
);

// Transaction List Item
const TransactionListItem = ({
    transaction,
    onEdit,
    onDelete
}: {
    transaction: Transaction;
    onEdit: (id: string) => void;
    onDelete: (id: string) => void;
}) => (
    <motion.div
        layout
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        className="flex items-center justify-between gap-4 p-4 rounded-md bg-white/5 border border-white/10"
    >
        <div className="flex-1 space-y-1">
            <p className="text-lg font-medium">{transaction.description}</p>
            <p className="text-sm text-gray-400">{transaction.category} - {formatDate(transaction.date)}</p>
        </div>
        <p className={cn(
            "text-lg font-semibold",
            transaction.amount < 0 ? "text-red-400" : "text-green-400"
        )}>
            {transaction.amount < 0 ? '-' : '+'}
            ${Math.abs(transaction.amount).toFixed(2)}
        </p>
        <div className="flex gap-2">
            <Button
                variant="outline"
                size="icon"
                onClick={() => onEdit(transaction.id)}
                className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/20"
            >
                <Edit className="h-4 w-4" />
            </Button>
            <Button
                variant="destructive"
                size="icon"
                onClick={() => onDelete(transaction.id)}
                className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
            >
                <Trash2 className="h-4 w-4" />
            </Button>
        </div>
    </motion.div>
);

// --- Main Component ---
const PersonalFinanceApp = () => {
    // --- State ---
    const [transactions, setTransactions] = useState<Transaction[]>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('financeTransactions');
            try {
                return saved ? JSON.parse(saved, (key, value) => {
                    return key === 'date' ? new Date(value) : value;
                }) : [];
            } catch (e) {
                console.error("Failed to parse transactions from localStorage", e);
                return [];
            }
        }
        return [];
    });

    const [budgets, setBudgets] = useState<Budget[]>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('financeBudgets');
            try {
                return saved ? JSON.parse(saved) : [];
            } catch (e) {
                console.error("Failed to parse budgets from localStorage", e);
                return [];
            }
        }
        return [];
    });

    const [isAddingTransaction, setIsAddingTransaction] = useState(false);
    const [editingTransactionId, setEditingTransactionId] = useState<string | null>(null);

    // Form states for adding/editing transactions
    const [formDate, setFormDate] = useState<Date | undefined>();
    const [formCategory, setFormCategory] = useState('');
    const [formDescription, setFormDescription] = useState('');
    const [formAmount, setFormAmount] = useState('');

    // Form states for adding/editing budgets
    const [budgetCategory, setBudgetCategory] = useState('');
    const [budgetAmount, setBudgetAmount] = useState('');
    const [isAddingBudget, setIsAddingBudget] = useState(false);
    const [editingBudgetId, setEditingBudgetId] = useState<string | null>(null);


    // --- Effects ---

    // Save transactions to localStorage
    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('financeTransactions', JSON.stringify(transactions));
        }
    }, [transactions]);

    // Save budgets to localStorage
    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('financeBudgets', JSON.stringify(budgets));
        }
    }, [budgets]);

    // --- Computed Values ---

    // Monthly expenses for the bar chart
    const monthlyExpenses = React.useMemo(() => {
        const monthlyTotals: { [month: string]: number } = {};
        transactions.forEach((t) => {
            const month = format(t.date, 'yyyy-MM');
            monthlyTotals[month] = (monthlyTotals[month] || 0) + t.amount;
        });
        return Object.entries(monthlyTotals).map(([month, total]) => ({
            month,
            total: parseFloat(total.toFixed(2)),
        }));
    }, [transactions]);

    // Category-wise expenses for the pie chart
    const categoryExpenses = React.useMemo(() => {
        const categoryTotals: { [category: string]: number } = {};
        transactions.forEach((t) => {
            categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
        });
        return Object.entries(categoryTotals).map(([category, total]) => ({
            category,
            total: parseFloat(total.toFixed(2)),
        }));
    }, [transactions]);

    // Summary data for the dashboard
    const totalExpenses = React.useMemo(() => {
        return transactions.reduce((acc, t) => acc + t.amount, 0).toFixed(2);
    }, [transactions]);

    const categoryBreakdown = React.useMemo(() => {
        const breakdown: { [category: string]: number } = {};
        transactions.forEach(t => {
            breakdown[t.category] = (breakdown[t.category] || 0) + t.amount;
        });
        return Object.entries(breakdown).map(([category, total]) => ({ category, total: parseFloat(total.toFixed(2)) }));
    }, [transactions]);

    const recentTransactions = React.useMemo(() => {
        return [...transactions].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 5);
    }, [transactions]);

    // Budget vs Actual
    const budgetComparison = React.useMemo(() => {
        const comparison: { category: string; budgeted: number; actual: number }[] = [];

        // Initialize with budgets
        budgets.forEach((budget) => {
            comparison.push({
                category: budget.category,
                budgeted: budget.amount,
                actual: 0, // Start with 0, will add actual later
            });
        });

        // Add actual expenses
        transactions.forEach((transaction) => {
            const categoryMatch = comparison.find((item) => item.category === transaction.category);
            if (categoryMatch) {
                categoryMatch.actual += transaction.amount;
            } else {
                // If a transaction is in a category not in the budget, add it.
                comparison.push({
                    category: transaction.category,
                    budgeted: 0, // No budget for this category
                    actual: transaction.amount
                })
            }
        });

        return comparison.map(item => ({...item, actual: parseFloat(item.actual.toFixed(2))})); // Ensure consistent format
    }, [transactions, budgets]);

    // --- Transaction Handlers ---

    const clearTransactionForm = () => {
        setFormDate(undefined);
        setFormCategory('');
        setFormDescription('');
        setFormAmount('');
        setEditingTransactionId(null);
    };

    const handleAddTransaction = () => {
        // Validation
        let hasErrors = false;
        if (!formDate) hasErrors = true;
        if (!formCategory) hasErrors = true;
        if (!formDescription) hasErrors = true;
        if (!formAmount || isNaN(Number(formAmount))) hasErrors = true;

        if (hasErrors) {
            alert('Please fill in all fields with valid values.'); // Basic validation
            return;
        }

        const newTransaction: Transaction = {
            id: editingTransactionId || crypto.randomUUID(),
            date: formDate,
            category: formCategory,
            description: formDescription,
            amount: Number(formAmount),
        };

        if (editingTransactionId) {
            setTransactions(transactions.map(t => t.id === editingTransactionId ? newTransaction : t));
        } else {
            setTransactions([...transactions, newTransaction]);
        }

        clearTransactionForm();
        setIsAddingTransaction(false);
    };

    const handleEditTransaction = (id: string) => {
        const transactionToEdit = transactions.find((t) => t.id === id);
        if (transactionToEdit) {
            setEditingTransactionId(id);
            setFormDate(transactionToEdit.date);
            setFormCategory(transactionToEdit.category);
            setFormDescription(transactionToEdit.description);
            setFormAmount(transactionToEdit.amount.toString());
            setIsAddingTransaction(true); // Open the form
        }
    };

    const handleDeleteTransaction = (id: string) => {
        setTransactions(transactions.filter((t) => t.id !== id));
        clearTransactionForm();
    };

    // --- Budget Handlers ---
    const clearBudgetForm = () => {
        setBudgetCategory('');
        setBudgetAmount('');
        setEditingBudgetId(null);
    }

    const handleAddBudget = () => {
        // Validation
        let hasErrors = false;
        if (!budgetCategory) hasErrors = true;
        if (!budgetAmount || isNaN(Number(budgetAmount)) || Number(budgetAmount) <= 0) hasErrors = true;

        if (hasErrors) {
            alert('Please enter a valid category and amount.');
            return;
        }

        const newBudget: Budget = {
            category: budgetCategory,
            amount: Number(budgetAmount),
        };

        if (editingBudgetId) {
            setBudgets(budgets.map(b => b.category === editingBudgetId ? newBudget : b));
        } else {
            // Check if budget for this category already exists
            const existingBudgetIndex = budgets.findIndex(b => b.category === budgetCategory);
            if (existingBudgetIndex > -1) {
                //update
                setBudgets(budgets.map(b => b.category === budgetCategory ? newBudget: b));
            }
            else{
                //add new
                setBudgets([...budgets, newBudget]);
            }
        }
        clearBudgetForm();
        setIsAddingBudget(false);
    };

    const handleEditBudget = (category: string) => {
        const budgetToEdit = budgets.find((b) => b.category === category);
        if (budgetToEdit) {
            setEditingBudgetId(category);
            setBudgetCategory(budgetToEdit.category);
            setBudgetAmount(budgetToEdit.amount.toString());
            setIsAddingBudget(true); // Open form
        }
    };

    const handleDeleteBudget = (category: string) => {
        setBudgets(budgets.filter((b) => b.category !== category));
        clearBudgetForm();
    };

    // --- Render ---
    return (
        <div className="p-4 md:p-8 bg-gray-950 min-h-screen">
            <h1 className="text-3xl font-bold mb-6 text-center text-white">Personal Finance Tracker</h1>

            <Tabs defaultValue="dashboard" className="w-full max-w-6xl mx-auto space-y-8">
                <TabsList className="grid w-full grid-cols-3 bg-gray-900 border border-gray-800">
                    <TabsTrigger value="dashboard" className="text-white data-[state=active]:bg-gray-800/50 data-[state=active]:text-white">
                        <Banknote className="mr-2 h-4 w-4" /> Dashboard
                    </TabsTrigger>
                    <TabsTrigger value="transactions" className="text-white data-[state=active]:bg-gray-800/50 data-[state=active]:text-white">
                        <ListChecks className="mr-2 h-4 w-4" /> Transactions
                    </TabsTrigger>
                    <TabsTrigger value="budget" className="text-white data-[state=active]:bg-gray-800/50 data-[state=active]:text-white">
                        <TrendingUp className="mr-2 h-4 w-4" /> Budget
                    </TabsTrigger>
                </TabsList>

                {/* --- Dashboard Tab --- */}
                <TabsContent value="dashboard">
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Card className="bg-gray-900 border border-gray-800 text-white">
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <Banknote className="h-5 w-5" /> Total Expenses
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-2xl font-semibold text-red-400">${totalExpenses}</p>
                                </CardContent>
                            </Card>

                            <Card className="bg-gray-900 border border-gray-800 text-white">
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <PieChartIcon className="h-5 w-5" /> Category Breakdown
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        {categoryBreakdown.map((item) => (
                                            <div key={item.category} className="flex justify-between items-center">
                                                <span className="capitalize">{item.category}</span>
                                                <span className="font-medium">${item.total.toFixed(2)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-gray-900 border border-gray-800 text-white">
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <ListChecks className="h-5 w-5" /> Recent Transactions
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        {recentTransactions.map((t) => (
                                            <div key={t.id} className="flex justify-between items-center">
                                                <span className="truncate">{t.description}</span>
                                                <span className={cn(
                                                    "font-medium",
                                                    t.amount < 0 ? "text-red-400" : "text-green-400"
                                                )}>
                                                    {t.amount < 0 ? '-' : '+'}
                                                    ${Math.abs(t.amount).toFixed(2)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Monthly Expenses Bar Chart */}
                        <Card className="bg-gray-900 border border-gray-800 text-white">
                            <CardHeader>
                                <CardTitle className="text-lg">Monthly Expenses</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={monthlyExpenses} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                                        <XAxis
                                            dataKey="month"
                                            tick={{ fill: '#9ca3af' }}
                                            tickLine={false}
                                            axisLine={false}
                                        />
                                        <YAxis
                                            tick={{ fill: '#9ca3af' }}
                                            tickLine={false}
                                            axisLine={false}
                                            tickFormatter={(value: number) => $${value}}
                                        />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#374151', border: 'none', color: '#fff', borderRadius: '0.5rem' }}
                                            itemStyle={{ color: '#fff' }}
                                            labelStyle={{ color: '#fff' }}
                                            formatter={(value: number) => $${value.toFixed(2)}}
                                        />
                                        <Legend wrapperStyle={{ color: '#9ca3af' }} />
                                        <Bar dataKey="total" fill="#8884d8" name="Expenses" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* --- Transactions Tab --- */}
                <TabsContent value="transactions">
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-2xl font-semibold text-white">Transactions</h2>
                            <Button
                                onClick={() => {
                                    setIsAddingTransaction(true);
                                    clearTransactionForm();
                                }}
                                className="bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 hover:text-blue-300"
                            >
                                <Plus className="mr-2 h-4 w-4" /> Add Transaction
                            </Button>
                        </div>

                        {/* Transaction Form (Modal) */}
                        <AnimatePresence>
                            {isAddingTransaction && (
                                <motion.div
                                    initial={{ opacity: 0, y: -20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 20 }}
                                    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
                                >
                                    <motion.div
                                        initial={{ scale: 0.8 }}
                                        animate={{ scale: 1 }}
                                        exit={{ scale: 0.8 }}
                                        className="bg-gray-900 rounded-xl p-6 w-full max-w-md space-y-6 border border-gray-800 shadow-2xl"
                                    >
                                        <h3 className="text-xl font-semibold text-white">
                                            {editingTransactionId ? 'Edit Transaction' : 'Add Transaction'}
                                        </h3>
                                        <div className="space-y-4">
                                            <FormDateInput
                                                label="Date"
                                                id="transaction-date"
                                                date={formDate}
                                                onSelect={setFormDate}
                                                error={!formDate ? "Date is required" : undefined}
                                            />
                                            <FormSelect
                                                label="Category"
                                                id="transaction-category"
                                                value={formCategory}
                                                onChange={(e) => setFormCategory(e.target.value)}
                                                options={CATEGORIES}
                                                error={!formCategory ? "Category is required" : undefined}
                                            />
                                            <FormInput
                                                label="Description"
                                                id="transaction-description"
                                                value={formDescription}
                                                onChange={(e) => setFormDescription(e.target.value)}
                                                placeholder="Enter description"
                                                error={!formDescription ? "Description is required" : undefined}
                                            />
                                            <FormInput
                                                label="Amount"
                                                id="transaction-amount"
                                                value={formAmount}
                                                onChange={(e) => setFormAmount(e.target.value)}
                                                placeholder="Enter amount"
                                                error={!formAmount || isNaN(Number(formAmount)) ? "Valid amount is required" : undefined}
                                            />
                                        </div>
                                        <div className="flex justify-end gap-4">
                                            <Button
                                                variant="outline"
                                                onClick={() => {
                                                    setIsAddingTransaction(false);
                                                    clearTransactionForm();
                                                }}
                                                className="text-gray-400 hover:text-white hover:bg-gray-800"
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                onClick={handleAddTransaction}
                                                className="bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 hover:text-blue-300"
                                            >
                                                {editingTransactionId ? 'Update' : 'Add'}
                                            </Button>
                                        </div>
                                    </motion.div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Transaction List */}
                        <div className="space-y-4">
                            <AnimatePresence>
                                {transactions.length === 0 ? (
                                    <motion.p
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="text-gray-500 text-center"
                                    >
                                        No transactions yet. Add some!
                                    </motion.p>
                                ) : (
                                    transactions.map((transaction) => (
                                        <TransactionListItem
                                            key={transaction.id}
                                            transaction={transaction}
                                            onEdit={handleEditTransaction}
                                            onDelete={handleDeleteTransaction}
                                        />
                                    ))
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </TabsContent>

                {/* --- Budget Tab --- */}
                <TabsContent value="budget">
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-2xl font-semibold text-white">Budget</h2>
                            <Button
                                onClick={() => {
                                    setIsAddingBudget(true);
                                    clearBudgetForm();
                                }}
                                className="bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 hover:text-blue-300"
                            >
                                <Plus className="mr-2 h-4 w-4" /> Add Budget
                            </Button>
                        </div>

                        {/* Budget Form (Modal) */}
                        <AnimatePresence>
                            {isAddingBudget && (
                                <motion.div
                                    initial={{ opacity: 0, y: -20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 20 }}
                                    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
                                >
                                    <motion.div
                                        initial={{ scale: 0.8 }}
                                        animate={{ scale: 1 }}
                                        exit={{ scale: 0.8 }}
                                        className="bg-gray-900 rounded-xl p-6 w-full max-w-md space-y-6 border border-gray-800 shadow-2xl"
                                    >
                                        <h3 className="text-xl font-semibold text-white">
                                            {editingBudgetId ? 'Edit Budget' : 'Add Budget'}
                                        </h3>
                                        <div className="space-y-4">
                                            <FormSelect
                                                label="Category"
                                                id="budget-category"
                                                value={budgetCategory}
                                                onChange={(e) => setBudgetCategory(e.target.value)}
                                                options={CATEGORIES}
                                                error={!budgetCategory ? "Category is required" : undefined}
                                            />
                                            <FormInput
                                                label="Amount"
                                                id="budget-amount"
                                                value={budgetAmount}
                                                onChange={(e) => setBudgetAmount(e.target.value)}
                                                placeholder="Enter amount"
                                                error={!budgetAmount || isNaN(Number(budgetAmount)) || Number(budgetAmount) <= 0 ? "Valid amount is required (greater than 0)" : undefined}
                                            />
                                        </div>
                                        <div className="flex justify-end gap-4">
                                            <Button
                                                variant="outline"
                                                onClick={() => {
                                                    setIsAddingBudget(false);
                                                    clearBudgetForm();
                                                }}
                                                className="text-gray-400 hover:text-white hover:bg-gray-800"
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                onClick={handleAddBudget}
                                                className="bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 hover:text-blue-300"
                                            >
                                                {editingBudgetId ? 'Update' : 'Add'}
                                            </Button>
                                        </div>
                                    </motion.div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Budget vs Actual Chart */}
                        <Card className="bg-gray-900 border border-gray-800 text-white">
                            <CardHeader>
                                <CardTitle className="text-lg">Budget vs Actual Spending</CardTitle>
                                <CardDescription>Comparison of budgeted and actual expenses per category.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={budgetComparison} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                                        <XAxis
                                            dataKey="category"
                                            tick={{ fill: '#9ca3af' }}
                                            tickLine={false}
                                            axisLine={false}
                                        />
                                        <YAxis
                                            tick={{ fill: '#9ca3af' }}
                                            tickLine={false}
                                            axisLine={false}
                                            tickFormatter={(value: number) => $${value}}
                                        />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#374151', border: 'none', color: '#fff', borderRadius: '0.5rem' }}
                                            itemStyle={{ color: '#fff' }}
                                            labelStyle={{ color: '#fff' }}
                                            formatter={(value: number) => $${value.toFixed(2)}}
                                        />
                                        <Legend wrapperStyle={{ color: '#9ca3af' }} />
                                        <Bar dataKey="budgeted" fill="#8884d8" name="Budgeted" />
                                        <Bar dataKey="actual" fill="#82ca9d" name="Actual" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* Budget List */}
                        <Card className="bg-gray-900 border border-gray-800 text-white">
                            <CardHeader>
                                <CardTitle className="text-lg">Budgets</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {budgets.length === 0 ? (
                                        <p className="text-gray-500">No budgets set yet.</p>
                                    ) : (
                                        budgets.map((budget) => (
                                            <div key={budget.category} className="flex justify-between items-center p-4 rounded-md bg-white/5">
                                                <span className="capitalize">{budget.category}</span>
                                                <span className="font-medium">${budget.amount.toFixed(2)}</span>
                                                <div className="flex gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        onClick={() => handleEditBudget(budget.category)}
                                                        className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/20"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="destructive"
                                                        size="icon"
                                                        onClick={() => handleDeleteBudget(budget.category)}
                                                        className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default PersonalFinanceApp;