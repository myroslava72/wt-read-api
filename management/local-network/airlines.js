const Web3 = require('web3');
const lib = require('zos-lib');
const { getSchemaVersion } = require('../../test/utils/schemas');

const provider = new Web3.providers.HttpProvider('http://localhost:8545');
const web3 = new Web3(provider);
const Contracts = lib.Contracts;
const Organization = Contracts.getFromNodeModules('@windingtree/wt-contracts', 'Organization');

const deployFullAirline = async (deploymentOptions, airlineDescription, flights, flightInstances) => {
  const dataFormatVersion = deploymentOptions.schemaVersion;
  const offChainDataAdapter = deploymentOptions.offChainDataClient;
  const app = deploymentOptions.app;

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

  const airlineEvent = await app.factory.methods.createAndAddToDirectory(orgJsonUri, app.directory.address).send({ from: accounts[3] });
  return Organization.at(airlineEvent.events.OrganizationCreated.returnValues.organization);
};

module.exports = {
  deployFullAirline,
};
