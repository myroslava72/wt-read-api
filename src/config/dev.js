const winston = require('winston');

const WtJsLibs = require('@windingtree/wt-js-libs');
const InMemoryAdapter = require('@windingtree/off-chain-adapter-in-memory');
const SwarmAdapter = require('@windingtree/off-chain-adapter-swarm');
const HttpAdapter = require('@windingtree/off-chain-adapter-http');

const { deployHotelIndex, deployFullHotel, deployAirlineIndex, deployFullAirline } = require('../../management/local-network');
const {
  HOTEL_DESCRIPTION,
  RATE_PLANS,
  AVAILABILITY,
  AIRLINE_DESCRIPTION,
  AIRLINE_FLIGHTS,
  FLIGHT_INSTANCES,
} = require('../../test/utils/test-data');

const { AIRLINE_SEGMENT_ID, HOTEL_SEGMENT_ID } = require('../constants');

module.exports = {
  port: 3000,
  baseUrl: 'http://localhost:3000',
  wtIndexAddress: 'will-be-set-during-init',
  ethNetwork: 'local',
  wtLibs: WtJsLibs.createInstance({
    segment: process.env.WT_SEGMENT,
    dataModelOptions: {
      provider: 'http://localhost:8545',
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
  }),
  networkSetup: async (currentConfig) => {
    if (process.env.WT_SEGMENT === HOTEL_SEGMENT_ID) {
      const indexContract = await deployHotelIndex();
      currentConfig.wtIndexAddress = indexContract.address;
      currentConfig.logger.info(`Winding Tree hotel index deployed to ${currentConfig.wtIndexAddress}`);

      const hotelAddress = await deployFullHotel(await currentConfig.wtLibs.getOffChainDataClient('in-memory'), indexContract, HOTEL_DESCRIPTION, RATE_PLANS, AVAILABILITY);
      currentConfig.logger.info(`Example hotel deployed to ${hotelAddress}`);
    } else if (process.env.WT_SEGMENT === AIRLINE_SEGMENT_ID) {
      const indexContract = await deployAirlineIndex();
      currentConfig.wtIndexAddress = indexContract.address;
      currentConfig.logger.info(`Winding Tree airline index deployed to ${currentConfig.wtIndexAddress}`);

      const airlineAddress = await deployFullAirline(await currentConfig.wtLibs.getOffChainDataClient('in-memory'), indexContract, AIRLINE_DESCRIPTION, AIRLINE_FLIGHTS, FLIGHT_INSTANCES);
      currentConfig.logger.info(`Example airline deployed to ${airlineAddress}`);
    } else {
      throw new Error(`Invalid WT_SEGMENT: ${process.env.WT_SEGMENT}`);
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
