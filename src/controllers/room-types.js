const { Http404Error } = require('../errors');

const detectRatePlans = (roomTypeId, ratePlansArray) => {
  return ratePlansArray.filter((rp) => rp.roomTypeIds && rp.roomTypeIds.indexOf(roomTypeId) > -1);
};

const detectAvailability = (roomTypeId, availabilityObject) => {
  let availabilities = availabilityObject.roomTypes.filter((a) => {
    return a.roomTypeId === roomTypeId;
  });
  return {
    updatedAt: availabilityObject && availabilityObject.updatedAt,
    roomTypes: availabilities,
  };
};

const getPlainHotel = async (hotel, fieldsQuery) => {
  let fieldsArray = Array.isArray(fieldsQuery) ? fieldsQuery : fieldsQuery.split(',');
  fieldsArray = fieldsArray.filter((x) => !!x);
  const resolvedFields = ['descriptionUri.roomTypes'];
  if (fieldsArray.indexOf('ratePlans') > -1) {
    resolvedFields.push('ratePlansUri');
  }
  if (fieldsArray.indexOf('availability') > -1) {
    resolvedFields.push('availabilityUri');
  }
  return hotel.toPlainObject(resolvedFields);
};

const setAdditionalFields = (roomType, plainHotel, fieldsQuery) => {
  if (fieldsQuery.indexOf('ratePlans') > -1) {
    if (plainHotel.dataUri.contents.ratePlansUri) {
      roomType.ratePlans = detectRatePlans(roomType.id, plainHotel.dataUri.contents.ratePlansUri.contents);
    } else {
      roomType.ratePlans = [];
    }
  }
  if (fieldsQuery.indexOf('availability') > -1) {
    if (plainHotel.dataUri.contents.availabilityUri) {
      roomType.availability = detectAvailability(roomType.id, plainHotel.dataUri.contents.availabilityUri.contents);
    } else {
      roomType.availability = [];
    }
  }
  return roomType;
};

const findAll = async (req, res, next) => {
  const fieldsQuery = req.query.fields || [];
  try {
    const plainHotel = await getPlainHotel(res.locals.wt.hotel, fieldsQuery);
    let roomTypes = plainHotel.dataUri.contents.descriptionUri.contents.roomTypes;
    roomTypes = roomTypes.map((roomType) => {
      return setAdditionalFields(roomType, plainHotel, fieldsQuery);
    });
    res.status(200).json(roomTypes);
  } catch (e) {
    next(e);
  }
};

const find = async (req, res, next) => {
  let { roomTypeId } = req.params;
  const fieldsQuery = req.query.fields || [];
  try {
    const plainHotel = await getPlainHotel(res.locals.wt.hotel, fieldsQuery);
    let roomTypes = plainHotel.dataUri.contents.descriptionUri.contents.roomTypes;
    let roomType = roomTypes.find((rt) => { return rt.id === roomTypeId; });
    if (!roomType) {
      return next(new Http404Error('roomTypeNotFound', 'Room type not found'));
    }
    roomType = setAdditionalFields(roomType, plainHotel, fieldsQuery);
    res.status(200).json(roomType);
  } catch (e) {
    next(e);
  }
};

const findRatePlans = async (req, res, next) => {
  let { roomTypeId } = req.params;
  try {
    let plainHotel = await getPlainHotel(res.locals.wt.hotel, ['ratePlans']);
    
    let roomTypes = plainHotel.dataUri.contents.descriptionUri.contents.roomTypes;
    let roomType = roomTypes.find((rt) => { return rt.id === roomTypeId; });
    if (!roomType) {
      return next(new Http404Error('roomTypeNotFound', 'Room type not found'));
    }
    if (!plainHotel.dataUri.contents.ratePlansUri) {
      return next(new Http404Error('noRatePlans', 'No ratePlansUri specified.'));
    }
    const ratePlans = detectRatePlans(roomTypeId, plainHotel.dataUri.contents.ratePlansUri.contents);
    res.status(200).json(ratePlans);
  } catch (e) {
    next(e);
  }
};

const findAvailability = async (req, res, next) => {
  let { roomTypeId } = req.params;
  try {
    let plainHotel = await getPlainHotel(res.locals.wt.hotel, ['availability']);
    
    let roomTypes = plainHotel.dataUri.contents.descriptionUri.contents.roomTypes;
    let roomType = roomTypes.find((rt) => { return rt.id === roomTypeId; });
    if (!roomType) {
      return next(new Http404Error('roomTypeNotFound', 'Room type not found'));
    }
    if (!plainHotel.dataUri.contents.availabilityUri) {
      return next(new Http404Error('noAvailability', 'No availabilityUri specified.'));
    }
    res.status(200).json(detectAvailability(roomTypeId, plainHotel.dataUri.contents.availabilityUri.contents));
  } catch (e) {
    next(e);
  }
};

module.exports = {
  findAll,
  find,
  findRatePlans,
  findAvailability,
};
