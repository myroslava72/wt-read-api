const SwarmAdapter = require('@windingtree/off-chain-adapter-swarm');
const HttpAdapter = require('@windingtree/off-chain-adapter-http');

module.exports = {
  wtIndexAddresses: {
    hotels: '0xad98e1eCcB4Db6c4BB5a03ee9989a583F0821473',
  },
  baseUrl: 'https://demo-api.windingtree.com',
  ethNetwork: 'ropsten',
  wtLibsOptions: {
    dataModelOptions: {
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
