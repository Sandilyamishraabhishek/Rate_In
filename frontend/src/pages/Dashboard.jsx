import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';

const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>]).{8,16}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const SortableHeader = ({ label, field, sortField, sortDir, onSort }) => {
  const active = sortField === field;
  return (
    <th onClick={() => onSort(field)} title={`Sort by ${label}`}>
      {label}
      <span className="sort-icon">
        {active ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ' ⇅'}
      </span>
    </th>
  );
};

const StatCard = ({ icon, label, value, color }) => (
  <div className="card text-center" style={{ borderTop: `3px solid ${color}` }}>
    <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{icon}</div>
    <h3 style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>{label}</h3>
    <p style={{ fontSize: '2.5rem', fontWeight: 700, color }}>{value ?? '—'}</p>
  </div>
);

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Sorting state for user table
  const [userSort, setUserSort] = useState({ field: 'name', dir: 'asc' });

  // Sorting state for ratings table
  const [ratingSort, setRatingSort] = useState({ field: 'score', dir: 'desc' });

  // Admin: create new user form
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', address: '', role: 'Normal User' });
  const [newUserErrors, setNewUserErrors] = useState({});
  const [userFormMsg, setUserFormMsg] = useState({ type: '', text: '' });
  const [userFormLoading, setUserFormLoading] = useState(false);

  // Admin: create new store form
  const [newStore, setNewStore] = useState({ name: '', email: '', address: '', ownerId: '' });
  const [storeFormMsg, setStoreFormMsg] = useState({ type: '', text: '' });
  const [storeFormLoading, setStoreFormLoading] = useState(false);

  // Store Owner state
  const [storeRatings, setStoreRatings] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      if (user.role === 'System Administrator') {
        const [statsRes, usersRes] = await Promise.all([
          api.get('/admin/dashboard'),
          api.get('/admin/users'),
        ]);
        setStats(statsRes.data);
        setUsers(usersRes.data);
      } else if (user.role === 'Store Owner') {
        const ratingsRes = await api.get('/stores/my-store/ratings');
        setStoreRatings(ratingsRes.data);
      }
    } catch (err) {
      setError('Failed to load dashboard data. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  // --- Sorting Helpers ---
  const sortedUsers = [...users].sort((a, b) => {
    let aVal = a[userSort.field] ?? '';
    let bVal = b[userSort.field] ?? '';
    if (userSort.field === 'storeRating') {
      aVal = parseFloat(aVal) || 0;
      bVal = parseFloat(bVal) || 0;
    } else {
      aVal = String(aVal).toLowerCase();
      bVal = String(bVal).toLowerCase();
    }
    if (aVal < bVal) return userSort.dir === 'asc' ? -1 : 1;
    if (aVal > bVal) return userSort.dir === 'asc' ? 1 : -1;
    return 0;
  });

  const handleUserSort = (field) => {
    setUserSort(prev => ({ field, dir: prev.field === field && prev.dir === 'asc' ? 'desc' : 'asc' }));
  };

  const sortedRatings = storeRatings ? [...storeRatings.ratings].sort((a, b) => {
    let aVal = ratingSort.field === 'score' ? a.score : (a.User?.name ?? '').toLowerCase();
    let bVal = ratingSort.field === 'score' ? b.score : (b.User?.name ?? '').toLowerCase();
    if (aVal < bVal) return ratingSort.dir === 'asc' ? -1 : 1;
    if (aVal > bVal) return ratingSort.dir === 'asc' ? 1 : -1;
    return 0;
  }) : [];

  const handleRatingSort = (field) => {
    setRatingSort(prev => ({ field, dir: prev.field === field && prev.dir === 'asc' ? 'desc' : 'asc' }));
  };

  // --- User form validation ---
  const validateUserField = (field, value, currentErrors) => {
    const errs = { ...currentErrors };
    if (field === 'name') {
      if (value.length > 0 && value.length < 20) errs.name = 'Name must be at least 20 characters.';
      else if (value.length > 60) errs.name = 'Name cannot exceed 60 characters.';
      else delete errs.name;
    }
    if (field === 'email') {
      if (value && !EMAIL_REGEX.test(value)) errs.email = 'Invalid email format.';
      else delete errs.email;
    }
    if (field === 'password') {
      if (value.length > 0 && !PASSWORD_REGEX.test(value)) errs.password = '8-16 chars, 1 uppercase, 1 special char.';
      else delete errs.password;
    }
    return errs;
  };

  const handleNewUserChange = (e) => {
    const { name, value } = e.target;
    setNewUser(prev => ({ ...prev, [name]: value }));
    setNewUserErrors(prev => validateUserField(name, value, prev));
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setUserFormMsg({ type: '', text: '' });
    const errs = {};
    if (!newUser.name || newUser.name.length < 20 || newUser.name.length > 60) errs.name = 'Name must be 20-60 characters.';
    if (!EMAIL_REGEX.test(newUser.email)) errs.email = 'Invalid email format.';
    if (!PASSWORD_REGEX.test(newUser.password)) errs.password = '8-16 chars, 1 uppercase, 1 special char.';
    if (Object.keys(errs).length > 0) { setNewUserErrors(errs); return; }

    setUserFormLoading(true);
    try {
      await api.post('/admin/users', newUser);
      setUserFormMsg({ type: 'success', text: 'User created successfully!' });
      setNewUser({ name: '', email: '', password: '', address: '', role: 'Normal User' });
      setNewUserErrors({});
      fetchDashboardData();
    } catch (err) {
      setUserFormMsg({ type: 'error', text: err.response?.data?.error || 'Error creating user.' });
    } finally {
      setUserFormLoading(false);
    }
  };

  const handleCreateStore = async (e) => {
    e.preventDefault();
    setStoreFormMsg({ type: '', text: '' });
    setStoreFormLoading(true);
    try {
      await api.post('/admin/stores', newStore);
      setStoreFormMsg({ type: 'success', text: 'Store created successfully!' });
      setNewStore({ name: '', email: '', address: '', ownerId: '' });
      fetchDashboardData();
    } catch (err) {
      setStoreFormMsg({ type: 'error', text: err.response?.data?.error || 'Error creating store.' });
    } finally {
      setStoreFormLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container text-center" style={{ paddingTop: '4rem' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
        <p style={{ color: 'var(--text-muted)' }}>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="container">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>Dashboard</h1>
        <p style={{ color: 'var(--text-muted)' }}>
          Welcome back, <strong style={{ color: 'var(--text-main)' }}>{user.name}</strong>
        </p>
      </div>

      {error && <div className="error-msg mb-4">{error}</div>}

      {/* ===== ADMIN VIEW ===== */}
      {user.role === 'System Administrator' && (
        <>
          {/* Stats Row */}
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
            <StatCard icon="👥" label="Total Users" value={stats?.totalUsers} color="#6366f1" />
            <StatCard icon="🏪" label="Total Stores" value={stats?.totalStores} color="#8b5cf6" />
            <StatCard icon="⭐" label="Total Ratings" value={stats?.totalRatings} color="#ec4899" />
          </div>

          {/* Create Forms */}
          <div className="grid grid-2 mt-4">
            {/* Create User */}
            <div className="card">
              <h3>➕ Create New User</h3>
              {userFormMsg.text && (
                <div className={userFormMsg.type === 'success' ? 'success-msg mb-4' : 'error-msg mb-4'}>
                  {userFormMsg.text}
                </div>
              )}
              <form onSubmit={handleCreateUser} noValidate>
                <div className="form-group">
                  <label>
                    Full Name
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginLeft: '0.5rem' }}>
                      ({newUser.name.length}/60)
                    </span>
                  </label>
                  <input
                    id="admin-new-user-name"
                    type="text"
                    name="name"
                    className="form-control"
                    placeholder="Min 20 characters"
                    value={newUser.name}
                    onChange={handleNewUserChange}
                    maxLength={60}
                    required
                    style={{ borderColor: newUserErrors.name ? '#ef4444' : undefined }}
                  />
                  {newUserErrors.name && <div className="error-msg mt-2">{newUserErrors.name}</div>}
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    id="admin-new-user-email"
                    type="email"
                    name="email"
                    className="form-control"
                    placeholder="user@example.com"
                    value={newUser.email}
                    onChange={handleNewUserChange}
                    required
                    style={{ borderColor: newUserErrors.email ? '#ef4444' : undefined }}
                  />
                  {newUserErrors.email && <div className="error-msg mt-2">{newUserErrors.email}</div>}
                </div>
                <div className="form-group">
                  <label>Password</label>
                  <input
                    id="admin-new-user-password"
                    type="password"
                    name="password"
                    className="form-control"
                    placeholder="8-16 chars, 1 uppercase, 1 special char"
                    value={newUser.password}
                    onChange={handleNewUserChange}
                    maxLength={16}
                    required
                    style={{ borderColor: newUserErrors.password ? '#ef4444' : undefined }}
                  />
                  {newUserErrors.password && <div className="error-msg mt-2">{newUserErrors.password}</div>}
                </div>
                <div className="form-group">
                  <label>
                    Address
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginLeft: '0.5rem' }}>
                      (optional, max 400)
                    </span>
                  </label>
                  <input
                    id="admin-new-user-address"
                    type="text"
                    name="address"
                    className="form-control"
                    placeholder="User's address"
                    value={newUser.address}
                    onChange={handleNewUserChange}
                    maxLength={400}
                  />
                </div>
                <div className="form-group">
                  <label>Role</label>
                  <select
                    id="admin-new-user-role"
                    name="role"
                    className="form-control"
                    value={newUser.role}
                    onChange={handleNewUserChange}
                  >
                    <option>Normal User</option>
                    <option>System Administrator</option>
                    <option>Store Owner</option>
                  </select>
                </div>
                <button
                  id="admin-new-user-submit"
                  type="submit"
                  className="btn"
                  disabled={userFormLoading || Object.keys(newUserErrors).length > 0}
                >
                  {userFormLoading ? 'Creating...' : 'Create User'}
                </button>
              </form>
            </div>

            {/* Create Store */}
            <div className="card">
              <h3>🏪 Create New Store</h3>
              {storeFormMsg.text && (
                <div className={storeFormMsg.type === 'success' ? 'success-msg mb-4' : 'error-msg mb-4'}>
                  {storeFormMsg.text}
                </div>
              )}
              <form onSubmit={handleCreateStore}>
                <div className="form-group">
                  <label>Store Name</label>
                  <input
                    id="admin-new-store-name"
                    type="text"
                    className="form-control"
                    placeholder="Store name"
                    value={newStore.name}
                    onChange={e => setNewStore({ ...newStore, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Store Email</label>
                  <input
                    id="admin-new-store-email"
                    type="email"
                    className="form-control"
                    placeholder="store@example.com"
                    value={newStore.email}
                    onChange={e => setNewStore({ ...newStore, email: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Store Address</label>
                  <input
                    id="admin-new-store-address"
                    type="text"
                    className="form-control"
                    placeholder="Store address"
                    value={newStore.address}
                    onChange={e => setNewStore({ ...newStore, address: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Owner ID <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>(must be a Store Owner)</span></label>
                  <input
                    id="admin-new-store-ownerid"
                    type="number"
                    className="form-control"
                    placeholder="User ID of the Store Owner"
                    value={newStore.ownerId}
                    onChange={e => setNewStore({ ...newStore, ownerId: e.target.value })}
                    required
                  />
                </div>
                <button
                  id="admin-new-store-submit"
                  type="submit"
                  className="btn"
                  disabled={storeFormLoading}
                >
                  {storeFormLoading ? 'Creating...' : 'Create Store'}
                </button>
              </form>
            </div>
          </div>

          {/* Users Table */}
          <div className="card mt-4">
            <h3 style={{ marginBottom: '1.5rem' }}>👥 All Users ({users.length})</h3>
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <SortableHeader label="Name" field="name" sortField={userSort.field} sortDir={userSort.dir} onSort={handleUserSort} />
                    <SortableHeader label="Email" field="email" sortField={userSort.field} sortDir={userSort.dir} onSort={handleUserSort} />
                    <SortableHeader label="Role" field="role" sortField={userSort.field} sortDir={userSort.dir} onSort={handleUserSort} />
                    <th>Address</th>
                    <SortableHeader label="Store Rating" field="storeRating" sortField={userSort.field} sortDir={userSort.dir} onSort={handleUserSort} />
                  </tr>
                </thead>
                <tbody>
                  {sortedUsers.length === 0 ? (
                    <tr><td colSpan="6" className="text-center" style={{ color: 'var(--text-muted)', padding: '2rem' }}>No users found.</td></tr>
                  ) : sortedUsers.map(u => (
                    <tr key={u.id}>
                      <td style={{ color: 'var(--text-muted)' }}>#{u.id}</td>
                      <td style={{ fontWeight: 500 }}>{u.name}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{u.email}</td>
                      <td>
                        <span style={{
                          display: 'inline-block', padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.78rem', fontWeight: 600,
                          background: u.role === 'System Administrator' ? 'rgba(99,102,241,0.2)' : u.role === 'Store Owner' ? 'rgba(139,92,246,0.2)' : 'rgba(16,185,129,0.2)',
                          color: u.role === 'System Administrator' ? '#818cf8' : u.role === 'Store Owner' ? '#a78bfa' : '#6ee7b7'
                        }}>
                          {u.role}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-muted)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.address || '—'}</td>
                      <td>
                        {u.role === 'Store Owner' ? (
                          <span style={{ color: '#f59e0b', fontWeight: 600 }}>
                            {u.storeRating != null ? `⭐ ${Number(u.storeRating).toFixed(1)}` : 'No store yet'}
                          </span>
                        ) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ===== STORE OWNER VIEW ===== */}
      {user.role === 'Store Owner' && storeRatings && (
        <div className="card mt-4">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <h3>⭐ My Store Ratings</h3>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Average Rating</div>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: '#f59e0b' }}>
                {Number(storeRatings.averageRating).toFixed(1)} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/ 5</span>
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                From {storeRatings.ratings.length} {storeRatings.ratings.length === 1 ? 'rating' : 'ratings'}
              </div>
            </div>
          </div>

          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <SortableHeader label="Customer Name" field="name" sortField={ratingSort.field} sortDir={ratingSort.dir} onSort={handleRatingSort} />
                  <th>Email</th>
                  <SortableHeader label="Rating" field="score" sortField={ratingSort.field} sortDir={ratingSort.dir} onSort={handleRatingSort} />
                </tr>
              </thead>
              <tbody>
                {sortedRatings.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="text-center" style={{ color: 'var(--text-muted)', padding: '2rem' }}>
                      No ratings yet. Share your store!
                    </td>
                  </tr>
                ) : sortedRatings.map(r => (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 500 }}>{r.User?.name}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{r.User?.email}</td>
                    <td>
                      <span style={{ color: '#f59e0b', fontWeight: 700, fontSize: '1.1rem' }}>
                        {'⭐'.repeat(r.score)} <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>({r.score}/5)</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {user.role === 'Store Owner' && !storeRatings && !loading && (
        <div className="card mt-4 text-center">
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏪</div>
          <h3 style={{ marginBottom: '0.5rem' }}>No store assigned yet</h3>
          <p style={{ color: 'var(--text-muted)' }}>Contact an administrator to have a store assigned to your account.</p>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
