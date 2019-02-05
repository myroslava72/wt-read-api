const hotelMappingToResponse = {
  manager: 'managerAddress',
};
const airlineMappingToResponse = {
  manager: 'managerAddress',
};

const mapObjectToResponse = (hotel, mapping) => {
  return Object.keys(hotel).reduce((newHotel, field) => {
    const newField = mapping[field] || field;
    newHotel[newField] = hotel[field];
    return newHotel;
  }, {});
};
const mapHotelObjectToResponse = (hotel) => mapObjectToResponse(hotel, hotelMappingToResponse);
const mapAirlineObjectToResponse = (hotel) => mapObjectToResponse(hotel, airlineMappingToResponse);

const hotelMappingFromQuery = {
  managerAddress: 'manager',
  ratePlans: 'ratePlansUri',
  availability: 'availabilityUri',
};

const airlineMappingFromQuery = {
  managerAddress: 'manager',
  flights: 'flightsUri',
};

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
  mapAirlineObjectToResponse,
  mapAirlineFieldsFromQuery,
};
