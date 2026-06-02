import React, { useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  const navLinkStyle = (path) => ({
    color: isActive(path) ? '#818cf8' : 'var(--text-muted)',
    fontWeight: isActive(path) ? 600 : 400,
    fontSize: '0.95rem',
    transition: 'color 0.2s ease',
    position: 'relative',
    paddingBottom: '2px',
    borderBottom: isActive(path) ? '2px solid #818cf8' : '2px solid transparent',
  });

  const roleBadgeStyle = (role) => {
    const colors = {
      'System Administrator': { bg: 'rgba(99,102,241,0.15)', color: '#818cf8', border: 'rgba(99,102,241,0.3)' },
      'Store Owner': { bg: 'rgba(139,92,246,0.15)', color: '#a78bfa', border: 'rgba(139,92,246,0.3)' },
      'Normal User': { bg: 'rgba(16,185,129,0.15)', color: '#6ee7b7', border: 'rgba(16,185,129,0.3)' },
    };
    const c = colors[role] || colors['Normal User'];
    return {
      background: c.bg,
      color: c.color,
      border: `1px solid ${c.border}`,
      padding: '0.2rem 0.6rem',
      borderRadius: '999px',
      fontSize: '0.75rem',
      fontWeight: 600,
    };
  };

  return (
    <nav className="navbar">
      {/* Brand */}
      <Link
        to="/"
        className="navbar-brand"
        style={{ textDecoration: 'none' }}
        id="navbar-brand"
      >
        🏪 Store Rater
      </Link>

      {/* Nav Links */}
      <div className="navbar-links">
        {user ? (
          <>
            <Link
              id="nav-home"
              to="/"
              style={navLinkStyle('/')}
            >
              Stores
            </Link>

            {['System Administrator', 'Store Owner'].includes(user.role) && (
              <Link
                id="nav-dashboard"
                to="/dashboard"
                style={navLinkStyle('/dashboard')}
              >
                Dashboard
              </Link>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingLeft: '1rem', borderLeft: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-main)', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.name}
                </div>
                <div style={roleBadgeStyle(user.role)}>
                  {user.role}
                </div>
              </div>

              <button
                id="nav-logout"
                className="btn btn-danger"
                onClick={handleLogout}
                style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
              >
                Logout
              </button>
            </div>
          </>
        ) : (
          <>
            <Link id="nav-login" to="/login" style={navLinkStyle('/login')}>
              Login
            </Link>
            <Link id="nav-register" to="/register" className="btn" style={{ padding: '0.5rem 1.25rem', fontSize: '0.9rem' }}>
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
