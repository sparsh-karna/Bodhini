import React from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { ChatHistory } from './components/ChatHistory';
import { Government } from './components/pages/Government';
import { Calendar } from './components/pages/Calendar';
import { Travel } from './components/pages/Travel';
import { Auth } from './components/Auth';
import { useAuthStore } from './store/authStore';
import { usePageStore } from './store/pageStore';
import { handleOrderMessage } from './utils/orderHandlers';

function App() {
  const { setPage } = usePageStore();
  const { isAuthenticated } = useAuthStore();
  const { currentPage } = usePageStore();

  if (!isAuthenticated) {
    return <Auth />;
  }

  const renderMainContent = () => {
    switch (currentPage) {
      case 'government':
        return <Government />;
      case 'calendar':
        return <Calendar />;
      case 'travel':
        return <Travel />;
      default:
        return <ChatArea />;
    }
  };

  return (
    <div className="flex h-screen bg-dark-lighter p-4 gap-4">
      <div className="flex-none w-64 bg-dark-lighter rounded-2xl overflow-hidden">
        <Sidebar onOrderClick={() => setPage('orders', handleOrderMessage)}/>
      </div>
      <div className="flex-1 bg-[#E6E6E2] rounded-2xl overflow-hidden text-dark">
        {renderMainContent()}
      </div>
      {currentPage === 'chat' && (
        <div className="flex-none w-80 bg-[#E6E6E2] rounded-2xl overflow-hidden border border-dark-light text-dark">
          <ChatHistory />
        </div>
      )}
    </div>
  );
}

export default App;