const SwarmAdapter = require('@windingtree/off-chain-adapter-swarm');
const HttpAdapter = require('@windingtree/off-chain-adapter-http');

module.exports = {
  directoryAddresses: {
    hotels: '0x8ea119A7Ef0Ac4c1a83a3BB6D1aa1a3afcAfDE8b',
    airlines: '0x6f8Ab047Ccc0C8128Cc4d343Feb618065a13D965',
  },
  factoryAddresses: {
    hotels: '0x78D1548E03660093B51159De0E615ea8F6B9eaF9',
    airlines: '0x78D1548E03660093B51159De0E615ea8F6B9eaF9',
  },
  checkTrustClues: false,
  baseUrl: 'https://lisbon-api.windingtree.com',
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
