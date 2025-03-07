import React from 'react';
import { Brain, Calendar as CalendarIcon, Map, MessageSquare, Package, ShoppingCart, Building2, LogOut, User } from 'lucide-react';
import { cn } from '../utils/cn';
import { usePageStore, PageType } from '../store/pageStore';
import { useAuthStore } from '../store/authStore';
import { motion } from 'framer-motion';

interface SidebarProps {
  className?: string;
  onOrderClick?: () => void; // Add onOrderClick prop
}


const menuItems = [
  { icon: MessageSquare, label: 'New Chat', page: 'chat' as PageType },
  { icon: Building2, label: 'Government Services', page: 'government' as PageType },
  { icon: ShoppingCart, label: 'Reservations', page: 'reservations' as PageType },
  { icon: CalendarIcon, label: 'Calendar', page: 'calendar' as PageType },
  { icon: Package, label: 'Order & Delivery', page: 'orders' as PageType },
  { icon: Map, label: 'Travel', page: 'travel' as PageType },
];

export const Sidebar: React.FC<SidebarProps> = ({ className, onOrderClick }) => {
  const { setPage, currentPage } = usePageStore();
  const { logout } = useAuthStore();

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center gap-3 p-6"
      >
        <Brain className="w-8 h-8 text-primary animate-glow" />
        <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Bodhini
        </h1>
      </motion.div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-2">
        {menuItems.map((item) => (
          <motion.button
            key={item.label}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setPage(item.page);
              if (item.page === 'orders' && onOrderClick) {
                onOrderClick(); // Trigger onOrderClick for "Order & Delivery"
              }
            }}
            className={cn(
              'flex items-center w-full gap-3 px-4 py-3 rounded-xl transition-all duration-200',
              currentPage === item.page
                ? 'bg-primary text-white'
                : 'text-gray-300 hover:bg-dark-light hover:text-white'
            )}
          >
            <item.icon className="w-5 h-5" />
            <span className="text-sm font-medium">{item.label}</span>
          </motion.button>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 flex items-center gap-2">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setPage('profile')}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-300 hover:bg-dark-light hover:text-white transition-all duration-200"
        >
          <User className="w-4 h-4" />
          <span className="text-sm font-medium">Profile</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={logout}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-300 hover:bg-dark-light hover:text-white transition-all duration-200"
        >
          <LogOut className="w-4 h-4" />
          <span className="text-sm font-medium">Logout</span>
        </motion.button>
      </div>
    </div>
  );
};
