const { Http404Error, HttpValidationError } = require('../errors');
const { config } = require('../config');
const wtJsLibs = require('../services/wt-js-libs');
const { DataFormatValidator } = require('../services/validation');
const { formatError } = require('../services/utils');
const {
  SCHEMA_PATH,
  AVAILABILITY_MODEL,
} = require('../constants');

const findAll = async (req, res, next) => {
  try {
    const hotelApis = await res.locals.wt.hotel.getWindingTreeApi();
    const apiContents = (await hotelApis.hotel[0].toPlainObject(['availabilityUri'])).contents;
    const passesTrustworthinessTest = await wtJsLibs.passesTrustworthinessTest(res.locals.wt.hotel.address, apiContents.guarantee);
    if (!passesTrustworthinessTest) {
      return next(new Http404Error('hotelNotFound', 'Hotel does not pass the trustworthiness test.', 'Hotel not found'));
    }
    if (!apiContents.availabilityUri) {
      return next(new Http404Error('noAvailability', 'No availabilityUri specified.'));
    }
    let availability = apiContents.availabilityUri.contents;
    const items = [], warnings = [], errors = [];
    const swaggerDocument = await DataFormatValidator.loadSchemaFromPath(SCHEMA_PATH, AVAILABILITY_MODEL);
    for (let roomType of availability.roomTypes) {
      try {
        DataFormatValidator.validate(
          roomType,
          AVAILABILITY_MODEL,
          swaggerDocument.components.schemas,
          config.dataFormatVersions.hotels,
          apiContents.dataFormatVersion,
          'availability'
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
};
