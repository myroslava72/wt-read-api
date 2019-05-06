const InMemoryAdapter = require('@windingtree/off-chain-adapter-in-memory');
const SwarmAdapter = require('@windingtree/off-chain-adapter-swarm');
const HttpAdapter = require('@windingtree/off-chain-adapter-http');

const convertEnvVarToBoolean = (val, defaults) => {
  if (val === undefined) {
    return defaults;
  }
  switch (val.toLowerCase().trim()) {
  case '1':
  case 'true':
  case 'yes':
    return true;
  case '0':
  case 'false':
  case 'no':
    return false;
  default:
    return defaults;
  }
};

const offChainAdapters = {};

if (process.env.ADAPTER_IN_MEMORY) {
  offChainAdapters['in-memory'] = {
    create: (options) => {
      return new InMemoryAdapter(options);
    },
  };
}

if (process.env.ADAPTER_SWARM) {
  offChainAdapters['bzz-raw'] = {
    options: {
      swarmProviderUrl: process.env.ADAPTER_SWARM_GATEWAY,
      timeoutRead: process.env.ADAPTER_SWARM_READ_TIMEOUT || 1000,
    },
    create: (options) => {
      return new SwarmAdapter(options);
    },
  };
}

if (process.env.ADAPTER_HTTPS) {
  offChainAdapters.https = {
    create: () => {
      return new HttpAdapter();
    },
  };
}

module.exports = {
  wtIndexAddresses: {
    hotels: process.env.WT_HOTEL_INDEX_ADDRESS,
    airlines: process.env.WT_AIRLINE_INDEX_ADDRESS,
  },
  port: process.env.PORT || 3000,
  baseUrl: process.env.BASE_URL,
  ethNetwork: process.env.ETH_NETWORK_NAME,
  checkTrustClues: convertEnvVarToBoolean(process.env.TRUST_CLUES_CHECK, true),
  wtLibsOptions: {
    onChainDataOptions: {
      provider: process.env.ETH_NETWORK_PROVIDER,
    },
    offChainDataOptions: {
      adapters: offChainAdapters,
    },
  },
};
