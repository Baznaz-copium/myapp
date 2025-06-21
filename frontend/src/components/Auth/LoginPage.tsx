import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Eye, EyeOff, Lock, User } from 'lucide-react';

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const vantaRef = useRef(null);




  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      navigate('/');
    } catch (error: any) {
      setError(error.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div ref={vantaRef} className=" min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center relative text-white">
      {/* Form Card */}
      <form
        onSubmit={handleSubmit}
        className="relative z-10 bg-gray-900/90 backdrop-blur p-8 rounded-xl shadow-2xl w-full max-w-sm space-y-6 animate-in fade-in-down duration-700"
      >
        <h2 className="text-2xl font-bold text-center text-purple-400">Welcome Back</h2>

        {error && (
          <div className="text-red-400 text-sm text-center">{error}</div>
        )}

        <div>
          <label className="block mb-1 text-sm font-medium">Username</label>
          <div className="relative">
            <User className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Enter username"
              autoFocus
              className="w-full pl-10 pr-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        <div>
          <label className="block mb-1 text-sm font-medium">Password</label>
          <div className="relative">
            <Lock className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter password"
              className="w-full pl-10 pr-10 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-2 rounded-md text-white font-semibold transition-all ${
            loading
              ? 'bg-purple-800 cursor-not-allowed opacity-60'
              : 'bg-purple-600 hover:bg-purple-700'
          }`}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
};

export default LoginPage;
