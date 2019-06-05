const TruffleContract = require('truffle-contract');

const getContractWithProvider = (metadata, provider) => {
  let contract = TruffleContract(metadata);
  contract.setProvider(provider);
  return contract;
};

module.exports = {
  getContractWithProvider,
};
