const Web3 = require('web3');
const TruffleContract = require('truffle-contract');
const CuratedListContract = require('@windingtree/trust-clue-curated-list/build/contracts/CuratedList.json');
const LifDeposit = require('@windingtree/trust-clue-lif-deposit/build/contracts/LifDeposit.json');
const LifTokenTest = require('@windingtree/lif-token/build/contracts/LifTokenTest.json');
const ENS = require('@ensdomains/ens/build/contracts/ENSRegistry.json');
const PublicResolver = require('@ensdomains/resolver/build/contracts/PublicResolver.json');
const TestRegistrar = require('@ensdomains/ens/build/contracts/TestRegistrar.json');
const namehash = require('eth-ens-namehash');

const getContractWithProvider = (metadata, provider) => {
  let contract = TruffleContract(metadata);
  contract.setProvider(provider);
  return contract;
};

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

const deployEnsRegistry = async () => {
  const ensContract = getContractWithProvider(ENS, provider);
  const accounts = await web3.eth.getAccounts();
  const ens = await ensContract.new({
    from: accounts[0],
    gas: 4700000,
  });
  return ens;
};

const setupEnsRegistry = async (ensContract, tokenContract) => {
  const resolverContract = getContractWithProvider(PublicResolver, provider);
  const registrarContract = getContractWithProvider(TestRegistrar, provider);
  const accounts = await web3.eth.getAccounts();
  const txOptions = {
    from: accounts[0],
    gas: 4700000,
  };

  const publicResolver = await resolverContract.new(ensContract.address, txOptions);
  await ensContract.setSubnodeOwner('0x0', web3.utils.sha3('eth'), accounts[0], txOptions);
  await ensContract.setResolver(namehash.hash('eth'), publicResolver.address, txOptions);
  const testRegistrar = await registrarContract.new(ensContract.address, namehash.hash('eth'), {
    from: accounts[0],
    gas: 4700000,
  });
  await ensContract.setSubnodeOwner('0x0', web3.utils.sha3('eth'), testRegistrar.address, txOptions);
  await testRegistrar.register(web3.utils.sha3('windingtree'), accounts[0], txOptions);
  await ensContract.setSubnodeOwner(namehash.hash('windingtree.eth'), web3.utils.sha3('token'), accounts[0], txOptions);
  await ensContract.setResolver(namehash.hash('token.windingtree.eth'), publicResolver.address, txOptions);
  await publicResolver.setAddr(namehash.hash('token.windingtree.eth'), tokenContract.address, txOptions);
};

const deployLifToken = async () => {
  const accounts = await web3.eth.getAccounts();
  const contract = getContractWithProvider(LifTokenTest, provider);
  const tokenContract = await contract.new({
    from: accounts[0],
    gas: 6000000,
  });
  await tokenContract.faucetLif({
    from: accounts[0],
    gas: 600000,
  });
  return tokenContract;
};

const deployLifDeposit = async (tokenContract, ensContract) => {
  const accounts = await web3.eth.getAccounts();
  const contract = getContractWithProvider(LifDeposit, provider);
  const depositContract = await contract.new(ensContract.address, {
    from: accounts[0],
    gas: 6000000,
  });

  await tokenContract.approve(depositContract.address, web3.utils.toWei('100', 'wei'), {
    from: accounts[0],
    gas: 6000000,
  });
  await depositContract.addDeposit(web3.utils.toWei('12', 'wei'), {
    from: accounts[0],
    gas: 6000000,
  });
  return depositContract;
};

const deployLifDepositTrustClue = async () => {
  const ensRegistry = await deployEnsRegistry();
  console.log(`ENS registry deployed to ${ensRegistry.address}`);
  const lifToken = await deployLifToken();
  console.log(`LIF token with faucet deployed to ${lifToken.address}`);
  await setupEnsRegistry(ensRegistry, lifToken);
  return deployLifDeposit(lifToken, ensRegistry);
};

module.exports = {
  deployLifToken,
  deployCuratedListTrustClue,
  deployLifDepositTrustClue,
};
