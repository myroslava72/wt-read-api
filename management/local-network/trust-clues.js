const Web3 = require('web3');
const CuratedListContract = require('@windingtree/trust-clue-curated-list/build/contracts/CuratedList.json');

const { getContractWithProvider } = require('./utils');

const provider = new Web3.providers.HttpProvider('http://localhost:8545');
const web3 = new Web3(provider);

const deployCuratedListTrustClue = async () => {
  const listContract = getContractWithProvider(CuratedListContract, provider);
  const accounts = await web3.eth.getAccounts();
  const curatedList = await listContract.new({
    from: accounts[0],
    gas: 6000000,
  });
  await curatedList.addMember(accounts[0], {
    from: accounts[0],
    gas: 6000000,
  });
  return curatedList;
};

module.exports = {
  deployCuratedListTrustClue,
};
