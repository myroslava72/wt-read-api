const winston = require('winston');
const YAML = require('yamljs');
const semver = require('semver');
const { WtJsLibs } = require('@windingtree/wt-js-libs');

const { ACCEPTED_SEGMENTS } = require('../constants');
const getPatchForgivingSchemaVersion = (packageName) => {
  let refDef = YAML.load(`node_modules/${packageName}/dist/swagger.yaml`);
  return `${semver.major(refDef.info.version)}.${semver.minor(refDef.info.version)}.x`;
};

const env = process.env.WT_CONFIG || 'dev';
let config = Object.assign({
  port: process.env.PORT || 3000,
  baseUrl: process.env.BASE_URL || 'http://localhost:3000',
  wtLibs: {},
  checkTrustClues: true,
  logger: winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    transports: [
      new winston.transports.Console({
        format: winston.format.simple(),
      }),
    ],
  }),
  dataFormatVersions: {
    airlines: getPatchForgivingSchemaVersion('@windingtree/wt-airline-schemas'),
    hotels: getPatchForgivingSchemaVersion('@windingtree/wt-hotel-schemas'),
  },
}, require(`./${env}`));

// setup js-libs instances
process.env.WT_SEGMENTS = process.env.WT_SEGMENTS ? process.env.WT_SEGMENTS : 'hotels,airlines';
for (let segment of process.env.WT_SEGMENTS.split(',')) {
  if (ACCEPTED_SEGMENTS.indexOf(segment) === -1) {
    throw new Error(`Unknown segment ${segment}.`);
  }
}
if (!config.wtLibsOptions.onChainDataOptions.provider) {
  throw new Error('ETH_NETWORK_PROVIDER not set');
}
config.wtLibs = WtJsLibs.createInstance({
  onChainDataOptions: { provider: config.wtLibsOptions.onChainDataOptions.provider },
  offChainDataOptions: config.wtLibsOptions.offChainDataOptions,
  trustClueOptions: config.wtLibsOptions.trustClueOptions,
});

module.exports = {
  config,
};
