const winston = require('winston');
const { WtJsLibs } = require('@windingtree/wt-js-libs');

const { ACCEPTED_SEGMENTS } = require('../constants');

const env = process.env.WT_CONFIG || 'dev';

let config = Object.assign({
  port: process.env.PORT || 3000,
  baseUrl: process.env.BASE_URL || 'http://localhost:3000',
  wtLibs: {},
  logger: winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    transports: [
      new winston.transports.Console({
        format: winston.format.simple(),
      }),
    ],
  }),
}, require(`./${env}`));

// setup js-libs instances
process.env.WT_SEGMENTS = process.env.WT_SEGMENTS ? process.env.WT_SEGMENTS : 'hotels,airlines';
for (let segment of process.env.WT_SEGMENTS.split(',')) {
  if (ACCEPTED_SEGMENTS.indexOf(segment) === -1) {
    throw new Error(`Unknown segment ${segment}.`);
  }
  if (!config.wtLibsOptions.dataModelOptions.provider) {
    throw new Error('ETH_NETWORK_PROVIDER not set');
  }
  config.wtLibs[segment] = WtJsLibs.createInstance({
    segment: segment,
    dataModelOptions: { provider: config.wtLibsOptions.dataModelOptions.provider },
    offChainDataOptions: config.wtLibsOptions.offChainDataOptions,
    networkSetup: config.wtLibsOptions.networkSetup,
  });
}

module.exports = {
  config,
};
