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
  calculateAirlineFields,
  calculateAirlinesFields,
} = require('../services/fields');
const {
  DEFAULT_PAGE_SIZE,
  SCHEMA_PATH,
  AIRLINE_SCHEMA_MODEL,
  VALIDATION_WARNING_HEADER,
} = require('../constants');
const {
  mapAirlineObjectToResponse,
  REVERSED_AIRLINE_FIELD_MAPPING,
} = require('../services/property-mapping');
const {
  paginate,
  LimitValidationError,
  MissingStartWithError,
} = require('../services/pagination');

const resolveAirlineObject = async (airline, offChainFields, onChainFields) => {
  let airlineData = {};
  try {
    if (offChainFields.length) {
      const loadInstances = offChainFields.indexOf('flightsUri.items.flightInstancesUri') > -1;
      const depth = loadInstances ? undefined : 3;

      const airlineApis = await airline.getWindingTreeApi();
      const apiContents = (await airlineApis.airline[0].toPlainObject(offChainFields, depth)).contents;

      if (!loadInstances && apiContents.flightsUri && apiContents.flightsUri.contents) {
        for (let flight of apiContents.flightsUri.contents.items) {
          delete flight.flightInstancesUri;
        }
      }

      const flattenedOffChainData = flattenObject(apiContents, offChainFields);
      airlineData = {
        dataFormatVersion: apiContents.dataFormatVersion,
        ...flattenedOffChainData.descriptionUri,
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
        id: airline.address,
      },
    };
  }
  return mapAirlineObjectToResponse(airlineData);
};

const fillAirlineList = async (path, fields, airlines, limit, startWith) => {
  limit = limit ? parseInt(limit, 10) : DEFAULT_PAGE_SIZE;
  let { items, nextStart } = paginate(airlines, limit, startWith, 'address');
  let realItems = [], warningItems = [], realErrors = [];
  const swaggerDocument = await DataFormatValidator.loadSchemaFromPath(SCHEMA_PATH, AIRLINE_SCHEMA_MODEL, fields.mapped, REVERSED_AIRLINE_FIELD_MAPPING);
  const promises = [];
  for (let airline of items) {
    promises.push((() => {
      let resolvedAirlineObject;
      return resolveAirlineObject(airline, fields.toFlatten, fields.onChain)
        .then((resolved) => {
          resolvedAirlineObject = resolved;
          DataFormatValidator.validate(
            resolvedAirlineObject,
            AIRLINE_SCHEMA_MODEL,
            swaggerDocument.components.schemas,
            config.dataFormatVersions.airlines,
            undefined,
            'airline',
            fields.mapped,
          );
          realItems.push(_.omit(resolvedAirlineObject, fields.toDrop));
        })
        .catch((e) => {
          if (e instanceof HttpValidationError) {
            airline = {
              error: 'Upstream airline data format validation failed: ' + e.toString(),
              originalError: e.data.errors.map((err) => { return err.toString(); }).join(';'),
              data: resolvedAirlineObject,
            };
            if (e.data && e.data.valid) {
              warningItems.push(airline);
            } else {
              airline.data = e.data && e.data.data;
              realErrors.push(airline);
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
    const nestedResult = await fillAirlineList(path, fields, airlines, limit - realItems.length, nextStart);
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
    let airlines = await res.locals.wt.airlineDirectory.getOrganizations();
    const { items, warnings, errors, next } = await fillAirlineList(req.path, calculateAirlinesFields(fields), airlines, limit, startWith);
    res.status(200).json({ items, warnings, errors, next });
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
    const fields = calculateAirlineFields(req.query.fields);
    const swaggerDocument = await DataFormatValidator.loadSchemaFromPath(SCHEMA_PATH, AIRLINE_SCHEMA_MODEL, fields.mapped, REVERSED_AIRLINE_FIELD_MAPPING);
    let resolvedAirline;
    try {
      resolvedAirline = await resolveAirlineObject(res.locals.wt.airline, fields.toFlatten, fields.onChain);
      if (resolvedAirline.error) {
        return next(new HttpBadGatewayError('airlineNotAccessible', resolvedAirline.error, 'Airline data is not accessible.'));
      }
      DataFormatValidator.validate(
        resolvedAirline,
        AIRLINE_SCHEMA_MODEL,
        swaggerDocument.components.schemas,
        config.dataFormatVersions.airlines,
        undefined,
        'airline',
        fields.mapped
      );
      resolvedAirline = _.omit(resolvedAirline, fields.toDrop);
    } catch (e) {
      if (e instanceof HttpValidationError) {
        let err = formatError(e);
        err.data = resolvedAirline;
        if (e.data && e.data.valid) {
          return res.set(VALIDATION_WARNING_HEADER, e.data.errors).status(200).json(err.toPlainObject());
        } else {
          return res.status(err.status).json(err.toPlainObject());
        }
      } else {
        next(e);
      }
    }
    return res.status(200).json(resolvedAirline);
  } catch (e) {
    return next(new HttpBadGatewayError('airlineNotAccessible', e.message, 'Airline data is not accessible.'));
  }
};

const meta = async (req, res, next) => {
  try {
    const airlineApis = await res.locals.wt.airline.getWindingTreeApi();
    const apiObject = await airlineApis.airline[0].toPlainObject([]);
    return res.status(200).json({
      address: res.locals.wt.airline.address,
      orgJsonUri: apiObject.ref,
      descriptionUri: apiObject.contents.descriptionUri,
      flightsUri: apiObject.contents.flightsUri,
      dataFormatVersion: apiObject.contents.dataFormatVersion,
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
