const { 'wt-js-libs': wtJsLibs } = require('@windingtree/wt-js-libs');

/**
 * Usage:
 * const wtJsLibsWrapper = require('../../src/services/wt-js-libs');
 * sinon.stub(wtJsLibsWrapper, 'getWTHotelIndex').resolves({
 *   getAllHotels: sinon.stub().resolves([new FakeNiceHotel(), new FakeHotelWithBadOnChainData()]),
 * });
 * wtJsLibsWrapper.getWTHotelIndex.restore();
 */

let fakeHotelCounter = 1;

class FakeNiceHotel {
  constructor () {
    this.address = `nice-hotel-${fakeHotelCounter++}`;
  }
  get dataIndex () {
    return Promise.resolve({
      contents: {
        get descriptionUri () {
          return Promise.resolve({
            contents: {
              name: 'nice hotel',
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
              name: 'nice hotel',
            },
          },
        },
      },
    };
  }
}
      
class FakeHotelWithBadOnChainData {
  constructor () {
    this.address = `fake-hotel-on-chain-${fakeHotelCounter++}`;
  }
  get dataIndex () {
    throw new wtJsLibs.errors.RemoteDataReadError('something');
  }
  toPlainObject () {
    throw new wtJsLibs.errors.RemoteDataReadError('something');
  }
}
      
class FakeHotelWithBadOffChainData {
  constructor () {
    this.address = `fake-hotel-off-chain-${fakeHotelCounter++}`;
  }
  get dataIndex () {
    throw new wtJsLibs.errors.StoragePointerError('something');
  }
  toPlainObject () {
    throw new wtJsLibs.errors.StoragePointerError('something');
  }
}

module.exports = {
  FakeNiceHotel,
  FakeHotelWithBadOnChainData,
  FakeHotelWithBadOffChainData,
};
