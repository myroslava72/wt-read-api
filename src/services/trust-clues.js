const { TrustClueCuratedList } = require('@windingtree/trust-clue-curated-list');

const getConfiguredCuratedList = (clues, web3Provider, options) => {
  if (options.curatedListAddress) {
    clues['curated-list'] = {
      options: {
        provider: web3Provider,
        address: options.curatedListAddress,
      },
      create: async (options) => {
        return new TrustClueCuratedList(options);
      },
    };
  }
};

const getTrustCluesConfig = (web3Provider, options = {}) => {
  const clues = {};
  // All of the supported trust clues
  getConfiguredCuratedList(clues, web3Provider, options);
  return {
    provider: web3Provider,
    clues: clues,
  };
};

module.exports = {
  getTrustCluesConfig,
};
