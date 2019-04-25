const winston = require('winston');

const InMemoryAdapter = require('@windingtree/off-chain-adapter-in-memory');
const SwarmAdapter = require('@windingtree/off-chain-adapter-swarm');
const HttpAdapter = require('@windingtree/off-chain-adapter-http');

const { deployHotelIndex, deployFullHotel, deployAirlineIndex, deployFullAirline } = require('../../management/local-network');
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

module.exports = {
  port: 3000,
  baseUrl: 'http://localhost:3000',
  wtIndexAddresses: {
    hotels: 'will-be-set-during-init',
    airlines: 'will-be-set-during-init',
  },
  ethNetwork: 'local',
  wtLibsOptions: {
    onChainDataOptions: {
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
  },
  networkSetup: async (currentConfig) => {
    const segmentsToStart = process.env.WT_SEGMENTS.split(',');
    if (segmentsToStart.indexOf(HOTEL_SEGMENT_ID) !== -1) {
      const indexContract = await deployHotelIndex();
      currentConfig.wtIndexAddresses[HOTEL_SEGMENT_ID] = indexContract.address;
      currentConfig.logger.info(`Winding Tree hotel index deployed to ${indexContract.address}`);

      const hotelAddress = await deployFullHotel(getSchemaVersion('@windingtree/wt-hotel-schemas'), await currentConfig.wtLibs.getOffChainDataClient('in-memory'), indexContract, HOTEL_DESCRIPTION, RATE_PLANS, AVAILABILITY);
      currentConfig.logger.info(`Example hotel deployed to ${hotelAddress}`);
    }
    if (segmentsToStart.indexOf(AIRLINE_SEGMENT_ID) !== -1) {
      const indexContract = await deployAirlineIndex();
      currentConfig.wtIndexAddresses[AIRLINE_SEGMENT_ID] = indexContract.address;
      currentConfig.logger.info(`Winding Tree airline index deployed to ${indexContract.address}`);

      const airlineAddress = await deployFullAirline(getSchemaVersion('@windingtree/wt-airline-schemas'), await currentConfig.wtLibs.getOffChainDataClient('in-memory'), indexContract, AIRLINE_DESCRIPTION, AIRLINE_FLIGHTS, FLIGHT_INSTANCES);
      currentConfig.logger.info(`Example airline deployed to ${airlineAddress}`);
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
