# PrintScrap.ai API

Backend API for PrintScrap.ai using Vercel Serverless Functions and MSSQL Database.

## Tech Stack

- **Runtime**: Node.js (Vercel Serverless Functions)
- **Database**: Microsoft SQL Server (MSSQL)
- **Authentication**: Basic Authentication with localStorage
- **No UUID**: Using IDENTITY(1,1) for auto-incrementing integer IDs

## Setup Instructions

### 1. Database Setup

1. Create an MSSQL database (Azure SQL or local SQL Server)
2. Run the schema.sql file to create tables and insert default data:

```sql
-- Execute schema.sql in your MSSQL database
```

### 2. Environment Variables

1. Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

2. Update the `.env` file with your database credentials:

```env
DB_USER=your_database_username
DB_PASSWORD=your_database_password
DB_SERVER=your_server.database.windows.net
DB_NAME=printscrap_db
```

### 3. Install Dependencies

All dependencies are managed in the root `package.json`. Install them from the project root:

```bash
npm install
```

This installs both frontend (Next.js) and backend (API) dependencies.

### 4. Deploy to Vercel

1. Install Vercel CLI:

```bash
npm install -g vercel
```

2. Set environment variables in Vercel:

```bash
vercel env add DB_USER
vercel env add DB_PASSWORD
vercel env add DB_SERVER
vercel env add DB_NAME
```

3. Deploy:

```bash
vercel --prod
```

## API Endpoints

### Authentication

- **POST** `/api/auth/login` - User login
- **POST** `/api/auth/register` - User registration (creates 1-day trial automatically)

### Users

- **GET** `/api/users` - Get all users (super_admin only)
- **GET** `/api/users/:id` - Get user by ID
- **PUT** `/api/users/:id` - Update user
- **PUT** `/api/users/:id/status` - Update user status (super_admin only)

### Categories

- **GET** `/api/categories` - Get all categories
- **POST** `/api/categories` - Create category
- **PUT** `/api/categories/:id` - Update category
- **DELETE** `/api/categories/:id` - Delete category

### Sub-Categories

- **GET** `/api/subcategories` - Get all sub-categories
- **POST** `/api/subcategories` - Create sub-category
- **DELETE** `/api/subcategories/:id` - Delete sub-category

### Masters (Units, Departments, Machines)

- **GET** `/api/units` - Get all units
- **POST** `/api/units` - Create unit
- **DELETE** `/api/units/:id` - Delete unit

- **GET** `/api/departments` - Get all departments
- **POST** `/api/departments` - Create department
- **DELETE** `/api/departments/:id` - Delete department

- **GET** `/api/machines` - Get all machines
- **POST** `/api/machines` - Create machine
- **DELETE** `/api/machines/:id` - Delete machine

### Scrap Entries

- **GET** `/api/scrap-entries` - Get user's scrap entries
- **POST** `/api/scrap-entries` - Create scrap entry

### Inventory/Stock

- **GET** `/api/stock` - Get user's stock/inventory

### Sales

- **GET** `/api/sales` - Get user's sales
- **POST** `/api/sales` - Create sale

### Plans & Subscriptions

- **GET** `/api/plans` - Get all plans
- **GET** `/api/subscriptions/:userId` - Get user subscription
- **GET** `/api/check-trial/:userId` - Check if trial expired

## Authentication Flow

### Frontend (localStorage)

1. **Login/Register**:
   - User sends email and password
   - API returns authHeader: `Basic base64(email:password)`
   - Frontend stores in localStorage: `localStorage.setItem('authHeader', authHeader)`

2. **Making Requests**:
   - Frontend includes header: `Authorization: Basic base64(email:password)`
   - Retrieve from localStorage: `localStorage.getItem('authHeader')`

3. **Logout**:
   - Clear localStorage: `localStorage.removeItem('authHeader')`

### Example Usage

```javascript
// Login
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});

const { data } = await response.json();
localStorage.setItem('authHeader', data.authHeader);
localStorage.setItem('user', JSON.stringify(data.user));

// Make authenticated request
const authHeader = localStorage.getItem('authHeader');
const stockResponse = await fetch('/api/stock', {
  headers: { 'Authorization': authHeader }
});
```

## Database Schema

The database uses standard integer IDs (IDENTITY) without UUIDs:

- **Users**: User accounts (client and super_admin)
- **Plans**: Subscription plans
- **Subscriptions**: User subscriptions (trial/active/expired)
- **Categories**: Scrap categories
- **SubCategories**: Scrap sub-categories
- **Units**: Measurement units
- **Departments**: Company departments
- **Machines**: Department machines
- **ScrapEntries**: Scrap collection entries
- **Stock**: Inventory/stock ledger
- **Sales**: Sales records
- **SaleItems**: Individual sale items

## Default Data

On first run, the schema creates:

- **Super Admin**: admin@printscrap.ai / admin123
- **3 Plans**: Basic (Rs.999), Professional (Rs.2499), Enterprise (Rs.4999)
- **3 Categories**: Paper, Plastic, Metal
- **4 Units**: Kg, Nos, Tons, Meters
- **3 Departments**: Printing, Binding, Cutting

## Trial Period

- New users automatically get a 1-day trial
- Trial subscription created with status='trial'
- After trial expires, modal shows plan options
- Contact: support@printscrap.ai / +91 98765 43210
