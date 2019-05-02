const YAML = require('yamljs');
const path = require('path');
const {
  mapAirlineFieldsFromQuery,
  mapHotelFieldsFromQuery,
} = require('./property-mapping');
const swaggerDocument = YAML.load(path.resolve(__dirname, '../../docs/swagger.yaml'));

const getListOfFieldsFromSwagger = (schema) => {
  try {
    return Object.keys(swaggerDocument.components.schemas[schema].properties);
  } catch (e) {
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
// address conflicts with a postal address fields
const HOTEL_ONCHAIN_FIELDS = getListOfFieldsFromSwagger('windingtree-wt-hotel-schemas-HotelOnChain').filter((f) => f !== 'address');
const HOTEL_DESCRIPTION_FIELDS = getListOfFieldsFromSwagger('windingtree-wt-hotel-schemas-HotelDescriptionBase');
const HOTEL_DATAURI_FIELDS = getListOfFieldsFromSwagger('windingtree-wt-hotel-schemas-HotelDataIndex');

const AIRLINE_DEFAULT_FIELDS_LIST = [
  'id',
  'name',
  'code',
  'defaultCancellationAmount',
  'contacts',
];
const AIRLINE_DEFAULT_FIELDS = AIRLINE_DEFAULT_FIELDS_LIST.concat(['code', 'currency']);
// address conflicts with a postal address fields
const AIRLINE_ONCHAIN_FIELDS = getListOfFieldsFromSwagger('windingtree-wt-airline-schemas-AirlineOnChain').filter((f) => f !== 'address');
const AIRLINE_DESCRIPTION_FIELDS = getListOfFieldsFromSwagger('windingtree-wt-airline-schemas-AirlineDescriptionBase');
const AIRLINE_DATAURI_FIELDS = getListOfFieldsFromSwagger('windingtree-wt-airline-schemas-AirlineDataIndex');

const _calculateFields = (fields, defaults, mappingSpec, onChainFieldsSpec, descriptionFieldsSpec, dataUriFieldsSpec) => {
  fields = fields || defaults;
  const fieldsArray = Array.isArray(fields) ? fields : fields.split(',');
  const mappedFields = mappingSpec(fieldsArray);
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
      if (dataUriFieldsSpec.indexOf(firstPart) > -1) {
        return f;
      }
      return null;
    }).filter((f) => !!f),
  };
};

const _airlineFields = (fields, defaults) => {
  return _calculateFields(
    fields,
    defaults,
    mapAirlineFieldsFromQuery,
    AIRLINE_ONCHAIN_FIELDS,
    AIRLINE_DESCRIPTION_FIELDS,
    AIRLINE_DATAURI_FIELDS
  );
};

const _hotelFields = (fields, defaults) => {
  return _calculateFields(
    fields,
    defaults,
    mapHotelFieldsFromQuery,
    HOTEL_ONCHAIN_FIELDS,
    HOTEL_DESCRIPTION_FIELDS,
    HOTEL_DATAURI_FIELDS
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
