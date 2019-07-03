const Web3Utils = require('web3-utils');
const { errors: wtJsLibsErrors } = require('@windingtree/wt-js-libs');
const wtJsLibs = require('../services/wt-js-libs');
const { AIRLINE_SEGMENT_ID, HOTEL_SEGMENT_ID } = require('../constants');
const { HttpBadGatewayError, HttpPaymentRequiredError,
  HttpValidationError, HttpForbiddenError,
  HttpInternalError, Http404Error } = require('../errors');

const isZeroAddress = (address) => {
  if (!address || !Web3Utils.isAddress(address)) {
    return true;
  }
  return String(address) === '0x0000000000000000000000000000000000000000';
};

const injectWtLibs = async (req, res, next) => {
  if (res.locals.wt) {
    next();
  }
  let usedSegments = process.env.WT_SEGMENTS.split(',');
  let wt = {};
  if (usedSegments.indexOf(HOTEL_SEGMENT_ID) !== -1) {
    wt.hotelDirectory = await wtJsLibs.getHotelDirectory();
  }
  if (usedSegments.indexOf(AIRLINE_SEGMENT_ID) !== -1) {
    wt.airlineDirectory = await wtJsLibs.getAirlineDirectory();
  }
  res.locals.wt = wt;
  next();
};

const validateHotelAddress = (req, res, next) => {
  const { hotelAddress } = req.params;

  if (isZeroAddress(hotelAddress) || !Web3Utils.checkAddressChecksum(hotelAddress)) {
    return next(new HttpValidationError('hotelChecksum', 'Given hotel address is not a valid Ethereum address. Must be a valid checksum address.', 'Checksum failed for hotel address.'));
  }
  next();
};

const validateAirlineAddress = (req, res, next) => {
  const { airlineAddress } = req.params;
  if (isZeroAddress(airlineAddress) || !Web3Utils.checkAddressChecksum(airlineAddress)) {
    return next(new HttpValidationError('airlineChecksum', 'Given airline address is not a valid Ethereum address. Must be a valid checksum address.', 'Checksum failed for airline address.'));
  }
  next();
};

/**
 * Replace well-defined on-chain errors with the corresponding
 * HTTP errors.
 */
const handleOnChainErrors = (err, req, res, next) => {
  if (!err) {
    return next();
  }
  if (err instanceof wtJsLibsErrors.WalletSigningError) {
    return next(new HttpForbiddenError());
  }
  if (err instanceof wtJsLibsErrors.InsufficientFundsError) {
    return next(new HttpPaymentRequiredError());
  }
  if (err instanceof wtJsLibsErrors.InaccessibleEthereumNodeError) {
    let msg = 'Ethereum node not reachable. Please try again later.';
    return next(new HttpBadGatewayError(msg));
  }
  next(err);
};

const handleDataFetchingErrors = (err, req, res, next) => {
  if (!err) {
    return next();
  }
  if (err instanceof wtJsLibsErrors.RemoteDataReadError) {
    return next(new HttpBadGatewayError('dataNotAccessible', err.message, 'Cannot access on-chain data, maybe the deployed smart contract is broken'));
  }
  if (err instanceof wtJsLibsErrors.StoragePointerError) {
    return next(new HttpBadGatewayError('dataNotAccessible', err.message, 'Cannot access off-chain data'));
  }
  
  next(err);
};

/**
 * Resolves a hotel from req.params.hotelAddress
 */
const resolveHotel = async (req, res, next) => {
  if (!res.locals.wt) {
    return next(new HttpInternalError('Bad middleware order.'));
  }
  let { hotelAddress } = req.params;
  try {
    res.locals.wt.hotel = await res.locals.wt.hotelDirectory.getOrganization(hotelAddress);
    return next();
  } catch (e) {
    return next(new Http404Error('hotelNotFound', 'Hotel not found'));
  }
};

/**
 * Resolves an airline from req.params.airlineAddress
 */
const resolveAirline = async (req, res, next) => {
  if (!res.locals.wt) {
    return next(new HttpInternalError('Bad middleware order.'));
  }
  let { airlineAddress } = req.params;
  try {
    res.locals.wt.airline = await res.locals.wt.airlineDirectory.getOrganization(airlineAddress);
    return next();
  } catch (e) {
    return next(new Http404Error('airlineNotFound', 'Airline not found'));
  }
};

module.exports = {
  injectWtLibs,
  validateHotelAddress,
  validateAirlineAddress,
  handleOnChainErrors,
  handleDataFetchingErrors,
  resolveHotel,
  resolveAirline,
};
