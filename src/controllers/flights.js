const { flattenObject } = require('../services/utils');
const { Http404Error, HttpBadGatewayError } = require('../errors');

const find = async (req, res, next) => {
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
    let flattenedFlight = flattenObject(flight, ['flightInstancesUri']);
    flight.flightInstances = flattenedFlight.flightInstancesUri;
    delete flight.flightInstancesUri;

    res.status(200).json(flight);
  } catch (e) {
    next(e);
  }
};

const findAll = async (req, res, next) => {
  try {
    let plainAirline = await res.locals.wt.airline.toPlainObject(['flightsUri.items.flightInstancesUri']);
    if (!plainAirline.dataUri.contents.flightsUri) {
      return next(new Http404Error('flightNotFound', 'Flights not found'));
    }
    const flights = [];
    for (let flight of plainAirline.dataUri.contents.flightsUri.contents.items) {
      let flattenedFlight = flattenObject(flight, ['flightInstancesUri']);
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
