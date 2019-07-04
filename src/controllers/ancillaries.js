const _ = require('lodash');
const { errors: wtJsLibsErrors } = require('@windingtree/wt-js-libs');
const wtJsLibs = require('../services/wt-js-libs');
const { flattenObject, formatError } = require('../services/utils');
const { config } = require('../config');
const { DataFormatValidator } = require('../services/validation');
const {
  HttpValidationError,
  Http404Error,
  //HttpBadGatewayError,
} = require('../errors');
const {
  calculateAncillariesFields,
} = require('../services/fields');
const {
  DEFAULT_PAGE_SIZE,
  SCHEMA_PATH,
  ANCILLARY_SCHEMA_MODEL,
  //VALIDATION_WARNING_HEADER,
} = require('../constants');
const {
  mapAncillaryObjectToResponse,
  REVERSED_ANCILLARY_FIELD_MAPPING,
} = require('../services/property-mapping');
const {
  paginate,
  LimitValidationError,
  MissingStartWithError,
} = require('../services/pagination');

const resolveAncillaryObject = async (ancillary, offChainFields, onChainFields) => {
  let ancillaryData = {};
  try {
    if (offChainFields.length) {
      const ancillaryApis = await ancillary.getWindingTreeApi();
      const apiContents = (await ancillaryApis.ancillary[0].toPlainObject(offChainFields)).contents;

      const flattenedOffChainData = flattenObject(apiContents, offChainFields);
      ancillaryData = {
        dataFormatVersion: apiContents.dataFormatVersion,
        ...flattenedOffChainData.descriptionUri,
      };
      // Some offChainFields need special treatment
      const fieldModifiers = {
        'defaultLocale': (data, source, key) => { data[key] = source[key]; return data; },
        'guarantee': (data, source, key) => { data[key] = source[key]; return data; },
        'notificationsUri': (data, source, key) => { data[key] = source[key]; return data; },
        'bookingUri': (data, source, key) => { data[key] = source[key]; return data; },
        'ratePlansUri': (data, source, key) => { data.ratePlans = source[key]; return data; },
        'availabilityUri': (data, source, key) => { data.availability = source[key]; return data; },
      };
      for (let fieldModifier in fieldModifiers) {
        if (flattenedOffChainData[fieldModifier] !== undefined) {
          ancillaryData = fieldModifiers[fieldModifier](ancillaryData, flattenedOffChainData, fieldModifier);
        }
      }
    }
    for (let i = 0; i < onChainFields.length; i += 1) {
      if (ancillary[onChainFields[i]]) {
        ancillaryData[onChainFields[i]] = await ancillary[onChainFields[i]];
      }
    }
    // Always append ancillary chain address as id property
    ancillaryData.id = ancillary.address;
  } catch (e) {
    let message = 'Cannot get ancillary data';
    if (e instanceof wtJsLibsErrors.RemoteDataReadError) {
      message = 'Cannot access on-chain data, maybe the deployed smart contract is broken';
    }
    if (e instanceof wtJsLibsErrors.StoragePointerError) {
      message = 'Cannot access off-chain data';
    }
    return {
      error: message,
      originalError: e.message,
      data: {
        id: ancillary.address,
      },
    };
  }
  return mapAncillaryObjectToResponse(ancillaryData);
};

const fillAncillaryList = async (path, fields, ancillaries, limit, startWith) => {
  limit = limit ? parseInt(limit, 10) : DEFAULT_PAGE_SIZE;
  let { items, nextStart } = paginate(ancillaries, limit, startWith, 'address');
  let realItems = [], warningItems = [], realErrors = [];
  const swaggerDocument = await DataFormatValidator.loadSchemaFromPath(SCHEMA_PATH, ANCILLARY_SCHEMA_MODEL, fields.mapped, REVERSED_ANCILLARY_FIELD_MAPPING);
  const promises = [];
  for (let ancillary of items) {
    promises.push((() => {
      let resolvedAncillaryObject;
      return resolvedAncillaryObject(ancillary, fields.toFlatten, fields.onChain)
        .then(async (resolved) => {
          resolvedAncillaryObject = resolved;
          if (resolvedAncillaryObject.error) {
            throw new HttpValidationError(resolvedAncillaryObject.error);
          }
          const passesTrustworthinessTest = await wtJsLibs.passesTrustworthinessTest(resolvedAncillaryObject.id, resolvedAncillaryObject.guarantee);
          // silently remove all that does not pass the test
          if (!passesTrustworthinessTest) {
            return;
          }
          DataFormatValidator.validate(
            resolvedAncillaryObject,
            ANCILLARY_SCHEMA_MODEL,
            swaggerDocument.components.schemas,
            config.dataFormatVersions.ancillaries,
            undefined,
            'ancillary',
            fields.mapped
          );
          realItems.push(_.omit(resolvedAncillaryObject, fields.toDrop));
        }).catch((e) => {
          if (e instanceof HttpValidationError) {
            ancillary = {
              error: 'Upstream ancillary data format validation failed: ' + e.toString(),
              originalError: e.data && e.data.errors && e.data.errors.length && e.data.errors.map((err) => { return err.toString(); }).join(';'),
              data: resolvedAncillaryObject,
            };
            if (e.data && e.data.valid) {
              warningItems.push(ancillary);
            } else {
              ancillary.data = e.data && e.data.data;
              realErrors.push(ancillary);
            }
          } else {
            throw e;
          }
        });
    })());
  }
  await Promise.all(promises);
  const clientFields = _.xor(fields.mapped, fields.toDrop).join(',');
  let next = nextStart ? `${config.baseUrl}${path}?limit=${limit}&fields=${clientFields}&startWith=${nextStart}` : undefined;

  if (realErrors.length && realItems.length < limit && nextStart) {
    const nestedResult = await fillAncillaryList(path, fields, ancillaries, limit - realItems.length, nextStart);
    realItems = realItems.concat(nestedResult.items);
    warningItems = warningItems.concat(nestedResult.warnings);
    realErrors = realErrors.concat(nestedResult.errors);
    if (realItems.length && nestedResult.nextStart) {
      next = `${config.baseUrl}${path}?limit=${limit}&fields=${clientFields}&startWith=${nestedResult.nextStart}`;
    } else {
      next = undefined;
    }
  }
  return {
    items: realItems,
    warnings: warningItems,
    errors: realErrors,
    next,
    nextStart,
  };
};

// Actual controllers
const findAll = async (req, res, next) => {
  const { limit, startWith, fields } = req.query;
  try {
    let ancillaries = await res.locals.wt.ancillaryDirectory.getOrganizations();
    const { items, warnings, errors, next } = await fillAncillaryList(req.path, calculateAncillariesFields(fields), ancillaries, limit, startWith);
    res.status(200).json({ items, warnings, errors, next });
  } catch (e) {
    if (e instanceof LimitValidationError) {
      return next(new HttpValidationError('paginationLimitError', 'Limit must be a natural number greater than 0.'));
    }
    if (e instanceof MissingStartWithError) {
      return next(new Http404Error('paginationStartWithError', 'Cannot find startWith in hotel collection.'));
    }
    next(e);
  }
};

// // const find = async (req, res, next) => {
// //   try {
// //     const fields = calculateHotelFields(req.query.fields);
// //     const swaggerDocument = await DataFormatValidator.loadSchemaFromPath(SCHEMA_PATH, HOTEL_SCHEMA_MODEL, fields.mapped, REVERSED_HOTEL_FIELD_MAPPING);
// //     let resolvedHotel;
// //     try {
// //       resolvedHotel = await resolveHotelObject(res.locals.wt.hotel, fields.toFlatten, fields.onChain);
// //       if (resolvedHotel.error) {
// //         return next(new HttpBadGatewayError('hotelNotAccessible', resolvedHotel.error, 'Hotel data is not accessible.'));
// //       }
// //       const passesTrustworthinessTest = await wtJsLibs.passesTrustworthinessTest(resolvedHotel.id, resolvedHotel.guarantee);
// //       // If a hotel does not pass the test, it's like it never existed
// //       if (!passesTrustworthinessTest) {
// //         return next(new Http404Error('hotelNotFound', 'Hotel does not pass the trustworthiness test.', 'Hotel not found'));
// //       }
// //       DataFormatValidator.validate(
// //         resolvedHotel,
// //         HOTEL_SCHEMA_MODEL,
// //         swaggerDocument.components.schemas,
// //         config.dataFormatVersions.hotels,
// //         undefined,
// //         'hotel',
// //         fields.mapped
// //       );
// //       resolvedHotel = _.omit(resolvedHotel, fields.toDrop);
// //     } catch (e) {
// //       if (e instanceof HttpValidationError) {
// //         let err = formatError(e);
// //         err.data = resolvedHotel;
// //         if (e.data && e.data.valid) {
// //           return res.set(VALIDATION_WARNING_HEADER, e.data.errors).status(200).json(err.toPlainObject());
// //         } else {
// //           return res.status(err.status).json(err.toPlainObject());
// //         }
// //       } else {
// //         next(e);
// //       }
// //     }
// //     return res.status(200).json(resolvedHotel);
// //   } catch (e) {
// //     // improve error handling
// //     return next(new HttpBadGatewayError('hotelNotAccessible', e.message, 'Hotel data is not accessible.'));
// //   }
// // };

// // const meta = async (req, res, next) => {
// //   try {
// //     const hotelApis = await res.locals.wt.hotel.getWindingTreeApi();
// //     const apiObject = await hotelApis.hotel[0].toPlainObject([]);
// //     const passesTrustworthinessTest = await wtJsLibs.passesTrustworthinessTest(res.locals.wt.hotel.address, apiObject.contents.guarantee);
// //     if (!passesTrustworthinessTest) {
// //       return next(new Http404Error('hotelNotFound', 'Hotel does not pass the trustworthiness test.', 'Hotel not found'));
// //     }
// //     return res.status(200).json({
// //       address: res.locals.wt.hotel.address,
// //       dataIndexUri: apiObject.ref,
// //       orgJsonUri: await res.locals.wt.hotel.orgJsonUri,
// //       descriptionUri: apiObject.contents.descriptionUri,
// //       ratePlansUri: apiObject.contents.ratePlansUri,
// //       availabilityUri: apiObject.contents.availabilityUri,
// //       dataFormatVersion: apiObject.contents.dataFormatVersion,
// //       defaultLocale: apiObject.contents.defaultLocale,
// //       guarantee: apiObject.contents.guarantee,
// //     });
// //   } catch (e) {
// //     return next(new HttpBadGatewayError('hotelNotAccessible', e.message, 'Hotel data is not accessible.'));
// //   }
// // };

module.exports = {
  // find,
  findAll,
  // meta,
};
