import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, Image, FileText, Video, UserCog, Car, Heart, CreditCard, FileKey, Building } from 'lucide-react';

const ChatInterface = ({ category }) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [showServices, setShowServices] = useState(category === 'Government Services');
  const [isRecording, setIsRecording] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const governmentServices = [
    { icon: UserCog, title: 'Aadhaar Card', description: 'Update or apply for Aadhaar' },
    { icon: Car, title: 'Driving License', description: 'New license or renewal' },
    { icon: Heart, title: 'Health Services', description: 'Healthcare and insurance' },
    { icon: CreditCard, title: 'PAN Card', description: 'Apply or update PAN' },
    { icon: FileKey, title: 'Passport', description: 'Apply for passport services' },
    { icon: Building, title: 'Property Registration', description: 'Register or transfer property' },
  ];

  const quickActions = [
    { id: '1', text: 'How do I apply for a new passport?' },
    { id: '2', text: 'Update my Aadhaar card address' },
    { id: '3', text: 'Book a driving license test' },
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    // Generate a unique session ID when the component mounts
    if (!sessionId) {
      setSessionId(`session_${Date.now()}`);
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    setMessages([]);
    setShowServices(category === 'Government Services');
    if (category === 'Government Services') {
      const welcomeMessage = `Welcome to Government Services! How can I assist you today?`;
      setMessages([
        {
          id: Date.now().toString(),
          text: welcomeMessage,
          sender: 'bot',
          timestamp: new Date(),
        },
      ]);
    }
  }, [category]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;
  
    const userMessage = {
      id: Date.now().toString(),
      text: message,
      sender: 'user',
      timestamp: new Date(),
    };
  
    setMessages((prev) => [...prev, userMessage]);
    setMessage('');
  
    // Fetch response from Flask backend with session ID
    try {
      // hello
      const response = await fetch('http://localhost:5001/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message, 
          session_id: sessionId 
        }),
      });
      const data = await response.json();
  
      const botMessage = {
        id: (Date.now() + 1).toString(),
        text: data.response,
        sender: 'bot',
        timestamp: new Date(),
      };
  
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error('Error fetching from backend:', error);
      const botMessage = {
        id: (Date.now() + 1).toString(),
        text: 'Sorry, there was an error processing your request. Please try again later.',
        sender: 'bot',
        timestamp: new Date(),
      };
  
      setMessages((prev) => [...prev, botMessage]);
    }
  };

  const handleQuickAction = (action) => {
    const userMessage = {
      id: Date.now().toString(),
      text: action.text,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);

    setTimeout(() => {
      const botMessage = {
        id: (Date.now() + 1).toString(),
        text: `I'll help you with: ${action.text}. Let me guide you through the process.`,
        sender: 'bot',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
    }, 1000);
  };

  const handleServiceClick = (service) => {
    const userMessage = {
      id: Date.now().toString(),
      text: `I need help with ${service.title}`,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);

    setTimeout(() => {
      const botMessage = {
        id: (Date.now() + 1).toString(),
        text: `I'll help you with ${service.title}. What specific assistance do you need with ${service.description.toLowerCase()}?`,
        sender: 'bot',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
    }, 1000);
  };

  // Voice Recording Handlers
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(audioBlob);

        const userMessage = {
          id: Date.now().toString(),
          text: "Voice message",
          sender: 'user',
          timestamp: new Date(),
          media: {
            type: 'audio',
            url: audioUrl
          }
        };

        setMessages((prev) => [...prev, userMessage]);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Unable to access microphone. Please check your permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // File Upload Handlers
  const handleFileUpload = (event, type) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const fileUrl = URL.createObjectURL(file);
    const userMessage = {
      id: Date.now().toString(),
      text: type === 'image' ? 'Image uploaded' : `Document uploaded: ${file.name}`,
      sender: 'user',
      timestamp: new Date(),
      media: {
        type,
        url: fileUrl,
        name: file.name
      }
    };

    setMessages((prev) => [...prev, userMessage]);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-gray-900">
      {/* Chat Messages Area */}
      <div className="flex-1 p-4 overflow-y-auto bg-gray-900">
        <div className="max-w-3xl mx-auto space-y-4">
          {showServices && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {governmentServices.map((service, index) => (
                <button
                  key={index}
                  onClick={() => handleServiceClick(service)}
                  className="bg-gray-800 p-4 rounded-lg shadow-md border border-gray-700 hover:border-blue-600 hover:shadow-lg transition-all duration-200 flex flex-col items-center text-center"
                >
                  <service.icon className="h-8 w-8 text-blue-500 mb-2" />
                  <h3 className="font-medium text-gray-100 mb-1">{service.title}</h3>
                  <p className="text-sm text-gray-400">{service.description}</p>
                </button>
              ))}
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-sm rounded-lg px-4 py-2 ${
                  msg.sender === 'user'
                    ? 'bg-blue-700 text-white'
                    : 'bg-gray-800 text-gray-200 border border-gray-700'
                }`}
              >
                <p>{msg.text}</p>
                {msg.media && (
                  <div className="mt-2">
                    {msg.media.type === 'image' && (
                      <img 
                        src={msg.media.url} 
                        alt="Uploaded" 
                        className="max-w-full rounded-lg"
                      />
                    )}
                    {msg.media.type === 'document' && (
                      <a 
                        href={msg.media.url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="flex items-center text-white underline"
                      >
                        <FileText className="h-4 w-4 mr-1" />
                        {msg.media.name}
                      </a>
                    )}
                    {msg.media.type === 'audio' && (
                      <audio controls className="mt-2">
                        <source src={msg.media.url} type="audio/wav" />
                        Your browser does not support the audio element.
                      </audio>
                    )}
                  </div>
                )}
                <p className="text-xs mt-1 opacity-75">
                  {msg.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gray-800 px-4 py-2 border-t border-gray-700">
        <div className="max-w-3xl mx-auto flex gap-2 overflow-x-auto pb-2">
          {quickActions.map((action) => (
            <button
              key={action.id}
              onClick={() => handleQuickAction(action)}
              className="whitespace-nowrap px-4 py-2 bg-gray-700 border border-gray-600 rounded-full text-sm text-gray-200 hover:border-blue-500 hover:text-blue-500 transition-colors duration-200"
            >
              {action.text}
            </button>
          ))}
        </div>
      </div>

      {/* Hidden File Inputs */}
      <input
        type="file"
        accept="image/*"
        className="hidden"
        ref={fileInputRef}
        onChange={(e) => handleFileUpload(e, 'image')}
        id="image-upload"
      />
      <input
        type="file"
        accept=".pdf,.doc,.docx,.txt"
        className="hidden"
        onChange={(e) => handleFileUpload(e, 'document')}
        id="document-upload"
      />

      {/* Input Area */}
      <div className="border-t border-gray-700 p-4 bg-gray-800">
        <form onSubmit={handleSubmit} className="flex items-center space-x-4">
          <div className="flex space-x-2">
            <button
              type="button"
              className={`p-2 rounded-full hover:bg-gray-700 ${
                isRecording ? 'text-red-500 bg-red-100' : 'text-gray-400 hover:text-blue-500'
              }`}
              title={isRecording ? 'Stop recording' : 'Start recording'}
              onClick={isRecording ? stopRecording : startRecording}
            >
              <Mic className="h-5 w-5" />
            </button>
            <button
              type="button"
              className="p-2 rounded-full text-gray-400 hover:text-blue-500"
              title="Upload image"
              onClick={() => document.getElementById('image-upload').click()}
            >
              <Image className="h-5 w-5" />
            </button>
            <button
              type="button"
              className="p-2 rounded-full text-gray-400 hover:text-blue-500"
              title="Upload document"
              onClick={() => document.getElementById('document-upload').click()}
            >
              <FileText className="h-5 w-5" />
            </button>
          </div>

          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 bg-gray-700 text-white rounded-full px-4 py-2 text-sm"
          />

          <button
            type="submit"
            className="p-2 rounded-full text-gray-400 hover:text-blue-500"
            disabled={!message.trim()}
          >
            <Send className="h-5 w-5" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;