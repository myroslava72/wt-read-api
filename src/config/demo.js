const SwarmAdapter = require('@windingtree/off-chain-adapter-swarm');
const HttpAdapter = require('@windingtree/off-chain-adapter-http');

module.exports = {
  directoryAddresses: {
    hotels: '0xad98e1eCcB4Db6c4BB5a03ee9989a583F0821473',
    airlines: '0xC3f87605886A190a3802d2328EEA496FCd413C2e',
  },
  factoryAddresses: {
    hotels: 'TBD',
    airlines: 'TBD',
  },
  baseUrl: 'https://demo-api.windingtree.com',
  ethNetwork: 'ropsten',
  wtLibsOptions: {
    onChainDataOptions: {
      provider: process.env.ETH_NETWORK_PROVIDER,
    },
    offChainDataOptions: {
      adapters: {
        'bzz-raw': {
          options: {
            swarmProviderUrl: 'https://swarm.windingtree.com/',
            timeoutRead: 1000,
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
};
