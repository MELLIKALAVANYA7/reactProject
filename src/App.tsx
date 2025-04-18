import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  CalendarIcon,
  Edit,
  Trash2,
  PlusCircle,
  AlertCircle,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
const mockApi = {
  getTransactions: async (): Promise<Transaction[]> => {
    
    await new Promise((resolve) => setTimeout(resolve, 500));
    const storedTransactions = localStorage.getItem("transactions");
    return storedTransactions ? JSON.parse(storedTransactions) : [];
  },
  createTransaction: async (
    transaction: Omit<Transaction, "id">
  ): Promise<Transaction> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const id = crypto.randomUUID();
    const newTransaction: Transaction = {
      ...transaction,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const storedTransactions = localStorage.getItem("transactions");
    const transactions: Transaction[] = storedTransactions
      ? JSON.parse(storedTransactions)
      : [];
    transactions.push(newTransaction);
    localStorage.setItem("transactions", JSON.stringify(transactions));
    return newTransaction;
  },
  updateTransaction: async (
    id: string,
    updates: Partial<Omit<Transaction, "id">>
  ): Promise<Transaction | null> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const storedTransactions = localStorage.getItem("transactions");
    let transactions: Transaction[] = storedTransactions
      ? JSON.parse(storedTransactions)
      : [];
    const index = transactions.findIndex((t) => t.id === id);
    if (index === -1) {
      return null;   
    }
    const updatedTransaction = {
      ...transactions[index],
      ...updates,
      updatedAt: new Date(),
    };
    transactions[index] = updatedTransaction;
    localStorage.setItem("transactions", JSON.stringify(transactions));
    return updatedTransaction;
  },
  deleteTransaction: async (id: string): Promise<void> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const storedTransactions = localStorage.getItem("transactions");
    let transactions: Transaction[] = storedTransactions
      ? JSON.parse(storedTransactions)
      : [];
    const updatedTransactions = transactions.filter((t) => t.id !== id);
    localStorage.setItem("transactions", JSON.stringify(updatedTransactions));
  },
};
interface Transaction {
  id: string;
  amount: number;
  date: Date;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

const formatDate = (date: Date) => {
  return format(date, "PPP");   
};

const App = () => {
const [transactions, setTransactions] = useState<Transaction[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
const [isDialogOpen, setIsDialogOpen] = useState(false);
const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);
  const [formData, setFormData] = useState<{
    amount: string;
    date: Date | undefined;
    description: string;
  }>({
    amount: "",
    date: undefined,
    description: "",
  });
  const [chartData, setChartData] = useState<
    { date: string; amount: number }[]
  >([]);
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await mockApi.getTransactions();
        setTransactions(
          data.sort((a, b) => b.date.getTime() - a.date.getTime())
        ); 
            } catch (err: any) {
        setError(err.message || "Failed to fetch transactions");
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, []);

   useEffect(() => {
    const prepareChartData = () => {
      if (!transactions || transactions.length === 0) {
        setChartData([]);
        return;
      }
       const groupedData: { [date: string]: number } = {};
      transactions.forEach((t) => {
        const formattedDate = format(t.date, "yyyy-MM-dd");
        if (groupedData[formattedDate]) {
          groupedData[formattedDate] += t.amount;
        } else {
          groupedData[formattedDate] = t.amount;
        }
      });

       const chartData = Object.entries(groupedData).map(([date, amount]) => ({
        date,
        amount,
      }));
      setChartData(chartData);
    };
    prepareChartData();
  }, [transactions]);

   const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleDateChange = (date: Date | undefined) => {
    setFormData({ ...formData, date });
  };

  const openModal = (transaction?: Transaction) => {
    if (transaction) {
       setEditingTransaction(transaction);
      setFormData({
        amount: transaction.amount.toString(),
        date: transaction.date,
        description: transaction.description,
      });
    } else {
       setEditingTransaction(null);
      setFormData({ amount: "", date: undefined, description: "" });   
    }
    setIsDialogOpen(true);
  };

  const closeModal = () => {
    setIsDialogOpen(false);
    setEditingTransaction(null); 
    setError(null);
  };

   const addTransaction = useCallback(async () => {
    if (!formData.amount || !formData.date || !formData.description) {
      setError("Please fill in all fields.");
      return;
    }

    const amount = Number(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      setError("Amount must be a positive number.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const newTransaction = await mockApi.createTransaction({
        amount,
        date: formData.date,
        description: formData.description,
      });
      setTransactions((prev) => [newTransaction, ...prev]);
      closeModal();
    } catch (err: any) {
      setError(err.message || "Failed to add transaction");
    } finally {
      setLoading(false);
    }
  }, [formData.amount, formData.date, formData.description]);

  const updateTransaction = useCallback(
    async (id: string) => {
      if (!formData.amount || !formData.date || !formData.description) {
        setError("Please fill in all fields.");
        return;
      }

      const amount = Number(formData.amount);
      if (isNaN(amount) || amount <= 0) {
        setError("Amount must be a positive number.");
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const updatedTransaction = await mockApi.updateTransaction(id, {
          amount,
          date: formData.date,
          description: formData.description,
        });
        if (!updatedTransaction) {
          setError("Transaction not found.");
          return;
        }
        setTransactions((prevTransactions) =>
          prevTransactions.map((transaction) =>
            transaction.id === id ? updatedTransaction : transaction
          )
        );
        closeModal();
      } catch (err: any) {
        setError(err.message || "Failed to update transaction");
      } finally {
        setLoading(false);
      }
    },
    [formData.amount, formData.date, formData.description]
  );

  const deleteTransactionHandler = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      await mockApi.deleteTransaction(id);
      setTransactions((prev) => prev.filter((t) => t.id !== id));
    } catch (err: any) {
      setError(err.message || "Failed to delete transaction");
    } finally {
      setLoading(false);
    }
  };
  if (loading) {
    return <div className="p-4 text-center">Loading...</div>;   
  }

  if (error) {
    return (
      <div
        className="p-4 bg-red-100 border border-red-400 text-red-700 rounded relative"
        role="alert"
      >
        <strong className="font-bold">Error: </strong>
        <span className="block sm:inline">{error}</span>
        <AlertCircle className="absolute top-3 left-4 h-6 w-6 text-red-500" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-2xl font-bold mb-4 md:mb-6 text-gray-800 dark:text-gray-200">
        Personal Finance Tracker
      </h1>

      {/* Add Transaction Button */}
      <div className="mb-4 md:mb-6">
        <Button
          onClick={() => openModal()}
          className="bg-blue-500 hover:bg-blue-600 text-white"
        >
          <PlusCircle className="mr-2 h-4 w-4" /> Add Transaction
        </Button>
      </div>

      {/* Transaction List */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-3 text-gray-700 dark:text-gray-300">
          Transactions
        </h2>
        {transactions.length === 0 ? (
          <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400">
            No transactions recorded yet.
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px] text-gray-600 dark:text-gray-400">
                    Amount
                  </TableHead>
                  <TableHead className="w-[120px] text-gray-600 dark:text-gray-400">
                    Date
                  </TableHead>
                  <TableHead className="text-gray-600 dark:text-gray-400">
                    Description
                  </TableHead>
                  <TableHead className="text-right text-gray-600 dark:text-gray-400">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence>
                  {transactions.map((transaction) => (
                    <motion.tr
                      key={transaction.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.2 }}
                    >
                      <TableCell className="font-medium text-gray-800 dark:text-gray-200">
                        ${transaction.amount.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-gray-700 dark:text-gray-300">
                        {formatDate(transaction.date)}
                      </TableCell>
                      <TableCell className="text-gray-700 dark:text-gray-300">
                        {transaction.description}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openModal(transaction)}
                          className="text-gray-500 hover:text-blue-500"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            deleteTransactionHandler(transaction.id)
                          }
                          className="text-gray-500 hover:text-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </TableBody>
            </Table>
          </div>
        )}
      </div>

       {transactions.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-300">
            Monthly Expenses
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={chartData}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
              className="bg-white dark:bg-gray-800 rounded-md shadow-md p-4"
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(200, 200, 200, 0.2)"
              />
              <XAxis
                dataKey="date"
                tick={{ fill: "#6b7280" }} 
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#6b7280" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value: number) => $${value}} 
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "0.5rem",
                }} 
                itemStyle={{ color: "#374151" }} 
                cursor={{ fill: "rgba(200, 200, 200, 0.5)" }}
              />
              <Legend wrapperStyle={{ color: "#6b7280" }} />
              <Bar dataKey="amount" fill="#8884d8" name="Expenses" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

       <Dialog open={isDialogOpen} onOpenChange={closeModal}>
        <DialogContent className="sm:max-w-[425px] bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-gray-100">
              {editingTransaction ? "Edit Transaction" : "Add Transaction"}
            </DialogTitle>
            <DialogDescription className="text-gray-500 dark:text-gray-400">
              {editingTransaction
                ? "Make changes to the transaction below. Click Save when done."
                : "Enter the transaction details below. Click Add when done."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label
                htmlFor="amount"
                className="text-right text-gray-700 dark:text-gray-300"
              >
                Amount
              </label>
              <Input
                id="amount"
                name="amount"
                value={formData.amount}
                onChange={handleInputChange}
                className="col-span-3 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
                placeholder="0.00"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label
                htmlFor="date"
                className="text-right text-gray-700 dark:text-gray-300"
              >
                Date
              </label>
              <div className="col-span-3">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100",
                        !formData.date && "text-muted-foreground"
                      )}
                    >
                      {formData.date ? (
                        formatDate(formData.date)
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.date}
                      onSelect={handleDateChange}
                      disabled={(date) => date > new Date()}
                      initialFocus
                      className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <label
                htmlFor="description"
                className="text-right mt-2 text-gray-700 dark:text-gray-300"
              >
                Description
              </label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="col-span-3 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 min-h-[80px]"
                placeholder="Enter transaction description"
              />
            </div>
          </div>
          {error && (
            <div
              className="p-2 bg-red-100 border border-red-400 text-red-700 rounded relative mb-4"
              role="alert"
            >
              <strong className="font-bold">Error: </strong>
              <span className="block sm:inline">{error}</span>
              <AlertCircle className="absolute top-2 left-3 h-5 w-5 text-red-500" />
            </div>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={closeModal}
              className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => {
                if (editingTransaction) {
                  updateTransaction(editingTransaction.id);
                } else {
                  addTransaction();
                }
              }}
              className="bg-blue-500 hover:bg-blue-600 text-white"
              disabled={loading}
            >
              {loading ? "Saving..." : editingTransaction ? "Save" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
export default App;