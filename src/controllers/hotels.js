const wtJsLibs = require('@windingtree/wt-js-libs');
const { baseUrl } = require('../config');
const {
  HttpValidationError,
  Http404Error,
  HttpBadGatewayError,
} = require('../errors');
const {
  HOTEL_FIELDS,
  DESCRIPTION_FIELDS,
  DEFAULT_HOTELS_FIELDS,
  DEFAULT_HOTEL_FIELDS,
} = require('../constants');
const {
  mapHotelObjectToResponse,
  mapHotelFieldsFromQuery,
} = require('../services/property-mapping');
const {
  DEFAULT_PAGE_SIZE,
} = require('../constants');
const {
  paginate,
  LimitValidationError,
  MissingStartWithError,
} = require('../services/pagination');

// Helpers
const flattenObject = (contents, fields) => {
  let currentFieldDef = {},
    currentLevelName,
    result = {};
  for (let field of fields) {
    let remainingPath;
    if (field.indexOf('.') === -1) {
      currentLevelName = field;
    } else {
      currentLevelName = field.substring(0, field.indexOf('.'));
      remainingPath = field.substring(field.indexOf('.') + 1);
    }
    if (remainingPath) {
      if (!currentFieldDef[currentLevelName]) {
        currentFieldDef[currentLevelName] = [];
      }
      currentFieldDef[currentLevelName].push(remainingPath);
    } else {
      currentFieldDef[currentLevelName] = undefined;
    }
  }

  for (let field in currentFieldDef) {
    if (contents[field] !== undefined) {
      // No specific children selected
      if (!currentFieldDef[field]) {
        // Differentiate between storage pointers and plain objects
        result[field] = contents[field].contents ? contents[field].contents : contents[field];
      // Specific children selected
      } else {
        let searchSpace;
        if (contents[field].ref && contents[field].contents) { // StoragePointer
          searchSpace = contents[field].contents;
        } else { // POJO
          searchSpace = contents[field];
        }
        result[field] = flattenObject(searchSpace, currentFieldDef[field]);
      }
    } else if (contents && typeof contents === 'object') { // Mapping object such as roomTypes
      for (let key in contents) {
        if (contents[key][field] !== undefined) {
          if (!result[key]) {
            result[key] = {};
          }
          result[key][field] = contents[key][field];
        }
      }
    }
  }

  return result;
};

const resolveHotelObject = async (hotel, offChainFields, onChainFields) => {
  let hotelData = {};
  try {
    if (offChainFields.length) {
      const plainHotel = await hotel.toPlainObject(offChainFields);
      const flattenedOffChainData = flattenObject(plainHotel.dataUri.contents, offChainFields);
      hotelData = {
        ...flattenedOffChainData.descriptionUri,
        ...(flattenObject(plainHotel, offChainFields)),
      };
      // Some offChainFields need special treatment
      const fieldModifiers = {
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
    if (e instanceof wtJsLibs.errors.RemoteDataReadError) {
      message = 'Cannot access on-chain data, maybe the deployed smart contract is broken';
    }
    if (e instanceof wtJsLibs.errors.StoragePointerError) {
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

const calculateFields = (fieldsQuery) => {
  const fieldsArray = Array.isArray(fieldsQuery) ? fieldsQuery : fieldsQuery.split(',');
  const mappedFields = mapHotelFieldsFromQuery(fieldsArray);
  return {
    mapped: mappedFields,
    onChain: mappedFields.map((f) => {
      if (HOTEL_FIELDS.indexOf(f) > -1) {
        return f;
      }
      return null;
    }).filter((f) => !!f),
    toFlatten: mappedFields.map((f) => {
      let firstPart = f;
      if (f.indexOf('.') > -1) {
        firstPart = f.substring(0, f.indexOf('.'));
      }
      if (DESCRIPTION_FIELDS.indexOf(firstPart) > -1) {
        return `descriptionUri.${f}`;
      }
      if ([
        'ratePlansUri',
        'availabilityUri',
        'notificationsUri',
        'bookingUri',
      ].indexOf(firstPart) > -1) {
        return f;
      }
      return null;
    }).filter((f) => !!f),
  };
};

const fillHotelList = async (path, fields, hotels, limit, startWith) => {
  limit = limit ? parseInt(limit, 10) : DEFAULT_PAGE_SIZE;
  let { items, nextStart } = paginate(hotels, limit, startWith, 'address');
  let rawHotels = [];
  for (let hotel of items) {
    rawHotels.push(resolveHotelObject(hotel, fields.toFlatten, fields.onChain));
  }
  const resolvedItems = await Promise.all(rawHotels);
  let realItems = resolvedItems.filter((i) => !i.error);
  let realErrors = resolvedItems.filter((i) => i.error);
  let next = nextStart ? `${baseUrl}${path}?limit=${limit}&fields=${fields.mapped.join(',')}&startWith=${nextStart}` : undefined;

  if (realErrors.length && realItems.length < limit && nextStart) {
    const nestedResult = await fillHotelList(path, fields, hotels, limit - realItems.length, nextStart);
    realItems = realItems.concat(nestedResult.items);
    realErrors = realErrors.concat(nestedResult.errors);
    if (realItems.length && nestedResult.nextStart) {
      next = `${baseUrl}${path}?limit=${limit}&fields=${fields.mapped.join(',')}&startWith=${nestedResult.nextStart}`;
    } else {
      next = undefined;
    }
  }
  return {
    items: realItems,
    errors: realErrors,
    next,
    nextStart,
  };
};

// Actual controllers

const findAll = async (req, res, next) => {
  const { limit, startWith } = req.query;
  const fieldsQuery = req.query.fields || DEFAULT_HOTELS_FIELDS;

  try {
    let hotels = await res.locals.wt.index.getAllHotels();
    const { items, errors, next } = await fillHotelList(req.path, calculateFields(fieldsQuery), hotels, limit, startWith);
    res.status(200).json({ items, errors, next });
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
    const fieldsQuery = req.query.fields || DEFAULT_HOTEL_FIELDS;
    const fields = calculateFields(fieldsQuery);
    const resolvedHotel = await resolveHotelObject(res.locals.wt.hotel, fields.toFlatten, fields.onChain);
    if (resolvedHotel.error) {
      return next(new HttpBadGatewayError('hotelNotAccessible', resolvedHotel.error, 'Hotel data is not accessible.'));
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
