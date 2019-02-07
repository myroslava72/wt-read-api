const winston = require('winston');
const assert = require('assert');
const WtJsLibs = require('@windingtree/wt-js-libs');

const { AIRLINE_SEGMENT_ID, HOTEL_SEGMENT_ID } = require('../constants');

const env = process.env.WT_CONFIG || 'dev';

let config;

const init = () => {
  config = Object.assign({
    port: process.env.PORT || 3000,
    baseUrl: process.env.BASE_URL || 'http://localhost:3000',
    logger: winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      transports: [
        new winston.transports.Console({
          format: winston.format.simple(),
        }),
      ],
    }),
  }, require(`./${env}`));
};

const initSegment = () => {
  const segment = process.env.WT_SEGMENT || 'hotels';
  assert([HOTEL_SEGMENT_ID, AIRLINE_SEGMENT_ID].indexOf(segment) !== -1);
  init();
  config.segment = segment;
  config.wtLibs = WtJsLibs.createInstance({
    segment: config.segment,
    dataModelOptions: { provider: config.wtLibs.options.dataModelOptions.provider },
    offChainDataOptions: config.wtLibs.options.offChainDataOptions,
    networkSetup: config.wtLibs.options.networkSetup,
  });
  return config;
};
initSegment();

module.exports = {
  config,
  initSegment,
};
