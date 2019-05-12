const { AIRLINE_SEGMENT_ID, HOTEL_SEGMENT_ID } = require('../constants');

const { config } = require('../config');

function getInstance () {
  return config.wtLibs;
}

function _setIndexAddress (address, segment) {
  config.wtIndexAddresses[segment] = address;
}

async function getWTHotelIndex () {
  return getInstance().getWTIndex(HOTEL_SEGMENT_ID, config.wtIndexAddresses[HOTEL_SEGMENT_ID]);
}

async function getWTAirlineIndex () {
  return getInstance().getWTIndex(AIRLINE_SEGMENT_ID, config.wtIndexAddresses[AIRLINE_SEGMENT_ID]);
}

function getTrustClueClient () {
  return getInstance().getTrustClueClient();
}

async function passesTrustworthinessTest (hotelAddress, guarantee) {
  if (!config.checkTrustClues) {
    return true;
  }
  if (!guarantee || !guarantee.claim || !guarantee.signature) {
    return false;
  }
  const trustClueClient = getInstance().getTrustClueClient();
  try {
    // 1. decode guarantor from guarantee
    const data = trustClueClient.verifyAndDecodeSignedData(guarantee.claim, guarantee.signature, 'guarantor');
    if (hotelAddress !== data.hotel) {
      throw new Error(`Guarantee seems to be for a different hotel at ${data.hotel}.`);
    }
    if (!data.expiresAt) {
      throw new Error('Guarantee has no expiration.');
    }
    if ((new Date()).getTime() > data.expiresAt) {
      throw new Error(`Guarantee expired at ${new Date(data.expiresAt)}.`);
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
