const winston = require('winston');
const InMemoryAdapter = require('@windingtree/off-chain-adapter-in-memory');
const Web3 = require('web3');

const provider = new Web3.providers.HttpProvider('http://localhost:8545');
const web3 = new Web3(provider);

module.exports = {
  port: 8100,
  baseUrl: 'http://example.com',
  directoryAddresses: {
    hotels: 'will-be-set-during-init',
    airlines: 'will-be-set-during-init',
  },
  factoryAddresses: {
    hotels: 'will-be-set-during-init',
    airlines: 'will-be-set-during-init',
  },
  ethNetwork: 'test',
  checkTrustClues: true,
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
    trustClueOptions: {
      provider: 'http://localhost:8545',
      clues: {
        'test-list': {
          create: async (options) => {
            const accounts = await web3.eth.getAccounts();
            return {
              getMetadata: () => ({
                name: 'test-list',
                description: '',
              }),
              getValueFor: (addr) => {
                return addr === accounts[0];
              },
              interpretValueFor: (addr) => {
                return addr === accounts[0];
              },
            };
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
