import React, { useState } from 'react';
import { Plus, Clover as Government, Hotel, Calendar, ShoppingCart, Plane } from 'lucide-react';

const Sidebar = ({ onCategorySelect, selectedCategory, handleNewChat }) => {
  const categories = [
    { icon: Government, label: 'Government Services' },
    { icon: Hotel, label: 'Reservations' },
    { icon: Calendar, label: 'Calendar' },
    { icon: ShoppingCart, label: 'Orders & Delivery' },
    { icon: Plane, label: 'Travel' },
  ];

  return (
    <div className="bg-gray-900 w-64 h-full overflow-y-auto py-4 border-r border-gray-800">
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
  );
};

/*************  ✨ Codeium Command ⭐  *************/
/**
 * ChatComponent renders a chat window with a sidebar to select categories and
 * start new chats. It also displays any chat messages.
 *
 * @param {function} onCategorySelect - called when the user selects a new
 *   category
 */
/******  35d76b39-6b6e-49e9-853d-9725ec8d222a  *******/const handleNewChat = () => {
  // Create a new chat instance
  const newChat = {
    id: Date.now().toString(),
    messages: [],
  };

  // Add the new chat instance to the existing chats
  setChats((prevChats) => [...prevChats, newChat]);

  // Set the selected chat to the new one
  setSelectedChat(newChat.id);
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
      
      {/* Chat messages */}
      {/* <div className="chat-window flex-1">
        {messages.length === 0 ? (
          <div className="text-gray-400">Start a new chat!</div>
        ) : (
          messages.map((message, index) => (
            <div key={index} className="message text-white">{message}</div>
          ))
        )}
      </div> */}
    </div>
  );
};

export default ChatComponent;
