const InMemoryAdapter = require('@windingtree/off-chain-adapter-in-memory');
const SwarmAdapter = require('@windingtree/off-chain-adapter-swarm');
const HttpAdapter = require('@windingtree/off-chain-adapter-http');
const { getTrustCluesConfig } = require('../services/trust-clues');

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

if (convertEnvVarToBoolean(process.env.ADAPTER_IN_MEMORY, false)) {
  offChainAdapters['in-memory'] = {
    create: (options) => {
      return new InMemoryAdapter(options);
    },
  };
}

if (convertEnvVarToBoolean(process.env.ADAPTER_SWARM, true)) {
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

if (convertEnvVarToBoolean(process.env.ADAPTER_HTTPS, true)) {
  offChainAdapters.https = {
    create: () => {
      return new HttpAdapter();
    },
  };
}

module.exports = {
  directoryAddresses: {
    hotels: process.env.WT_HOTEL_DIRECTORY_ADDRESS,
    airlines: process.env.WT_AIRLINE_DIRECTORY_ADDRESS,
  },
  factoryAddresses: {
    hotels: process.env.WT_HOTEL_FACTORY_ADDRESS,
    airlines: process.env.WT_AIRLINE_FACTORY_ADDRESS,
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
    trustClueOptions: getTrustCluesConfig(process.env.ETH_NETWORK_PROVIDER, {
      curatedListAddress: process.env.TRUST_CLUES_CURATED_LIST_ADDRESS,
    }),
  },
};
