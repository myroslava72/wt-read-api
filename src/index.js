const { app } = require('./app');
const { config } = require('./config');

const server = app.listen(config.port, () => {
  config.logger.info(`WT Read API at ${config.port}...`);
  if (config.networkSetup) {
    config.networkSetup(config);
  }
});

module.exports = server;
