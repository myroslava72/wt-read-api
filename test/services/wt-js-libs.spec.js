/* eslint-env mocha */
/* eslint-disable no-unused-expressions */
const { expect } = require('chai');
const sinon = require('sinon');
const { getTrustClueClient, passesTrustworthinessTest } = require('../../src/services/wt-js-libs');
const { config } = require('../../src/config');

describe('WtJsLibs wrapper', () => {
  describe('getTrustClueClient', () => {
    it('should call wtJsLibs', () => {
      const getClientSpy = sinon.spy(config.wtLibs, 'getTrustClueClient');
      const client = getTrustClueClient();
      expect(client).to.have.property('verifyAndDecodeSignedData');
      expect(getClientSpy.callCount).to.be.equal(1);
      getClientSpy.restore();
    });
  });

  describe('passesTrustworthinessTest', () => {
    let origGetTrustClueClient, baseTrustClueClient, warnLogStub;

    beforeEach(() => {
      origGetTrustClueClient = config.wtLibs.getTrustClueClient;
      baseTrustClueClient = {
        verifyAndDecodeSignedData: () => ({
          hotel: '123',
          expiresAt: (new Date()).setDate((new Date()).getDate() + 1),
        }),
        interpretAllValues: () => Promise.resolve([
          { name: 'test-clue', value: true },
          { name: 'test-clue-2', value: true },
        ]),
      };
      config.wtLibs.getTrustClueClient = () => (baseTrustClueClient);
      warnLogStub = sinon.stub(config.logger, 'warn');
      config.checkTrustClues = true;
    });

    afterEach(() => {
      config.wtLibs.getTrustClueClient = origGetTrustClueClient;
      config.logger.warn.restore();
      config.checkTrustClues = false;
    });

    it('should always return true if no guarantee is required', async () => {
      config.checkTrustClues = false;
      expect(await passesTrustworthinessTest('123', { claim: '123', signature: '123' })).to.be.equal(true);
      expect(await passesTrustworthinessTest('123', 'rubbish')).to.be.equal(true);
      expect(await passesTrustworthinessTest('123', {
        claim: 'rubbish',
      })).to.be.equal(true);
      expect(await passesTrustworthinessTest('123', {
        claim: 'rubbish',
        signature: 'rubbish',
      })).to.be.equal(true);
      config.checkTrustClues = true;
    });

    it('should return true if at all trust clues interpret as true', async () => {
      expect(await passesTrustworthinessTest('123', { claim: '123', signature: '123' })).to.be.equal(true);
    });

    it('should return false if no or malformed guarantee is provided but should be checked', async () => {
      expect(await passesTrustworthinessTest('123', undefined)).to.be.equal(false);
      expect(await passesTrustworthinessTest('123', {})).to.be.equal(false);
      expect(await passesTrustworthinessTest('123', { claim: '123' })).to.be.equal(false);
      expect(await passesTrustworthinessTest('123', { signature: '123' })).to.be.equal(false);
    });

    it('should return false and log if at least one trust clue interprets as false', async () => {
      baseTrustClueClient.interpretAllValues = () => Promise.resolve([
        { name: 'test-clue', value: true },
        { name: 'test-clue-2', value: false },
      ]);
      expect(await passesTrustworthinessTest('123', { claim: '123', signature: '123' })).to.be.equal(false);
    });

    it('should return false and log if signature is not verified', async () => {
      baseTrustClueClient.verifyAndDecodeSignedData = () => {
        throw new Error('Signature not verified.');
      };
      expect(await passesTrustworthinessTest('123', { claim: '123', signature: '123' })).to.be.equal(false);
      expect(warnLogStub.callCount).to.be.eql(1);
      expect(warnLogStub.firstCall.args[0]).to.match(/signature not verified/i);
    });

    it('should return false and log if guarantee has no hotel information', async () => {
      baseTrustClueClient.verifyAndDecodeSignedData = () => ({
        expiresAt: (new Date()).setDate((new Date()).getDate() - 1),
      });
      expect(await passesTrustworthinessTest('123', { claim: '123', signature: '123' })).to.be.equal(false);
      expect(warnLogStub.callCount).to.be.eql(1);
      expect(warnLogStub.firstCall.args[0]).to.match(/for a different hotel/i);
    });

    it('should return false and log if hotelAddress does not match the guarantee', async () => {
      baseTrustClueClient.verifyAndDecodeSignedData = () => ({
        hotel: '456',
        expiresAt: (new Date()).setDate((new Date()).getDate() + 1),
      });
      expect(await passesTrustworthinessTest('123', { claim: '123', signature: '123' })).to.be.equal(false);
      expect(warnLogStub.callCount).to.be.eql(1);
      expect(warnLogStub.firstCall.args[0]).to.match(/for a different hotel/i);
    });

    it('should return false and log if guarantee is expired', async () => {
      baseTrustClueClient.verifyAndDecodeSignedData = () => ({
        hotel: '123',
        expiresAt: (new Date()).setDate((new Date()).getDate() - 1),
      });
      expect(await passesTrustworthinessTest('123', { claim: '123', signature: '123' })).to.be.equal(false);
      expect(warnLogStub.callCount).to.be.eql(1);
      expect(warnLogStub.firstCall.args[0]).to.match(/guarantee expired/i);
    });

    it('should return false and log if guarantee has no expiration information', async () => {
      baseTrustClueClient.verifyAndDecodeSignedData = () => ({
        hotel: '123',
      });
      expect(await passesTrustworthinessTest('123', { claim: '123', signature: '123' })).to.be.equal(false);
      expect(warnLogStub.callCount).to.be.eql(1);
      expect(warnLogStub.firstCall.args[0]).to.match(/guarantee has no expiration/i);
    });
  });
});
