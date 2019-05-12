const { Http404Error, HttpValidationError } = require('../errors');
const { DataFormatValidator } = require('../services/validation');
const wtJsLibs = require('../services/wt-js-libs');
const { formatError } = require('../services/utils');
const { config } = require('../config');
const {
  VALIDATION_WARNING_HEADER,
  SCHEMA_PATH,
  ROOM_TYPE_MODEL,
  RATE_PLAN_MODEL,
  AVAILABILITY_MODEL,
} = require('../constants');

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

const getPlainHotel = async (hotel, fieldsArray) => {
  const resolvedFields = ['descriptionUri.roomTypes'];
  if (fieldsArray.indexOf('ratePlans') > -1) {
    resolvedFields.push('ratePlansUri');
  }
  if (fieldsArray.indexOf('availability') > -1) {
    resolvedFields.push('availabilityUri');
  }
  resolvedFields.push('guarantee');
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

const _normalizeQuery = (fieldsQuery) => {
  let fieldsArray = Array.isArray(fieldsQuery) ? fieldsQuery : fieldsQuery.split(',');
  return fieldsArray.filter((x) => !!x);
};

const findAll = async (req, res, next) => {
  const fieldsQuery = req.query.fields || [];
  const fieldsArray = _normalizeQuery(fieldsQuery);
  try {
    const plainHotel = await getPlainHotel(res.locals.wt.hotel, fieldsArray);
    const passesTrustworthinessTest = await wtJsLibs.passesTrustworthinessTest(plainHotel.address, plainHotel.dataUri.contents.guarantee);
    if (!passesTrustworthinessTest) {
      return next(new Http404Error('hotelNotFound', 'Hotel does not pass the trustworthiness test.', 'Hotel not found'));
    }
    let roomTypes = plainHotel.dataUri.contents.descriptionUri.contents.roomTypes;
    const items = [], warnings = [], errors = [];
    const swaggerDocument = await DataFormatValidator.loadSchemaFromPath(SCHEMA_PATH, ROOM_TYPE_MODEL);
    for (let roomType of roomTypes) {
      roomType = setAdditionalFields(roomType, plainHotel, fieldsQuery);
      try {
        DataFormatValidator.validate(
          roomType,
          ROOM_TYPE_MODEL,
          swaggerDocument.components.schemas,
          config.dataFormatVersions.hotels,
          plainHotel.dataUri.contents.dataFormatVersion,
          'room type'
        );
        items.push(roomType);
      } catch (e) {
        if (e instanceof HttpValidationError) {
          let err = formatError(e);
          err.data = roomType;
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
      items,
      warnings,
      errors,
    });
  } catch (e) {
    next(e);
  }
};

const find = async (req, res, next) => {
  let { roomTypeId } = req.params;
  const fieldsQuery = req.query.fields || [];
  const fieldsArray = _normalizeQuery(fieldsQuery);
  try {
    const plainHotel = await getPlainHotel(res.locals.wt.hotel, fieldsArray);
    const passesTrustworthinessTest = await wtJsLibs.passesTrustworthinessTest(plainHotel.address, plainHotel.dataUri.contents.guarantee);
    if (!passesTrustworthinessTest) {
      return next(new Http404Error('hotelNotFound', 'Hotel does not pass the trustworthiness test.', 'Hotel not found'));
    }
    let roomTypes = plainHotel.dataUri.contents.descriptionUri.contents.roomTypes;
    let roomType = roomTypes.find((rt) => { return rt.id === roomTypeId; });
    if (!roomType) {
      return next(new Http404Error('roomTypeNotFound', 'Room type not found'));
    }
    roomType = setAdditionalFields(roomType, plainHotel, fieldsQuery);
    const swaggerDocument = await DataFormatValidator.loadSchemaFromPath(SCHEMA_PATH, ROOM_TYPE_MODEL, fieldsArray.length === 0 ? undefined : fieldsArray);
    try {
      DataFormatValidator.validate(
        roomType,
        ROOM_TYPE_MODEL,
        swaggerDocument.components.schemas,
        config.dataFormatVersions.hotels,
        plainHotel.dataUri.contents.dataFormatVersion,
        'room type'
      );
    } catch (e) {
      if (e instanceof HttpValidationError) {
        let err = formatError(e);
        err.data = roomType;
        if (e.data && e.data.valid) {
          return res.set(VALIDATION_WARNING_HEADER, e.data.errors).status(200).json(err.toPlainObject());
        } else {
          return res.status(err.status).json(err.toPlainObject());
        }
      } else {
        next(e);
      }
    }
    res.status(200).json(roomType);
  } catch (e) {
    next(e);
  }
};

const findRatePlans = async (req, res, next) => {
  let { roomTypeId } = req.params;
  try {
    let plainHotel = await getPlainHotel(res.locals.wt.hotel, ['ratePlans']);
    const passesTrustworthinessTest = await wtJsLibs.passesTrustworthinessTest(plainHotel.address, plainHotel.dataUri.contents.guarantee);
    if (!passesTrustworthinessTest) {
      return next(new Http404Error('hotelNotFound', 'Hotel does not pass the trustworthiness test.', 'Hotel not found'));
    }
    let roomTypes = plainHotel.dataUri.contents.descriptionUri.contents.roomTypes;
    let roomType = roomTypes.find((rt) => { return rt.id === roomTypeId; });
    if (!roomType) {
      return next(new Http404Error('roomTypeNotFound', 'Room type not found'));
    }
    if (!plainHotel.dataUri.contents.ratePlansUri) {
      return next(new Http404Error('noRatePlans', 'No ratePlansUri specified.'));
    }
    const ratePlans = detectRatePlans(roomTypeId, plainHotel.dataUri.contents.ratePlansUri.contents);
    const items = [], warnings = [], errors = [];
    const swaggerDocument = await DataFormatValidator.loadSchemaFromPath(SCHEMA_PATH, RATE_PLAN_MODEL);
    for (let plan of ratePlans) {
      try {
        DataFormatValidator.validate(
          plan,
          RATE_PLAN_MODEL,
          swaggerDocument.components.schemas,
          config.dataFormatVersions.hotels,
          plainHotel.dataUri.contents.dataFormatVersion,
          'rate plan',
        );
        items.push(plan);
      } catch (e) {
        if (e instanceof HttpValidationError) {
          let err = formatError(e);
          err.data = plan;
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
      items,
      warnings,
      errors,
    });
  } catch (e) {
    next(e);
  }
};

const findAvailability = async (req, res, next) => {
  let { roomTypeId } = req.params;
  try {
    let plainHotel = await getPlainHotel(res.locals.wt.hotel, ['availability']);
    const passesTrustworthinessTest = await wtJsLibs.passesTrustworthinessTest(plainHotel.address, plainHotel.dataUri.contents.guarantee);
    if (!passesTrustworthinessTest) {
      return next(new Http404Error('hotelNotFound', 'Hotel does not pass the trustworthiness test.', 'Hotel not found'));
    }
    let roomTypes = plainHotel.dataUri.contents.descriptionUri.contents.roomTypes;
    let roomType = roomTypes.find((rt) => { return rt.id === roomTypeId; });
    if (!roomType) {
      return next(new Http404Error('roomTypeNotFound', 'Room type not found'));
    }
    if (!plainHotel.dataUri.contents.availabilityUri) {
      return next(new Http404Error('noAvailability', 'No availabilityUri specified.'));
    }
    const availability = detectAvailability(roomTypeId, plainHotel.dataUri.contents.availabilityUri.contents);
    let items = [], warnings = [], errors = [];
    const swaggerDocument = await DataFormatValidator.loadSchemaFromPath(SCHEMA_PATH, AVAILABILITY_MODEL);
    for (let roomType of availability.roomTypes) {
      try {
        DataFormatValidator.validate(
          roomType,
          AVAILABILITY_MODEL,
          swaggerDocument.components.schemas,
          config.dataFormatVersions.hotels,
          plainHotel.dataUri.contents.dataFormatVersion,
          'availability',
        );
        items.push(roomType);
      } catch (e) {
        if (e instanceof HttpValidationError) {
          let err = formatError(e);
          err.data = roomType;
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
      items,
      warnings,
      errors,
      updatedAt: availability.updatedAt,
    });
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
