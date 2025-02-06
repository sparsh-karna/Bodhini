import React, { useState, useEffect, useCallback } from 'react';
import { BrainCog, Lock, Mail } from 'lucide-react';
import PropTypes from 'prop-types';
import axios from 'axios';

const Auth = ({ onAuthenticate }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);

  const slides = [
    {
      title: "Welcome to Bodhini",
      subtitle: "Your Intelligent Multilingual Assistant",
      image: "img2.jpg"
    },
    {
      title: "Communicate Seamlessly",
      subtitle: "Break language barriers effortlessly",
      image: "img2.jpg"
    },
    {
      title: "AI-Powered Intelligence",
      subtitle: "Get smart responses in any language",
      image: "img2.jpg"
    }
  ];

  useEffect(() => {
    let timer;
    if (autoPlay) {
      timer = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
      }, 5000);
    }
    return () => clearInterval(timer);
  }, [autoPlay, slides.length]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const endpoint = isLogin ? '/login' : '/register';
      const response = await axios.post(`http://localhost:5001${endpoint}`, {
        email,
        password
      });

      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('userId', response.data.userId);
        onAuthenticate();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-gray-800 p-8 rounded-2xl shadow-2xl border border-gray-700 space-y-6">
        <div className="text-center">
          <div className="flex justify-center">
            <img src="/bodhini_logo_trans.png" alt="Bodhini Logo" className="h-18 w-16" />
          </div>
          <div className="relative h-32 overflow-hidden mb-6">
            {slides.map((slide, index) => (
              <div
                key={index}
                className={`absolute w-full transition-opacity duration-500 ${
                  currentSlide === index ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <h2 className="text-3xl font-bold text-gray-100">
                  {slide.title}
                </h2>
                <p className="mt-2 text-sm text-gray-400">
                  {slide.subtitle}
                </p>
              </div>
            ))}
          </div>
        </div>
        
        {error && (
          <div className="text-red-500 text-center">
            {error}
          </div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="email"
                required
                className="block w-full pl-10 px-4 py-3 bg-gray-700 text-gray-200 border border-gray-600 rounded-lg shadow-sm placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="password"
                required
                className="block w-full pl-10 px-4 py-3 bg-gray-700 text-gray-200 border border-gray-600 rounded-lg shadow-sm placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full py-3 px-4 text-sm font-semibold text-white bg-blue-600 rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-300"
          >
            {isLogin ? 'Sign in' : 'Sign up'}
          </button>
        </form>
        <div className="text-center">
          <button
            type="button"
            className="text-sm font-medium text-blue-500 hover:underline hover:text-blue-400 transition-colors"
            onClick={() => setIsLogin(!isLogin)}
          >
            {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
};

Auth.propTypes = {
  onAuthenticate: PropTypes.func.isRequired,
};

export default Auth;