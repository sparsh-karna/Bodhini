import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Camera, Mic, StopCircle, X, Trash2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { usePageStore } from '../store/pageStore';
import { handleOrderMessage } from '../utils/orderHandlers';

interface ChatAreaProps {
  className?: string;
  category?: string;
}

interface Message {
  id: number;
  text?: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  file?: File | null;
  image?: string;
  audio?: string;
  reasoning?: {
    query_analysis: string;
    retrieval_analysis: string;
    context_integration: string;
    evidence_evaluation: string;
    response_strategy: string;
  };
}

interface OrderField {
  field: string;
  description: string;
}

export const ChatArea: React.FC<ChatAreaProps> = ({ className, category }) => {
  const { handler } = usePageStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [image, setImage] = useState<string | null>(null);
  const [audio, setAudio] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [showMediaPreviews, setShowMediaPreviews] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isProcessingSpeech, setIsProcessingSpeech] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [collectingOrderDetails, setCollectingOrderDetails] = useState(false);
  const [currentField, setCurrentField] = useState<OrderField | null>(null);
  const [requiredFields, setRequiredFields] = useState<OrderField[]>([]);
  const [orderDetails, setOrderDetails] = useState<Record<string, string>>({});

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const animationRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const messageEndRef = useRef<HTMLDivElement>(null);
  const [showCameraPreview, setShowCameraPreview] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generate session ID when component mounts
  useEffect(() => {
    if (!sessionId) {
      setSessionId(`session_${Date.now()}`);
    }
  }, []);

  // Auto-scroll to the bottom when new messages arrive
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Cleanup resources when component unmounts
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  // Show media previews when there's a file, image, or audio
  useEffect(() => {
    setShowMediaPreviews(!!(file || image || audio));
  }, [file, image, audio]);

  const handleOrderMessage = async (messageText: string) => {
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
        const botMessage: Message = {
          id: Date.now(),
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
      if (currentField) {
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
          const botMessage: Message = {
            id: Date.now(),
            text: `Please provide your ${nextField.description}:`,
            sender: 'bot',
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, botMessage]);
        } else {
          // All fields collected, start automation
          setCollectingOrderDetails(false);
          setCurrentField(null);
          
          const confirmMessage: Message = {
            id: Date.now(),
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
            
            const botMessage: Message = {
              id: Date.now(),
              text: data.message,
              sender: 'bot',
              timestamp: new Date(),
            };
            
            setMessages(prev => [...prev, botMessage]);
            
          } catch (error) {
            console.error('Error in order automation:', error);
            const errorMessage: Message = {
              id: Date.now(),
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
    }
  };

  const ReasoningDisplay = ({ reasoning }) => {
    if (!reasoning || Object.keys(reasoning).length === 0) return null;
  
    return (
      <div className="mt-2 text-xs bg-gray-900 rounded-lg p-2 border border-gray-700">
        <p className="text-blue-400 font-semibold">Reasoning Process:</p>
        <div className="ml-2">
          {Object.entries(reasoning).map(([key, value]) => (
            <div key={key} className="mt-1">
              <span className="text-gray-400 capitalize">{key.replace(/_/g, ' ')}: </span>
              <span className="text-gray-500">{value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() && !file && !image && !audio) return;
  
    const messageText = input || '';
  
    const userMessage: Message = {
      id: Date.now(),
      text: messageText,
      sender: 'user',
      timestamp: new Date(),
      file: file || undefined,
      image: image || undefined,
      audio: audio || undefined,
    };
  
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setFile(null);
    setImage(null);
    setAudio(null);
    setShowMediaPreviews(false);
  
    setLoading(true);
  
    try {
      const response = await fetch('http://localhost:5001/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: messageText, 
          session_id: sessionId,
          explain: true, // Always set explain=true for testing
        }),
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const data = await response.json();
  
      if (!data || !data.response) {
        throw new Error('Invalid response from the server');
      }
  
      const botMessage: Message = {
        id: Date.now() + 1,
        text: data.response.response, // Use the response directly
        sender: 'bot',
        timestamp: new Date(),
        reasoning: data.response.explanation, // Pass the explanation to the message
      };
  
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error('Error fetching from backend:', error);
      const errorMessage: Message = {
        id: Date.now() + 1,
        text: 'Sorry, there was an error processing your request. Please try again later.',
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      
      // If the file is a PDF, process it
      if (selectedFile.type === 'application/pdf') {
        handlePdfProcessing(selectedFile);
      }
    }
  };

  const handlePdfProcessing = async (pdfFile: File) => {
    setLoading(true);
    const formData = new FormData();
    formData.append('pdf', pdfFile);
    formData.append('session_id', sessionId || '');

    try {
      const response = await fetch('http://localhost:5001/process-pdf', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      
      const botMessage: Message = {
        id: Date.now() + 1,
        text: data.response || 'Your PDF has been processed and added to the database.',
        sender: 'bot',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error processing PDF:', error);
      const errorMessage: Message = {
        id: Date.now() + 1,
        text: 'Sorry, there was an error processing your PDF. Please try again later.',
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };
  
  const openCameraPreview = async () => {
    try {
      // Stop any existing stream
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' } 
      });
      
      setCameraStream(stream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      
      setShowCameraPreview(true);
    } catch (error) {
      console.error('Error accessing camera:', error);
    }
  };
  
  const captureImage = () => {
    if (!videoRef.current) return;
    
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      setImage(canvas.toDataURL('image/png'));
    }
    closeCameraPreview();
  };
  
  const closeCameraPreview = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setShowCameraPreview(false);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunks.current = [];
      
      // Set up audio visualizer
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      analyser.fftSize = 256;
      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const visualize = () => {
        analyser.getByteFrequencyData(dataArray);
        // Calculate audio level (0-100)
        const sum = dataArray.reduce((acc, val) => acc + val, 0);
        const avg = sum / dataArray.length;
        setAudioLevel(Math.min(100, avg * 2)); // Scale for better visualization
        animationRef.current = requestAnimationFrame(visualize);
      };

      visualize();
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      // Set up recording timer
      setRecordingDuration(0);
      timerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
        if (audioContextRef.current) audioContextRef.current.close();
        if (timerRef.current) clearInterval(timerRef.current);
        
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
        setAudio(URL.createObjectURL(audioBlob));
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting audio recording:', error);
    }
  };

  const processVoiceRecording = async (audioBlob: Blob) => {
    setIsProcessingSpeech(true);
  
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.wav');
      formData.append('session_id', sessionId || '');
  
      const response = await fetch('http://localhost:5001/speech-to-text', {
        method: 'POST',
        body: formData,
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const data = await response.json();
  
      if (data.error) {
        throw new Error(data.error);
      }
  
      const userMessage: Message = {
        id: Date.now(),
        text: data.original_text,
        sender: 'user',
        timestamp: new Date(),
        audio: URL.createObjectURL(audioBlob),
      };
  
      const botMessage: Message = {
        id: Date.now() + 1,
        text: data.response,
        sender: 'bot',
        timestamp: new Date(),
      };
  
      setMessages((prev) => [...prev, userMessage, botMessage]);
    } catch (error) {
      console.error('Speech processing error:', error);
      const errorMessage: Message = {
        id: Date.now() + 1,
        text: `Sorry, I couldn't process your voice message: ${error instanceof Error ? error.message : 'Unknown error'}`,
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsProcessingSpeech(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      
      // Process the audio for speech-to-text when stopped
      setTimeout(() => {
        if (audioChunks.current.length > 0) {
          const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
          processVoiceRecording(audioBlob);
        }
      }, 500); // Small delay to ensure recording is fully stopped
    }
    setIsRecording(false);
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
    // Clean up without saving the recording
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    if (audioContextRef.current) audioContextRef.current.close();
    if (timerRef.current) clearInterval(timerRef.current);
    
    setIsRecording(false);
    audioChunks.current = [];
  };

  const clearMedia = () => {
    setFile(null);
    setImage(null);
    setAudio(null);
    setShowMediaPreviews(false);
  };

  // Format recording time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`flex flex-col h-full ${className || ''}`}>
      {/* Camera Preview Overlay */}
      {showCameraPreview && (
        <div className="absolute inset-0 z-50 bg-black flex flex-col">
          <div className="flex-1 relative">
            <video 
              ref={videoRef} 
              className="absolute inset-0 w-full h-full object-cover"
              autoPlay 
              playsInline
            />
          </div>
          <div className="p-4 flex justify-between bg-black">
            <button 
              onClick={closeCameraPreview}
              className="p-2 rounded-full bg-gray-800 text-white"
            >
              <X className="w-6 h-6" />
            </button>
            <button 
              onClick={captureImage}
              className="p-3 rounded-full bg-white"
            >
              <Camera className="w-8 h-8 text-black" />
            </button>
            <div className="w-10" /> {/* Empty spacer for balance */}
          </div>
        </div>
      )}
    
      <div className="flex-1 p-6 overflow-y-auto space-y-4">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className={`max-w-lg rounded-lg px-4 py-2 ${
              msg.sender === 'user' ? 'bg-blue-700 text-white' : 'bg-gray-800 text-gray-200 border border-gray-700'
            }`}
          >
            {/* Display language indicator if available */}
            {msg.languageInfo && (
              <span className="text-xs text-gray-400 mb-1 block">
                {msg.languageInfo}
              </span>
            )}
            
            {msg.sender === 'bot' ? (
              <>
                <ReactMarkdown>{msg.text}</ReactMarkdown>
                {msg.reasoning && <ReasoningDisplay reasoning={msg.reasoning} />}
              </>
            ) : (
              <p>{msg.text}</p>
            )}
            
            {msg.originalMessage && msg.originalMessage !== msg.text && (
              <div className="text-xs text-gray-400 mt-1 italic">
                Original: {msg.originalMessage}
              </div>
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
        
        {/* Loading indicator */}
        {(loading || isProcessingSpeech) && (
          <div className="flex justify-left mt-4">
            <div className="w-8 h-8 border-4 border-t-4 border-blue-500 rounded-full animate-pulse"></div>
          </div>
        )}
        
        <div ref={messageEndRef} />
      </div>

      {/* Media previews */}
      {showMediaPreviews && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-medium text-sm">Preview</h4>
            <button onClick={clearMedia}>
              <X className="w-5 h-5 text-gray-500 hover:text-red-500" />
            </button>
          </div>
          
          <div className="flex gap-4 items-center">
            {image && (
              <div className="relative">
                <img src={image} alt="Preview" className="w-32 h-32 object-cover rounded-lg border border-gray-300" />
              </div>
            )}
            
            {file && (
              <div className="flex items-center gap-2 p-3 bg-white rounded-lg border border-gray-300">
                <Paperclip className="w-5 h-5 text-blue-500" />
                <span className="truncate max-w-[200px]">{file.name}</span>
              </div>
            )}
            
            {audio && (
              <div className="w-full">
                <audio controls className="w-full">
                  <source src={audio} type="audio/webm" />
                </audio>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hidden file inputs */}
      <input
        type="file"
        accept="image/*"
        className="hidden"
        ref={fileInputRef}
        onChange={(e) => handleFileChange(e)}
        id="image-upload"
      />
      
      <input
        type="file"
        accept=".pdf"
        className="hidden"
        onChange={(e) => handleFileChange(e)}
        id="document-upload"
      />

      {/* Message input area */}
      <div className="p-4 border-t border-gray-200">
        {isRecording ? (
          <div className="flex items-center gap-3">
            {/* WhatsApp-style recording UI */}
            <button type="button" onClick={cancelRecording} className="text-red-500">
              <Trash2 className="w-5 h-5" />
            </button>
            
            <div className="flex-1 flex items-center gap-2 bg-gray-100 p-3 rounded-lg border">
              <div className="relative flex-1">
                <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-red-500 h-full" 
                    style={{ width: `${audioLevel}%` }} 
                  />
                </div>
                <span className="text-xs text-gray-600 mt-1 block">{formatTime(recordingDuration)}</span>
              </div>
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            </div>
            
            <button type="button" onClick={stopRecording}>
              <Send className="w-5 h-5 text-blue-500" />
            </button>
          </div>
        ) : (
          <form onSubmit={handleSend} className="flex items-center gap-3">
            <div className="flex gap-2">
              <button type="button">
                <label className="cursor-pointer" htmlFor="document-upload">
                  <Paperclip className="w-5 h-5" />
                </label>
              </button>
              <button type="button" onClick={openCameraPreview}>
                <Camera className="w-5 h-5" />
              </button>
            </div>
            
            <input 
              type="text" 
              value={input} 
              onChange={(e) => setInput(e.target.value)} 
              placeholder="Type your message..." 
              className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400" 
            />
            
            {input.trim() || file || image || audio ? (
              <button type="submit">
                <Send className="w-5 h-5 text-blue-500" />
              </button>
            ) : (
              <button type="button" onClick={startRecording}>
                <Mic className="w-5 h-5" />
              </button>
            )}
          </form>
        )}
      </div>
      
      <style >{`
        @keyframes pulse {
          0% {
            transform: scale(0.8);
          }
          50% {
            transform: scale(1.2);
          }
          100% {
            transform: scale(0.8);
          }
        }

        .animate-pulse {
          animation: pulse 1.5s infinite;
        }
      `}</style>
    </div>
  );
};