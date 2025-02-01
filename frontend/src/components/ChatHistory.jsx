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
    <div className="h-full flex flex-col bg-gray-900 rounded-lg shadow-2xl overflow-hidden">
      <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-800">
        <h2 className="text-lg font-semibold text-gray-100 flex items-center">
          <MessageCircle className="mr-2 text-blue-500" />
          Chat History
        </h2>
        <button className="text-gray-400 hover:text-gray-200 transition-colors">
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {histories.map((history, index) => (
          <div
            key={index}
            className="p-4 rounded-lg bg-gray-800 border border-gray-700 hover:bg-gray-700 cursor-pointer transition-all duration-200 group"
          >
            <h3 className="font-medium text-gray-100 group-hover:text-blue-400 transition-colors">
              {history.title}
            </h3>
            <div className="flex items-center text-sm text-gray-500 mt-1 group-hover:text-gray-300">
              <Clock className="h-4 w-4 mr-2" />
              <span>{history.time}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChatHistory;