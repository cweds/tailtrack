#!/usr/bin/env node
// Local development script that bypasses vite.config.ts issues
import 'dotenv/config';
import { spawn } from 'child_process';

console.log('🚀 Starting local development server...');
console.log('📊 Database:', process.env.DATABASE_URL ? 'Connected' : 'Not configured');
console.log('🌐 Server will be available at: http://localhost:5000');

// Start the server directly without vite config complications
const server = spawn('node', ['--loader', 'tsx/esm', 'server/index.ts'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_ENV: 'development'
  }
});

server.on('close', (code) => {
  console.log(`Server exited with code ${code}`);
});

server.on('error', (err) => {
  console.error('Failed to start server:', err);
});