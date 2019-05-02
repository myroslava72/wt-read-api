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

function getTrustClueClient () {
  const wtLibsInstance = getInstance();
  return wtLibsInstance.getTrustClueClient();
}

// 0x87265a62c60247f862b9149423061b36b460f4bb responds with true for dev-net
async function passesTrustworthinessTest (address) {
  const wtLibsInstance = getInstance();
  const trustClueClient = wtLibsInstance.getTrustClueClient();
  const trustworthinessTestResults = await trustClueClient.interpretAllValues(address);
  console.log(trustworthinessTestResults);
  return trustworthinessTestResults
    .map((v) => v.value === true)
    .indexOf(false) === -1;
}

module.exports = {
  getInstance,
  getWTHotelIndex,
  getWTAirlineIndex,
  getTrustClueClient,
  passesTrustworthinessTest,
  _setIndexAddress,
};
