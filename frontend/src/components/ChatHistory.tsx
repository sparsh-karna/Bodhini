import React from 'react';
import { Clock, Trash2 } from 'lucide-react';
import { cn } from '../utils/cn';

interface ChatHistoryProps {
  className?: string;
}

const mockHistory = [
  { id: 1, title: 'Travel Planning to Japan', time: '2 hours ago' },
  { id: 2, title: 'Restaurant Booking Help', time: '5 hours ago' },
  { id: 3, title: 'Government Service Inquiry', time: 'Yesterday' },
];

export const ChatHistory: React.FC<ChatHistoryProps> = ({ className }) => {
  return (
    <div className={cn("flex flex-col h-full", className)}>
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-dark">Chat History</h2>
        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <Trash2 className="w-5 h-5 text-gray-500 hover:text-dark" />
        </button>
      </div>
      <div className="flex-1 p-4 space-y-2 overflow-y-auto">
        {mockHistory.map((chat) => (
          <button
            key={chat.id}
            className="w-full p-4 rounded-xl bg-white hover:bg-gray-50 transition-all duration-200 text-left group border border-gray-200"
          >
            <p className="text-dark font-medium truncate group-hover:text-dark">
              {chat.title}
            </p>
            <div className="flex items-center gap-1 mt-1 text-gray-500 text-sm">
              <Clock className="w-3 h-3" />
              <span>{chat.time}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};