/* eslint-env mocha */
/* eslint-disable no-unused-expressions */
const { expect } = require('chai');
const sinon = require('sinon');
const Web3Utils = require('web3-utils');
const { getTrustClueClient, passesTrustworthinessTest } = require('../../src/services/wt-js-libs');
const { config } = require('../../src/config');

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

    beforeEach(() => {
      origGetTrustClueClient = config.wtLibs.getTrustClueClient;
      baseTrustClueClient = {
        verifySignedData: (claim, sig, verFn) => verFn('0x5808b3232de474e155a8d915cc588D5095C13631'),
        interpretAllValues: () => Promise.resolve([
          { name: 'test-clue', value: true },
          { name: 'test-clue-2', value: true },
        ]),
      };
      config.wtLibs.getTrustClueClient = () => (baseTrustClueClient);
      warnLogStub = sinon.stub(config.logger, 'warn');
      guarantee = {
        claim: '0x7b22686f74656c223a22307844626446394236333664463732644433356642323262623130356438653162423961303935374338222c2267756172616e746f72223a22307835383038623332333264653437346531353561386439313563633538384435303935433133363331222c22657870697265734174223a313536313336343436393030307d',
        signature: '0x6bd1846b460d5ce14a329240db33f83ecbcce795e0ae701ebdb3060eea686252525ddde8e7769e748b03df5acecf104acd605726c469d23470223de03243a9571c',
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
        guarantor: '0x5808b3232de474e155a8d915cc588D5095C13631',
        expiresAt: 1561364469000,
      }));
      expect(await passesTrustworthinessTest(hotelAddress, guarantee)).to.be.equal(false);
      expect(warnLogStub.callCount).to.be.eql(1);
      expect(warnLogStub.firstCall.args[0]).to.match(/for a different hotel/i);
    });

    it('should return false and log if hotelAddress does not match the guarantee', async () => {
      guarantee.claim = Web3Utils.utf8ToHex(JSON.stringify({
        hotel: '456',
        guarantor: '0x5808b3232de474e155a8d915cc588D5095C13631',
        expiresAt: 1561364469000,
      }));
      expect(await passesTrustworthinessTest(hotelAddress, guarantee)).to.be.equal(false);
      expect(warnLogStub.callCount).to.be.eql(1);
      expect(warnLogStub.firstCall.args[0]).to.match(/for a different hotel/i);
    });

    it('should return false and log if guarantee is expired', async () => {
      guarantee.claim = Web3Utils.utf8ToHex(JSON.stringify({
        hotel: '0xDbdF9B636dF72dD35fB22bb105d8e1bB9a0957C8',
        guarantor: '0x5808b3232de474e155a8d915cc588D5095C13631',
        expiresAt: (new Date()).setDate((new Date()).getDate() - 1),
      }));
      expect(await passesTrustworthinessTest(hotelAddress, guarantee)).to.be.equal(false);
      expect(warnLogStub.callCount).to.be.eql(1);
      expect(warnLogStub.firstCall.args[0]).to.match(/guarantee expired/i);
    });

    it('should return false and log if guarantee has no expiration information', async () => {
      guarantee.claim = Web3Utils.utf8ToHex(JSON.stringify({
        hotel: '0xDbdF9B636dF72dD35fB22bb105d8e1bB9a0957C8',
        guarantor: '0x5808b3232de474e155a8d915cc588D5095C13631',
      }));
      expect(await passesTrustworthinessTest(hotelAddress, guarantee)).to.be.equal(false);
      expect(warnLogStub.callCount).to.be.eql(1);
      expect(warnLogStub.firstCall.args[0]).to.match(/guarantee has no expiration/i);
    });
  });
});
