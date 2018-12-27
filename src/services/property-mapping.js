const hotelMapping = {
  manager: 'managerAddress',
};

const mapHotelObjectToResponse = (hotel) => {
  return Object.keys(hotel).reduce((newHotel, field) => {
    const newField = hotelMapping[field] || field;
    newHotel[newField] = hotel[field];
    return newHotel;
  }, {});
};

const fieldMapping = {
  managerAddress: 'manager',
  ratePlans: 'ratePlansUri',
  availability: 'availabilityUri',
};
const reversedFieldMapping = Object.keys(fieldMapping).reduce((reversed, field) => { reversed[fieldMapping[field]] = field; return reversed; }, {});

const mapHotelFieldsFromQuery = (fields) => {
  return fields.reduce((newFields, field) => {
    const newField = field.split('.').map((f) => fieldMapping[f] || f).join('.');
    newFields.push(newField);
    return newFields;
  }, []);
};

module.exports = {
  mapHotelObjectToResponse,
  mapHotelFieldsFromQuery,
  REVERSED_FIELD_MAPPING: reversedFieldMapping,
};
