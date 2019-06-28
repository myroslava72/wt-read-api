const Web3Utils = require('web3-utils');
const { AIRLINE_SEGMENT_ID, HOTEL_SEGMENT_ID } = require('../constants');

const { config } = require('../config');

function getInstance () {
  return config.wtLibs;
}

function _setDirectoryAddress (address, segment) {
  config.directoryAddresses[segment] = address;
}

async function getHotelDirectory () {
  return getInstance().getDirectory(HOTEL_SEGMENT_ID, config.directoryAddresses[HOTEL_SEGMENT_ID]);
}

async function getAirlineDirectory () {
  return getInstance().getDirectory(AIRLINE_SEGMENT_ID, config.directoryAddresses[AIRLINE_SEGMENT_ID]);
}

async function getFactory (segment) {
  return getInstance().getFactory(config.factoryAddresses[segment]);
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
    // 1. decode guarantor from guarantee and verify signature
    const data = JSON.parse(Web3Utils.hexToUtf8(guarantee.claim));
    trustClueClient.verifySignedData(guarantee.claim, guarantee.signature, (actualSigner) => {
      if (hotelAddress !== data.hotel) {
        throw new Error(`Guarantee seems to be for a different hotel at ${data.hotel}.`);
      }
      if (!data.expiresAt) {
        throw new Error('Guarantee has no expiration.');
      }
      if ((new Date()).getTime() > data.expiresAt) {
        throw new Error(`Guarantee expired at ${new Date(data.expiresAt)}.`);
      }
      if (Web3Utils.toChecksumAddress(data.guarantor) !== actualSigner) {
        throw new Error(`Expected signer '${data.guarantor}' does not match the recovered one '${actualSigner}'`);
      }
    }
    );
    // 2. check guarantors trust levels
    const trustworthinessTestResults = await trustClueClient.interpretAllValues(data.guarantor);
    // 3. return single boolean value - this expects all clues to have interpret function that returns boolean
    return trustworthinessTestResults
      .map((v) => {
        if (!v.value) {
          console.warn(`Guarantor ${data.guarantor} for hotel ${data.hotel} does not pass ${v.name}`);
        }
        return v.value === true;
      })
      .indexOf(false) === -1;
  } catch (e) {
    config.logger.warn(`Cannot establish trust level for '${hotelAddress}': ${e.toString()}`);
    return false;
  }
}

module.exports = {
  getInstance,
  getFactory,
  getHotelDirectory,
  getAirlineDirectory,
  getTrustClueClient,
  passesTrustworthinessTest,
  _setDirectoryAddress,
};
