// Preload script for Electron
// This runs in the renderer process before the page loads
// with access to both DOM APIs and Node.js APIs

// Since we're using nodeIntegration: true and contextIsolation: false,
// we don't need to use contextBridge here. The renderer has full Node.js access.

// This file exists primarily for future migration to a more secure setup
// with contextIsolation: true, where we would expose specific APIs via contextBridge.

console.log('Preload script loaded');
