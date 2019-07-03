/* eslint-env mocha */
/* eslint-disable no-unused-expressions */
const { expect } = require('chai');
const sinon = require('sinon');
const Web3Utils = require('web3-utils');
const { getTrustClueClient, passesTrustworthinessTest } = require('../../src/services/wt-js-libs');
const { config } = require('../../src/config');

const Web3 = require('web3');
const provider = new Web3.providers.HttpProvider('http://localhost:8545');
const web3 = new Web3(provider);

describe('WtJsLibs wrapper', () => {
  describe('getTrustClueClient', () => {
    it('should call wtJsLibs', () => {
      const getClientSpy = sinon.spy(config.wtLibs, 'getTrustClueClient');
      const client = getTrustClueClient();
      expect(client).to.have.property('verifySignedData');
      expect(getClientSpy.callCount).to.be.equal(1);
      getClientSpy.restore();
    });
  });

  describe('passesTrustworthinessTest', () => {
    let origGetTrustClueClient, baseTrustClueClient, warnLogStub, guarantee;
    const hotelAddress = '0xDbdF9B636dF72dD35fB22bb105d8e1bB9a0957C8';
    let accounts;

    beforeEach(async () => {
      accounts = await web3.eth.getAccounts();
      origGetTrustClueClient = config.wtLibs.getTrustClueClient;
      baseTrustClueClient = {
        verifySignedData: (claim, sig, verFn) => verFn(accounts[0]),
        interpretAllValues: () => Promise.resolve([
          { name: 'test-clue', value: true },
          { name: 'test-clue-2', value: true },
        ]),
      };
      config.wtLibs.getTrustClueClient = () => (baseTrustClueClient);
      warnLogStub = sinon.stub(config.logger, 'warn');

      const monthFromNow = new Date();
      monthFromNow.setMonth(monthFromNow.getMonth() + 1);
      const rawClaim = {
        'hotel': hotelAddress,
        'guarantor': accounts[0],
        'expiresAt': monthFromNow.getTime(),
      };
      const hexClaim = web3.utils.utf8ToHex(JSON.stringify(rawClaim));
      guarantee = {
        claim: hexClaim,
        signature: await web3.eth.sign(hexClaim, accounts[0]),
      };
    });

    afterEach(() => {
      config.wtLibs.getTrustClueClient = origGetTrustClueClient;
      config.logger.warn.restore();
    });

    it('should always return true if no guarantee is required', async () => {
      config.checkTrustClues = false;
      expect(await passesTrustworthinessTest(hotelAddress, guarantee)).to.be.equal(true);
      expect(await passesTrustworthinessTest(hotelAddress, 'rubbish')).to.be.equal(true);
      expect(await passesTrustworthinessTest(hotelAddress, {
        claim: 'rubbish',
      })).to.be.equal(true);
      expect(await passesTrustworthinessTest(hotelAddress, {
        claim: 'rubbish',
        signature: 'rubbish',
      })).to.be.equal(true);
      config.checkTrustClues = true;
    });

    it('should return true if at all trust clues interpret as true', async () => {
      expect(await passesTrustworthinessTest(hotelAddress, guarantee)).to.be.equal(true);
    });

    it('should return false if no or malformed guarantee is provided but should be checked', async () => {
      expect(await passesTrustworthinessTest('123', undefined)).to.be.equal(false);
      expect(await passesTrustworthinessTest('123', {})).to.be.equal(false);
      expect(await passesTrustworthinessTest('123', { claim: guarantee.claim })).to.be.equal(false);
      expect(await passesTrustworthinessTest('123', { signature: guarantee.signature })).to.be.equal(false);
      expect(await passesTrustworthinessTest('123', { claim: 'rubbish' })).to.be.equal(false);
      expect(await passesTrustworthinessTest('123', { signature: 'rubbish' })).to.be.equal(false);
    });

    it('should return false and log if at least one trust clue interprets as false', async () => {
      baseTrustClueClient.interpretAllValues = () => Promise.resolve([
        { name: 'test-clue', value: true },
        { name: 'test-clue-2', value: false },
      ]);
      expect(await passesTrustworthinessTest(hotelAddress, guarantee)).to.be.equal(false);
    });

    it('should return false and log if signature is not verified', async () => {
      baseTrustClueClient.verifySignedData = () => {
        throw new Error('Signature not verified.');
      };
      expect(await passesTrustworthinessTest(hotelAddress, guarantee)).to.be.equal(false);
      expect(warnLogStub.callCount).to.be.eql(1);
      expect(warnLogStub.firstCall.args[0]).to.match(/signature not verified/i);
    });

    it('should return false and log if signer does not match', async () => {
      baseTrustClueClient.verifySignedData = (claim, sig, verFn) => verFn('1234');
      expect(await passesTrustworthinessTest(hotelAddress, guarantee)).to.be.equal(false);
      expect(warnLogStub.callCount).to.be.eql(1);
      expect(warnLogStub.firstCall.args[0]).to.match(/does not match/i);
    });

    it('should return false and log if guarantee has no hotel information', async () => {
      guarantee.claim = Web3Utils.utf8ToHex(JSON.stringify({
        guarantor: accounts[0],
        expiresAt: 1561364469000,
      }));
      expect(await passesTrustworthinessTest(hotelAddress, guarantee)).to.be.equal(false);
      expect(warnLogStub.callCount).to.be.eql(1);
      expect(warnLogStub.firstCall.args[0]).to.match(/for a different hotel/i);
    });

    it('should return false and log if hotelAddress does not match the guarantee', async () => {
      guarantee.claim = Web3Utils.utf8ToHex(JSON.stringify({
        hotel: '456',
        guarantor: accounts[0],
        expiresAt: 1561364469000,
      }));
      expect(await passesTrustworthinessTest(hotelAddress, guarantee)).to.be.equal(false);
      expect(warnLogStub.callCount).to.be.eql(1);
      expect(warnLogStub.firstCall.args[0]).to.match(/for a different hotel/i);
    });

    it('should return false and log if guarantee is expired', async () => {
      guarantee.claim = Web3Utils.utf8ToHex(JSON.stringify({
        hotel: hotelAddress,
        guarantor: accounts[0],
        expiresAt: (new Date()).setDate((new Date()).getDate() - 1),
      }));
      expect(await passesTrustworthinessTest(hotelAddress, guarantee)).to.be.equal(false);
      expect(warnLogStub.callCount).to.be.eql(1);
      expect(warnLogStub.firstCall.args[0]).to.match(/guarantee expired/i);
    });

    it('should return false and log if guarantee has no expiration information', async () => {
      guarantee.claim = Web3Utils.utf8ToHex(JSON.stringify({
        hotel: hotelAddress,
        guarantor: accounts[0],
      }));
      expect(await passesTrustworthinessTest(hotelAddress, guarantee)).to.be.equal(false);
      expect(warnLogStub.callCount).to.be.eql(1);
      expect(warnLogStub.firstCall.args[0]).to.match(/guarantee has no expiration/i);
    });
  });
});
