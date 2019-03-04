const hotelMappingToResponse = {
  manager: 'managerAddress',
};
const airlineMappingToResponse = {
  manager: 'managerAddress',
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

const hotelMappingFromQuery = {
  managerAddress: 'manager',
  ratePlans: 'ratePlansUri',
  availability: 'availabilityUri',
};
const airlineMappingFromQuery = {
  managerAddress: 'manager',
  flights: 'flightsUri',
  flightInstances: 'flightInstancesUri',
};
const REVERSED_HOTEL_FIELD_MAPPING = Object.keys(hotelMappingFromQuery).reduce((reversed, field) => { reversed[hotelMappingFromQuery[field]] = field; return reversed; }, {});
const REVERSED_AIRLINE_FIELD_MAPPING = Object.keys(airlineMappingFromQuery).reduce((reversed, field) => { reversed[airlineMappingFromQuery[field]] = field; return reversed; }, {});

const mapFieldsFromQuery = (fields, mapping) => {
  return fields.reduce((newFields, field) => {
    const newField = field.split('.').map((f) => mapping[f] || f).join('.');
    newFields.push(newField);
    return newFields;
  }, []);
};
const mapHotelFieldsFromQuery = (fields) => mapFieldsFromQuery(fields, hotelMappingFromQuery);
const mapAirlineFieldsFromQuery = (fields) => mapFieldsFromQuery(fields, airlineMappingFromQuery);

module.exports = {
  mapHotelObjectToResponse,
  mapHotelFieldsFromQuery,
  REVERSED_HOTEL_FIELD_MAPPING,
  mapAirlineObjectToResponse,
  mapAirlineFieldsFromQuery,
  REVERSED_AIRLINE_FIELD_MAPPING,
};
