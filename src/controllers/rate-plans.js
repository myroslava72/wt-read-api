const { Http404Error, HttpValidationError } = require('../errors');
const { DataFormatValidator } = require('../services/validation');
const { formatError } = require('../services/utils');
const {
  VALIDATION_WARNING_HEADER,
  SCHEMA_PATH,
  RATE_PLAN_MODEL,
} = require('../constants');

const findAll = async (req, res, next) => {
  try {
    let plainHotel = await res.locals.wt.hotel.toPlainObject(['ratePlansUri']);
    if (!plainHotel.dataUri.contents.ratePlansUri) {
      return next(new Http404Error('ratePlanNotFound', 'Rate plan not found'));
    }
    let ratePlans = plainHotel.dataUri.contents.ratePlansUri.contents;
    const items = [], warnings = [], errors = [];
    const swaggerDocument = await DataFormatValidator.loadSchemaFromPath(SCHEMA_PATH, RATE_PLAN_MODEL, undefined, {});
    for (let plan of ratePlans) {
      try {
        DataFormatValidator.validate(plan, 'rate plan', RATE_PLAN_MODEL, swaggerDocument.components.schemas, plainHotel.dataUri.contents.dataFormatVersion);
        items.push(plan);
      } catch (e) {
        if (e instanceof HttpValidationError) {
          let err = formatError(e);
          err.data = plan;
          if (e.code && e.code.valid) {
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
    let plainHotel = await res.locals.wt.hotel.toPlainObject(['ratePlansUri']);
    if (!plainHotel.dataUri.contents.ratePlansUri) {
      return next(new Http404Error('ratePlanNotFound', 'Rate plan not found'));
    }
    const ratePlans = plainHotel.dataUri.contents.ratePlansUri.contents;
    let ratePlan = ratePlans.find((rp) => { return rp.id === ratePlanId; });
    if (!ratePlan) {
      return next(new Http404Error('ratePlanNotFound', 'Rate plan not found'));
    }
    ratePlan.dataFormatVersion = plainHotel.dataUri.contents.dataFormatVersion;
    const swaggerDocument = await DataFormatValidator.loadSchemaFromPath(SCHEMA_PATH, RATE_PLAN_MODEL, undefined, {});
    try {
      DataFormatValidator.validate(ratePlan, 'rate plan', RATE_PLAN_MODEL, swaggerDocument.components.schemas);
    } catch (e) {
      if (e instanceof HttpValidationError) {
        let err = formatError(e);
        err.data = ratePlan;
        if (e.code && e.code.valid) {
          return res.set(VALIDATION_WARNING_HEADER, e.code.errors).status(200).json(err.toPlainObject());
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
