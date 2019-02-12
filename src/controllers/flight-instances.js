const { Http404Error } = require('../errors');

const find = async (req, res, next) => {
  let { airlineAddress, flightId, flightInstanceId } = req.params;
  try {
    let plainAirline = await res.locals.wt.airline.toPlainObject(['flightsUri.items.flightInstancesUri']);
    if (!plainAirline.dataUri.contents.flightsUri) {
      return next(new Http404Error('flightNotFound', 'Flights not found'));
    }
    if (plainAirline.address !== airlineAddress) {
      return next(new Http404Error('airlineNotFound', 'Airline not found'));
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
    res.status(200).json(flightInstance);
  } catch (e) {
    next(e);
  }
};

module.exports = {
  find,
};
