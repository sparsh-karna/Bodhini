import React, { useState, useEffect } from 'react';
import { Mic, Send, Image, FileText } from 'lucide-react';

const AudioInputWave = ({ 
  isRecording, 
  isProcessingSpeech, 
  message,
  onMessageChange,
  onStartRecording,
  onStopRecording,
  onSubmit,
  onImageUpload,
  onDocumentUpload
}) => {
  const [recordingTime, setRecordingTime] = useState(0);

  useEffect(() => {
    let interval;
    if (isRecording) {
      setRecordingTime(0);
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      setRecordingTime(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <form onSubmit={onSubmit} className="flex items-center space-x-4">
      <div className="flex space-x-2">
        <button
          type="button"
          className={`p-2 rounded-full hover:bg-gray-700 ${
            isRecording ? 'text-red-500' : 'text-gray-400 hover:text-blue-500'
          } ${isProcessingSpeech ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={isProcessingSpeech ? null : (isRecording ? onStopRecording : onStartRecording)}
          disabled={isProcessingSpeech}
        >
          <Mic className="h-5 w-5" />
        </button>
        <button
          type="button"
          className="p-2 rounded-full text-gray-400 hover:text-blue-500"
          onClick={onImageUpload}
        >
          <Image className="h-5 w-5" />
        </button>
        <button
          type="button"
          className="p-2 rounded-full text-gray-400 hover:text-blue-500"
          onClick={onDocumentUpload}
        >
          <FileText className="h-5 w-5" />
        </button>
      </div>

      {isRecording ? (
        <div className="flex-1 bg-gray-700 rounded-full px-4 py-2 flex items-center justify-center relative">
          <div className="absolute left-4 text-sm text-gray-300">
            {formatTime(recordingTime)}
          </div>
          <div className="flex items-center space-x-1">
            {[...Array(30)].map((_, i) => (
              <div
                key={i}
                className="w-0.5 h-5 bg-blue-500 rounded-full animate-wave"
                style={{
                  animation: `waveform 1s ease-in-out infinite`,
                  animationDelay: `${i * 0.05}s`,
                  transformOrigin: 'center'
                }}
              />
            ))}
          </div>
          <style jsx>{`
            @keyframes waveform {
              0%, 100% {
                transform: scaleY(0.1);
              }
              50% {
                transform: scaleY(${Math.random() * 0.8 + 0.2});
              }
            }
            .animate-wave {
              animation: waveform 1s ease-in-out infinite;
            }
          `}</style>
        </div>
      ) : (
        <input
          type="text"
          value={message}
          onChange={onMessageChange}
          placeholder="Type your message..."
          className="flex-1 bg-gray-700 text-white rounded-full px-4 py-2 text-sm"
        />
      )}

      <button
        type="submit"
        className="p-2 rounded-full text-gray-400 hover:text-blue-500"
        disabled={!message.trim() && !isRecording}
      >
        <Send className="h-5 w-5" />
      </button>
    </form>
  );
};

export default AudioInputWave;