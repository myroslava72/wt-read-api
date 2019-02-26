const { mapAirlineFieldsFromQuery } = require('../services/property-mapping');
const { flattenObject, formatError } = require('../services/utils');
const { Http404Error, HttpBadGatewayError, HttpValidationError } = require('../errors');
const { DataFormatValidator } = require('../services/validation');
const {
  VALIDATION_WARNING_HEADER,
  SCHEMA_PATH,
  FLIGHT_MODEL,
} = require('../constants');

const find = async (req, res, next) => {
  let fieldsQuery = req.query.fields || [];
  let fieldsArray = Array.isArray(fieldsQuery) ? fieldsQuery : fieldsQuery.split(',');
  fieldsArray = mapAirlineFieldsFromQuery(fieldsArray);
  let { flightId } = req.params;
  try {
    const loadInstances = fieldsArray.indexOf('flightInstancesUri') > -1;
    const fieldsToResolve = loadInstances ? ['flightsUri.items.flightInstancesUri'] : ['flightsUri.items'];
    const depth = loadInstances ? undefined : 2;
    let plainAirline = await res.locals.wt.airline.toPlainObject(fieldsToResolve, depth);
    if (!plainAirline.dataUri.contents.flightsUri) {
      return next(new Http404Error('flightNotFound', 'Flights not found'));
    }
    const flights = plainAirline.dataUri.contents.flightsUri.contents;
    const flight = flights.items.find(f => f.id === flightId);
    if (!flight) {
      return next(new Http404Error('flightNotFound', 'Flight not found'));
    }
    const flattenedFlight = flattenObject(flight, fieldsArray);
    flight.flightInstances = flattenedFlight.flightInstancesUri;
    delete flight.flightInstancesUri;

    flight.dataFormatVersion = plainAirline.dataUri.contents.dataFormatVersion;
    const swaggerDocument = await DataFormatValidator.loadSchemaFromPath(SCHEMA_PATH, FLIGHT_MODEL, undefined, {});
    try {
      DataFormatValidator.validate(flight, 'flight', FLIGHT_MODEL, swaggerDocument.components.schemas);
    } catch (e) {
      if (e instanceof HttpValidationError) {
        let err = formatError(e);
        err.data = flight;
        if (e.code && e.code.valid) {
          return res.set(VALIDATION_WARNING_HEADER, e.code.errors).status(200).json(err.toPlainObject());
        } else {
          return res.status(err.status).json(err.toPlainObject());
        }
      } else {
        next(e);
      }
    }
    res.status(200).json(flight);
  } catch (e) {
    next(e);
  }
};

const findAll = async (req, res, next) => {
  let fieldsQuery = req.query.fields || [];
  let fieldsArray = Array.isArray(fieldsQuery) ? fieldsQuery : fieldsQuery.split(',');
  fieldsArray = mapAirlineFieldsFromQuery(fieldsArray);
  try {
    const loadInstances = fieldsArray.indexOf('flightInstancesUri') > -1;
    const fieldsToResolve = loadInstances ? ['flightsUri.items.flightInstancesUri'] : ['flightsUri.items'];
    const depth = loadInstances ? undefined : 2;
    let plainAirline = await res.locals.wt.airline.toPlainObject(fieldsToResolve, depth);
    if (!plainAirline.dataUri.contents.flightsUri) {
      return next(new Http404Error('flightNotFound', 'Flights not found'));
    }
    const flights = [];
    for (let flight of plainAirline.dataUri.contents.flightsUri.contents.items) {
      let flattenedFlight = flattenObject(flight, fieldsArray);
      flight.flightInstances = flattenedFlight.flightInstancesUri;
      delete flight.flightInstancesUri;
      flights.push(flight);
    }
    res.status(200).json({
      items: flights,
      updatedAt: plainAirline.dataUri.contents.flightsUri.contents.updatedAt,
    });
  } catch (e) {
    next(e);
  }
};

const meta = async (req, res, next) => {
  let { flightId } = req.params;
  try {
    let plainAirline = await res.locals.wt.airline.toPlainObject(['flightsUri']);
    if (!plainAirline.dataUri.contents.flightsUri) {
      return next(new Http404Error('flightNotFound', 'Flights not found'));
    }
    const flights = plainAirline.dataUri.contents.flightsUri.contents;
    const flight = flights.items.find(f => f.id === flightId);
    if (!flight) {
      return next(new Http404Error('flightNotFound', 'Flight not found'));
    }
    res.status(200).json({
      flightInstancesUri: flight.flightInstancesUri.ref,
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
