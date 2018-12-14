const wtJsLibs = require('@windingtree/wt-js-libs');

/**
 * Usage:
 * const wtJsLibsWrapper = require('../../src/services/wt-js-libs');
 * sinon.stub(wtJsLibsWrapper, 'getWTIndex').resolves({
 *   getAllHotels: sinon.stub().resolves([new FakeNiceHotel(), new FakeHotelWithBadOnChainData()]),
 * });
 * wtJsLibsWrapper.getWTIndex.restore();
 */

let fakeHotelCounter = 1;

class FakeNiceHotel {
  constructor () {
    this.address = `nice-hotel-${fakeHotelCounter}`;
    this.dataFormatVersion = '0.2.0';
    this.descriptionUri = `nice-hotel-uri-${fakeHotelCounter++}`;
  }
  get dataIndex () {
    return Promise.resolve({
      contents: {
        dataFormatVersion: this.dataFormatVersion,
        get descriptionUri () {
          return Promise.resolve({
            contents: {
              name: 'nice hotel',
              description: 'nice hotel desc',
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
          dataFormatVersion: this.dataFormatVersion,
          descriptionUri: {
            ref: this.descriptionUri,
            contents: {
              name: 'nice hotel name',
              description: 'nice hotel desc',
              contacts: [],
              address: { line1: '', city: '', country: '' },
              timezone: '',
              currency: '',
              updatedAt: '',
              defaultCancellationAmount: 20,
            },
          },
        },
      },
    };
  }
}

class FakeOldFormatHotel extends FakeNiceHotel {
  constructor () {
    super();
    this.dataFormatVersion = '0.1.0';
  }
}

class FakeWrongFormatHotel extends FakeNiceHotel {
  toPlainObject () {
    return {
      dataUri: {
        contents: {
          dataFormatVersion: this.dataFormatVersion,
          descriptionUri: {
            ref: this.descriptionUri,
            contents: {
              name: 'hotel name',
              description: 23,
              contacts: { general: { email: 'email1' } },
              address: { line1: 'brick lane', city: 'london', country: 'uk' },
              timezone: 'cet',
              currency: 'czk',
              updatedAt: '2018-12-12 12:00:00',
              defaultCancellationAmount: 20,
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
  FakeOldFormatHotel,
  FakeWrongFormatHotel,
};
