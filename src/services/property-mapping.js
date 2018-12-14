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
};
