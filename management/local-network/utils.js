const TruffleContract = require('truffle-contract');

const getContractWithProvider = (metadata, provider) => {
  let contract = new TruffleContract(metadata);
  contract.setProvider(provider);
  return contract;
};

module.exports = {
  getContractWithProvider,
};
