const YAML = require('yamljs');
const path = require('path');
const _ = require('lodash');
const {
  mapAirlineFieldsFromQuery,
  mapHotelFieldsFromQuery,
} = require('./property-mapping');
const swaggerDocument = YAML.load(path.resolve(__dirname, '../../docs/swagger.yaml'));

const getListOfFieldsFromSwagger = (schema) => {
  try {
    if (swaggerDocument.components.schemas[schema].allOf) {
      let res = [];
      for (let subSchema of swaggerDocument.components.schemas[schema].allOf) {
        if (subSchema.$ref) {
          const normalizedName = subSchema.$ref.replace('#/components/schemas/', '');
          const properties = getListOfFieldsFromSwagger(normalizedName);
          res = res.concat(properties);
        } else {
          res = res.concat(Object.keys(subSchema.properties));
        }
      }
      return res;
    }
    return Object.keys(swaggerDocument.components.schemas[schema].properties);
  } catch (e) {
    console.log(`No schema properties found for ${schema}`);
    return [];
  }
};

const HOTEL_DEFAULT_FIELDS_LIST = [
  'id',
  'location',
  'name',
];
const HOTEL_DEFAULT_FIELDS = HOTEL_DEFAULT_FIELDS_LIST.concat([
  'description',
  'contacts',
  'address',
  'currency',
  'images',
  'amenities',
  'updatedAt',
]);
const HOTEL_ONCHAIN_FIELDS = ['owner', 'created'];
const HOTEL_DESCRIPTION_FIELDS = getListOfFieldsFromSwagger('windingtree-wt-hotel-schemas-HotelDescriptionBase');
const HOTEL_DATAINDEX_FIELDS = getListOfFieldsFromSwagger('windingtree-wt-hotel-schemas-HotelDataIndex');

const AIRLINE_DEFAULT_FIELDS_LIST = [
  'id',
  'name',
  'code',
  'defaultCancellationAmount',
  'contacts',
];
const AIRLINE_DEFAULT_FIELDS = AIRLINE_DEFAULT_FIELDS_LIST.concat(['code', 'currency']);
const AIRLINE_ONCHAIN_FIELDS = ['owner', 'created'];
const AIRLINE_DESCRIPTION_FIELDS = getListOfFieldsFromSwagger('windingtree-wt-airline-schemas-AirlineDescriptionBase');
const AIRLINE_DATAINDEX_FIELDS = getListOfFieldsFromSwagger('windingtree-wt-airline-schemas-AirlineDataIndex');

const _calculateFields = (fields, mappingSpec, onChainFieldsSpec = [], descriptionFieldsSpec = [], dataIndexFieldsSpec = [], toDropSpec = []) => {
  const mappedFields = mappingSpec(fields);
  return {
    mapped: mappedFields,
    onChain: mappedFields.map((f) => onChainFieldsSpec.indexOf(f) > -1 ? f : null).filter((f) => !!f),
    toFlatten: mappedFields.map((f) => {
      let firstPart = f;
      if (f.indexOf('.') > -1) {
        firstPart = f.substring(0, f.indexOf('.'));
      }
      if (descriptionFieldsSpec.indexOf(firstPart) > -1) {
        return `descriptionUri.${f}`;
      }
      if (dataIndexFieldsSpec.indexOf(firstPart) > -1) {
        return f;
      }
      return null;
    }).filter((f) => !!f),
    toDrop: mappedFields.map((f) => toDropSpec.indexOf(f) > -1 ? f : null).filter((f) => !!f),
  };
};

const _airlineFields = (fields, defaults) => {
  fields = fields || defaults;
  const fieldsArray = Array.isArray(fields) ? fields : fields.split(',');
  const required = ['dataFormatVersion'];
  return _calculateFields(
    _.uniq(fieldsArray.concat(required)),
    mapAirlineFieldsFromQuery,
    AIRLINE_ONCHAIN_FIELDS,
    AIRLINE_DESCRIPTION_FIELDS,
    AIRLINE_DATAINDEX_FIELDS,
    required.map((f) => fields.indexOf(f) === -1 ? f : null)
  );
};

const _hotelFields = (fields, defaults) => {
  fields = fields || defaults;
  const fieldsArray = Array.isArray(fields) ? fields : fields.split(',');
  const required = ['dataFormatVersion', 'guarantee'];
  return _calculateFields(
    _.uniq(fieldsArray.concat(required)),
    mapHotelFieldsFromQuery,
    HOTEL_ONCHAIN_FIELDS,
    HOTEL_DESCRIPTION_FIELDS,
    HOTEL_DATAINDEX_FIELDS,
    required.map((f) => fields.indexOf(f) === -1 ? f : null)
  );
};

// TODO always include dataFormatVersion, guarantee
const calculateHotelFields = (fields) => {
  return _hotelFields(fields, HOTEL_DEFAULT_FIELDS);
};

const calculateHotelsFields = (fields) => {
  return _hotelFields(fields, HOTEL_DEFAULT_FIELDS_LIST);
};

const calculateAirlineFields = (fields) => {
  return _airlineFields(fields, AIRLINE_DEFAULT_FIELDS);
};

const calculateAirlinesFields = (fields) => {
  return _airlineFields(fields, AIRLINE_DEFAULT_FIELDS_LIST);
};

module.exports = {
  _calculateFields,
  _airlineFields,
  _hotelFields,
  calculateAirlineFields,
  calculateAirlinesFields,
  calculateHotelFields,
  calculateHotelsFields,
};
