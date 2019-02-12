const wtJsLibs = require('@windingtree/wt-js-libs');
const { flattenObject } = require('../services/utils');
const { baseUrl } = require('../config').config;
const {
  HttpValidationError,
  Http404Error,
  HttpBadGatewayError,
} = require('../errors');
const {
  AIRLINE_FIELDS,
  AIRLINE_DESCRIPTION_FIELDS,
  DEFAULT_AIRLINES_FIELDS,
  DEFAULT_AIRLINE_FIELDS,
} = require('../constants');
const {
  mapAirlineObjectToResponse,
  mapAirlineFieldsFromQuery,
} = require('../services/property-mapping');
const {
  DEFAULT_PAGE_SIZE,
} = require('../constants');
const {
  paginate,
  LimitValidationError,
  MissingStartWithError,
} = require('../services/pagination');

const resolveAirlineObject = async (airline, offChainFields, onChainFields) => {
  let airlineData = {};
  try {
    if (offChainFields.length) {
      const plainAirline = await airline.toPlainObject(offChainFields);
      const flattenedOffChainData = flattenObject(plainAirline.dataUri.contents, offChainFields);
      airlineData = {
        ...flattenedOffChainData.descriptionUri,
        ...(flattenObject(plainAirline, offChainFields)),
      };
      // Some offChainFields need special treatment
      const fieldModifiers = {
        'notificationsUri': (data, source, key) => { data[key] = source[key]; return data; },
        'bookingUri': (data, source, key) => { data[key] = source[key]; return data; },
        'flightsUri': (data, source, key) => {
          data.flights = source[key];
          if (data.flights) {
            for (let f of data.flights.items) {
              if (f.flightInstancesUri && f.flightInstancesUri.ref && f.flightInstancesUri.contents) {
                f.flightInstances = f.flightInstancesUri.contents;
              } else {
                f.flightInstances = f.flightInstancesUri;
              }
              delete f.flightInstancesUri;
            }
          }
          return data;
        },
      };
      for (let fieldModifier in fieldModifiers) {
        if (flattenedOffChainData[fieldModifier] !== undefined) {
          airlineData = fieldModifiers[fieldModifier](airlineData, flattenedOffChainData, fieldModifier);
        }
      }
    }
    for (let i = 0; i < onChainFields.length; i += 1) {
      if (airline[onChainFields[i]]) {
        airlineData[onChainFields[i]] = await airline[onChainFields[i]];
      }
    }
    // Always append airline chain address as id property
    airlineData.id = airline.address;
  } catch (e) {
    let message = 'Cannot get airline data';
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
        id: airline.address,
      },
    };
  }
  return mapAirlineObjectToResponse(airlineData);
};

const calculateFields = (fieldsQuery) => {
  const fieldsArray = Array.isArray(fieldsQuery) ? fieldsQuery : fieldsQuery.split(',');
  const mappedFields = mapAirlineFieldsFromQuery(fieldsArray);
  return {
    mapped: mappedFields,
    onChain: mappedFields.map((f) => {
      if (AIRLINE_FIELDS.indexOf(f) > -1) {
        return f;
      }
      return null;
    }).filter((f) => !!f),
    toFlatten: mappedFields.map((f) => {
      let firstPart = f;
      if (f.indexOf('.') > -1) {
        firstPart = f.substring(0, f.indexOf('.'));
      }
      if (AIRLINE_DESCRIPTION_FIELDS.indexOf(firstPart) > -1) {
        return `descriptionUri.${f}`;
      }
      if ([
        'flightsUri',
        'notificationsUri',
        'bookingUri',
      ].indexOf(firstPart) > -1) {
        return f;
      }
      return null;
    }).filter((f) => !!f),
  };
};

const fillAirlineList = async (path, fields, airlines, limit, startWith) => {
  limit = limit ? parseInt(limit, 10) : DEFAULT_PAGE_SIZE;
  let { items, nextStart } = paginate(airlines, limit, startWith, 'address');
  let rawAirlines = [];
  for (let airline of items) {
    rawAirlines.push(resolveAirlineObject(airline, fields.toFlatten, fields.onChain));
  }
  const resolvedItems = await Promise.all(rawAirlines);
  let realItems = resolvedItems.filter((i) => !i.error);
  let realErrors = resolvedItems.filter((i) => i.error);
  let next = nextStart ? `${baseUrl}${path}?limit=${limit}&fields=${fields.mapped.join(',')}&startWith=${nextStart}` : undefined;

  if (realErrors.length && realItems.length < limit && nextStart) {
    const nestedResult = await fillAirlineList(path, fields, airlines, limit - realItems.length, nextStart);
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
  const fieldsQuery = req.query.fields || DEFAULT_AIRLINES_FIELDS;

  try {
    let airlines = await res.locals.wt.airlineIndex.getAllAirlines();
    const { items, errors, next } = await fillAirlineList(req.path, calculateFields(fieldsQuery), airlines, limit, startWith);
    res.status(200).json({ items, errors, next });
  } catch (e) {
    if (e instanceof LimitValidationError) {
      return next(new HttpValidationError('paginationLimitError', 'Limit must be a natural number greater than 0.'));
    }
    if (e instanceof MissingStartWithError) {
      return next(new Http404Error('paginationStartWithError', 'Cannot find startWith in airline collection.'));
    }
    next(e);
  }
};

const find = async (req, res, next) => {
  try {
    const fieldsQuery = req.query.fields || DEFAULT_AIRLINE_FIELDS;
    const fields = calculateFields(fieldsQuery);
    const resolvedAirline = await resolveAirlineObject(res.locals.wt.airline, fields.toFlatten, fields.onChain);
    if (resolvedAirline.error) {
      return next(new HttpBadGatewayError('airlineNotAccessible', resolvedAirline.error, 'Airline data is not accessible.'));
    }
    return res.status(200).json(resolvedAirline);
  } catch (e) {
    return next(new HttpBadGatewayError('airlineNotAccessible', e.message, 'Airline data is not accessible.'));
  }
};

const meta = async (req, res, next) => {
  try {
    const resolvedAirline = await res.locals.wt.airline.toPlainObject([]);
    return res.status(200).json({
      address: resolvedAirline.address,
      dataUri: resolvedAirline.dataUri.ref,
      descriptionUri: resolvedAirline.dataUri.contents.descriptionUri,
      flightsUri: resolvedAirline.dataUri.contents.flightsUri,
      dataFormatVersion: resolvedAirline.dataUri.contents.dataFormatVersion,
    });
  } catch (e) {
    return next(new HttpBadGatewayError('airlineNotAccessible', e.message, 'Airline data is not accessible.'));
  }
};

module.exports = {
  find,
  findAll,
  meta,
};
