const SwarmAdapter = require('@windingtree/off-chain-adapter-swarm');
const HttpAdapter = require('@windingtree/off-chain-adapter-http');

module.exports = {
  wtIndexAddresses: {
    hotels: '0xfb562057d613175c850df65e435bb0824b65d319',
  },
  baseUrl: 'https://playground-api.windingtree.com',
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
