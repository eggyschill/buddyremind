// src/components/RegisterForm.js
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../assets/css/Auth.css';

const RegisterForm = () => {
  const navigate = useNavigate();
  const { register, error, clearError } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear field-specific error when user types
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    
    // Confirm password validation
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clear previous errors
    clearError();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      await register({
        name: formData.name,
        email: formData.email,
        password: formData.password
      });
      
      // Redirect to dashboard on successful registration
      navigate('/dashboard');
    } catch (err) {
      // Error will be set in the auth context
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2>Create Your Account</h2>
          <p>Start managing your reminders with BuddyRemind</p>
        </div>
        
        {error && (
          <div className="error-alert">
            <span>{error}</span>
          </div>
        )}
        
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your full name"
              className={formErrors.name ? 'error' : ''}
              disabled={loading}
            />
            {formErrors.name && <span className="error-message">{formErrors.name}</span>}
          </div>
          
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              className={formErrors.email ? 'error' : ''}
              disabled={loading}
            />
            {formErrors.email && <span className="error-message">{formErrors.email}</span>}
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Create a password"
              className={formErrors.password ? 'error' : ''}
              disabled={loading}
            />
            {formErrors.password && <span className="error-message">{formErrors.password}</span>}
          </div>
          
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm your password"
              className={formErrors.confirmPassword ? 'error' : ''}
              disabled={loading}
            />
            {formErrors.confirmPassword && (
              <span className="error-message">{formErrors.confirmPassword}</span>
            )}
          </div>
          
          <button 
            type="submit" 
            className="auth-submit-btn"
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>
        
        <div className="auth-footer">
          <p>
            Already have an account? <Link to="/login">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterForm;
