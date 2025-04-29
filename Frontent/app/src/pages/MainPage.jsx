import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { Bar, Pie, Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement } from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

const MainPage = ({ userEmail }) => {
  const [userName, setUserName] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [newTransaction, setNewTransaction] = useState({ description: '', amount: 0, date: '' });
  const [monthlyExpenses, setMonthlyExpenses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSpent: 0,
    averageTransaction: 0,
    highestExpense: 0,
    transactionCount: 0
  });
  const [timeRange, setTimeRange] = useState('all'); // 'week', 'month', 'year', 'all'
  const chartRef = useRef(null);

  // Fetch user details
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axios.get(`https://internship-project-1-ahe5.onrender.com/users/me/`, {
          params: { email: userEmail }
        });
        setUserName(`₹{response.data.first_name} ₹{response.data.last_name}`);
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };
    fetchUser();
  }, [userEmail]);

  // Calculate statistics
  const calculateStats = (data) => {
    const amounts = data.map(t => t.amount);
    const total = amounts.reduce((sum, amount) => sum + amount, 0);
    const average = amounts.length > 0 ? total / amounts.length : 0;
    const highest = Math.max(...amounts, 0);
    
    setStats({
      totalSpent: total,
      averageTransaction: average,
      highestExpense: highest,
      transactionCount: data.length
    });
  };

  // Filter transactions by time range
  const filterTransactions = (data, range) => {
    const now = new Date();
    let cutoffDate = new Date(0); // Default to all time
    
    if (range === 'week') {
      cutoffDate = new Date(now.setDate(now.getDate() - 7));
    } else if (range === 'month') {
      cutoffDate = new Date(now.setMonth(now.getMonth() - 1));
    } else if (range === 'year') {
      cutoffDate = new Date(now.setFullYear(now.getFullYear() - 1));
    }
    
    return range === 'all' 
      ? data 
      : data.filter(t => new Date(t.date) >= cutoffDate);
  };

  // Fetch transactions
  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`https://internship-project-1-ahe5.onrender.com/transactions/`, {
        params: { email: userEmail }
      });
      const filtered = filterTransactions(response.data, timeRange);
      setTransactions(filtered);
      calculateStats(filtered);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch monthly expenses
  const fetchMonthlyExpenses = async () => {
    try {
      const response = await axios.get(`https://internship-project-1-ahe5.onrender.com/transactions/monthly-expenses`, {
        params: { email: userEmail }
      });
      setMonthlyExpenses(response.data);
    } catch (error) {
      console.error('Error fetching monthly expenses:', error);
    }
  };

  // Create a new transaction
  const handleCreateTransaction = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`https://internship-project-1-ahe5.onrender.com/transactions/`, newTransaction, {
        params: { email: userEmail }
      });
      setNewTransaction({ description: '', amount: 0, date: '' });
      fetchTransactions();
      fetchMonthlyExpenses();
    } catch (error) {
      console.error('Error creating transaction:', error);
    }
  };

  // Delete a transaction
  const handleDeleteTransaction = async (transactionId) => {
    try {
      await axios.delete(`https://internship-project-1-ahe5.onrender.com/transactions/₹{transactionId}`, {
        params: { email: userEmail }
      });
      fetchTransactions();
      fetchMonthlyExpenses();
    } catch (error) {
      console.error('Error deleting transaction:', error);
    }
  };

  useEffect(() => {
    fetchTransactions();
    fetchMonthlyExpenses();
  }, [userEmail, timeRange]);

  // Prepare data for charts
  const prepareChartData = () => {
    // Monthly expenses bar chart
    const monthlyData = {
      labels: monthlyExpenses.map(e => e.month),
      datasets: [
        {
          label: 'Monthly Expenses',
          data: monthlyExpenses.map(e => e.total),
          backgroundColor: 'rgba(59, 130, 246, 0.7)',
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 1
        }
      ]
    };

    // Transaction categories pie chart (example - you'll need to add categories to your transactions)
    const categories = {};
    transactions.forEach(t => {
      // Simple categorization by description keywords (you should implement proper categorization)
      const category = t.description.toLowerCase().includes('food') ? 'Food' :
                      t.description.toLowerCase().includes('rent') ? 'Rent' :
                      t.description.toLowerCase().includes('transport') ? 'Transport' : 'Other';
      categories[category] = (categories[category] || 0) + t.amount;
    });

    const categoryData = {
      labels: Object.keys(categories),
      datasets: [
        {
          data: Object.values(categories),
          backgroundColor: [
            'rgba(255, 99, 132, 0.7)',
            'rgba(54, 162, 235, 0.7)',
            'rgba(255, 206, 86, 0.7)',
            'rgba(75, 192, 192, 0.7)',
            'rgba(153, 102, 255, 0.7)'
          ],
          borderColor: [
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)'
          ],
          borderWidth: 1
        }
      ]
    };

    // Daily spending line chart (last 30 days)
    const last30Days = [...Array(30)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();

    const dailySpending = last30Days.map(date => {
      return transactions
        .filter(t => t.date.split('T')[0] === date)
        .reduce((sum, t) => sum + t.amount, 0);
    });

    const dailyData = {
      labels: last30Days.map(d => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
      datasets: [
        {
          label: 'Daily Spending',
          data: dailySpending,
          fill: false,
          backgroundColor: 'rgba(75, 192, 192, 0.7)',
          borderColor: 'rgba(75, 192, 192, 1)',
          tension: 0.1
        }
      ]
    };

    return { monthlyData, categoryData, dailyData };
  };

  const { monthlyData, categoryData, dailyData } = prepareChartData();

  return (
    <section className="bg-gradient-to-b from-blue-900 to-blue-700 text-white min-h-screen p-8">
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold mb-6">Welcome, {userName}!</h1>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white text-blue-900 rounded-lg shadow-lg p-6">
            <h3 className="text-sm font-medium text-gray-500">Total Spent</h3>
            <p className="text-2xl font-bold">₹{stats.totalSpent.toFixed(2)}</p>
          </div>
          <div className="bg-white text-blue-900 rounded-lg shadow-lg p-6">
            <h3 className="text-sm font-medium text-gray-500">Avg. Transaction</h3>
            <p className="text-2xl font-bold">₹{stats.averageTransaction.toFixed(2)}</p>
          </div>
          <div className="bg-white text-blue-900 rounded-lg shadow-lg p-6">
            <h3 className="text-sm font-medium text-gray-500">Highest Expense</h3>
            <p className="text-2xl font-bold">₹{stats.highestExpense.toFixed(2)}</p>
          </div>
          <div className="bg-white text-blue-900 rounded-lg shadow-lg p-6">
            <h3 className="text-sm font-medium text-gray-500">Transactions</h3>
            <p className="text-2xl font-bold">{stats.transactionCount}</p>
          </div>
        </div>

        {/* Time Range Filter */}
        <div className="bg-white text-blue-900 rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">Time Range</h2>
          <div className="flex space-x-4">
            {['week', 'month', 'year', 'all'].map((range) => (
              <motion.button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-lg ₹{timeRange === range ? 'bg-blue-600 text-white' : 'bg-gray-200 text-blue-900'}`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {range.charAt(0).toUpperCase() + range.slice(1)}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white text-blue-900 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4">Monthly Expenses</h2>
            <div className="h-64">
              <Bar 
                data={monthlyData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'top',
                    },
                  },
                }}
              />
            </div>
          </div>
          <div className="bg-white text-blue-900 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4">Spending by Category</h2>
            <div className="h-64">
              <Pie 
                data={categoryData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'right',
                    },
                  },
                }}
              />
            </div>
          </div>
          <div className="bg-white text-blue-900 rounded-lg shadow-lg p-6 lg:col-span-2">
            <h2 className="text-xl font-bold mb-4">Daily Spending (Last 30 Days)</h2>
            <div className="h-64">
              <Line 
                data={dailyData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'top',
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true
                    }
                  }
                }}
              />
            </div>
          </div>
        </div>

        {/* Create Transaction */}
        <div className="bg-white text-blue-900 rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">Create a New Transaction</h2>
          <form onSubmit={handleCreateTransaction} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium">Description</label>
                <input
                  type="text"
                  name="description"
                  value={newTransaction.description}
                  onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Amount</label>
                <input
                  type="number"
                  step="0.01"
                  name="amount"
                  value={newTransaction.amount}
                  onChange={(e) => setNewTransaction({ ...newTransaction, amount: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Date</label>
                <input
                  type="date"
                  name="date"
                  value={newTransaction.date}
                  onChange={(e) => setNewTransaction({ ...newTransaction, date: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
            <motion.button
              type="submit"
              className="px-6 py-2 bg-yellow-500 text-blue-900 font-bold rounded-lg hover:bg-yellow-400 transition-all duration-300"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Add Transaction
            </motion.button>
          </form>
        </div>

        {/* Transactions List */}
        <div className="bg-white text-blue-900 rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">Your Transactions</h2>
          {isLoading ? (
            <p>Loading transactions...</p>
          ) : Array.isArray(transactions) && transactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-blue-900 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-blue-900 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-blue-900 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-blue-900 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transactions.map((transaction) => (
                    <tr key={transaction.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(transaction.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-900">
                        {transaction.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ₹{transaction.amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <motion.button
                          onClick={() => handleDeleteTransaction(transaction.id)}
                          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-400 transition-all duration-300"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          Delete
                        </motion.button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p>No transactions found.</p>
          )}
        </div>
      </div>
    </section>
  );
};

export default MainPage;