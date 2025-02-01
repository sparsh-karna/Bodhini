import React from 'react';
import { Plus, Clover as Government, Hotel, Calendar, ShoppingCart, Plane } from 'lucide-react';

interface SidebarProps {
  onCategorySelect: (category: string) => void;
  selectedCategory: string;
}

const Sidebar: React.FC<SidebarProps> = ({ onCategorySelect, selectedCategory }) => {
  const categories = [
    { icon: Government, label: 'Government Services' },
    { icon: Hotel, label: 'Reservations' },
    { icon: Calendar, label: 'Calendar' },
    { icon: ShoppingCart, label: 'Orders & Delivery' },
    { icon: Plane, label: 'Travel' },
  ];

  const handleNewChat = () => {
    onCategorySelect('');
  };

  return (
    <div className="bg-gray-900 w-64 h-full overflow-y-auto py-4 border-r border-gray-800">
      <button 
        className="w-full px-4 py-2 flex items-center space-x-2 text-blue-500 hover:bg-gray-800 transition-colors duration-200"
        onClick={handleNewChat}
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

export default Sidebar;