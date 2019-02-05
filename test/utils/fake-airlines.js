const wtJsLibs = require('@windingtree/wt-js-libs');

/**
 * Usage:
 * const wtJsLibsWrapper = require('../../src/services/wt-js-libs');
 * sinon.stub(wtJsLibsWrapper, 'getWTAirlineIndex').resolves({
 *   getAirline: sinon.stub().resolves(new FakeAirlineWithBadOffChainData()),
 * });
 * wtJsLibsWrapper.getWTAirlineIndex.restore();
 */

let fakeAirlineCounter = 1;

class FakeNiceAirline {
  constructor () {
    this.address = `nice-airline-${fakeAirlineCounter++}`;
  }
  get dataIndex () {
    return Promise.resolve({
      contents: {
        get descriptionUri () {
          return Promise.resolve({
            contents: {
              name: 'nice airline',
            },
          });
        },
      },
    });
  }
  toPlainObject () {
    return {
      dataUri: {
        contents: {
          descriptionUri: {
            contents: {
              name: 'nice airline',
            },
          },
        },
      },
    };
  }
}
      
class FakeAirlineWithBadOnChainData {
  constructor () {
    this.address = `fake-airline-on-chain-${fakeAirlineCounter++}`;
  }
  get dataIndex () {
    throw new wtJsLibs.errors.RemoteDataReadError('something');
  }
  toPlainObject () {
    throw new wtJsLibs.errors.RemoteDataReadError('something');
  }
}

class FakeAirlineWithBadOffChainData {
  constructor () {
    this.address = `fake-airline-off-chain-${fakeAirlineCounter++}`;
  }
  get dataIndex () {
    throw new wtJsLibs.errors.StoragePointerError('something');
  }
  toPlainObject () {
    throw new wtJsLibs.errors.StoragePointerError('something');
  }
}

module.exports = {
  FakeNiceAirline,
  FakeAirlineWithBadOnChainData,
  FakeAirlineWithBadOffChainData,
};
