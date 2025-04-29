import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const HeroSection = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <section className="bg-gradient-to-b from-blue-900 to-blue-700 text-white py-20 relative">
      {/* Top-right corner buttons */}
      <div className="absolute top-4 right-6 flex space-x-4">
        <Link to="/login">
          <motion.button
            className="px-4 py-2 bg-blue-500 text-white font-bold rounded-lg shadow-lg hover:bg-blue-400 transition-all duration-300"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Login
          </motion.button>
        </Link>
        <Link to="/signup">
          <motion.button
            className="px-4 py-2 bg-green-500 text-white font-bold rounded-lg shadow-lg hover:bg-green-400 transition-all duration-300"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Signup
          </motion.button>
        </Link>
      </div>

      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center">
          {/* Left Content Column */}
          <motion.div
            className="w-full md:w-1/2 mb-12 md:mb-0 md:pr-12"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: isVisible ? 1 : 0, x: isVisible ? 0 : -50 }}
            transition={{ duration: 0.8 }}
          >
            <div className="space-y-6">
              <div className="inline-block px-3 py-1 bg-blue-500 bg-opacity-30 rounded-full mb-2">
                <span className="text-xs font-semibold tracking-wider">TAKE CONTROL OF YOUR FINANCES</span>
              </div>

              <h1 className="text-4xl md:text-5xl font-bold leading-tight">
                Smart Money Tracking For Your <span className="text-yellow-400">Financial Freedom</span>
              </h1>

              <p className="text-lg text-blue-100">
                Track expenses, monitor savings, and visualize your financial journey with our intuitive dashboard. Make informed decisions and achieve your financial goals.
              </p>

              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 pt-4">
                <motion.button
                  className="px-8 py-3 bg-yellow-500 text-blue-900 font-bold rounded-lg shadow-lg hover:bg-yellow-400 transition-all duration-300 flex items-center justify-center"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Get Started Free
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                  </svg>
                </motion.button>

                <motion.a
                  href="#features"
                  className="px-8 py-3 border-2 border-blue-300 text-white font-semibold rounded-lg hover:bg-blue-600 transition-all duration-300 flex items-center justify-center"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Learn More
                </motion.a>
              </div>
            </div>
          </motion.div>

          {/* Right Dashboard Preview */}
          <motion.div
            className="w-full md:w-1/2"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 50 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <div className="relative">
              {/* Glow effect */}
              <div className="absolute -inset-2 bg-blue-400 rounded-xl blur-lg opacity-30 animate-pulse"></div>

              {/* Dashboard preview */}
              <div className="relative z-10 bg-white rounded-xl shadow-2xl overflow-hidden">
                <div className="bg-blue-800 p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  </div>
                  <div className="text-sm text-white font-medium">Financial Dashboard</div>
                  <div></div>
                </div>

                <div className="p-6 bg-gray-50">
                  {/* Mock chart */}
                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-gray-800 font-semibold">Monthly Overview</h3>
                      <span className="text-sm text-green-600 font-medium">+12.5%</span>
                    </div>
                    <div className="h-32 bg-white rounded-lg p-3">
                      <div className="flex items-end justify-between h-full">
                        {[35, 55, 40, 70, 60, 75, 65, 80].map((height, index) => (
                          <div key={index} className="w-8">
                            <div
                              className="bg-blue-600 rounded-t-sm"
                              style={{ height: `${height}%` }}
                            ></div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Mock stats */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <div className="text-sm text-gray-500">Total Savings</div>
                      <div className="text-xl font-bold text-gray-800">$12,750</div>
                      <div className="text-xs text-green-600">↑ 8.2% from last month</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <div className="text-sm text-gray-500">Monthly Expenses</div>
                      <div className="text-xl font-bold text-gray-800">$3,426</div>
                      <div className="text-xs text-red-600">↓ 4.1% from last month</div>
                    </div>
                  </div>

                  {/* Mock transaction list */}
                  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="px-4 py-3 bg-gray-100 border-b border-gray-200">
                      <h3 className="text-sm font-medium text-gray-700">Recent Transactions</h3>
                    </div>
                    <div className="divide-y divide-gray-200">
                      {[
                        { name: 'Grocery Store', amount: '-$124.50', date: 'Today' },
                        { name: 'Salary Deposit', amount: '+$3,500.00', date: 'Yesterday' },
                        { name: 'Electric Bill', amount: '-$87.32', date: '3 days ago' }
                      ].map((transaction, index) => (
                        <div key={index} className="flex justify-between items-center p-4">
                          <div>
                            <div className="font-medium text-gray-800">{transaction.name}</div>
                            <div className="text-xs text-gray-500">{transaction.date}</div>
                          </div>
                          <div className={`font-medium ${transaction.amount.includes('+') ? 'text-green-600' : 'text-red-600'}`}>
                            {transaction.amount}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Wave shape divider */}
      <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none">
        <svg className="relative block w-full h-16" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" className="fill-white"></path>
        </svg>
      </div>
    </section>
  );
};

export default HeroSection;