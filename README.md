# Store Rating Platform

A full-stack web application for rating and discovering stores, built as part of the FullStack Intern Coding Challenge.

## Tech Stack

- **Frontend:** React 19 + Vite + React Router DOM
- **Backend:** Node.js + Express 5
- **Database:** SQLite (via Sequelize ORM)
- **Auth:** JWT (JSON Web Tokens) + bcryptjs

## Features

- 🔐 **Three user roles:** System Administrator, Store Owner, Normal User
- 🏪 **Store Listings** with real-time search (by name or address) and sorting (Name, Address, Rating)
- ⭐ **Interactive Star Ratings** — submit or update your rating for any store
- 📊 **Admin Dashboard** — view stats, manage users & stores, sortable tables
- 👤 **Store Owner Dashboard** — view average rating and all customer ratings with sorting
- ✅ **Strict Validations** — name (20-60 chars), email format, password complexity (8-16 chars, 1 uppercase, 1 special), address (max 400 chars)
- 🎨 **Premium Dark UI** — glassmorphism design, micro-animations, password strength indicator

## Project Structure

```
Full Stack/
├── backend/
│   ├── middleware/
│   │   └── auth.js          # JWT authenticate & authorize middleware
│   ├── models/
│   │   ├── index.js         # Sequelize init + associations
│   │   ├── User.js
│   │   ├── Store.js
│   │   └── Rating.js
│   ├── routes/
│   │   ├── auth.js          # Register, Login, Update Password
│   │   ├── admin.js         # Admin-only: stats, create users/stores
│   │   ├── stores.js        # Store listings + store owner ratings
│   │   └── ratings.js       # Submit & update ratings
│   ├── server.js
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   └── Navbar.jsx
    │   ├── context/
    │   │   └── AuthContext.jsx
    │   ├── pages/
    │   │   ├── Login.jsx
    │   │   ├── Register.jsx
    │   │   ├── Stores.jsx
    │   │   └── Dashboard.jsx
    │   ├── services/
    │   │   └── api.js
    │   ├── App.jsx
    │   └── index.css
    ├── index.html
    └── package.json
```

## Getting Started

### Prerequisites
- Node.js ≥ 18

### 1. Install & Run Backend

```bash
cd backend
npm install
node server.js
# Server runs on http://localhost:5000
```

### 2. Install & Run Frontend

```bash
cd frontend
npm install
npm run dev
# App runs on http://localhost:5173
```

## API Endpoints

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/auth/register` | Public | Register a new user |
| POST | `/api/auth/login` | Public | Login |
| PUT | `/api/auth/update-password` | Any | Change password |
| GET | `/api/admin/dashboard` | Admin | Get stats |
| GET | `/api/admin/users` | Admin | List all users |
| POST | `/api/admin/users` | Admin | Create user |
| POST | `/api/admin/stores` | Admin | Create store |
| GET | `/api/stores` | Any | List stores (with search) |
| GET | `/api/stores/my-store/ratings` | Store Owner | View my store ratings |
| POST | `/api/ratings` | Any | Submit rating |
| PUT | `/api/ratings/:id` | Any | Update rating |

## Validation Rules

| Field | Rule |
|-------|------|
| Name | 20 – 60 characters |
| Email | Valid email format |
| Password | 8-16 chars, min 1 uppercase, min 1 special character |
| Address | Max 400 characters (optional) |

## Default Roles

- **Normal User** — Browse stores, submit/update ratings
- **Store Owner** — Same as Normal User + Dashboard showing their store's ratings
- **System Administrator** — Full access: manage users, stores, view all stats
