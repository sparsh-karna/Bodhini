import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, Mic, Image, FileText, Video, UserCog, Car, Heart, 
  CreditCard, FileKey, Building, Plane, ShoppingBag, Calendar,
  Utensils, Hotel, Train, Package, Clock, MapPin,
  ShoppingCart, Gift, Wrench, Scissors, Truck, Bell
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { marked } from 'marked';

import AudioRecordingIndicator from './AudioRecordingIndicator';


const ChatInterface = ({ category }) => {
  const [showWelcome, setShowWelcome] = useState(true);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [showServices, setShowServices] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(false); // Add loading state
  const [sessionId, setSessionId] = useState(null)
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const [isProcessingSpeech, setIsProcessingSpeech] = useState(false);
  const [orderDetails, setOrderDetails] = useState(null);
  const [collectingDetails, setCollectingDetails] = useState(false);
  const [collectingOrderDetails, setCollectingOrderDetails] = useState(false);
  const [currentField, setCurrentField] = useState(null);
  const [requiredFields, setRequiredFields] = useState([]);

  // Add this new function in the ChatInterface component
  const handleOrderMessage = async (messageText) => {
    if (!collectingOrderDetails) {
      // First message - get required fields
      try {
        const response = await fetch('http://localhost:5001/automate-order', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}),
        });
        
        const data = await response.json();
        setRequiredFields(data.required_fields);
        setCollectingOrderDetails(true);
        setCurrentField(data.required_fields[0]);
        
        // Add bot message showing security note and first required field
        const botMessage = {
          id: Date.now().toString(),
          text: `${data.security_note}\n\nPlease provide your ${data.required_fields[0].description}:`,
          sender: 'bot',
          timestamp: new Date(),
        };
        
        setMessages(prev => [...prev, botMessage]);
        
      } catch (error) {
        console.error('Error starting order process:', error);
      }
    } else {
      // Save the current field's value
      const updatedDetails = {
        ...orderDetails,
        [currentField.field]: messageText
      };
      setOrderDetails(updatedDetails);
      
      // Find next required field
      const currentIndex = requiredFields.findIndex(field => field.field === currentField.field);
      const nextField = requiredFields[currentIndex + 1];
      
      if (nextField) {
        // Ask for next field
        setCurrentField(nextField);
        const botMessage = {
          id: Date.now().toString(),
          text: `Please provide your ${nextField.description}:`,
          sender: 'bot',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, botMessage]);
      } else {
        // All fields collected, start automation
        setCollectingOrderDetails(false);
        setCurrentField(null);
        
        const confirmMessage = {
          id: Date.now().toString(),
          text: "I have all the required details. Starting the order automation process...",
          sender: 'bot',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, confirmMessage]);
        
        try {
          const response = await fetch('http://localhost:5001/automate-order', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ orderDetails: updatedDetails }),
          });
          
          const data = await response.json();
          
          const botMessage = {
            id: Date.now().toString(),
            text: data.message,
            sender: 'bot',
            timestamp: new Date(),
          };
          
          setMessages(prev => [...prev, botMessage]);
          
        } catch (error) {
          console.error('Error in order automation:', error);
          const errorMessage = {
            id: Date.now().toString(),
            text: 'Sorry, there was an error processing your order. Please try again.',
            sender: 'bot',
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, errorMessage]);
        }
        
        // Reset states
        setOrderDetails({});
        setRequiredFields([]);
      }
    }
  };

  const governmentServices = [
    { icon: UserCog, title: 'Aadhaar Card', description: 'Update or apply for Aadhaar' },
    { icon: Car, title: 'Driving License', description: 'New license or renewal' },
    { icon: Heart, title: 'Health Services', description: 'Healthcare and insurance' },
    { icon: CreditCard, title: 'PAN Card', description: 'Apply or update PAN' },
    { icon: FileKey, title: 'Passport', description: 'Apply for passport services' },
    { icon: Building, title: 'Property Registration', description: 'Register or transfer property' },
  ];

  
  const travelServices = [
    { icon: Plane, title: 'Flight Booking', description: 'Book domestic & international flights' },
    { icon: Train, title: 'Train Tickets', description: 'Book train tickets & passes' },
    { icon: Package, title: 'Package Tracking', description: 'Track your deliveries' },
    { icon: ShoppingBag, title: 'Food Delivery', description: 'Order food from restaurants' },
    { icon: MapPin, title: 'Cab Booking', description: 'Book rides & rentals' },
    { icon: Clock, title: 'Express Delivery', description: 'Send packages & documents' },
  ];

  const calendarServices = [
    { icon: Calendar, title: 'Schedule Meeting', description: 'Create & manage meetings' },
    { icon: Clock, title: 'Reminders', description: 'Set important reminders' },
    { icon: UserCog, title: 'Availability', description: 'Manage your availability' },
    { icon: Video, title: 'Video Calls', description: 'Schedule video conferences' },
  ];

  const reservationServices = [
    { icon: Hotel, title: 'Hotels', description: 'Book hotels & accommodations' },
    { icon: Utensils, title: 'Restaurants', description: 'Make dining reservations' },
    { icon: Car, title: 'Car Rentals', description: 'Reserve vehicles' },
    { icon: Building, title: 'Venues', description: 'Book event spaces' },
  ];

  const orderAndServiceServices = [
    { icon: ShoppingCart, title: 'Online Shopping', description: 'Browse and order products' },
    { icon: Gift, title: 'Gift Services', description: 'Send gifts & personalized items' },
    { icon: Wrench, title: 'Home Services', description: 'Book home repairs & maintenance' },
    { icon: Scissors, title: 'Salon & Beauty', description: 'Book beauty & grooming services' },
    { icon: Truck, title: 'Service Booking', description: 'Schedule professional services' },
    { icon: Bell, title: 'Subscription', description: 'Manage recurring services' },
  ];

  const [selectedService, setSelectedService] = useState(null);

  const getServicesByCategory = (category) => {
    switch (category) {
      case 'Government Services':
        return governmentServices;
      case 'Travel':
        return travelServices;
      case 'Calendar':
        return calendarServices;
      case 'Reservations':
        return reservationServices;
      case 'Orders & Delivery':
        return orderAndServiceServices;
      default:
        return [];
    }
  };

  
  const getCategoryQuickActions = (category) => {
    switch (category) {
      case 'Government Services':
        return [
          { id: '1', text: 'How do I apply for a new passport?' },
          { id: '2', text: 'Update my Aadhaar card address' },
          { id: '3', text: 'Book a driving license test' },
        ];
      case 'Travel':
        return [
          { id: '1', text: 'Track my latest order' },
          { id: '2', text: 'Book a flight ticket' },
          { id: '3', text: 'Schedule a food delivery' },
        ];
      case 'Calendar':
        return [
          { id: '1', text: 'Schedule a new meeting' },
          { id: '2', text: 'Set a reminder' },
          { id: '3', text: 'Check my availability' },
        ];
      case 'Reservations':
        return [
          { id: '1', text: 'Book a hotel room' },
          { id: '2', text: 'Make a dinner reservation' },
          { id: '3', text: 'Rent a car' },
        ];
        case 'Orders & Delivery':
          return [
            { id: '1', text: 'Book a home service' },
            { id: '2', text: 'Order a gift' },
            { id: '3', text: 'Schedule salon appointment' },
          ];
      default:
        return [
          { id: '1', text: 'How do I apply for a new passport?' },
          { id: '2', text: 'Update my Aadhaar card address' },
          { id: '3', text: 'Book a driving license test' },
        ];
    }
  };

   
  const getCategoryHeading = (category) => {
    switch (category) {
      case 'Government Services':
        return 'What will you apply for?';
      case 'Travel':
        return 'Where will you go?';
      case 'Calendar':
        return 'What will you schedule?';
      case 'Reservations':
        return 'What will you book?';
      case 'Orders & Delivery':
        return 'What will you order?';
      default:
        return 'How can we help?';
    }
  };



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
    // Reset state when category changes
    setMessages([]);
    setShowServices(true);
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
  
    setMessages(prev => [...prev, userMessage]);
    setMessage('');
    
    // Check if we're in Orders & Delivery section and collecting order details
    if (category === 'Orders & Delivery' && (collectingOrderDetails || message.toLowerCase().includes('order'))) {
      await handleOrderMessage(message);
  
    } else {
      // Existing chat logic
      setLoading(true);
      try {
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
  
        setMessages(prev => [...prev, botMessage]);
      } catch (error) {
        console.error('Error fetching from backend:', error);
        const botMessage = {
          id: (Date.now() + 1).toString(),
          text: 'Sorry, there was an error processing your request. Please try again later.',
          sender: 'bot',
          timestamp: new Date(),
        };
  
        setMessages(prev => [...prev, botMessage]);
      } finally {
        setLoading(false);
      }
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

  const handleServiceClick = async (service) => {
    setSelectedService(service);
    setShowServices(false);
    
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
        text: ``,
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

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(audioBlob);

        // Prepare form data for upload
        const formData = new FormData();
        formData.append('audio', audioBlob, 'recording.wav');
        formData.append('session_id', sessionId);

        setIsProcessingSpeech(true);

        try {
          const response = await fetch('http://localhost:5001/speech-to-text', {
            method: 'POST',
            body: formData
          });
          const data = await response.json();

          if (data.error) {
            throw new Error(data.error);
          }

          // Add user's voice message
          const userMessage = {
            id: Date.now().toString(),
            text: data.original_text,
            sender: 'user',
            timestamp: new Date(),
            media: {
              type: 'audio',
              url: audioUrl
            }
          };

          // Add bot's response
          const botMessage = {
            id: (Date.now() + 1).toString(),
            text: data.response,
            sender: 'bot',
            timestamp: new Date()
          };

          setMessages((prev) => [...prev, userMessage, botMessage]);
        } catch (error) {
          console.error('Speech processing error:', error);
          const errorMessage = {
            id: (Date.now() + 1).toString(),
            text: `Sorry, I couldn't process your voice message: ${error.message}`,
            sender: 'bot',
            timestamp: new Date()
          };
          setMessages((prev) => [...prev, errorMessage]);
        } finally {
          setIsProcessingSpeech(false);
        }

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
    <div className="flex flex-col h-screen bg-gray-900">

      {/* Chat Messages Area */}
      <div className="flex-1 p-4 overflow-y-auto bg-gradient-to-br from-gray-900 via-gray-800 to-gray-1200 h-[calc(100vh-150px)]">
        <div className="max-w-3xl mx-auto space-y-4">
          
        {!selectedService && (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
  
  </div>
)}

{showServices && (
            <div className="mt-24 mb-12">
              <h1 className="text-5xl font-bold text-white text-center mb-24">
                {getCategoryHeading(category)}
              </h1>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {getServicesByCategory(category).map((service, index) => (
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
            </div>
          )}


{selectedService && (
  <div className="bg-gray-800 p-4 rounded-lg shadow-md border border-blue-600 mb-6">
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <selectedService.icon className="h-8 w-8 text-blue-500" />
        <div>
          <h3 className="font-medium text-gray-100">{selectedService.title}</h3>
          <p className="text-sm text-gray-400">{selectedService.description}</p>
        </div>
      </div>
      <button 
        onClick={() => {
          setSelectedService(null);
          setShowServices(true);
          setMessages([]);
        }}
        className="text-gray-400 hover:text-blue-500 transition-colors"
      >
        Back to Services
      </button>
    </div>
  </div>
)}

    {messages.map((msg) => (
      <div
        key={msg.id}
        className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
      >
        <div
          className={`max-w-lg rounded-lg px-4 py-2 ${msg.sender === 'user' ? 'bg-blue-700 text-white' : 'bg-gray-800 text-gray-200 border border-gray-700'}`}
        >
          {msg.sender === 'bot' ? (
            <ReactMarkdown>{msg.text}</ReactMarkdown>
          ) : (
            <p>{msg.text}</p>
          )}
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
            {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </div>
    ))}
    {/* Move loading indicator to the side */}
    {loading && (
  <div className="flex justify-left mt-4">
    <div className="flex justify-center items-center mt-4">
  <div className="w-8 h-8 border-4 border-t-4 border-blue-500 rounded-full animate-pulse"></div>
</div>

<style jsx>{`
  @keyframes pulse {
    0% {
      transform: scale(0.8); /* Initial smaller size */
    }
    50% {
      transform: scale(1.2); /* Enlarged size */
    }
    100% {
      transform: scale(0.8); /* Back to original size */
    }
  }

  .animate-pulse {
    animation: pulse 1.5s infinite;
  }
`}</style>

  </div>
)}

    <div ref={messagesEndRef} />
  </div>
</div>

      {/* Quick Actions - only shown for default case */}
      {!category && (
        <div className="bg-gray-800 px-4 py-2 border-t border-gray-700">
          <div className="max-w-3xl mx-auto flex gap-2 overflow-x-auto pb-2">
            {getCategoryQuickActions(category).map((action) => (
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
      )}

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
  <AudioRecordingIndicator 
    isRecording={isRecording} 
    isProcessingSpeech={isProcessingSpeech} 
    message={message} 
    onMessageChange={(e) => setMessage(e.target.value)} 
    onStartRecording={startRecording} 
    onStopRecording={stopRecording} 
    onSubmit={handleSubmit} 
    onImageUpload={() => document.getElementById('image-upload').click()} 
    onDocumentUpload={() => document.getElementById('document-upload').click()} 
  />
</div>
    </div>
  );
};

export default ChatInterface;