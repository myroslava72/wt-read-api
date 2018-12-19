const WTLibs = require('@windingtree/wt-js-libs');
const wtJsLibs = require('../services/wt-js-libs');
const { HttpBadGatewayError, HttpPaymentRequiredError,
  HttpValidationError, HttpForbiddenError,
  HttpInternalError, Http404Error } = require('../errors');

const injectWtLibs = async (req, res, next) => {
  if (res.locals.wt) {
    next();
  }
  const wtLibsInstance = wtJsLibs.getInstance();
  res.locals.wt = {
    instance: wtLibsInstance,
    index: await wtJsLibs.getWTIndex(),
  };
  next();
};

const validateHotelAddress = (req, res, next) => {
  const { hotelAddress } = req.params;
  const { wt } = res.locals;

  if (wt.instance.dataModel.web3Utils.isZeroAddress(hotelAddress) || !wt.instance.dataModel.web3Utils.checkAddressChecksum(hotelAddress)) {
    return next(new HttpValidationError('hotelChecksum', 'Given hotel address is not a valid Ethereum address. Must be a valid checksum address.', 'Checksum failed for hotel address.'));
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
  if (err instanceof WTLibs.errors.WalletSigningError) {
    return next(new HttpForbiddenError());
  }
  if (err instanceof WTLibs.errors.InsufficientFundsError) {
    return next(new HttpPaymentRequiredError());
  }
  if (err instanceof WTLibs.errors.InaccessibleEthereumNodeError) {
    let msg = 'Ethereum node not reachable. Please try again later.';
    return next(new HttpBadGatewayError(msg));
  }
  next(err);
};

const handleDataFetchingErrors = (err, req, res, next) => {
  if (!err) {
    return next();
  }
  if (err instanceof WTLibs.errors.RemoteDataReadError) {
    return next(new HttpBadGatewayError('hotelNotAccessible', err.message, 'Cannot access on-chain data, maybe the deployed smart contract is broken'));
  }
  if (err instanceof WTLibs.errors.StoragePointerError) {
    return next(new HttpBadGatewayError('hotelNotAccessible', err.message, 'Cannot access off-chain data'));
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
    res.locals.wt.hotel = await res.locals.wt.index.getHotel(hotelAddress);
    return next();
  } catch (e) {
    return next(new Http404Error('hotelNotFound', 'Hotel not found'));
  }
};

module.exports = {
  injectWtLibs,
  validateHotelAddress,
  handleOnChainErrors,
  handleDataFetchingErrors,
  resolveHotel,
};
