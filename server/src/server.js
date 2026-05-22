import 'dotenv/config';
import http from 'http';

import { connectDb } from './config/db.js';
import { createApp } from './app.js';
import { initSockets } from './sockets/index.js';

const PORT = process.env.PORT || 5000;

async function start() {
  await connectDb();

  const app = createApp();
  const server = http.createServer(app);
  initSockets(server);

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use. Stop the other process or set PORT to a different value.`);
      process.exit(1);
    }
    console.error('HTTP server error', err);
    process.exit(1);
  });

  server.listen(PORT, () => {
    console.log(`API listening on http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server', err);
  process.exit(1);
});
