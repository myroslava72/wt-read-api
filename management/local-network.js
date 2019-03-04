const TruffleContract = require('truffle-contract');
const Web3 = require('web3');
const WTHotelIndexContract = require('@windingtree/wt-contracts/build/contracts/WTHotelIndex');
const WTAirlineIndexContract = require('@windingtree/wt-contracts/build/contracts/WTAirlineIndex');

const provider = new Web3.providers.HttpProvider('http://localhost:8545');
const web3 = new Web3(provider);

const { DATA_FORMAT_VERSION } = require('../src/constants');

const getContractWithProvider = (metadata, provider) => {
  let contract = new TruffleContract(metadata);
  contract.setProvider(provider);
  return contract;
};

const deployHotelIndex = async () => {
  const indexContract = getContractWithProvider(WTHotelIndexContract, provider);
  const accounts = await web3.eth.getAccounts();
  return indexContract.new({
    from: accounts[0],
    gas: 6000000,
  });
};

const deployFullHotel = async (offChainDataAdapter, index, hotelDescription, ratePlans, availability, dataFormatVersion) => {
  const accounts = await web3.eth.getAccounts();
  const indexFile = {};

  if (hotelDescription) {
    indexFile['descriptionUri'] = await offChainDataAdapter.upload(hotelDescription);
  }
  if (ratePlans) {
    indexFile['ratePlansUri'] = await offChainDataAdapter.upload(ratePlans);
  }
  if (availability) {
    indexFile['availabilityUri'] = await offChainDataAdapter.upload(availability);
  }
  indexFile.notificationsUri = 'https://notifications.example';
  indexFile.bookingUri = 'https://booking.example';
  indexFile.dataFormatVersion = dataFormatVersion || DATA_FORMAT_VERSION;
  indexFile.defaultLocale = 'en';
  const dataUri = await offChainDataAdapter.upload(indexFile);

  const registerResult = await index.registerHotel(dataUri, {
    from: accounts[0],
    gas: 6000000,
  });
  return web3.utils.toChecksumAddress(registerResult.logs[0].args.hotel);
};

const deployAirlineIndex = async () => {
  const indexContract = getContractWithProvider(WTAirlineIndexContract, provider);
  const accounts = await web3.eth.getAccounts();
  return indexContract.new({
    from: accounts[0],
    gas: 6000000,
  });
};

const deployFullAirline = async (offChainDataAdapter, index, airlineDescription, flights, flightInstances, dataFormatVersion) => {
  const accounts = await web3.eth.getAccounts();
  const indexFile = {};

  if (flightInstances) {
    for (let flight of flights.items) {
      flight['flightInstancesUri'] = await offChainDataAdapter.upload(flightInstances);
    }
  }
  if (airlineDescription) {
    indexFile['descriptionUri'] = await offChainDataAdapter.upload(airlineDescription);
  }
  if (flights) {
    indexFile['flightsUri'] = await offChainDataAdapter.upload(flights);
  }
  indexFile.notificationsUri = 'https://notifications.example';
  indexFile.bookingUri = 'https://booking.example';
  indexFile.dataFormatVersion = dataFormatVersion || DATA_FORMAT_VERSION;
  const dataUri = await offChainDataAdapter.upload(indexFile);

  const registerResult = await index.registerAirline(dataUri, {
    from: accounts[0],
    gas: 6000000,
  });
  return web3.utils.toChecksumAddress(registerResult.logs[0].args.airline);
};

module.exports = {
  deployHotelIndex,
  deployFullHotel,
  deployAirlineIndex,
  deployFullAirline,
};
