import React, { useState } from 'react';

// LandingPage Component
function LandingPage({ onSubmit }) {
  const [query, setQuery] = useState('');

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && query.trim() !== '') {
      onSubmit(query);
    }
  };

  const handleSubmit = () => {
    if (query.trim() !== '') {
      onSubmit(query);
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>How can we help?</h1>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder="Type your question here..."
        style={styles.input}
      />
      <button style={styles.button} onClick={handleSubmit}>
        Start Chat
      </button>
      <div style={styles.infoBox}>
        <p>
          Welcome to our support portal! Please enter your question above and press <strong>Enter</strong> or click <strong>Start Chat</strong>.
        </p>
        <p>
          Need help applying for a new passport? Looking to update your Aadhaar or driver’s license? We’ve got you covered!
        </p>
      </div>
    </div>
  );
}

// ChatInterface Component
function ChatInterface({ query, onBack }) {
  return (
    <div style={chatStyles.container}>
      <button onClick={onBack} style={chatStyles.backButton}>← Back</button>
      <h2 style={chatStyles.heading}>Chat Interface</h2>
      <p style={chatStyles.query}>Your query: <strong>{query}</strong></p>
      {/* Chat logic goes here */}
    </div>
  );
}

// Parent App Component
function App() {
  const [activeComponent, setActiveComponent] = useState('landing');
  const [query, setQuery] = useState('');

  const handleLandingSubmit = (userQuery) => {
    setQuery(userQuery);
    setActiveComponent('chat');
  };

  const handleBack = () => {
    setActiveComponent('landing');
  };

  return (
    <div>
      {activeComponent === 'landing' ? (
        <LandingPage onSubmit={handleLandingSubmit} />
      ) : (
        <ChatInterface query={query} onBack={handleBack} />
      )}
    </div>
  );
}

export default App;

// Inline styles for LandingPage
const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    backgroundColor: '#2C3E50',
    color: '#ECF0F1',
    fontFamily: 'sans-serif',
    padding: '0 20px',
  },
  heading: {
    fontSize: '2.5rem',
    marginBottom: '20px',
  },
  input: {
    width: '100%',
    maxWidth: '400px',
    padding: '10px',
    fontSize: '1rem',
    borderRadius: '4px',
    border: 'none',
    marginBottom: '10px',
  },
  button: {
    padding: '10px 20px',
    fontSize: '1rem',
    borderRadius: '4px',
    border: 'none',
    backgroundColor: '#3498DB',
    color: '#ECF0F1',
    cursor: 'pointer',
    marginBottom: '20px',
  },
  infoBox: {
    maxWidth: '500px',
    textAlign: 'center',
    lineHeight: '1.5',
  },
};

// Inline styles for ChatInterface
const chatStyles = {
  container: {
    padding: '20px',
    fontFamily: 'sans-serif',
    backgroundColor: '#F5F5F5',
    minHeight: '100vh',
  },
  backButton: {
    marginBottom: '20px',
    backgroundColor: '#3498DB',
    color: '#ECF0F1',
    border: 'none',
    borderRadius: '4px',
    padding: '5px 10px',
    cursor: 'pointer',
  },
  heading: {
    fontSize: '2rem',
    marginBottom: '10px',
  },
  query: {
    fontSize: '1.2rem',
  },
};
