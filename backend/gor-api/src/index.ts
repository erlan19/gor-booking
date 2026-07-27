import { createServer } from 'http';
import app from './app.js';
import { env } from './config/env.js';
import { initSocket } from './sockets/index.js';
import { startAutoCancelJob } from './jobs/autoCancelPending.js';

const httpServer = createServer(app);
initSocket(httpServer);
startAutoCancelJob();

httpServer.listen(env.PORT, () => {
  console.log(`GOR API running on port ${env.PORT}`);
});

export { app, httpServer as server };
