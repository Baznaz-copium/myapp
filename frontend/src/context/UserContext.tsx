import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { User, CreateUserPayload, UpdateUserPayload } from '../types/User';
import axios from 'axios';

interface UserContextType {
  users: User[];
  loading: boolean;
  error: string | null;
  addUser: (payload: CreateUserPayload) => Promise<void>;
  updateUser: (id: number, payload: UpdateUserPayload) => Promise<void>;
  deleteUser: (id: number) => Promise<void>;
  deleteUsers: (ids: number[]) => Promise<void>;
  refreshUsers: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const API_URL = `${API_BASE_URL}/api/users`;

// Transform PHP API user to frontend User type
const transformApiUser = (apiUser: any): User => ({
  id: parseInt(apiUser.id),
  username: apiUser.username,
  email: apiUser.email || undefined,
  role: apiUser.role as 'admin' | 'staff' | 'user',
  active: parseInt(apiUser.active) || 0,
  created_at: apiUser.created_at,
  updated_at: apiUser.updated_at,
  last_login: apiUser.last_login || undefined,
  avatar: undefined // PHP API doesn't provide avatars
});

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(API_URL);
      const apiUsers = Array.isArray(response.data) ? response.data : [];
      const transformedUsers = apiUsers.map(transformApiUser);
      setUsers(transformedUsers);
    } catch (err) {
      const errorMessage = axios.isAxiosError(err) 
        ? err.response?.data?.error || err.message 
        : 'Failed to fetch users';
      setError(errorMessage);
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const addUser = useCallback(async (payload: CreateUserPayload) => {
    setLoading(true);
    setError(null);
    
    try {
      const apiPayload = {
        username: payload.username,
        email: payload.email,
        password: payload.password,
        role: payload.role,
        active: payload.active
      };

      const response = await axios.post(API_URL, apiPayload);
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to create user');
      }
      
      await fetchUsers();
    } catch (err) {
      const errorMessage = axios.isAxiosError(err) 
        ? err.response?.data?.error || err.message 
        : 'Failed to add user';
      setError(errorMessage);
      console.error('Error adding user:', err);
    } finally {
      setLoading(false);
    }
  }, [fetchUsers]);

  const updateUser = useCallback(async (id: number, payload: UpdateUserPayload) => {
    setLoading(true);
    setError(null);
    
    try {
      const apiPayload: any = {};
      
      if (payload.username) apiPayload.username = payload.username;
      if (payload.email !== undefined) apiPayload.email = payload.email;
      if (payload.password) apiPayload.password = payload.password;
      if (payload.role) apiPayload.role = payload.role;
      if (payload.active !== undefined) apiPayload.active = payload.active;

      const response = await axios.put(`${API_URL}/${id}`, apiPayload);
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to update user');
      }
      
      // Refresh users list after successful update
      await fetchUsers();
    } catch (err) {
      const errorMessage = axios.isAxiosError(err) 
        ? err.response?.data?.error || err.message 
        : 'Failed to update user';
      setError(errorMessage);
      console.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [fetchUsers]);

  const deleteUser = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.delete(`${API_URL}/${id}`);
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to delete user');
      }
      
      // Refresh users list after successful deletion
      await fetchUsers();
    } catch (err) {
      const errorMessage = axios.isAxiosError(err) 
        ? err.response?.data?.error || err.message 
        : 'Failed to delete user';
      setError(errorMessage);
      console.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [fetchUsers]);

  const deleteUsers = useCallback(async (ids: number[]) => {
    setLoading(true);
    setError(null);
    
    try {
      // Delete users one by one since PHP API doesn't support bulk delete
      for (const id of ids) {
        const response = await axios.delete(`${API_URL}/${id}`);
        if (!response.data.success) {
          throw new Error(response.data.error || `Failed to delete user ${id}`);
        }
      }
      
      // Refresh users list after successful deletions
      await fetchUsers();
    } catch (err) {
      const errorMessage = axios.isAxiosError(err) 
        ? err.response?.data?.error || err.message 
        : 'Failed to delete users';
      setError(errorMessage);
      console.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [fetchUsers]);

  const refreshUsers = useCallback(async () => {
    await fetchUsers();
  }, [fetchUsers]);

  // Initial load
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return (
    <UserContext.Provider
      value={{
        users,
        loading,
        error,
        addUser,
        updateUser,
        deleteUser,
        deleteUsers,
        refreshUsers
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUsers = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUsers must be used within a UserProvider');
  }
  return context;
};