const { Http404Error, HttpValidationError } = require('../errors');
const { DataFormatValidator } = require('../services/validation');
const wtJsLibs = require('../services/wt-js-libs');
const { formatError } = require('../services/utils');
const { config } = require('../config');
const {
  VALIDATION_WARNING_HEADER,
  SCHEMA_PATH,
  RATE_PLAN_MODEL,
} = require('../constants');

const findAll = async (req, res, next) => {
  try {
    const hotelApis = await res.locals.wt.hotel.getWindingTreeApi();
    const apiContents = (await hotelApis.hotel[0].toPlainObject(['ratePlansUri'])).contents;
    const passesTrustworthinessTest = await wtJsLibs.passesTrustworthinessTest(res.locals.wt.hotel.address, apiContents.guarantee);
    if (!passesTrustworthinessTest) {
      return next(new Http404Error('hotelNotFound', 'Hotel does not pass the trustworthiness test.', 'Hotel not found'));
    }
    if (!apiContents.ratePlansUri) {
      return next(new Http404Error('ratePlanNotFound', 'Rate plan not found'));
    }
    let ratePlans = apiContents.ratePlansUri.contents;
    const items = [], warnings = [], errors = [];
    const swaggerDocument = await DataFormatValidator.loadSchemaFromPath(SCHEMA_PATH, RATE_PLAN_MODEL);
    for (let plan of ratePlans) {
      try {
        DataFormatValidator.validate(
          plan,
          RATE_PLAN_MODEL,
          swaggerDocument.components.schemas,
          config.dataFormatVersions.hotels,
          apiContents.dataFormatVersion,
          'rate plan'
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

const find = async (req, res, next) => {
  let { ratePlanId } = req.params;
  try {
    const hotelApis = await res.locals.wt.hotel.getWindingTreeApi();
    const apiContents = (await hotelApis.hotel[0].toPlainObject(['ratePlansUri'])).contents;
    const passesTrustworthinessTest = await wtJsLibs.passesTrustworthinessTest(res.locals.wt.hotel.address, apiContents.guarantee);
    if (!passesTrustworthinessTest) {
      return next(new Http404Error('hotelNotFound', 'Hotel does not pass the trustworthiness test.', 'Hotel not found'));
    }
    if (!apiContents.ratePlansUri) {
      return next(new Http404Error('ratePlanNotFound', 'Rate plan not found'));
    }
    const ratePlans = apiContents.ratePlansUri.contents;
    let ratePlan = ratePlans.find((rp) => { return rp.id === ratePlanId; });
    if (!ratePlan) {
      return next(new Http404Error('ratePlanNotFound', 'Rate plan not found'));
    }
    const swaggerDocument = await DataFormatValidator.loadSchemaFromPath(SCHEMA_PATH, RATE_PLAN_MODEL);
    try {
      DataFormatValidator.validate(
        ratePlan,
        RATE_PLAN_MODEL,
        swaggerDocument.components.schemas,
        config.dataFormatVersions.hotels,
        apiContents.dataFormatVersion,
        'rate plan'
      );
    } catch (e) {
      if (e instanceof HttpValidationError) {
        let err = formatError(e);
        err.data = ratePlan;
        if (e.data && e.data.valid) {
          return res.set(VALIDATION_WARNING_HEADER, e.data.errors).status(200).json(err.toPlainObject());
        } else {
          return res.status(err.status).json(err.toPlainObject());
        }
      } else {
        next(e);
      }
    }
    res.status(200).json(ratePlan);
  } catch (e) {
    next(e);
  }
};

module.exports = {
  findAll,
  find,
};
