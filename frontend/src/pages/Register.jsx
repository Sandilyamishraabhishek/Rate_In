import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>]).{8,16}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const getPasswordStrength = (pw) => {
  if (!pw) return null;
  const hasUpper = /[A-Z]/.test(pw);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(pw);
  const goodLength = pw.length >= 8 && pw.length <= 16;
  if (goodLength && hasUpper && hasSpecial) return 'strong';
  if ((goodLength && hasUpper) || (goodLength && hasSpecial)) return 'medium';
  return 'weak';
};

const strengthColor = { strong: '#10b981', medium: '#f59e0b', weak: '#ef4444' };
const strengthLabel = { strong: '✓ Strong', medium: '⚠ Medium', weak: '✗ Weak' };

const Register = () => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', address: '' });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const validate = (field, value) => {
    const newErrors = { ...errors };
    if (field === 'name') {
      if (value.length > 0 && value.length < 20) newErrors.name = 'Name must be at least 20 characters.';
      else if (value.length > 60) newErrors.name = 'Name cannot exceed 60 characters.';
      else delete newErrors.name;
    }
    if (field === 'email') {
      if (value && !EMAIL_REGEX.test(value)) newErrors.email = 'Please enter a valid email address.';
      else delete newErrors.email;
    }
    if (field === 'password') {
      if (value.length > 0 && !PASSWORD_REGEX.test(value))
        newErrors.password = 'Password: 8-16 chars, 1 uppercase, 1 special character.';
      else delete newErrors.password;
    }
    if (field === 'address') {
      if (value.length > 400) newErrors.address = 'Address cannot exceed 400 characters.';
      else delete newErrors.address;
    }
    setErrors(newErrors);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    validate(name, value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');

    // Final validation
    const finalErrors = {};
    if (!formData.name || formData.name.length < 20 || formData.name.length > 60)
      finalErrors.name = 'Name must be between 20 and 60 characters.';
    if (!EMAIL_REGEX.test(formData.email))
      finalErrors.email = 'Please enter a valid email address.';
    if (!PASSWORD_REGEX.test(formData.password))
      finalErrors.password = 'Password: 8-16 chars, 1 uppercase, 1 special character.';
    if (formData.address && formData.address.length > 400)
      finalErrors.address = 'Address cannot exceed 400 characters.';

    if (Object.keys(finalErrors).length > 0) {
      setErrors(finalErrors);
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/register', formData);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      setApiError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const pwStrength = getPasswordStrength(formData.password);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ width: '100%', maxWidth: '500px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🏪</div>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, background: 'linear-gradient(to right, #818cf8, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '0.5rem' }}>
            Create Account
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>Join Store Rater today</p>
        </div>

        <div className="card">
          {apiError && <div className="error-msg mb-4">{apiError}</div>}
          {success && (
            <div className="success-msg mb-4">
              🎉 Registration successful! Redirecting to login...
            </div>
          )}

          {!success && (
            <form onSubmit={handleSubmit} noValidate>
              <div className="form-group">
                <label htmlFor="reg-name">
                  Full Name
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginLeft: '0.5rem' }}>
                    ({formData.name.length}/60) — min 20 chars
                  </span>
                </label>
                <input
                  id="reg-name"
                  type="text"
                  name="name"
                  className="form-control"
                  placeholder="Enter your full name (min 20 characters)"
                  value={formData.name}
                  onChange={handleChange}
                  maxLength={60}
                  required
                  style={{ borderColor: errors.name ? '#ef4444' : undefined }}
                />
                {errors.name && <div className="error-msg mt-2">{errors.name}</div>}
              </div>

              <div className="form-group">
                <label htmlFor="reg-email">Email Address</label>
                <input
                  id="reg-email"
                  type="email"
                  name="email"
                  className="form-control"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  style={{ borderColor: errors.email ? '#ef4444' : undefined }}
                />
                {errors.email && <div className="error-msg mt-2">{errors.email}</div>}
              </div>

              <div className="form-group">
                <label htmlFor="reg-password">
                  Password
                  {pwStrength && (
                    <span style={{ marginLeft: '0.75rem', fontSize: '0.8rem', color: strengthColor[pwStrength], fontWeight: 600 }}>
                      {strengthLabel[pwStrength]}
                    </span>
                  )}
                </label>
                <input
                  id="reg-password"
                  type="password"
                  name="password"
                  className="form-control"
                  placeholder="8-16 chars, 1 uppercase, 1 special char"
                  value={formData.password}
                  onChange={handleChange}
                  maxLength={16}
                  required
                  style={{ borderColor: errors.password ? '#ef4444' : undefined }}
                />
                {pwStrength && (
                  <div style={{ display: 'flex', gap: '4px', marginTop: '8px' }}>
                    {['weak', 'medium', 'strong'].map((level, i) => (
                      <div key={level} style={{
                        flex: 1, height: '4px', borderRadius: '2px',
                        background: i <= ['weak', 'medium', 'strong'].indexOf(pwStrength)
                          ? strengthColor[pwStrength]
                          : 'rgba(255,255,255,0.1)',
                        transition: 'background 0.3s'
                      }} />
                    ))}
                  </div>
                )}
                {errors.password && <div className="error-msg mt-2">{errors.password}</div>}
              </div>

              <div className="form-group">
                <label htmlFor="reg-address">
                  Address (Optional)
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginLeft: '0.5rem' }}>
                    ({formData.address.length}/400)
                  </span>
                </label>
                <textarea
                  id="reg-address"
                  name="address"
                  className="form-control"
                  placeholder="Your address (optional)"
                  value={formData.address}
                  onChange={handleChange}
                  maxLength={400}
                  rows={3}
                  style={{ resize: 'vertical', borderColor: errors.address ? '#ef4444' : undefined }}
                />
                {errors.address && <div className="error-msg mt-2">{errors.address}</div>}
              </div>

              <button
                id="reg-submit"
                type="submit"
                className="btn"
                style={{ width: '100%', marginTop: '0.5rem' }}
                disabled={loading || Object.keys(errors).length > 0}
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>
          )}

          <p className="text-center mt-4" style={{ color: 'var(--text-muted)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--primary-color)', fontWeight: 600 }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
