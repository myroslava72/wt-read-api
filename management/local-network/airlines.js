const Web3 = require('web3');
const { WTAirlineIndexContract } = require('@windingtree/wt-contracts');
const { getContractWithProvider } = require('./utils');

const provider = new Web3.providers.HttpProvider('http://localhost:8545');
const web3 = new Web3(provider);

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
    from: accounts[0],
  });
  return airlineIndex;
};

const deployFullAirline = async (dataFormatVersion, offChainDataAdapter, index, airlineDescription, flights, flightInstances) => {
  const accounts = await web3.eth.getAccounts();
  const indexFile = {};

  if (flightInstances) {
    for (let flight of flights.items) {
      flight.flightInstancesUri = await offChainDataAdapter.upload(flightInstances);
    }
  }
  if (airlineDescription) {
    indexFile.descriptionUri = await offChainDataAdapter.upload(airlineDescription);
  }
  if (flights) {
    indexFile.flightsUri = await offChainDataAdapter.upload(flights);
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
  deployAirlineIndex,
  deployFullAirline,
};
