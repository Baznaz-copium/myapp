import React, { useState, useRef, useEffect } from 'react';
import { User, CreateUserPayload, UpdateUserPayload } from '../../types/User';
import { Save, X, Eye, EyeOff, User as UserIcon, Mail, Lock, Shield } from 'lucide-react';

interface UserFormProps {
  user?: User | null;
  isLoading: boolean;
  onSave: (payload: CreateUserPayload | UpdateUserPayload) => Promise<void>;
  onCancel: () => void;
}

const UserForm: React.FC<UserFormProps> = ({
  user,
  isLoading,
  onSave,
  onCancel
}) => {
  const [form, setForm] = useState({
    username: user?.username || '',
    email: user?.email || '',
    password: '',
    role: user?.role || 'staff' as const,
    active: user?.active ?? 1
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const usernameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (usernameRef.current) {
      usernameRef.current.focus();
    }
  }, []);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!form.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (form.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }

    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!user && !form.password) {
      newErrors.password = 'Password is required';
    } else if (form.password && form.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      
      if (!validateForm()) return;

      if (user) {
        const updatePayload: UpdateUserPayload = {
          username: form.username,
          email: form.email || undefined,
          role: form.role,
          active: form.active
        };
        if (form.password) {
          updatePayload.password = form.password;
        }
        await onSave(updatePayload);
      } else {
        const createPayload: CreateUserPayload = {
          username: form.username,
          email: form.email || undefined,
          password: form.password,
          role: form.role,
          active: form.active
        };
        await onSave(createPayload);
      }
    };

  const updateField = (field: string, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="class=bg-gray-800 backdrop-blur-sm rounded-xl p-6 border border-gray-700 mb-6" >
      <h3 className="text-lg font-semibold text-white mb-4">
        {user ? 'Edit User' : 'Create New User'}
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              <UserIcon className="w-4 h-4 inline mr-1" />
              Username *
            </label>
            <input
              ref={usernameRef}
              type="text"
              value={form.username}
              onChange={(e) => updateField('username', e.target.value)}
              className={`bg-gray-800  border-gray-700 text-white w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                errors.username ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Enter username"
              disabled={isLoading}
            />
            {errors.username && (
              <p className="mt-1 text-sm text-red-600">{errors.username}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              <Mail className="w-4 h-4 inline mr-1" />
              Email
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => updateField('email', e.target.value)}
              className={`bg-gray-800  border-gray-700 text-white w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                errors.email ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Enter email address"
              disabled={isLoading}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              <Lock className="w-4 h-4 inline mr-1" />
              {user ? 'New Password' : 'Password'} {user && '(leave blank to keep current)'}
              {!user && ' *'}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={(e) => updateField('password', e.target.value)}
                className={`bg-gray-800  border-gray-700 text-white w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  errors.password ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter password"
                disabled={isLoading}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                disabled={isLoading}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              <Shield className="w-4 h-4 inline mr-1" />
              Role
            </label>
            <select
              value={form.role}
              onChange={(e) => updateField('role', e.target.value)}
              className="bg-gray-800 border-gray-700 text-white w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
              disabled={isLoading}
            >
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="active"
            checked={form.active === 1}
            onChange={(e) => updateField('active', e.target.checked ? 1 : 0)}
            className="w-4 h-4 text-pruple-800 border-gray-300 rounded focus:ring-purple-800"
            disabled={isLoading}
          />
          <label htmlFor="active" className="text-sm font-medium text-white">
            Active user account
          </label>
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            disabled={isLoading}
          >
            <X className="w-4 h-4 inline mr-1" />
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className=" bg-purple-700 hover:bg-purple-800 text-white px-4 py-2 rounded flex items-center justify-center"
          >
            <Save className="w-4 h-4 inline mr-1" />
            {isLoading ? 'Saving...' : (user ? 'Update User' : 'Create User')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UserForm;