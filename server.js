import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { initSocket } from './lib/socket.js';
import './scripts/cronJobs.js'; // Start cron jobs

const dev = process.env.NODE_ENV !== 'production';
// Use '0.0.0.0' to accept connections from any network interface
// This allows connections from other devices on the same network
const hostname = process.env.HOSTNAME || (dev ? '0.0.0.0' : 'localhost');
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // Initialize Socket.io
  initSocket(httpServer);

  httpServer.listen(port, hostname, (err) => {
    if (err) throw err;
    if (hostname === '0.0.0.0') {
      console.log(`> Ready on http://localhost:${port}`);
      console.log(`> Network access: http://[your-ip]:${port}`);
    } else {
      console.log(`> Ready on http://${hostname}:${port}`);
    }
  });
});
