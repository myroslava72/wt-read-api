const { Http404Error } = require('../errors');

const find = async (req, res, next) => {
  let { flightInstanceId } = req.params;
  try {
    let plainAirline = await res.locals.wt.airline.toPlainObject(['flightsUri.items.flightInstancesUri']);
    if (!plainAirline.dataUri.contents.flightsUri) {
      return next(new Http404Error('flightNotFound', 'Flights not found'));
    }
    const flights = plainAirline.dataUri.contents.flightsUri.contents;
    let flightInstance;
    for (let f of flights.items) {
      flightInstance = f.flightInstancesUri.contents.find((fi) => {
        return fi.id === flightInstanceId;
      });
    }
    if (!flightInstance) {
      return next(new Http404Error('flightNotFound', 'Flight not found'));
    }
    res.status(200).json(flightInstance);
  } catch (e) {
    next(e);
  }
};

module.exports = {
  find,
};
