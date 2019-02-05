const WtJsLibs = require('@windingtree/wt-js-libs');
const InMemoryAdapter = require('@windingtree/off-chain-adapter-in-memory');
const SwarmAdapter = require('@windingtree/off-chain-adapter-swarm');
const HttpAdapter = require('@windingtree/off-chain-adapter-http');

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
  wtIndexAddress: process.env.WT_INDEX_ADDRESS,
  port: process.env.PORT || 3000,
  baseUrl: process.env.BASE_URL,
  ethNetwork: process.env.ETH_NETWORK_NAME,
  wtLibs: WtJsLibs.createInstance({
    segment: process.env.WT_SEGMENT,
    dataModelOptions: {
      provider: process.env.ETH_NETWORK_PROVIDER,
    },
    offChainDataOptions: {
      adapters: offChainAdapters,
    },
  }),
};
