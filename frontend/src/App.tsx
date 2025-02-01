import React, { useState } from 'react';
import { BrainCog } from 'lucide-react';
import ChatInterface from './components/ChatInterface';
import Sidebar from './components/Sidebar';
import ChatHistory from './components/ChatHistory';
import Auth from './components/Auth';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');

  const handleMouseEnter = () => {
    setShowHistory(true);
  };

  const handleMouseLeave = () => {
    setShowHistory(false);
  };

  if (!isAuthenticated) {
    return <Auth onAuthenticate={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex">
      {/* Logo and Sidebar */}
      <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-700 flex items-center space-x-2">
        <img src="src\WhatsApp Image 2025-01-25 at 23.26.00_63aa4091.jpg" alt="Bodhini Logo" className="h-8 w-8" />
          <span className="text-xl font-bold text-gray-100">Bodhini</span>
        </div>
        <Sidebar 
          onCategorySelect={setSelectedCategory} 
          selectedCategory={selectedCategory} 
        />
      </div>
      





      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        <ChatInterface category={selectedCategory} />
      </div>

      {/* History Panel */}
      <div 
        className="fixed right-0 top-0 h-full w-80 bg-gray-800 shadow-lg transform transition-transform duration-300 ease-in-out"
        style={{ transform: showHistory ? 'translateX(0)' : 'translateX(calc(100% - 8px))' }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="absolute left-0 top-0 bottom-0 w-2 cursor-pointer" />
        <ChatHistory />
      </div>
    </div>
  );
}

export default App;