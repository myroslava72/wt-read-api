const express = require('express');
const {
  injectWtLibs,
  validateAirlineAddress,
  resolveAirline,
  handleOnChainErrors,
  handleDataFetchingErrors,
} = require('../middlewares');
const airlinesController = require('../controllers/airlines');
const flightsController = require('../controllers/flights');
const flightInstancesController = require('../controllers/flight-instances');

const airlinesRouter = express.Router({
  strict: true,
});

airlinesRouter.get('/airlines', injectWtLibs, airlinesController.findAll, handleOnChainErrors);
airlinesRouter.get('/airlines/:airlineAddress', injectWtLibs, validateAirlineAddress, resolveAirline, airlinesController.find, handleOnChainErrors);
airlinesRouter.get('/airlines/:airlineAddress/meta', injectWtLibs, validateAirlineAddress, resolveAirline, airlinesController.meta, handleOnChainErrors);

airlinesRouter.get('/airlines/:airlineAddress/flights', injectWtLibs, validateAirlineAddress, resolveAirline, flightsController.findAll, handleOnChainErrors);
airlinesRouter.get('/airlines/:airlineAddress/flights/:flightId', injectWtLibs, validateAirlineAddress, resolveAirline, flightsController.find, handleOnChainErrors, handleDataFetchingErrors);
airlinesRouter.get('/airlines/:airlineAddress/flights/:flightId/meta', injectWtLibs, validateAirlineAddress, resolveAirline, flightsController.meta, handleOnChainErrors, handleDataFetchingErrors);

airlinesRouter.get('/airlines/:airlineAddress/flights/:flightId/instances', injectWtLibs, validateAirlineAddress, resolveAirline, flightInstancesController.findAll, handleOnChainErrors, handleDataFetchingErrors);
airlinesRouter.get('/airlines/:airlineAddress/flights/:flightId/instances/:flightInstanceId', injectWtLibs, validateAirlineAddress, resolveAirline, flightInstancesController.find, handleOnChainErrors, handleDataFetchingErrors);

module.exports = {
  airlinesRouter,
};
