import React, { useEffect, useState } from 'react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Legend,
    Tooltip,
} from 'recharts';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog"


// Mock API (Replace with your actual API calls)
const fetchTransactions = async () => {
    // Simulate fetching transactions from a database
    // Replace this with your actual fetch logic (e.g., from /api/transactions)
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve([
                {
                    _id: '1',
                    amount: 50,
                    date: new Date(2024, 0, 10),
                    description: 'Groceries',
                    category: 'Food',
                },
                {
                    _id: '2',
                    amount: 25,
                    date: new Date(2024, 0, 15),
                    description: 'Gas',
                    category: 'Transportation',
                },
                {
                    _id: '3',
                    amount: 100,
                    date: new Date(2024, 0, 20),
                    description: 'Dinner',
                    category: 'Food',
                },
                {
                    _id: '4',
                    amount: 30,
                    date: new Date(2024, 0, 5),
                    description: 'Movie',
                    category: 'Entertainment',
                },
                {
                    _id: '5',
                    amount: 75,
                    date: new Date(2024, 1, 12),
                    description: 'Utilities',
                    category: 'Utilities',
                },
                {
                    _id: '6',
                    amount: 200,
                    date: new Date(2024, 1, 18),
                    description: 'Clothes',
                    category: 'Shopping',
                },
                {
                    _id: '7',
                    amount: 60,
                    date: new Date(2024, 1, 22),
                    description: 'Lunch',
                    category: 'Food',
                },
                {
                    _id: '8',
                    amount: 40,
                    date: new Date(2024, 2, 8),
                    description: 'Bus Fare',
                    category: 'Transportation',
                },
                {
                    _id: '9',
                    amount: 120,
                    date: new Date(2024, 2, 14),
                    description: 'Concert',
                    category: 'Entertainment',
                },
                {
                    _id: '10',
                    amount: 90,
                    date: new Date(2024, 2, 25),
                    description: 'Internet',
                    category: 'Utilities',
                },
            ]);
        }, 500);
    });
};

// --- Helper Components ---

// Reusable Summary Card
const SummaryCard = ({ title, value, description, className }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
    >
        <Card className={cn('shadow-md', className)}>
            <CardHeader>
                <CardTitle className="text-lg font-semibold">{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{value}</div>
            </CardContent>
        </Card>
    </motion.div>
);

// Category Pie Chart
const CategoryPieChart = ({ data }) => {
    const COLORS = [
        '#0088FE',
        '#00C49F',
        '#FFBB28',
        '#FF8042',
        '#8884d8',
        '#A8328E',
        '#32A852',
        '#A87832',
    ];

    const renderCustomizedLabel = ({
        cx,
        cy,
        midAngle,
        innerRadius,
        outerRadius,
        percent,
        index,
    }) => {
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
        const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
        const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));

        return (
            <text
                x={x}
                y={y}
                fill="white"
                textAnchor={x > cx ? 'start' : 'end'}
                dominantBaseline="central"
            >
                {${(percent * 100).toFixed(0)}%}
            </text>
        );
    };

    return (
        <Card className="shadow-md">
            <CardHeader>
                <CardTitle>Expenses by Category</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px] w-full">
                {data.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={renderCustomizedLabel}
                                outerRadius={100}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {data.map((entry, index) => (
                                    <Cell
                                        key={cell-${index}}
                                        fill={COLORS[index % COLORS.length]}
                                    />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend
                                layout="vertical"
                                align="right"
                                verticalAlign="middle"
                            />
                        </PieChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="text-center text-gray-500 dark:text-gray-400">
                        No category data available.
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

// Recent Transactions Table
const RecentTransactions = ({ transactions }) => (
    <Card className="shadow-md">
        <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
            {transactions.length > 0 ? (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead>Category</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {transactions.map((transaction) => (
                            <TableRow key={transaction._id}>
                                <TableCell>
                                    {format(new Date(transaction.date), 'MMM dd, yyyy')}
                                </TableCell>
                                <TableCell>{transaction.description}</TableCell>
                                <TableCell className="text-right">
                                    ${transaction.amount.toFixed(2)}
                                </TableCell>
                                <TableCell>{transaction.category}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            ) : (
                <p className="text-gray-500 dark:text-gray-400">No recent transactions.</p>
            )}
        </CardContent>
    </Card>
);

const TransactionForm = ({ onClose, onAddTransaction }: { onClose: () => void, onAddTransaction: (transaction: any) => void }) => {
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formError, setFormError] = useState('');
    const [open, setOpen] = useState(false)


    const categories = [
        'Food',
        'Transportation',
        'Entertainment',
        'Utilities',
        'Shopping',
        'Other',
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!amount || !date || !description || !category) {
            setFormError('Please fill in all fields.');
            return;
        }
        if (Number(amount) <= 0) {
            setFormError('Amount must be greater than zero.');
            return;
        }

        setFormError(''); // Clear any previous error
        setIsSubmitting(true);

        const newTransaction = {
            _id: crypto.randomUUID(), // Mock ID for demo
            amount: Number(amount),
            date: date,
            description,
            category,
        };

        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 500));
        onAddTransaction(newTransaction);
        setIsSubmitting(false);
        onClose(); // Close the form
        // Reset form
        setAmount('');
        setDate(new Date());
        setDescription('');
        setCategory('');

    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <Label htmlFor="amount">Amount</Label>
                <Input
                    id="amount"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    className="mt-1"
                />
            </div>
            <div>
                <Label htmlFor="date">Date</Label>
                <Dialog>
                    <DialogTrigger asChild>
                        <Button
                            variant={"outline"}
                            className={cn(
                                "w-full justify-start text-left font-normal mt-1",
                                !date && "text-muted-foreground"
                            )}
                        >
                            {date ? format(date, "PPP") : <span>Pick a date</span>}
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="p-0" >
                        <Calendar
                            mode="single"
                            selected={date}
                            onSelect={setDate}
                            disabled={(date) =>
                                date > new Date() || date < new Date('2023-01-01')
                            }
                            initialFocus
                        />
                        <DialogFooter>
                            <Button onClick={() => setOpen(false)}>Close</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
            <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    className="mt-1"
                />
            </div>
            <div>
                <Label htmlFor="category">Category</Label>
                <Select
                    onValueChange={setCategory}
                    defaultValue={category}
                >
                    <SelectTrigger className="mt-1 w-full">
                        <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                        {categories.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                                {cat}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            {formError && <p className="text-red-500 text-sm">{formError}</p>}
            <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Add Transaction'}
            </Button>
        </form>
    );
};

// --- Main Component ---
const DashboardPage = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showAddTransactionModal, setShowAddTransactionModal] = useState(false);

    useEffect(() => {
        const getTransactions = async () => {
            try {
                const data = await fetchTransactions();
                setTransactions(data);
            } catch (err) {
                setError(err);
            } finally {
                setLoading(false);
            }
        };

        getTransactions();
    }, []);

    const handleAddTransaction = (newTransaction: any) => {
        setTransactions((prevTransactions) => [newTransaction, ...prevTransactions]);
    };

    // --- Data Processing for Charts and Summaries ---
    const totalExpenses = transactions.reduce((acc, t) => acc + t.amount, 0);

    const categoryBreakdown = transactions.reduce((acc, t) => {
        const category = t.category;
        if (!acc[category]) {
            acc[category] = 0;
        }
        acc[category] += t.amount;
        return acc;
    }, {});

    const categoryPieData = Object.entries(categoryBreakdown).map(([name, value]) => ({
        name,
        value,
    }));

    const recentTransactions = transactions.slice(0, 5); // Get the 5 most recent

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <p>Loading...</p> {/* Replace with a proper loader */}
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-screen text-red-500">
                Error: {error.message}
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 md:p-6">
            <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
                Dashboard
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <SummaryCard
                    title="Total Expenses"
                    value={$${totalExpenses.toFixed(2)}}
                    description="Total amount spent"
                    className="bg-white dark:bg-gray-800"
                />
                <SummaryCard
                    title="Categories"
                    value={Object.keys(categoryBreakdown).length}
                    description="Number of categories"
                    className="bg-white dark:bg-gray-800"
                />
                {/* Add more summary cards as needed */}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <CategoryPieChart data={categoryPieData} />
                <RecentTransactions transactions={recentTransactions} />
            </div>
            <div className="mt-8 flex justify-center">
                <Dialog open={showAddTransactionModal} onOpenChange={setShowAddTransactionModal}>
                    <DialogTrigger asChild>
                        <Button
                            variant="outline"
                            onClick={() => setShowAddTransactionModal(true)}
                            className="bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 hover:text-blue-300"
                        >
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Add Transaction
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Add New Transaction</DialogTitle>
                        </DialogHeader>
                        <TransactionForm
                            onClose={() => setShowAddTransactionModal(false)}
                            onAddTransaction={handleAddTransaction}
                        />
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
};

export default DashboardPage;