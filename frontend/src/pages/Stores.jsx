import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';

const StarRating = ({ value, onChange }) => {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display: 'flex', gap: '4px', cursor: 'pointer' }}>
      {[1, 2, 3, 4, 5].map(star => (
        <span
          key={star}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(star)}
          style={{
            fontSize: '1.5rem',
            transition: 'transform 0.1s ease',
            transform: (hover || value) >= star ? 'scale(1.2)' : 'scale(1)',
            color: (hover || value) >= star ? '#f59e0b' : 'rgba(255,255,255,0.2)',
          }}
          title={`Rate ${star} star${star > 1 ? 's' : ''}`}
        >
          ★
        </span>
      ))}
    </div>
  );
};

const Stores = () => {
  const { user } = useContext(AuthContext);
  const [stores, setStores] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState('name');
  const [sortDir, setSortDir] = useState('asc');
  const [ratingMsg, setRatingMsg] = useState({});

  useEffect(() => {
    const debounce = setTimeout(fetchStores, 300);
    return () => clearTimeout(debounce);
  }, [search]);

  const fetchStores = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/stores?search=${encodeURIComponent(search)}`);
      setStores(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRatingSubmit = async (storeId, score, existingRatingId) => {
    try {
      if (existingRatingId) {
        await api.put(`/ratings/${existingRatingId}`, { score });
      } else {
        await api.post('/ratings', { storeId, score });
      }
      setRatingMsg(prev => ({ ...prev, [storeId]: { type: 'success', text: 'Rating saved!' } }));
      setTimeout(() => setRatingMsg(prev => ({ ...prev, [storeId]: null })), 2000);
      fetchStores();
    } catch (err) {
      setRatingMsg(prev => ({ ...prev, [storeId]: { type: 'error', text: err.response?.data?.error || 'Failed to submit rating.' } }));
    }
  };

  const handleSort = (field) => {
    setSortField(prev => {
      if (prev === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
      else setSortDir('asc');
      return field;
    });
  };

  const sortedStores = [...stores].sort((a, b) => {
    let aVal = sortField === 'overallRating' ? parseFloat(a[sortField]) || 0 : String(a[sortField] ?? '').toLowerCase();
    let bVal = sortField === 'overallRating' ? parseFloat(b[sortField]) || 0 : String(b[sortField] ?? '').toLowerCase();
    if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  const SortBtn = ({ field, label }) => (
    <button
      onClick={() => handleSort(field)}
      style={{
        background: sortField === field ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.05)',
        border: '1px solid',
        borderColor: sortField === field ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.1)',
        color: sortField === field ? '#818cf8' : 'var(--text-muted)',
        padding: '0.4rem 0.9rem',
        borderRadius: '999px',
        cursor: 'pointer',
        fontSize: '0.85rem',
        fontWeight: sortField === field ? 600 : 400,
        transition: 'all 0.2s ease',
        fontFamily: 'inherit',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.3rem',
      }}
    >
      {label}
      {sortField === field && <span>{sortDir === 'asc' ? '▲' : '▼'}</span>}
    </button>
  );

  return (
    <div className="container">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>🏪 Stores</h1>
        <p style={{ color: 'var(--text-muted)' }}>Discover and rate stores</p>
      </div>

      {/* Search & Sort Controls */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: '1', minWidth: '240px', position: 'relative' }}>
          <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>🔍</span>
          <input
            id="store-search"
            type="text"
            className="form-control"
            placeholder="Search by name or address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '2.5rem' }}
          />
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginRight: '0.25rem' }}>Sort:</span>
          <SortBtn field="name" label="Name" />
          <SortBtn field="address" label="Address" />
          <SortBtn field="overallRating" label="⭐ Rating" />
        </div>
      </div>

      {loading ? (
        <div className="text-center" style={{ padding: '4rem', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
          <p>Loading stores...</p>
        </div>
      ) : sortedStores.length === 0 ? (
        <div className="card text-center" style={{ padding: '3rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏪</div>
          <h3 style={{ marginBottom: '0.5rem' }}>No stores found</h3>
          <p style={{ color: 'var(--text-muted)' }}>Try adjusting your search query.</p>
        </div>
      ) : (
        <div className="grid grid-2">
          {sortedStores.map(store => (
            <div key={store.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Store Header */}
              <div>
                <h3 style={{ fontSize: '1.15rem', marginBottom: '0.25rem' }}>{store.name}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>📍 {store.address}</p>
              </div>

              {/* Overall Rating Display */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.3)',
                  borderRadius: '8px', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.4rem'
                }}>
                  <span style={{ color: '#f59e0b', fontSize: '1.1rem' }}>⭐</span>
                  <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>{Number(store.overallRating).toFixed(1)}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>/5</span>
                </div>
              </div>

              {/* Divider */}
              <div style={{ borderTop: '1px solid var(--card-border)' }} />

              {/* User Rating */}
              <div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                  {store.userSubmittedRating ? `Your rating: ${store.userSubmittedRating}/5 — click to change` : 'Rate this store:'}
                </div>
                <StarRating
                  value={store.userSubmittedRating || 0}
                  onChange={(score) => handleRatingSubmit(store.id, score, store.userRatingId)}
                />
                {ratingMsg[store.id] && (
                  <div className={ratingMsg[store.id].type === 'success' ? 'success-msg mt-2' : 'error-msg mt-2'}>
                    {ratingMsg[store.id].text}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Stores;
