const { errors: wtJsLibsErrors } = require('@windingtree/wt-js-libs');

/**
 * Usage:
 * const wtJsLibsWrapper = require('../../src/services/wt-js-libs');
 * sinon.stub(wtJsLibsWrapper, 'getWTHotelIndex').resolves({
 *   getHotel: sinon.stub().resolves(new FakeHotelWithBadOnChainData()),
 *   getAllHotels: sinon.stub().resolves([new FakeNiceHotel(), new FakeHotelWithBadOnChainData()]),
 * });
 * wtJsLibsWrapper.getWTHotelIndex.restore();
 */

let fakeHotelCounter = 1;

class FakeNiceHotel {
  constructor () {
    this.address = `nice-hotel-${fakeHotelCounter}`;
    this.dataFormatVersion = '0.6.6';
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
              address: { road: '', houseNumber: '', city: '', countryCode: '' },
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
              address: { road: 'brick lane', houseNumber: '123', city: 'london', countryCode: 'uk' },
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
    throw new wtJsLibsErrors.RemoteDataReadError('something');
  }
  toPlainObject () {
    throw new wtJsLibsErrors.RemoteDataReadError('something');
  }
}

class FakeHotelWithBadOffChainData {
  constructor () {
    this.address = `fake-hotel-off-chain-${fakeHotelCounter++}`;
  }
  get dataIndex () {
    throw new wtJsLibsErrors.StoragePointerError('something');
  }
  toPlainObject () {
    throw new wtJsLibsErrors.StoragePointerError('something');
  }
}

module.exports = {
  FakeNiceHotel,
  FakeHotelWithBadOnChainData,
  FakeHotelWithBadOffChainData,
  FakeOldFormatHotel,
  FakeWrongFormatHotel,
};
