import React from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { motion } from 'framer-motion';

export const Calendar: React.FC = () => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const currentDate = new Date();
  const currentMonth = currentDate.toLocaleString('default', { month: 'long' });

  return (
    <div className="flex-1 p-6 overflow-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        <div className="flex items-center gap-3 mb-8">
          <CalendarIcon className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold text-white">Calendar</h1>
        </div>

        <div className="bg-dark-lighter rounded-xl p-6 border border-dark-light">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-white">{currentMonth}</h2>
            <div className="flex gap-2">
              <button className="p-2 rounded-lg bg-dark hover:bg-dark-light transition-colors">
                Previous
              </button>
              <button className="p-2 rounded-lg bg-dark hover:bg-dark-light transition-colors">
                Next
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2 mb-4">
            {days.map((day) => (
              <div key={day} className="text-center text-gray-400 font-medium">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 35 }).map((_, i) => (
              <motion.button
                key={i}
                whileHover={{ scale: 1.1 }}
                className="aspect-square rounded-lg bg-dark hover:bg-dark-light transition-colors flex items-center justify-center"
              >
                {i + 1}
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
};