const winston = require('winston');
const InMemoryAdapter = require('@windingtree/off-chain-adapter-in-memory');

module.exports = {
  port: 8100,
  baseUrl: 'http://example.com',
  wtIndexAddresses: {
    hotels: 'will-be-set-during-init',
    airlines: 'will-be-set-during-init',
  },
  ethNetwork: 'test',
  wtLibsOptions: {
    onChainDataOptions: {
      provider: 'http://localhost:8545',
    },
    offChainDataOptions: {
      adapters: {
        'in-memory': {
          options: { },
          create: (options) => {
            return new InMemoryAdapter(options);
          },
        },
      },
    },
  },
  logger: winston.createLogger({
    level: 'warn',
    transports: [
      new winston.transports.Console({
        format: winston.format.simple(),
        handleExceptions: true,
      }),
    ],
  }),
};
