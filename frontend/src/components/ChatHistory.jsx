import React from 'react';
import { Clock, X, MessageCircle } from 'lucide-react';

const ChatHistory = () => {
  const histories = [
    { title: 'Government ID Application', time: '2 hours ago' },
    { title: 'Hotel Booking', time: '5 hours ago' },
    { title: 'Flight Ticket Search', time: 'Yesterday' },
    { title: 'Calendar Reminder', time: '2 days ago' },
  ];

  return (
    
    <div className="w-64 bg-gray-900 border-r border-gray-700 flex flex-col h-screen sticky top-0">
      
      {/* Adds space at the top to shift content down */}
      <div className="flex-1 overflow-y-auto p-2 space-y-4 mt-6">
        {histories.map((history, index) => (
          <div
            key={index}
            className="p-2 rounded-md bg-gray-800 border border-gray-700 hover:bg-gray-700 cursor-pointer transition-all duration-200 group flex justify-between items-center"
          >
            <div>
              <h3 className="font-normal text-gray-300 group-hover:text-blue-400 transition-colors text-sm">
                {history.title}
              </h3>
              <div className="flex items-center text-xs text-gray-500 mt-1 group-hover:text-gray-300">
                <Clock className="h-3 w-3 mr-1" />
                <span>{history.time}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChatHistory;