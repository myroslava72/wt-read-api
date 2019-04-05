const TruffleContract = require('truffle-contract');
const Web3 = require('web3');
const { WTHotelIndexContract, WTAirlineIndexContract } = require('@windingtree/wt-contracts');

const provider = new Web3.providers.HttpProvider('http://localhost:8545');
const web3 = new Web3(provider);

const getContractWithProvider = (metadata, provider) => {
  let contract = new TruffleContract(metadata);
  contract.setProvider(provider);
  return contract;
};

const deployHotelIndex = async () => {
  const indexContract = getContractWithProvider(WTHotelIndexContract, provider);
  const accounts = await web3.eth.getAccounts();
  const hotelIndex = await indexContract.new({
    from: accounts[0],
    gas: 6000000,
  });
  // we have to call initialize as it's not automatically called by zos proxies
  // because we don't use them for dev env
  await hotelIndex.initialize(accounts[0], accounts[1], {
    from: accounts[0]
  });
  return hotelIndex;
};

const deployFullHotel = async (dataFormatVersion, offChainDataAdapter, index, hotelDescription, ratePlans, availability) => {
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
  indexFile.dataFormatVersion = dataFormatVersion;
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
  const airlineIndex = await indexContract.new({
    from: accounts[0],
    gas: 6000000,
  });
  // we have to call initialize as it's not automatically called by zos proxies
  // because we don't use them for dev env
  await airlineIndex.initialize(accounts[0], accounts[1], {
    from: accounts[0]
  });
  return airlineIndex;
};

const deployFullAirline = async (dataFormatVersion, offChainDataAdapter, index, airlineDescription, flights, flightInstances) => {
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
  indexFile.dataFormatVersion = dataFormatVersion;
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
