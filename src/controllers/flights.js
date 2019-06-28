const { mapAirlineFieldsFromQuery } = require('../services/property-mapping');
const { flattenObject, formatError } = require('../services/utils');
const { Http404Error, HttpBadGatewayError, HttpValidationError } = require('../errors');
const { DataFormatValidator } = require('../services/validation');
const { config } = require('../config');
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
    const airlineApis = await res.locals.wt.airline.getWindingTreeApi();
    const apiContents = (await airlineApis.airline[0].toPlainObject(fieldsToResolve, depth)).contents;
    if (!apiContents.flightsUri) {
      return next(new Http404Error('flightNotFound', 'Flights not found'));
    }
    const flights = apiContents.flightsUri.contents;
    const flight = flights.items.find(f => f.id === flightId);
    if (!flight) {
      return next(new Http404Error('flightNotFound', 'Flight not found'));
    }
    const flattenedFlight = flattenObject(flight, fieldsArray);
    flight.flightInstances = flattenedFlight.flightInstancesUri;
    delete flight.flightInstancesUri;

    const swaggerDocument = await DataFormatValidator.loadSchemaFromPath(SCHEMA_PATH, FLIGHT_MODEL);
    try {
      DataFormatValidator.validate(
        flight,
        FLIGHT_MODEL,
        swaggerDocument.components.schemas,
        config.dataFormatVersions.airlines,
        apiContents.dataFormatVersion,
        'flight',
      );
    } catch (e) {
      if (e instanceof HttpValidationError) {
        let err = formatError(e);
        err.data = flight;
        if (e.data && e.data.valid) {
          return res.set(VALIDATION_WARNING_HEADER, e.data.errors).status(200).json(err.toPlainObject());
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
    const airlineApis = await res.locals.wt.airline.getWindingTreeApi();
    const apiContents = (await airlineApis.airline[0].toPlainObject(fieldsToResolve, depth)).contents;
    if (!apiContents.flightsUri) {
      return next(new Http404Error('flightNotFound', 'Flights not found'));
    }
    const flights = [], warnings = [], errors = [];
    const swaggerDocument = await DataFormatValidator.loadSchemaFromPath(SCHEMA_PATH, FLIGHT_MODEL);
    for (let flight of apiContents.flightsUri.contents.items) {
      let flattenedFlight = flattenObject(flight, fieldsArray);
      flight.flightInstances = flattenedFlight.flightInstancesUri;
      delete flight.flightInstancesUri;
      try {
        DataFormatValidator.validate(
          flight,
          FLIGHT_MODEL,
          swaggerDocument.components.schemas,
          config.dataFormatVersions.airlines,
          apiContents.dataFormatVersion,
          'flight',
        );
        flights.push(flight);
      } catch (e) {
        if (e instanceof HttpValidationError) {
          let err = formatError(e);
          err.data = flight;
          if (e.data && e.data.valid) {
            warnings.push(err);
          } else {
            err.data = { id: err.data.id };
            errors.push(err);
          }
        } else {
          next(e);
        }
      }
    }
    res.status(200).json({
      items: flights,
      warnings: warnings,
      errors: errors,
      updatedAt: apiContents.flightsUri.contents.updatedAt,
    });
  } catch (e) {
    next(e);
  }
};

const meta = async (req, res, next) => {
  let { flightId } = req.params;
  try {
    const airlineApis = await res.locals.wt.airline.getWindingTreeApi();
    const apiContents = (await airlineApis.airline[0].toPlainObject(['flightsUri'])).contents;
    if (!apiContents.flightsUri) {
      return next(new Http404Error('flightNotFound', 'Flights not found'));
    }
    const flights = apiContents.flightsUri.contents;
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
