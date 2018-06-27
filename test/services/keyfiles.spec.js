/* eslint-env mocha */
/* eslint-disable no-unused-expressions */
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');

const { expect } = require('chai');
const {
  loadKeyFile,
} = require('../../src/services/keyfiles');
const config = require('../../src/config');
const wallet = require('../utils/keys/ffa1e3be-e80a-4e1c-bb71-ed54c3bef115');

const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);
const unlink = promisify(fs.unlink);

describe('keyfiles.js', () => {
  let originalKeyStorage;
  const tempPath = path.resolve('test/utils/temp-keys');
  let walletEncoded;

  before(() => {
    originalKeyStorage = config.get('keyFileStorage');
    config.set('keyFileStorage', tempPath);
  });

  beforeEach(async () => {
    walletEncoded = (await readFile(path.resolve('test/utils/keys/ffa1e3be-e80a-4e1c-bb71-ed54c3bef115.enc'))).toString();
    await writeFile(path.resolve(config.get('keyFileStorage'), 'ffa1e3be-e80a-4e1c-bb71-ed54c3bef115.enc'), walletEncoded, { encoding: 'utf8', flag: 'w' });
  });

  afterEach(async () => {
    if (fs.existsSync(path.resolve(tempPath, `${wallet.id}.enc`))) {
      await unlink(path.resolve(tempPath, `${wallet.id}.enc`));
    }
  });

  after(() => {
    config.set('keyFileStorage', originalKeyStorage);
  });

  describe('loadKeyFile', () => {
    it('should load decrypted keyfile', async () => {
      const privateKeyJSON = await loadKeyFile(wallet.id);
      expect(privateKeyJSON).to.be.ok;
      expect(privateKeyJSON).to.deep.equal(wallet);
    });

    it('should throw on an unsupported cipher', async () => {
      walletEncoded = walletEncoded.replace('aes-256-cbc', 'aes-128-crt');
      await writeFile(path.resolve(config.get('keyFileStorage'), 'ffa1e3be-e80a-4e1c-bb71-ed54c3bef115.enc'), walletEncoded, { encoding: 'utf8', flag: 'w' });
      try {
        await loadKeyFile(wallet.id);
      } catch (e) {
        expect(e.message).match(/unsupported cipher/i);
      }
    });

    it('should throw on a bad secret', async () => {
      let originalSecret = config.get('secret');
      config.set('secret', 'something-else');
      try {
        await loadKeyFile(wallet.id);
      } catch (e) {
        expect(e.message).match(/cannot decipher keyfile/i);
      }
      config.set('secret', originalSecret);
    });

    it('should throw when loading a non-existent keyfile', async () => {
      try {
        await loadKeyFile('random-nonexistent-uuid');
      } catch (e) {
        expect(e.message).to.match(/wallet not found/i);
      }
    });
  });
});
