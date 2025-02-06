import { useState } from 'react';
import ChatInterface from './components/ChatInterface';
import Sidebar from './components/Sidebar';
import ChatHistory from './components/ChatHistory';
import Auth from './components/Auth';
import { Clock, X, MessageCircle } from 'lucide-react';


function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [messages, setMessages] = useState([]);
  const [isChatActive, setIsChatActive] = useState(false);

  // Handle the new chat and clear messages
  const handleNewChat = () => {
    setIsChatActive(true);
    setMessages([]);
    setSelectedCategory('');
  };

  if (!isAuthenticated) {
    return <Auth onAuthenticate={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex">
      {/* Sidebar */}
      <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col h-screen sticky top-0">
        <div className="p-4 border-b border-gray-700 flex items-center space-x-2">
          <img src="/bodhini_logo_trans.png" alt="Bodhini Logo" className="h-14 w-10" />
          <span className="text-xl font-bold text-gray-100">Bodhini</span>
        </div>
        <Sidebar onCategorySelect={setSelectedCategory} selectedCategory={selectedCategory} onNewChat={handleNewChat} />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        <ChatInterface category={selectedCategory} messages={messages} setMessages={setMessages} />
      </div>

      {/* Chat History Panel (Always Visible) */}
      <div className="w-64 bg-gray-800 border-r border-gray-900 flex flex-col h-screen sticky top-0">
        <div className="p-4 border-b border-l border-gray-700 flex items-center space-x-2">
          <MessageCircle className="mr-2 text-blue-500 h-14 w-10" />
          <span className="text-xl font-bold text-gray-100">Chat History</span>
        </div>
      
        <ChatHistory />
      
      </div>
    </div>
  );
}

export default App;
