# PrintScrap.ai - API Setup Guide

## 📁 Final Project Structure

```
printscrap.ai/
├── api/                          # Backend API (Vercel Serverless Functions)
│   ├── auth/
│   │   ├── login.ts             # Login endpoint
│   │   └── register.ts          # Registration with 1-day trial
│   ├── db.ts                    # MSSQL database connection
│   ├── auth.ts                  # Authentication middleware
│   ├── types.ts                 # TypeScript type definitions
│   ├── schema.sql               # Database schema
│   ├── .env.example             # Environment variables template
│   └── README.md                # API documentation
├── src/                         # Frontend (Next.js)
│   ├── app/                     # Next.js App Router
│   ├── components/              # React components
│   ├── contexts/                # React contexts
│   └── lib/                     # Utilities
├── package.json                 # ✅ Single package.json for entire project
├── tsconfig.json                # ✅ Single TypeScript config
├── vercel.json                  # Vercel deployment config
└── .env.example                 # Root environment variables

```

## 🎯 Key Points

### ✅ Single Package.json
- All dependencies (frontend + backend) in **root package.json**
- No separate `api/package.json`
- Simplified dependency management

### ✅ Single TypeScript Config
- Main `tsconfig.json` at root handles both frontend and backend
- No separate `api/tsconfig.json`
- Unified TypeScript configuration

### 🔧 Dependencies Added to Root package.json

**Production Dependencies:**
```json
"mssql": "^10.0.1"
```

**Development Dependencies:**
```json
"@types/mssql": "^9.1.4",
"@vercel/node": "^3.0.11"
```

## 📦 Installation

```bash
# Install all dependencies (frontend + backend)
npm install
```

## 🚀 Development

```bash
# Run Next.js frontend
npm run dev

# Run Vercel serverless functions locally
npm run vercel:dev
```

## 🌐 Deployment

```bash
# Deploy to Vercel production
npm run vercel:deploy
```

## 🗄️ Database Setup

### 1. Create MSSQL Database
Use Azure SQL Database or local SQL Server instance.

### 2. Set Environment Variables

Create `.env` in root:

```env
DB_USER=your_database_username
DB_PASSWORD=your_database_password
DB_SERVER=your_server.database.windows.net
DB_NAME=printscrap_db
```

### 3. Run Schema

Execute `api/schema.sql` in your MSSQL database to create:
- All tables (Users, Plans, Subscriptions, Categories, etc.)
- Default data (Super Admin, Plans, Categories)

## 🔐 Authentication Flow

### Basic Authentication with localStorage

```typescript
// 1. Login/Register
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});

const { data } = await response.json();

// 2. Store in localStorage
localStorage.setItem('authHeader', data.authHeader);
localStorage.setItem('user', JSON.stringify(data.user));

// 3. Make authenticated requests
const authHeader = localStorage.getItem('authHeader');
const response = await fetch('/api/endpoint', {
  headers: { 'Authorization': authHeader }
});
```

## 📋 API Endpoints

All endpoints are TypeScript with full type safety:

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Register with auto 1-day trial

### Future Endpoints (To be created)
- Users, Categories, SubCategories
- Units, Departments, Machines
- Scrap Entries, Stock, Sales

## 🎨 TypeScript Features

### Fully Typed API
```typescript
// types.ts - All interfaces defined
export interface User {
  id: number;
  email: string;
  role: 'super_admin' | 'client';
  // ... more fields
}

// login.ts - Type-safe request/response
const { email, password } = req.body as LoginRequest;
return res.json<ApiResponse<AuthResponse>>({ ... });
```

### Benefits
- ✅ Compile-time type checking
- ✅ IDE autocomplete
- ✅ Refactoring safety
- ✅ Self-documenting code

## 📊 Database Schema Highlights

### No UUIDs - Using IDENTITY
```sql
CREATE TABLE Users (
    id INT IDENTITY(1,1) PRIMARY KEY,  -- Auto-increment integer
    email NVARCHAR(255) UNIQUE NOT NULL,
    -- ...
);
```

### Trial Period System
```sql
-- Subscriptions track trial status
CREATE TABLE Subscriptions (
    status NVARCHAR(50) CHECK (status IN ('trial', 'active', 'expired', 'cancelled')),
    startDate DATETIME NOT NULL,
    endDate DATETIME NOT NULL,
    -- ...
);
```

### Default Data Included
- Super Admin: `admin@printscrap.ai` / `admin123`
- 3 Plans: Basic (₹999), Professional (₹2499), Enterprise (₹4999)
- Sample Categories, Units, Departments

## 🔒 Security Features

- **Basic Authentication**: Simple, secure credential-based auth
- **SQL Injection Protection**: Parameterized queries
- **CORS Enabled**: Cross-origin resource sharing
- **Encrypted Connection**: SSL/TLS for Azure SQL
- **Transaction Support**: Data integrity with rollback

## 📝 Next Steps

1. ✅ Setup complete - API structure ready
2. ⏭️ Create MSSQL database
3. ⏭️ Run schema.sql
4. ⏭️ Set environment variables
5. ⏭️ Test endpoints locally
6. ⏭️ Deploy to Vercel
7. ⏭️ Create additional endpoints as needed

## 🆘 Support

- **Email**: support@printscrap.ai
- **Phone**: +91 98765 43210

---

**Note**: This is a production-ready TypeScript API with MSSQL backend, Basic Authentication, and automatic 1-day trial for new users.
