let { config } = require('../config');

function getInstance () {
  return config.wtLibs;
}

function _setConfig (c) {
  config = c;
}

async function getWTHotelIndex () {
  const wtLibsInstance = getInstance();
  return wtLibsInstance.getWTIndex(config.wtIndexAddress);
}

async function getWTAirlineIndex () {
  const wtLibsInstance = getInstance();
  return wtLibsInstance.getWTIndex(config.wtIndexAddress);
}

module.exports = {
  getInstance,
  _setConfig,
  getWTHotelIndex,
  getWTAirlineIndex,
};
