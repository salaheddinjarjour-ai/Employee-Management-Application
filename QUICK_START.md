# Employee Management Application - Quick Start Guide

## 🚀 Starting the Application

### Prerequisites
- SQL Server (SQLEXPRESS) must be running
- Node.js and npm installed
- Dependencies installed (`npm install`)

### Start Command
```bash
npm run dev
```

This will start:
- Backend server on http://localhost:3000
- Frontend application on http://localhost:5173

### Access the Application
Open your browser and navigate to: **http://localhost:5173**

---

## 🔧 Configuration

### Environment Variables (.env)
```env
# SQL Server Configuration
DB_USER=EmployeeAppUser
DB_PASSWORD=Employee@2025!
DB_SERVER=localhost\SQLEXPRESS
DB_DATABASE=EmployeeManagement

# App Configuration
NODE_ENV=development
PORT=3000
```

---

## 📊 System Components

### Backend Server
- **Port**: 3000
- **Technology**: Express.js + TypeScript
- **Database**: MSSQL (SQL Server)
- **API Base**: http://localhost:3000/api

### Frontend Application
- **Port**: 5173
- **Technology**: React 18 + Vite
- **UI**: Arabic RTL interface with Tailwind CSS

### Database
- **Server**: localhost\SQLEXPRESS
- **Database**: EmployeeManagement
- **User**: EmployeeAppUser

---

## 🧪 Health Check

### Verify Backend
```bash
curl http://localhost:3000/api/health
```
Expected response: `{"status":"ok","timestamp":"..."}`

### Verify Frontend
Open browser to http://localhost:5173

---

## 📝 Available Scripts

```bash
# Development (runs both frontend and backend)
npm run dev

# Build server only
npm run build:server

# Build client only
npm run build:client

# Build everything
npm run build

# Start production server
npm start
```

---

## 🔍 Troubleshooting

### SQL Server Not Running
```powershell
# Check SQL Server status
Get-Service | Where-Object {$_.Name -like "*SQL*"}

# Start SQL Server if needed
Start-Service MSSQL$SQLEXPRESS
```

### Port Already in Use
```powershell
# Check what's using port 3000
netstat -ano | findstr :3000

# Check what's using port 5173
netstat -ano | findstr :5173
```

### Database Connection Issues
1. Verify SQL Server is running
2. Check .env configuration
3. Ensure EmployeeManagement database exists
4. Verify EmployeeAppUser has correct permissions

---

## 📚 Features

- **Employee Management**: Full CRUD operations
- **Payroll**: Multi-currency support (USD/TRY)
- **Leave Management**: Request and approval workflow
- **Attendance**: Absence tracking with penalties
- **Performance**: Evaluations and reviews
- **Training**: Course management
- **Promotions**: Career advancement tracking
- **Rewards**: Recognition and bonuses
- **Reports**: Comprehensive reporting system
- **File Attachments**: Document management per employee

---

## 🎯 Quick Actions

### Add New Employee
1. Navigate to "الموظفون" (Employees)
2. Click "إضافة موظف" (Add Employee)
3. Fill in the form
4. Click "حفظ" (Save)

### View Employee Details
1. Go to Employees page
2. Click the eye icon (👁️) next to any employee
3. Navigate through the 10 tabs for complete information

### Import from Excel
1. Go to Employees page
2. Click "استيراد Excel" (Import Excel)
3. Upload your Excel file
4. Map columns to database fields
5. Complete the import

---

## ✅ System Status

**Last Verified**: January 11, 2026  
**Status**: ✅ All systems operational  
**Database**: ✅ Connected and responding  
**Network**: ✅ All services communicating correctly
