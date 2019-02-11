const express = require('express');
const {
  injectWtLibs,
  validateAirlineAddress,
  resolveAirline,
  handleOnChainErrors,
  handleDataFetchingErrors,
} = require('../middlewares');
const airlinesController = require('../controllers/airlines');
const flightInstancesController = require('../controllers/flight-instances');

const airlinesRouter = express.Router();

airlinesRouter.get('/airlines', injectWtLibs, airlinesController.findAll, handleOnChainErrors);
airlinesRouter.get('/airlines/:airlineAddress', injectWtLibs, validateAirlineAddress, resolveAirline, airlinesController.find, handleOnChainErrors);
airlinesRouter.get('/airlines/:airlineAddress/meta', injectWtLibs, validateAirlineAddress, resolveAirline, airlinesController.meta, handleOnChainErrors);

airlinesRouter.get('/airlines/:airlineAddress/flightinstances/:flightInstanceId', injectWtLibs, validateAirlineAddress, resolveAirline, flightInstancesController.find, handleOnChainErrors, handleDataFetchingErrors);

module.exports = {
  airlinesRouter,
};
