import { useState } from 'react';
import ChatInterface from './components/ChatInterface';
import Sidebar from './components/Sidebar';
import ChatHistory from './components/ChatHistory';
import Auth from './components/Auth';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [messages, setMessages] = useState([]); // State to manage messages
  const [isChatActive, setIsChatActive] = useState(false);

  const handleMouseEnter = () => {
    setShowHistory(true);
  };

  const handleMouseLeave = () => {
    setShowHistory(false);
  };

  // Handle the new chat and clear messages
  const handleNewChat = () => {
    setIsChatActive(true);
    setMessages([]); // Clear the messages when starting a new chat
    setSelectedCategory(''); // Optionally reset category to none or default
  };

  if (!isAuthenticated) {
    return <Auth onAuthenticate={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex">
      {/* Logo and Sidebar */}
      <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col sticky top-0 h-screen z-10">
        <div className="p-4 border-b border-gray-700 flex items-center space-x-2">
          <img
            src="/bodhini_logo_trans.png" 
            alt="Bodhini Logo"
            className="h-14 w-10"
          />
          <span className="text-xl font-bold text-gray-100">Bodhini</span>
        </div>
        <Sidebar
          onCategorySelect={setSelectedCategory}
          selectedCategory={selectedCategory}
          onNewChat={handleNewChat} // Pass the handleNewChat function
        />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        <ChatInterface
          category={selectedCategory}
          messages={messages} // Pass messages to the ChatInterface
          setMessages={setMessages} // Pass setMessages to clear messages when necessary
        />
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
