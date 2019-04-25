const { AIRLINE_SEGMENT_ID, HOTEL_SEGMENT_ID } = require('../constants');

const { config } = require('../config');

function getInstance () {
  return config.wtLibs;
}

function _setIndexAddress (address, segment) {
  config.wtIndexAddresses[segment] = address;
}

async function getWTHotelIndex () {
  const wtLibsInstance = getInstance();
  return wtLibsInstance.getWTIndex(HOTEL_SEGMENT_ID, config.wtIndexAddresses[HOTEL_SEGMENT_ID]);
}

async function getWTAirlineIndex () {
  const wtLibsInstance = getInstance();
  return wtLibsInstance.getWTIndex(AIRLINE_SEGMENT_ID, config.wtIndexAddresses[AIRLINE_SEGMENT_ID]);
}

module.exports = {
  getInstance,
  getWTHotelIndex,
  getWTAirlineIndex,
  _setIndexAddress,
};
