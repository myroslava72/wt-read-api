const path = require('path');
const YAML = require('yamljs');
const express = require('express');
const bodyParser = require('body-parser');
const swaggerUi = require('swagger-ui-express');
const morgan = require('morgan');
const cors = require('cors');
const slash = require('express-slash');
const wtJsLibsWrapper = require('./services/wt-js-libs');
const { config } = require('./config');
const {
  AIRLINE_SEGMENT_ID,
  HOTEL_SEGMENT_ID,
  ACCEPTED_SEGMENTS,
  VALIDATION_WARNING_HEADER,
} = require('./constants');
const { HttpError, HttpInternalError, Http404Error, HttpBadRequestError } = require('./errors');
const { version } = require('../package.json');
const { hotelsRouter } = require('./routes/hotels');
const { airlinesRouter } = require('./routes/airlines');

const app = express();
// No need to leak information and waste bandwith with this
// header.
app.disable('x-powered-by');
app.enable('strict routing');
 
// Swagger docs
const swaggerDocument = YAML.load(path.resolve(__dirname, '../docs/swagger.yaml'));
swaggerDocument.servers = [{ url: config.baseUrl }];
swaggerDocument.info.version = version;

// remove unused endpoint definitions
const segmentsToStart = process.env.WT_SEGMENTS.split(',');
for (let segment of ACCEPTED_SEGMENTS) {
  if (segmentsToStart.indexOf(segment) === -1) {
    for (let path in swaggerDocument.paths) {
      if (path.startsWith(`/${segment}`)) {
        delete swaggerDocument.paths[path];
      }
    }
  }
}
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Generic middlewares
app.use(cors({ exposedHeaders: [ VALIDATION_WARNING_HEADER ] }));
app.use(bodyParser.json());
app.use((err, req, res, next) => {
  // Catch and handle bodyParser errors.
  if (err.statusCode === 400 && err.type === 'entity.parse.failed') {
    return next(new HttpBadRequestError('badRequest', 'Invalid JSON.'));
  }
  next(err);
});

// Logging only when not in test mode
app.use(morgan(':remote-addr :remote-user [:date[clf]] :method :url HTTP/:http-version :status :res[content-length] - :response-time ms', {
  stream: {
    write: (msg) => config.logger.info(msg),
  },
}));

// Root handler
app.get('/', async (req, res) => {
  const trustClues = await wtJsLibsWrapper.getTrustClueClient().getMetadataForAllClues();
  const response = {
    docs: config.baseUrl + '/docs/',
    info: 'https://github.com/windingtree/wt-read-api/blob/master/README.md',
    version,
    config: process.env.WT_CONFIG,
    directoryAddresses: config.directoryAddresses,
    factoryAddresses: config.factoryAddresses,
    ethNetwork: config.ethNetwork,
    dataFormatVersions: config.dataFormatVersions,
  };
  if (config.checkTrustClues) {
    response.trustClues = trustClues;
  }
  res.status(200).json(response);
});

// Router
if (segmentsToStart.indexOf(HOTEL_SEGMENT_ID) !== -1) {
  app.use(hotelsRouter);
}
if (segmentsToStart.indexOf(AIRLINE_SEGMENT_ID) !== -1) {
  app.use(airlinesRouter);
}
app.use(slash());

// 404 handler
app.use('*', (req, res, next) => {
  next(new Http404Error());
});

// Error handler
app.use((err, req, res, next) => {
  if (!(err instanceof HttpError)) {
    config.logger.error(err.stack);
    err = new HttpInternalError();
  }

  res.status(err.status).json(err.toPlainObject());
});

module.exports = {
  app,
};
