// src/contexts/AuthContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';
import { authService } from '../services/api';

// Create the auth context
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load user from token on initial render
  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setLoading(false);
        return;
      }
      
      try {
        const response = await authService.getCurrentUser();
        setCurrentUser(response.data.data);
        setError(null);
      } catch (err) {
        console.error('Failed to load user:', err);
        localStorage.removeItem('token');
        setError('Session expired. Please login again.');
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

// Register a new user
const register = async (userData) => {
  setLoading(true);
  setError(null);
  
  try {
    const response = await authService.register(userData);
    localStorage.setItem('token', response.data.token);
    setCurrentUser(response.data.data);
    return response.data;
  } catch (err) {
    console.error('Registration failed:', err);
    // Add more detailed error logging here
    console.error('Error response:', err.response);
    console.error('Error details:', err.response?.data);
    
    // Set a more informative error message
    setError(err.response?.data?.message || 
             `Registration failed: ${err.message}. Status: ${err.response?.status}`);
    throw err;
  } finally {
    setLoading(false);
  }
};

  // Login user
  const login = async (credentials) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await authService.login(credentials);
      localStorage.setItem('token', response.data.token);
      setCurrentUser(response.data.data);
      return response.data;
    } catch (err) {
      console.error('Login failed:', err);
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Logout user
  const logout = async () => {
    setLoading(true);
    
    try {
      await authService.logout();
      localStorage.removeItem('token');
      setCurrentUser(null);
    } catch (err) {
      console.error('Logout failed:', err);
      // Still remove token and user even if API call fails
      localStorage.removeItem('token');
      setCurrentUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Update user profile
  const updateProfile = async (userData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await authService.updateProfile(userData);
      setCurrentUser(response.data.data);
      return response.data;
    } catch (err) {
      console.error('Profile update failed:', err);
      setError(err.response?.data?.message || 'Failed to update profile. Please try again.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Clear error
  const clearError = () => {
    setError(null);
  };

  // Provide auth context value
  const value = {
    currentUser,
    loading,
    error,
    register,
    login,
    logout,
    updateProfile,
    clearError,
    isAuthenticated: !!currentUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
