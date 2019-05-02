const _ = require('lodash');
const { errors: wtJsLibsErrors } = require('@windingtree/wt-js-libs');
const { flattenObject, formatError } = require('../services/utils');
const { config } = require('../config');
const { DataFormatValidator } = require('../services/validation');
const {
  HttpValidationError,
  Http404Error,
  HttpBadGatewayError,
} = require('../errors');
const {
  calculateHotelsFields,
  calculateHotelFields,
} = require('../services/fields');
const {
  DEFAULT_PAGE_SIZE,
  SCHEMA_PATH,
  HOTEL_SCHEMA_MODEL,
  VALIDATION_WARNING_HEADER,
} = require('../constants');
const {
  mapHotelObjectToResponse,
  REVERSED_HOTEL_FIELD_MAPPING,
} = require('../services/property-mapping');
const {
  paginate,
  LimitValidationError,
  MissingStartWithError,
} = require('../services/pagination');

const resolveHotelObject = async (hotel, offChainFields, onChainFields) => {
  let hotelData = {};
  try {
    if (offChainFields.length) {
      const plainHotel = await hotel.toPlainObject(offChainFields);
      const flattenedOffChainData = flattenObject(plainHotel.dataUri.contents, offChainFields);
      hotelData = {
        dataFormatVersion: plainHotel.dataUri.contents.dataFormatVersion,
        ...flattenedOffChainData.descriptionUri,
        ...(flattenObject(plainHotel, offChainFields)),
      };
      // Some offChainFields need special treatment
      const fieldModifiers = {
        'defaultLocale': (data, source, key) => { data[key] = source[key]; return data; },
        'notificationsUri': (data, source, key) => { data[key] = source[key]; return data; },
        'bookingUri': (data, source, key) => { data[key] = source[key]; return data; },
        'ratePlansUri': (data, source, key) => { data.ratePlans = source[key]; return data; },
        'availabilityUri': (data, source, key) => { data.availability = source[key]; return data; },
      };
      for (let fieldModifier in fieldModifiers) {
        if (flattenedOffChainData[fieldModifier] !== undefined) {
          hotelData = fieldModifiers[fieldModifier](hotelData, flattenedOffChainData, fieldModifier);
        }
      }
    }
    for (let i = 0; i < onChainFields.length; i += 1) {
      if (hotel[onChainFields[i]]) {
        hotelData[onChainFields[i]] = await hotel[onChainFields[i]];
      }
    }
    // Always append hotel chain address as id property
    hotelData.id = hotel.address;
  } catch (e) {
    let message = 'Cannot get hotel data';
    if (e instanceof wtJsLibsErrors.RemoteDataReadError) {
      message = 'Cannot access on-chain data, maybe the deployed smart contract is broken';
    }
    if (e instanceof wtJsLibsErrors.StoragePointerError) {
      message = 'Cannot access off-chain data';
    }
    return {
      error: message,
      originalError: e.message,
      data: {
        id: hotel.address,
      },
    };
  }
  return mapHotelObjectToResponse(hotelData);
};

const fillHotelList = async (path, fields, hotels, limit, startWith) => {
  limit = limit ? parseInt(limit, 10) : DEFAULT_PAGE_SIZE;
  let { items, nextStart } = paginate(hotels, limit, startWith, 'address');
  let realItems = [], warningItems = [], realErrors = [];
  const swaggerDocument = await DataFormatValidator.loadSchemaFromPath(SCHEMA_PATH, HOTEL_SCHEMA_MODEL, fields.mapped, REVERSED_HOTEL_FIELD_MAPPING);
  const promises = [];
  for (let hotel of items) {
    promises.push((() => {
      let resolvedHotelObject;
      return resolveHotelObject(hotel, fields.toFlatten, fields.onChain)
        .then((resolved) => {
          resolvedHotelObject = resolved;
          DataFormatValidator.validate(
            resolvedHotelObject,
            HOTEL_SCHEMA_MODEL,
            swaggerDocument.components.schemas,
            config.dataFormatVersions.hotels,
            undefined,
            'hotel',
            fields.mapped
          );
          realItems.push(_.omit(resolvedHotelObject, fields.toDrop));
        }).catch((e) => {
          if (e instanceof HttpValidationError) {
            hotel = {
              error: 'Upstream hotel data format validation failed: ' + e.toString(),
              originalError: e.data.errors.map((err) => { return err.toString(); }).join(';'),
              data: resolvedHotelObject,
            };
            if (e.data && e.data.valid) {
              warningItems.push(hotel);
            } else {
              hotel.data = e.data && e.data.data;
              realErrors.push(hotel);
            }
          } else {
            throw e;
          }
        });
    })());
  }
  await Promise.all(promises);
  const clientFields = _.xor(fields.mapped, fields.toDrop).join(',');
  let next = nextStart ? `${config.baseUrl}${path}?limit=${limit}&fields=${clientFields}&startWith=${nextStart}` : undefined;

  if (realErrors.length && realItems.length < limit && nextStart) {
    const nestedResult = await fillHotelList(path, fields, hotels, limit - realItems.length, nextStart);
    realItems = realItems.concat(nestedResult.items);
    warningItems = warningItems.concat(nestedResult.warnings);
    realErrors = realErrors.concat(nestedResult.errors);
    if (realItems.length && nestedResult.nextStart) {
      next = `${config.baseUrl}${path}?limit=${limit}&fields=${clientFields}&startWith=${nestedResult.nextStart}`;
    } else {
      next = undefined;
    }
  }
  return {
    items: realItems,
    warnings: warningItems,
    errors: realErrors,
    next,
    nextStart,
  };
};

// Actual controllers
const findAll = async (req, res, next) => {
  const { limit, startWith, fields } = req.query;
  try {
    let hotels = await res.locals.wt.hotelIndex.getAllHotels();
    const { items, warnings, errors, next } = await fillHotelList(req.path, calculateHotelsFields(fields), hotels, limit, startWith);
    res.status(200).json({ items, warnings, errors, next });
  } catch (e) {
    if (e instanceof LimitValidationError) {
      return next(new HttpValidationError('paginationLimitError', 'Limit must be a natural number greater than 0.'));
    }
    if (e instanceof MissingStartWithError) {
      return next(new Http404Error('paginationStartWithError', 'Cannot find startWith in hotel collection.'));
    }
    next(e);
  }
};

const find = async (req, res, next) => {
  try {
    const fields = calculateHotelFields(req.query.fields);
    const swaggerDocument = await DataFormatValidator.loadSchemaFromPath(SCHEMA_PATH, HOTEL_SCHEMA_MODEL, fields.mapped, REVERSED_HOTEL_FIELD_MAPPING);
    let resolvedHotel;
    try {
      resolvedHotel = await resolveHotelObject(res.locals.wt.hotel, fields.toFlatten, fields.onChain);
      if (resolvedHotel.error) {
        return next(new HttpBadGatewayError('hotelNotAccessible', resolvedHotel.error, 'Hotel data is not accessible.'));
      }
      DataFormatValidator.validate(
        resolvedHotel,
        HOTEL_SCHEMA_MODEL,
        swaggerDocument.components.schemas,
        config.dataFormatVersions.hotels,
        undefined,
        'hotel',
        fields.mapped
      );
      resolvedHotel = _.omit(resolvedHotel, fields.toDrop);
    } catch (e) {
      if (e instanceof HttpValidationError) {
        let err = formatError(e);
        err.data = resolvedHotel;
        if (e.data && e.data.valid) {
          return res.set(VALIDATION_WARNING_HEADER, e.data.errors).status(200).json(err.toPlainObject());
        } else {
          return res.status(err.status).json(err.toPlainObject());
        }
      } else {
        next(e);
      }
    }
    return res.status(200).json(resolvedHotel);
  } catch (e) {
    return next(new HttpBadGatewayError('hotelNotAccessible', e.message, 'Hotel data is not accessible.'));
  }
};

const meta = async (req, res, next) => {
  try {
    const resolvedHotel = await res.locals.wt.hotel.toPlainObject([]);
    return res.status(200).json({
      address: resolvedHotel.address,
      dataUri: resolvedHotel.dataUri.ref,
      descriptionUri: resolvedHotel.dataUri.contents.descriptionUri,
      ratePlansUri: resolvedHotel.dataUri.contents.ratePlansUri,
      availabilityUri: resolvedHotel.dataUri.contents.availabilityUri,
      dataFormatVersion: resolvedHotel.dataUri.contents.dataFormatVersion,
      defaultLocale: resolvedHotel.dataUri.contents.defaultLocale,
    });
  } catch (e) {
    return next(new HttpBadGatewayError('hotelNotAccessible', e.message, 'Hotel data is not accessible.'));
  }
};

module.exports = {
  find,
  findAll,
  meta,
};
