import http from 'http';
import dotenv from 'dotenv';
import app from './app.js';
import { initSocket } from './socket/index.js';

dotenv.config();

const port = process.env.PORT || 4000;
const server = http.createServer(app);

// Initialize modular Socket.io system
const io = initSocket(server);

// Attach io to app for use in controllers (req.app.get('io'))
app.set('io', io);

// Start Server
server.listen(port);

export { io };
