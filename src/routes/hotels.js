const express = require('express');
const {
  injectWtLibs,
  validateHotelAddress,
  resolveHotel,
  handleOnChainErrors,
  handleDataFetchingErrors,
} = require('../middlewares');
const hotelsController = require('../controllers/hotels');
const roomTypesController = require('../controllers/room-types');
const ratePlansController = require('../controllers/rate-plans');
const availabilityController = require('../controllers/availability');

const hotelsRouter = express.Router({
  strict: true,
});

hotelsRouter.get('/hotels', injectWtLibs, hotelsController.findAll, handleOnChainErrors);
hotelsRouter.get('/hotels/:hotelAddress', injectWtLibs, validateHotelAddress, resolveHotel, hotelsController.find, handleOnChainErrors);
hotelsRouter.get('/hotels/:hotelAddress/meta', injectWtLibs, validateHotelAddress, resolveHotel, hotelsController.meta, handleOnChainErrors);

hotelsRouter.get('/hotels/:hotelAddress/availability', injectWtLibs, validateHotelAddress, resolveHotel, availabilityController.findAll, handleOnChainErrors, handleDataFetchingErrors);

hotelsRouter.get('/hotels/:hotelAddress/roomTypes', injectWtLibs, validateHotelAddress, resolveHotel, roomTypesController.findAll, handleOnChainErrors, handleDataFetchingErrors);
hotelsRouter.get('/hotels/:hotelAddress/roomTypes/:roomTypeId', injectWtLibs, validateHotelAddress, resolveHotel, roomTypesController.find, handleOnChainErrors, handleDataFetchingErrors);
hotelsRouter.get('/hotels/:hotelAddress/roomTypes/:roomTypeId/ratePlans', injectWtLibs, validateHotelAddress, resolveHotel, roomTypesController.findRatePlans, handleOnChainErrors, handleDataFetchingErrors);
hotelsRouter.get('/hotels/:hotelAddress/roomTypes/:roomTypeId/availability', injectWtLibs, validateHotelAddress, resolveHotel, roomTypesController.findAvailability, handleOnChainErrors, handleDataFetchingErrors);

hotelsRouter.get('/hotels/:hotelAddress/ratePlans', injectWtLibs, validateHotelAddress, resolveHotel, ratePlansController.findAll, handleOnChainErrors, handleDataFetchingErrors);
hotelsRouter.get('/hotels/:hotelAddress/ratePlans/:ratePlanId', injectWtLibs, validateHotelAddress, resolveHotel, ratePlansController.find, handleOnChainErrors, handleDataFetchingErrors);

module.exports = {
  hotelsRouter,
};
