const { createServer } = require('http');
const app = require('./app');
const { env } = require('./config/env');
const { initSocket } = require('./sockets/index');
const { startAutoCancelJob } = require('./jobs/autoCancelPending');

const httpServer = createServer(app);
initSocket(httpServer);
startAutoCancelJob();

httpServer.listen(env.PORT, () => {
  console.log(`GOR API running on port ${env.PORT}`);
});

module.exports = { app, server: httpServer };
