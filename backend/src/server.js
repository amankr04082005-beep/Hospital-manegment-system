require('dotenv').config();
const http = require('http');
const app = require('./app');
const connectDB = require('./config/db');
const { initSocket } = require('./services/socket.service');
const logger = require('./services/logger.service');

const PORT = process.env.PORT || 5000;

function listenWithPortFallback(startPort) {
  const httpServer = http.createServer(app);

  // Initialize Socket.io for real-time updates
  initSocket(httpServer);

  httpServer.listen(startPort, () => {
    logger.info(
      `Hospital Management API listening on port ${startPort} [${process.env.NODE_ENV || 'development'}]`
    );
  });

  httpServer.on('error', (err) => {
    if (err && err.code === 'EADDRINUSE') {
      logger.warn(`Port ${startPort} is already in use. Trying a free port automatically...`);
      httpServer.close(() => {
        const fallbackServer = http.createServer(app);
        initSocket(fallbackServer);
        fallbackServer.listen(0, () => {
          const addr = fallbackServer.address();
          const actualPort = addr && typeof addr === 'object' ? addr.port : startPort;
          logger.info(`Hospital Management API listening on port ${actualPort} [fallback from EADDRINUSE]`);
        });
      });
    } else {
      logger.error('Server failed to start:', err);
    }
  });
}

(async () => {
  await connectDB();
  listenWithPortFallback(PORT);
})();

