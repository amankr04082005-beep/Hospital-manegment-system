require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

function listenWithPortFallback(startPort) {
  const server = app.listen(startPort, () => {
    console.log(
      `Hospital Management API listening on port ${startPort} [${process.env.NODE_ENV || 'development'}]`
    );
  });

  server.on('error', (err) => {
    if (err && err.code === 'EADDRINUSE') {
      console.warn(
        `Port ${startPort} is already in use (EADDRINUSE). Trying a free port automatically...`
      );
      // Close the server created by listen() attempt.
      server.close(() => {
        const fallbackServer = app.listen(0, () => {
          const addr = fallbackServer.address();
          const actualPort = addr && typeof addr === 'object' ? addr.port : startPort;
          console.log(
            `Hospital Management API listening on port ${actualPort} [fallback from EADDRINUSE]`
          );
        });
      });
    } else {
      console.error('Server failed to start:', err);
    }
  });
}

(async () => {
  await connectDB();
  listenWithPortFallback(PORT);
})();

