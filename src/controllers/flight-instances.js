const { Http404Error, HttpValidationError } = require('../errors');
const { DataFormatValidator } = require('../services/validation');
const { formatError } = require('../services/utils');
const { config } = require('../config');
const {
  VALIDATION_WARNING_HEADER,
  SCHEMA_PATH,
  FLIGHT_INSTANCE_MODEL,
} = require('../constants');

const find = async (req, res, next) => {
  let { flightId, flightInstanceId } = req.params;
  try {
    let plainAirline = await res.locals.wt.airline.toPlainObject(['flightsUri.items.flightInstancesUri']);
    if (!plainAirline.dataUri.contents.flightsUri) {
      return next(new Http404Error('flightNotFound', 'Flights not found'));
    }
    const flights = plainAirline.dataUri.contents.flightsUri.contents;
    const flight = flights.items.find(f => f.id === flightId);
    if (!flight) {
      return next(new Http404Error('flightNotFound', 'Flight not found'));
    }
    let flightInstance = flight.flightInstancesUri.contents.find(i => i.id === flightInstanceId);
    if (!flightInstance) {
      return next(new Http404Error('flightInstanceNotFound', 'Flight instance not found'));
    }
    const swaggerDocument = await DataFormatValidator.loadSchemaFromPath(SCHEMA_PATH, FLIGHT_INSTANCE_MODEL);
    try {
      DataFormatValidator.validate(
        flightInstance,
        FLIGHT_INSTANCE_MODEL,
        swaggerDocument.components.schemas,
        config.dataFormatVersions.airlines,
        plainAirline.dataUri.contents.dataFormatVersion,
        'flight instance',
      );
    } catch (e) {
      if (e instanceof HttpValidationError) {
        let err = formatError(e);
        err.data = flightInstance;
        if (e.data && e.data.valid) {
          return res.set(VALIDATION_WARNING_HEADER, e.data.errors).status(200).json(err.toPlainObject());
        } else {
          return res.status(err.status).json(err.toPlainObject());
        }
      } else {
        next(e);
      }
    }
    res.status(200).json(flightInstance);
  } catch (e) {
    next(e);
  }
};

const findAll = async (req, res, next) => {
  let { flightId } = req.params;
  try {
    let plainAirline = await res.locals.wt.airline.toPlainObject(['flightsUri.items.flightInstancesUri']);
    if (!plainAirline.dataUri.contents.flightsUri) {
      return next(new Http404Error('flightNotFound', 'Flights not found'));
    }
    const flights = plainAirline.dataUri.contents.flightsUri.contents;
    const flight = flights.items.find(f => f.id === flightId);
    if (!flight) {
      return next(new Http404Error('flightNotFound', 'Flight not found'));
    }
    const instances = [], warnings = [], errors = [];
    const swaggerDocument = await DataFormatValidator.loadSchemaFromPath(SCHEMA_PATH, FLIGHT_INSTANCE_MODEL);
    for (let instance of flight.flightInstancesUri.contents) {
      try {
        DataFormatValidator.validate(
          instance,
          FLIGHT_INSTANCE_MODEL,
          swaggerDocument.components.schemas,
          config.dataFormatVersions.airlines,
          plainAirline.dataUri.contents.dataFormatVersion,
          'flight instance',
        );
        instances.push(instance);
      } catch (e) {
        if (e instanceof HttpValidationError) {
          let err = formatError(e);
          err.data = instance;
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
      items: instances,
      warnings: warnings,
      errors: errors,
    });
  } catch (e) {
    next(e);
  }
};

module.exports = {
  find,
  findAll,
};
