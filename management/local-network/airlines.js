const Web3 = require('web3');
const lib = require('zos-lib');
const { getSchemaVersion } = require('../../test/utils/schemas');

const provider = new Web3.providers.HttpProvider('http://localhost:8545');
const web3 = new Web3(provider);


// Setup a local copy of zos package for wt-contracts
const ZWeb3 = lib.ZWeb3;
ZWeb3.initialize(web3.currentProvider);
const Contracts = lib.Contracts;
Contracts.setArtifactsDefaults({
  gas: 6721975,
  gasPrice: 100000000000,
});
const Organization = Contracts.getFromNodeModules('@windingtree/wt-contracts', 'Organization');

const deployAirlineDirectory = async (lifTokenContract) => {
    const accounts = await web3.eth.getAccounts();

    // setup the project with all the proxies
    const project = await lib.AppProject.fetchOrDeploy('wt-contracts', '0.0.1');
    const Organization = Contracts.getFromNodeModules('@windingtree/wt-contracts', 'Organization');
    const OrganizationFactory = Contracts.getFromNodeModules('@windingtree/wt-contracts', 'OrganizationFactory');
    const SegmentDirectory = Contracts.getFromNodeModules('@windingtree/wt-contracts', 'SegmentDirectory');
    await project.setImplementation(Organization, 'Organization');
    await project.setImplementation(OrganizationFactory, 'OrganizationFactory');
    await project.setImplementation(SegmentDirectory, 'SegmentDirectory');

    // setup the factory proxy
    const factory = await project.createProxy(OrganizationFactory, {
      initFunction: 'initialize',
      initArgs: [accounts[4], project.getApp().address],
      from: accounts[4],
    });
    const airlineDirectory = await project.createProxy(SegmentDirectory, {
      initFunction: 'initialize',
      initArgs: [accounts[4], 'airlines', lifTokenContract.address],
      from: accounts[4],
    });

    return {
      directory: airlineDirectory,
      factory: factory,
    }
};

const deployFullAirline = async (dataFormatVersion, offChainDataAdapter, factory, directory, wtJsLibsWrapper, airlineDescription, flights, flightInstances) => {
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

  const orgJsonUri = await offChainDataAdapter.upload({
    'dataFormatVersion': getSchemaVersion('@windingtree/wt-airline-schemas'),
    'name': airlineDescription.name,
    'airline': {
      'name': airlineDescription.name,
      'apis': [
        {
          'entrypoint': dataUri,
          'format': 'windingtree',
        },
        {
          'entrypoint': 'http://dummy.restapiexample.com/api/v1/employees',
          'format': 'coolapi',
        },
      ],
    },
  });

  const airlineEvent = await factory.methods.createAndAddToDirectory(orgJsonUri, directory.address).send({ from: accounts[3] });
  return Organization.at(airlineEvent.events.OrganizationCreated.returnValues.organization);
};

module.exports = {
  deployAirlineDirectory,
  deployFullAirline,
};
