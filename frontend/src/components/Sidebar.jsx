import React, { useState } from 'react';
import { Plus, Clover as Government, Hotel, Calendar, ShoppingCart, Plane, LogOut, User } from 'lucide-react';

const Sidebar = ({ onCategorySelect, selectedCategory, handleNewChat }) => {
  const categories = [
    { icon: Government, label: 'Government Services' },
    { icon: Hotel, label: 'Reservations' },
    { icon: Calendar, label: 'Calendar' },
    { icon: ShoppingCart, label: 'Orders & Delivery' },
    { icon: Plane, label: 'Travel' },
  ];

  return (
    <div className="bg-gray-900 w-64 h-full flex flex-col justify-between overflow-y-auto py-4 border-r border-gray-800">
      <div>
        <button 
          className="w-full px-4 py-2 flex items-center space-x-2 text-blue-500 hover:bg-gray-800 transition-colors duration-200"
          onClick={handleNewChat} // Trigger new chat when clicked
        >
          <Plus className="h-5 w-5" />
          <span>New Chat</span>
        </button>

        <div className="mt-4">
          {categories.map((category) => (
            <button
              key={category.label}
              className={`w-full px-4 py-2 flex items-center space-x-2 transition-colors duration-200 ${
                selectedCategory === category.label
                  ? 'bg-gray-800 text-blue-500'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
              }`}
              onClick={() => onCategorySelect(category.label)}
            >
              <category.icon className="h-5 w-5" />
              <span>{category.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col items-center border-gray-800">
        <div className="flex items-center space-x-2 text-gray-400">
          <br></br>
          <User className="h-8 w-8 round-xl" />
          <br></br>
          <span>Mishti Mattu</span>
        </div>
      </div>
    </div>
  );
};

const ChatComponent = ({ onCategorySelect }) => {
  const [messages, setMessages] = useState([]);

  const handleNewChat = () => {
    setMessages([]); // Clear messages
    onCategorySelect(''); // Reset the selected category
  };

  return (
    <div className="bg-gray-900 w-full h-full flex flex-col py-4">
      <Sidebar onCategorySelect={onCategorySelect} handleNewChat={handleNewChat} selectedCategory="" />
    </div>
  );
};

export default ChatComponent;
