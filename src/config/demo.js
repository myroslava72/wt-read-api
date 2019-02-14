const SwarmAdapter = require('@windingtree/off-chain-adapter-swarm');
const HttpAdapter = require('@windingtree/off-chain-adapter-http');

module.exports = {
  wtIndexAddresses: {
    hotels: '0xa433590275a3a1ebca247a230076d2d281f46a49',
  },
  baseUrl: 'https://demo-api.windingtree.com',
  ethNetwork: 'ropsten',
  wtLibsOptions: {
    dataModelOptions: {
      provider: process.env.ETH_NETWORK_PROVIDER || 'https://ropsten.infura.io/v3/',
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
