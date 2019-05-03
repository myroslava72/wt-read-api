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

async function passesTrustworthinessTest (hotelAddress, guarantee) {
  const wtLibsInstance = getInstance();
  const trustClueClient = wtLibsInstance.getTrustClueClient();
  try {
    // 1. decode guarantor from guarantee
    const data = trustClueClient.verifyAndDecodeSignedData(guarantee.claim, guarantee.signature, 'guarantor');
    if (hotelAddress !== data.hotel) {
      throw new Error(`Guarantee seems to be for a different hotel at ${data.hotel}.`);
    }
    if ((new Date()).getTime() > data.expiresAt) {
      throw new Error(`Guarantee expired at ${new Date(data.expiresAt)}`);
    }
    // 2. check guarantors trust levels
    const trustworthinessTestResults = await trustClueClient.interpretAllValues(data.guarantor);
    // 3. return single boolean value - this expects all clues to have interpret function that returns boolean
    return trustworthinessTestResults
      .map((v) => v.value === true)
      .indexOf(false) === -1;
  } catch (e) {
    config.logger.warn(`Cannot establish trust level for '${hotelAddress}': ${e.toString()}`);
    return false;
  }
}

module.exports = {
  getInstance,
  getWTHotelIndex,
  getWTAirlineIndex,
  getTrustClueClient,
  passesTrustworthinessTest,
  _setIndexAddress,
};
