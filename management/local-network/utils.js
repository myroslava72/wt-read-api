const { deployLifToken } = require('./trust-clues');
const { AIRLINE_SEGMENT_ID, HOTEL_SEGMENT_ID } = require('../../src/constants');
const lib = require('zos-lib');
const Web3 = require('web3');

const provider = new Web3.providers.HttpProvider('http://localhost:8545');
const web3 = new Web3(provider);

const deployApp = async (web3, lifTokenContract, segment) => {
  // Setup a local copy of zos package for wt-contracts
  const ZWeb3 = lib.ZWeb3;
  ZWeb3.initialize(web3.currentProvider);
  const Contracts = lib.Contracts;
  Contracts.setArtifactsDefaults({
    gas: 6721975,
    gasPrice: 100000000000,
  });

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
  const directory = await project.createProxy(SegmentDirectory, {
    initFunction: 'initialize',
    initArgs: [accounts[4], segment, lifTokenContract.address],
    from: accounts[4],
  });

  return {
    directory,
    factory,
  };
};

const deployAirlineApp = async (config) => {
  const lifTokenContract = await deployLifToken();
  const app = await deployApp(web3, lifTokenContract, 'airlines');
  config.directoryAddresses[AIRLINE_SEGMENT_ID] = app.directory.address;
  config.factoryAddresses[AIRLINE_SEGMENT_ID] = app.factory.address;
  return app;
};

const deployHotelApp = async (config) => {
  const lifTokenContract = await deployLifToken();
  const app = await deployApp(web3, lifTokenContract, 'hotels');
  config.directoryAddresses[HOTEL_SEGMENT_ID] = app.directory.address;
  config.factoryAddresses[HOTEL_SEGMENT_ID] = app.factory.address;
  return app;
};

module.exports = {
  deployApp,
  deployHotelApp,
  deployAirlineApp,
};
