import React, { useState, useEffect, useCallback } from 'react';
import { BrainCog, Lock, Mail } from 'lucide-react';
import PropTypes from 'prop-types';

const Auth = ({ onAuthenticate }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);
  const [rememberMe, setRememberMe] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);

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

  const resetTimer = useCallback(() => {
    setAutoPlay(false);
    setTimeout(() => setAutoPlay(true), 100);
  }, []);

  const handleSlideChange = (index) => {
    setCurrentSlide(index);
    resetTimer();
  };

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

    if (!isLogin && !acceptTerms) {
      setError('Please accept the Terms & Conditions to continue.');
      return;
    }

    try {
      const endpoint = isLogin ? '/login' : '/register';
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`http://localhost:5001${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ 
          email, 
          password,
          rememberMe: isLogin ? rememberMe : undefined
        }),
        signal: controller.signal
      }).finally(() => clearTimeout(timeoutId));

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      localStorage.setItem('token', data.token);
      localStorage.setItem('userId', data.userId);
      if (rememberMe) {
        localStorage.setItem('rememberMe', 'true');
        localStorage.setItem('userEmail', email);
      }
      onAuthenticate();

    } catch (err) {
      if (err.name === 'AbortError') {
        setError('Request timed out. Please try again.');
      } else if (err.message === 'Failed to fetch') {
        setError('Unable to connect to server. Please check your connection.');
      } else {
        setError(err.message || 'An error occurred during authentication.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-8">
      <div className="w-full max-w-6xl bg-gray-800 rounded-3xl overflow-hidden flex shadow-2xl">
        <div className="w-1/2 relative p-8">
          <div className="flex justify-start mb-12">
            <img src="/bodhini_logo_trans.png" alt="Bodhini Logo" className="h-18 w-16" />
          </div>
          
          <div className="absolute inset-0 mt-24 mb-20 mx-8">
            {slides.map((slide, index) => (
              <div
                key={index}
                onClick={() => handleSlideChange((index + 1) % slides.length)}
                className={`absolute inset-0 cursor-pointer transition-all duration-500 ${
                  currentSlide === index ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8 pointer-events-none'
                }`}
              >
                <div className="h-full flex flex-col justify-between">
                  <div className="relative h-full">
                    <img 
                      src={slide.image} 
                      alt={slide.title}
                      className="w-full h-full object-cover rounded-lg"
                    />
                    <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
                      <h2 className="text-4xl font-medium text-white">
                        {slide.title}
                      </h2>
                      <p className="text-xl text-gray-300 mt-2">
                        {slide.subtitle}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="absolute bottom-8 left-8 flex gap-2">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => handleSlideChange(index)}
                className={`w-8 h-1 rounded transition-colors duration-300 ${
                  currentSlide === index ? 'bg-white' : 'bg-gray-500 hover:bg-gray-400'
                }`}
              />
            ))}
          </div>
        </div>

        <div className="w-1/2 p-8">
          <div className="max-w-md mx-auto space-y-6">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-100">
                {isLogin ? 'Log in to your account' : 'Create an account'}
              </h2>
              <p className="mt-2 text-sm text-gray-400">
                {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
                <button
                  type="button"
                  className="text-blue-500 hover:underline"
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setError('');
                  }}
                >
                  {isLogin ? 'Sign up' : 'Log in'}
                </button>
              </p>
            </div>

            {error && (
              <div className="text-red-500 text-center bg-red-100/10 p-3 rounded-lg">
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

              {!isLogin && (
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    className="rounded border-gray-600 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="terms" className="ml-2 text-sm text-gray-400">
                    I agree to the Terms & Conditions
                  </label>
                </div>
              )}

              {isLogin && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="remember"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-gray-600 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="remember" className="ml-2 text-sm text-gray-400">
                      Remember me
                    </label>
                  </div>
                  <button type="button" className="text-sm text-blue-500 hover:underline">
                    Forgot password?
                  </button>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 px-4 text-sm font-semibold text-white bg-blue-600 rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-300"
              >
                {isLogin ? 'Log in' : 'Create account'}
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-700"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-gray-800 text-gray-400">
                    Or {isLogin ? 'login' : 'register'} with
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button 
                  type="button"
                  className="flex items-center justify-center px-4 py-2 border border-gray-600 rounded-lg text-gray-200 hover:bg-gray-700"
                >
                  <span className="mr-2">Google</span>
                </button>
                <button 
                  type="button"
                  className="flex items-center justify-center px-4 py-2 border border-gray-600 rounded-lg text-gray-200 hover:bg-gray-700"
                >
                  <span className="mr-2">Apple</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

Auth.propTypes = {
  onAuthenticate: PropTypes.func.isRequired,
};

export default Auth;