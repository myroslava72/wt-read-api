const winston = require('winston');

const InMemoryAdapter = require('@windingtree/off-chain-adapter-in-memory');
const SwarmAdapter = require('@windingtree/off-chain-adapter-swarm');
const HttpAdapter = require('@windingtree/off-chain-adapter-http');
const { TrustClueCuratedList } = require('@windingtree/trust-clue-curated-list');
const { TrustClueLifDeposit } = require('@windingtree/trust-clue-lif-deposit');

const { deployHotelApp, deployFullHotel,
  deployAirlineApp, deployFullAirline,
  deployCuratedListTrustClue, deployLifDepositTrustClue,
} = require('../../management/local-network');
const { getSchemaVersion } = require('../../test/utils/schemas');
const {
  HOTEL_DESCRIPTION,
  RATE_PLANS,
  AVAILABILITY,
  AIRLINE_DESCRIPTION,
  AIRLINE_FLIGHTS,
  FLIGHT_INSTANCES,
} = require('../../test/utils/test-data');

const { AIRLINE_SEGMENT_ID, HOTEL_SEGMENT_ID } = require('../constants');
const web3ProviderAddress = 'http://localhost:8545';

module.exports = {
  port: 3000,
  baseUrl: 'http://localhost:3000',
  directoryAddresses: {
    hotels: 'will-be-set-during-init',
    airlines: 'will-be-set-during-init',
  },
  factoryAddresses: {
    hotels: 'will-be-set-during-init',
    airlines: 'will-be-set-during-init',
  },
  ethNetwork: 'local',
  checkTrustClues: false, // highly experimental
  wtLibsOptions: {
    onChainDataOptions: {
      provider: web3ProviderAddress,
    },
    offChainDataOptions: {
      adapters: {
        'in-memory': {
          create: (options) => {
            return new InMemoryAdapter(options);
          },
        },
        'bzz-raw': {
          options: {
            swarmProviderUrl: 'http://localhost:8500',
            timeoutRead: 500,
          },
          create: (options) => {
            return new SwarmAdapter(options);
          },
        },
        https: {
          create: () => {
            return new HttpAdapter();
          },
        },
      },
    },
    trustClueOptions: {
      provider: web3ProviderAddress,
      clues: {
        'curated-list': {
          options: {
            provider: web3ProviderAddress,
          },
          create: async (options) => {
            const curatedList = await deployCuratedListTrustClue();
            console.log(`Curated list deployed to ${curatedList.address}`);
            return new TrustClueCuratedList(Object.assign(options, {
              address: curatedList.address,
            }));
          },
        },
        'lif-deposit': {
          options: {
            provider: web3ProviderAddress,
            interpret: (v) => v.toNumber() > 10,
          },
          create: async (options) => {
            const lifDeposit = await deployLifDepositTrustClue();
            console.log(`LIF deposit deployed to ${lifDeposit.address}`);
            return new TrustClueLifDeposit(Object.assign(options, {
              address: lifDeposit.address,
            }));
          },
        },
      },
    },
  },
  networkSetup: async (currentConfig) => {
    const segmentsToStart = process.env.WT_SEGMENTS.split(',');
    if (segmentsToStart.indexOf(HOTEL_SEGMENT_ID) !== -1) {
      const hotelApp = await deployHotelApp(currentConfig);
      currentConfig.directoryAddresses[HOTEL_SEGMENT_ID] = hotelApp.directory.address;
      currentConfig.factoryAddresses[HOTEL_SEGMENT_ID] = hotelApp.factory.address;
      currentConfig.logger.info(`Winding Tree hotel directory deployed to ${hotelApp.directory.address}`);
      currentConfig.logger.info(`Winding Tree hotel factory deployed to ${hotelApp.factory.address}`);

      const hotel = await deployFullHotel({
        schemaVersion: getSchemaVersion('@windingtree/wt-hotel-schemas'),
        offChainDataClient: currentConfig.wtLibs.getOffChainDataClient('in-memory'),
        app: hotelApp,
      }, HOTEL_DESCRIPTION, RATE_PLANS, AVAILABILITY);
      currentConfig.logger.info(`Example hotel deployed to ${hotel.address}`);
    }
    if (segmentsToStart.indexOf(AIRLINE_SEGMENT_ID) !== -1) {
      const airlineApp = await deployAirlineApp(currentConfig);
      currentConfig.directoryAddresses[AIRLINE_SEGMENT_ID] = airlineApp.directory.address;
      currentConfig.factoryAddresses[AIRLINE_SEGMENT_ID] = airlineApp.factory.address;
      currentConfig.logger.info(`Winding Tree airline directory deployed to ${airlineApp.directory.address}`);
      currentConfig.logger.info(`Winding Tree airline factory deployed to ${airlineApp.factory.address}`);

      const airline = await deployFullAirline({
        schemaVersion: getSchemaVersion('@windingtree/wt-airline-schemas'),
        offChainDataClient: await currentConfig.wtLibs.getOffChainDataClient('in-memory'),
        app: airlineApp,
      }, AIRLINE_DESCRIPTION, AIRLINE_FLIGHTS, FLIGHT_INSTANCES);
      currentConfig.logger.info(`Example airline deployed to ${airline.address}`);
    }
  },
  logger: winston.createLogger({
    level: 'debug',
    transports: [
      new winston.transports.Console({
        format: winston.format.simple(),
        handleExceptions: true,
      }),
    ],
  }),
};
