const Web3 = require('web3');
const lib = require('zos-lib');
const { getSchemaVersion } = require('../../test/utils/schemas');

const provider = new Web3.providers.HttpProvider('http://localhost:8545');
const web3 = new Web3(provider);
const Contracts = lib.Contracts;
const Organization = Contracts.getFromNodeModules('@windingtree/wt-contracts', 'Organization');

const deployFullHotel = async (deploymentOptions, hotelDescription, ratePlans, availability, ownerAcountIdx = 0) => {
  const dataFormatVersion = deploymentOptions.schemaVersion;
  const offChainDataAdapter = deploymentOptions.offChainDataClient;
  const app = deploymentOptions.app;

  const accounts = await web3.eth.getAccounts();
  const indexFile = {};

  if (hotelDescription) {
    indexFile.descriptionUri = await offChainDataAdapter.upload(hotelDescription);
  }
  if (ratePlans) {
    indexFile.ratePlansUri = await offChainDataAdapter.upload(ratePlans);
  }
  if (availability) {
    indexFile.availabilityUri = await offChainDataAdapter.upload(availability);
  }
  indexFile.notificationsUri = 'https://notifications.example';
  indexFile.bookingUri = 'https://booking.example';
  indexFile.dataFormatVersion = dataFormatVersion;
  indexFile.defaultLocale = 'en';
  const dataUri = await offChainDataAdapter.upload(indexFile);

  const orgJsonUri = await offChainDataAdapter.upload({
    'dataFormatVersion': getSchemaVersion('@windingtree/wt-hotel-schemas'),
    'name': hotelDescription.name,
    'hotel': {
      'name': hotelDescription.name,
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

  const hotelEvent = await app.factory.methods.createAndAddToDirectory(orgJsonUri, app.directory.address).send({ from: accounts[ownerAcountIdx] });
  const hotel = Organization.at(hotelEvent.events.OrganizationCreated.returnValues.organization);

  const monthFromNow = new Date();
  monthFromNow.setMonth(monthFromNow.getMonth() + 1);
  const rawClaim = {
    'hotel': hotel.address,
    'guarantor': accounts[ownerAcountIdx],
    'expiresAt': monthFromNow.getTime(),
  };
  const hexClaim = web3.utils.utf8ToHex(JSON.stringify(rawClaim));
  const signature = await web3.eth.sign(hexClaim, accounts[ownerAcountIdx]);
  indexFile.guarantee = {
    claim: hexClaim,
    signature: signature,
  };

  return hotel;
};

module.exports = {
  deployFullHotel,
};
