# 🚀 Deployment Guide - Employee Management System

## Quick Start - Build for Production

### Prerequisites
- ✅ Node.js 16+ installed
- ✅ All dependencies installed (`npm install`)
- ✅ Application tested and working

---

## Build Commands

### Option 1: Build Installer + Portable (Recommended)
```bash
npm run build:win
```
**Output**:
- `release/نظام إدارة الموظفين Setup 1.0.0.exe` (Installer)
- `release/نظام_إدارة_الموظفين_Portable_1.0.0.exe` (Portable)

### Option 2: Build Portable Only
```bash
npm run build:portable
```

### Option 3: Build Code Only (No Packaging)
```bash
npm run build
```

---

## Build Output

### Installer Version
- **File**: `نظام إدارة الموظفين Setup 1.0.0.exe`
- **Size**: ~150-200 MB
- **Installation**: Creates Start Menu shortcuts, Desktop shortcut
- **Uninstall**: Available in Windows Settings
- **Best For**: Permanent installations on company computers

### Portable Version
- **File**: `نظام_إدارة_الموظفين_Portable_1.0.0.exe`
- **Size**: ~150-200 MB
- **Installation**: No installation required, run directly
- **Best For**: USB drives, temporary use, testing

---

## Distribution

### Method 1: Direct Distribution
1. Build the application: `npm run build:win`
2. Navigate to `release/` folder
3. Share the `.exe` files with users
4. Users run the installer or portable version

### Method 2: Network Share
1. Build the application
2. Copy to company network drive
3. Users access from network location
4. Easy to update centrally

### Method 3: USB Distribution
1. Build portable version
2. Copy to USB drives
3. Distribute to employees
4. Fully offline capable

---

## Installation Instructions (For End Users)

### Installer Version
1. Download `نظام إدارة الموظفين Setup 1.0.0.exe`
2. Double-click to run
3. Follow installation wizard
4. Choose installation directory (optional)
5. Click "Install"
6. Launch from Start Menu or Desktop shortcut

### Portable Version
1. Download `نظام_إدارة_الموظفين_Portable_1.0.0.exe`
2. Copy to desired location (USB, folder, etc.)
3. Double-click to run
4. No installation required

---

## First Run Setup

### Admin User Creation
1. Launch the application
2. First-run setup screen appears
3. Create admin username and password
4. Click "إنشاء حساب المسؤول"
5. Auto-login to dashboard

### Database Location
- **Path**: `C:\Users\[Username]\AppData\Roaming\employee-management-system\`
- **Files**:
  - `database/hrms.db` - Main database
  - `backups/` - Automatic backups
  - `uploads/` - Employee attachments

---

## Features

### ✅ Fully Offline
- No internet connection required
- All data stored locally
- Complete privacy and security

### ✅ Automatic Backups
- Backup created on every app exit
- Location: `AppData\Roaming\employee-management-system\backups\`
- Format: `auto_on_exit_YYYY-MM-DDTHH-MM-SS-MMMZ.db`

### ✅ Manual Backups
- Settings → إعدادات الاتصال → نسخ احتياطي يدوي
- Choose custom backup location
- Admin-only feature

### ✅ User Management
- Create multiple users
- Assign granular permissions
- Admin and regular user roles

---

## Troubleshooting

### Build Fails
```bash
# Clear and reinstall dependencies
rm -rf node_modules package-lock.json
npm install
npm run build:win
```

### Application Won't Start
- Check Windows Defender/Antivirus
- Run as Administrator
- Check AppData folder permissions

### Database Issues
- Restore from backup in `backups/` folder
- Check disk space
- Verify file permissions

### Icon Not Showing
- Icon is embedded in `.exe`
- May take time to appear in Windows
- Clear icon cache if needed

---

## System Requirements

### Minimum
- **OS**: Windows 10 (64-bit)
- **RAM**: 4 GB
- **Disk**: 500 MB free space
- **Display**: 1366x768

### Recommended
- **OS**: Windows 10/11 (64-bit)
- **RAM**: 8 GB
- **Disk**: 1 GB free space
- **Display**: 1920x1080

---

## Security Notes

- All passwords hashed with bcrypt
- Database stored locally (not cloud)
- No external connections
- Audit log tracks all actions
- Permission-based access control

---

## Support

### Common Issues
1. **App won't launch**: Run as administrator
2. **Database locked**: Close all instances
3. **Backup failed**: Check folder permissions
4. **Login failed**: Reset password via admin

### Data Migration
- Export data via Excel export features
- Copy database file for backup
- Use manual backup feature in Settings

---

## Version Information

**Current Version**: 1.0.0  
**Build Date**: 2026-01-20  
**Platform**: Windows x64  
**Framework**: Electron + React + SQLite

---

## Next Steps

1. ✅ Build the application
2. ✅ Test on clean Windows machine
3. ✅ Distribute to users
4. ✅ Provide installation instructions
5. ✅ Set up backup strategy

**Ready to deploy!** 🎉
