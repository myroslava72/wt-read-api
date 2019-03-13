const { AIRLINE_SEGMENT_ID, HOTEL_SEGMENT_ID } = require('../constants');

const { config } = require('../config');

function getInstance (segment) {
  return config.wtLibs[segment];
}

function _setIndexAddress (address, segment) {
  config.wtIndexAddresses[segment] = address;
}

async function getWTHotelIndex () {
  const wtLibsInstance = getInstance(HOTEL_SEGMENT_ID);
  return wtLibsInstance.getWTIndex(config.wtIndexAddresses[HOTEL_SEGMENT_ID]);
}

async function getWTAirlineIndex () {
  const wtLibsInstance = getInstance(AIRLINE_SEGMENT_ID);
  return wtLibsInstance.getWTIndex(config.wtIndexAddresses[AIRLINE_SEGMENT_ID]);
}

module.exports = {
  getInstance,
  getWTHotelIndex,
  getWTAirlineIndex,
  _setIndexAddress,
};
