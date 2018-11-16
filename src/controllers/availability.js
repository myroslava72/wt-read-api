const { Http404Error } = require('../errors');

const findAll = async (req, res, next) => {
  try {
    let plainHotel = await res.locals.wt.hotel.toPlainObject(['availabilityUri']);
    if (!plainHotel.dataUri.contents.availabilityUri) {
      return next(new Http404Error('noAvailability', 'No availabilityUri specified.'));
    }
    let availability = plainHotel.dataUri.contents.availabilityUri.contents;
    res.status(200).json(availability);
  } catch (e) {
    next(e);
  }
};

module.exports = {
  findAll,
};
