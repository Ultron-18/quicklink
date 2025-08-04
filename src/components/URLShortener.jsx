import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, Copy, Check, Zap, Globe, Star, ArrowRight, ExternalLink, Trash2, AlertCircle, Github } from 'lucide-react';

const URLShortener = () => {
  const [url, setUrl] = useState('');
  const [customSlug, setCustomSlug] = useState('');
  const [shortenedUrl, setShortenedUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [urlHistory, setUrlHistory] = useState([]);
  const [apiStatus, setApiStatus] = useState('unknown'); // 'connected', 'error', 'unknown'

  // Load history from localStorage on component mount
  useEffect(() => {
    const savedHistory = JSON.parse(localStorage.getItem('urlHistory') || '[]');
    setUrlHistory(savedHistory);
    
    // Test API connection on load
    testApiConnection();
  }, []);

  // Save to localStorage whenever history changes
  useEffect(() => {
    if (urlHistory.length > 0) {
      localStorage.setItem('urlHistory', JSON.stringify(urlHistory));
    }
  }, [urlHistory]);

  const testApiConnection = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/test`);
      const data = await response.json();
      
      if (data.success) {
        setApiStatus('connected');
        console.log('✅ API connection successful');
      } else {
        setApiStatus('error');
        console.error('❌ API connection failed:', data.error);
      }
    } catch (error) {
      setApiStatus('error');
      console.error('❌ API connection error:', error);
    }
  };

  const isValidUrl = (string) => {
    try {
      const url = new URL(string);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (_) {
      return false;
    }
  };

  const shortenUrl = async () => {
    if (!url.trim()) {
      setError('Please enter a URL');
      return;
    }

    let fullUrl = url.trim();
    
    // Add https:// if no protocol is specified
    if (!fullUrl.match(/^https?:\/\//)) {
      fullUrl = 'https://' + fullUrl;
    }

    if (!isValidUrl(fullUrl)) {
      setError('Please enter a valid URL');
      return;
    }

    setIsLoading(true);
    setError('');
    setShortenedUrl('');

    try {
      const response = await fetch('/api/shorten', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ 
          url: fullUrl, 
          customSlug: customSlug.trim() || undefined 
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to shorten URL');
      }

      if (data.success) {
        setShortenedUrl(data.shortUrl);
        
        // Add to history
        const newEntry = {
          id: Date.now(),
          originalUrl: fullUrl,
          shortUrl: data.shortUrl,
          customSlug: data.customSlug || null,
          createdAt: new Date().toISOString(),
          rebrandlyId: data.id
        };
        
        setUrlHistory(prev => [newEntry, ...prev.slice(0, 9)]); // Keep only last 10
        
        console.log('✅ URL shortened successfully:', data.shortUrl);
      } else {
        throw new Error('Failed to shorten URL');
      }
      
    } catch (err) {
      console.error('❌ Shorten URL error:', err);
      
      // Handle specific error types
      if (err.message.includes('quota exceeded')) {
        setError('Monthly quota exceeded. Please try again next month or upgrade your plan.');
      } else if (err.message.includes('already exists')) {
        setError('This custom slug is already taken. Please try a different one.');
      } else if (err.message.includes('Invalid URL')) {
        setError('Please enter a valid URL starting with http:// or https://');
      } else {
        setError(err.message || 'Failed to shorten URL. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const resetForm = () => {
    setUrl('');
    setCustomSlug('');
    setShortenedUrl('');
    setError('');
  };

  const deleteFromHistory = (id) => {
    setUrlHistory(prev => {
      const updated = prev.filter(item => item.id !== id);
      localStorage.setItem('urlHistory', JSON.stringify(updated));
      return updated;
    });
  };

  const clearAllHistory = () => {
    setUrlHistory([]);
    localStorage.removeItem('urlHistory');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !isLoading) {
      shortenUrl();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <motion.header 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50"
      >
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <motion.div 
              className="flex items-center space-x-2"
              whileHover={{ scale: 1.05 }}
            >
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Link className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                QuickLink
              </span>
            </motion.div>
            
            {/* API Status Indicator */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${
                  apiStatus === 'connected' ? 'bg-green-500' : 
                  apiStatus === 'error' ? 'bg-red-500' : 'bg-yellow-500'
                }`} />
                <span className="text-sm text-gray-600">
                  {apiStatus === 'connected' ? 'API Connected' : 
                   apiStatus === 'error' ? 'API Error' : 'Checking...'}
                </span>
              </div>
              
              <nav className="hidden md:flex items-center space-x-6">
                <a href="#home" className="text-gray-600 hover:text-blue-600 transition-colors">
                  Home
                </a>
                <a href="#features" className="text-gray-600 hover:text-blue-600 transition-colors">
                  Features
                </a>
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg font-medium"
                >
                  <a href="https://github.com/ultron-18/quicklink" target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2">
                    <Github className="w-4 h-4" />
                    <span>Star on Github</span>
                  </a>
                </motion.button>
              </nav>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-4 py-12" id="home">
        <motion.div 
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Shorten Links,
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {" "}Amplify Impact
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Transform your long, unwieldy URLs into short, memorable, and trackable links that drive engagement.
          </p>
        </motion.div>

        {/* API Error Alert */}
        {apiStatus === 'error' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center space-x-2"
          >
            <AlertCircle className="w-5 h-5" />
            <span>API connection error. Please check your server or try again later.</span>
            <button 
              onClick={testApiConnection}
              className="ml-auto text-red-600 hover:text-red-800 font-medium"
            >
              Retry
            </button>
          </motion.div>
        )}

        {/* URL Shortener Form */}
        <motion.div 
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 mb-12"
        >
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter your long URL
              </label>
              <div className="relative">
                <Globe className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="https://example.com/very-long-url-that-needs-shortening"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Custom slug (optional)
              </label>
              <div className="relative">
                <Star className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={customSlug}
                  onChange={(e) => setCustomSlug(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="my-custom-link"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  disabled={isLoading}
                  pattern="[a-zA-Z0-9_-]+"
                  title="Only letters, numbers, hyphens, and underscores allowed"
                />
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Create a personalized short URL with your own custom text (3-50 characters)
              </p>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center space-x-2"
              >
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}

            <motion.button
              onClick={shortenUrl}
              disabled={isLoading || apiStatus === 'error'}
              whileHover={{ scale: isLoading ? 1 : 1.02 }}
              whileTap={{ scale: isLoading ? 1 : 0.98 }}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg font-medium flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isLoading ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                  />
                  <span>Shortening...</span>
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5" />
                  <span>Shorten URL</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </motion.button>
          </div>

          {/* Result */}
          <AnimatePresence>
            {shortenedUrl && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mt-8 p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  🎉 Your shortened URL is ready!
                </h3>
                <div className="flex items-center space-x-3 bg-white p-4 rounded-lg border">
                  <Link className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  <span className="text-blue-600 font-medium truncate flex-1">
                    {shortenedUrl}
                  </span>
                  <motion.button
                    onClick={() => copyToClipboard(shortenedUrl)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center space-x-1 bg-blue-600 text-white px-3 py-2 rounded-md text-sm font-medium"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copied ? 'Copied!' : 'Copy'}</span>
                  </motion.button>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <motion.button
                    onClick={() => window.open(shortenedUrl, '_blank')}
                    whileHover={{ scale: 1.05 }}
                    className="flex items-center space-x-1 text-blue-600 hover:text-blue-700"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Test Link</span>
                  </motion.button>
                  <motion.button
                    onClick={resetForm}
                    whileHover={{ scale: 1.05 }}
                    className="text-gray-600 hover:text-gray-700 font-medium"
                  >
                    Shorten Another
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* URL History */}
        {urlHistory.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 mb-12"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Recent Links</h2>
              <motion.button
                onClick={clearAllHistory}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="text-red-600 hover:text-red-700 text-sm font-medium flex items-center space-x-1"
              >
                <Trash2 className="w-4 h-4" />
                <span>Clear All</span>
              </motion.button>
            </div>
            <div className="space-y-4">
              {urlHistory.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {item.originalUrl}
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      <p className="text-sm text-blue-600 truncate">
                        {item.shortUrl}
                      </p>
                      {item.customSlug && (
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                          Custom
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Created: {new Date(item.createdAt).toLocaleDateString()} at {new Date(item.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <motion.button
                      onClick={() => copyToClipboard(item.shortUrl)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="p-2 text-gray-400 hover:text-blue-600 transition-colors rounded-md hover:bg-blue-50"
                      title="Copy to clipboard"
                    >
                      <Copy className="w-4 h-4" />
                    </motion.button>
                    <motion.button
                      onClick={() => deleteFromHistory(item.id)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors rounded-md hover:bg-red-50"
                      title="Delete from history"
                    >
                      <Trash2 className="w-4 h-4" />
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Features Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="grid md:grid-cols-3 gap-8"
          id="features"
        >
          {[
            {
              icon: <Zap className="w-8 h-8 text-blue-600" />,
              title: "Lightning Fast",
              description: "Generate shortened URLs in milliseconds with our optimized Rebrandly integration."
            },
            {
              icon: <Star className="w-8 h-8 text-purple-600" />,
              title: "Custom Links",
              description: "Create branded, memorable URLs with custom slugs that reflect your brand identity."
            },
            {
              icon: <Globe className="w-8 h-8 text-green-600" />,
              title: "Global Reach",
              description: "Reliable URL redirection with 99.9% uptime across the globe powered by Rebrandly."
            }
          ].map((feature, index) => (
            <motion.div
              key={index}
              whileHover={{ y: -5 }}
              className="bg-white p-6 rounded-xl shadow-lg border border-gray-200"
            >
              <div className="mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 mt-20">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-6 h-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Link className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold">QuickLink</span>
          </div>
          <p className="text-gray-400 mb-2">
            Making the web more accessible, one link at a time.
          </p>
          <p className="text-sm text-gray-500">
            Powered by Rebrandly API • Built with React & Tailwind CSS
          </p>
          <div className="mt-8 pt-8 border-t border-gray-800 text-sm text-gray-500">
            © 2025 QuickLink. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default URLShortener;
