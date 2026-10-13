import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'path'
import { initializeDatabase } from './database/init'
import { registerIPCHandlers } from './ipc/register'

// Disable hardware acceleration for better compatibility
app.disableHardwareAcceleration()

let mainWindow: BrowserWindow | null = null

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        minWidth: 1024,
        minHeight: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: false,
            webSecurity: false // Allow loading local resources (e.g. avatars)
        },
        title: 'Employee Management System',
        icon: path.join(__dirname, '../build/icon.ico')
    })

    // Load the app
    const indexPath = path.join(__dirname, '../dist/index.html')
    console.log('Loading from:', indexPath)
    console.log('__dirname:', __dirname)

    if (process.env.VITE_DEV_SERVER_URL) {
        mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
    } else {
        mainWindow.loadFile(indexPath)
    }

    // Force open DevTools after content loads
    mainWindow.webContents.on('did-finish-load', () => {
        mainWindow?.webContents.openDevTools({ mode: 'detach' })
    })

    mainWindow.on('closed', () => {
        mainWindow = null
    })
}

// App lifecycle
app.whenReady().then(async () => {
    // Initialize database
    await initializeDatabase()

    // Register all IPC handlers
    registerIPCHandlers()

    // Create window
    createWindow()

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow()
        }
    })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

// Handle app quit - trigger backup
app.on('before-quit', async (event) => {
    event.preventDefault()
    // Implement backup on close
    try {
        const { createBackup } = require('./util/backup')
        console.log('Creating backup before quit...')
        createBackup('auto_on_exit')
    } catch (error) {
        console.error('Failed to create backup on exit:', error)
    }
    app.exit(0)
})
