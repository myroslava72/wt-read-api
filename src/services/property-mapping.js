const hotelMappingToResponse = {
  owner: 'ownerAddress',
};
const airlineMappingToResponse = {
  owner: 'ownerAddress',
};
const ancillaryMappingToResponse = {
  owner: 'ownerAddress',
};

const mapObjectToResponse = (obj, mapping) => {
  return Object.keys(obj).reduce((newObj, field) => {
    const newField = mapping[field] || field;
    newObj[newField] = obj[field];
    return newObj;
  }, {});
};

const mapHotelObjectToResponse = (hotel) => mapObjectToResponse(hotel, hotelMappingToResponse);
const mapAirlineObjectToResponse = (airline) => mapObjectToResponse(airline, airlineMappingToResponse);
const mapAncillaryObjectToResponse = (ancillary) => mapObjectToResponse(ancillary, ancillaryMappingToResponse);

const hotelMappingFromQuery = {
  ownerAddress: 'owner',
  ratePlans: 'ratePlansUri',
  availability: 'availabilityUri',
};
const airlineMappingFromQuery = {
  ownerAddress: 'owner',
  flights: 'flightsUri',
  flightInstances: 'flightInstancesUri',
};
const ancillaryMappingFromQuery = {
  ownerAddress: 'owner',
  ancillaries: 'ancillariesUri',
  ancillaryInstances: 'ancillaryInstancesUri',
};

const REVERSED_HOTEL_FIELD_MAPPING = Object.keys(hotelMappingFromQuery).reduce((reversed, field) => { reversed[hotelMappingFromQuery[field]] = field; return reversed; }, {});
const REVERSED_AIRLINE_FIELD_MAPPING = Object.keys(airlineMappingFromQuery).reduce((reversed, field) => { reversed[airlineMappingFromQuery[field]] = field; return reversed; }, {});
const REVERSED_ANCILLARY_FIELD_MAPPING = Object.keys(ancillaryMappingFromQuery).reduce((reversed, field) => { reversed[ancillaryMappingFromQuery[field]] = field; return reversed; }, {});

const mapFieldsFromQuery = (fields, mapping) => {
  return fields.reduce((newFields, field) => {
    const newField = field.split('.').map((f) => mapping[f] || f).join('.');
    newFields.push(newField);
    return newFields;
  }, []);
};
const mapHotelFieldsFromQuery = (fields) => mapFieldsFromQuery(fields, hotelMappingFromQuery);
const mapAirlineFieldsFromQuery = (fields) => mapFieldsFromQuery(fields, airlineMappingFromQuery);
const mapAncillaryFieldsFromQuery = (fields) => mapFieldsFromQuery(fields, ancillaryMappingFromQuery);

module.exports = {
  mapHotelObjectToResponse,
  mapHotelFieldsFromQuery,
  REVERSED_HOTEL_FIELD_MAPPING,
  mapAirlineObjectToResponse,
  mapAirlineFieldsFromQuery,
  REVERSED_AIRLINE_FIELD_MAPPING,
  mapAncillaryObjectToResponse,
  mapAncillaryFieldsFromQuery,
  REVERSED_ANCILLARY_FIELD_MAPPING,
};
