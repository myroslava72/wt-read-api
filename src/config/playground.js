const SwarmAdapter = require('@windingtree/off-chain-adapter-swarm');
const HttpAdapter = require('@windingtree/off-chain-adapter-http');

module.exports = {
  directoryAddresses: {
    hotels: '0xB309875d8b24D522Ea0Ac57903c8A0b0C93C414A',
    airlines: '0x918154a7b2f37ca03e0D05283B5d0d781812DEB6',
  },
  factoryAddresses: {
    hotels: 'TBD',
    airlines: 'TBD',
  },
  baseUrl: 'https://playground-api.windingtree.com',
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
