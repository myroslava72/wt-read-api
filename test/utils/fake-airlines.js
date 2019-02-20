const { 'wt-js-libs': wtJsLibs } = require('@windingtree/wt-js-libs');

/**
 * Usage:
 * const wtJsLibsWrapper = require('../../src/services/wt-js-libs');
 * sinon.stub(wtJsLibsWrapper, 'getWTAirlineIndex').resolves({
 *   getAirline: sinon.stub().resolves(new FakeAirlineWithBadOffChainData()),
 *   getAllAirlines: sinon.stub().resolves([new FakeNiceAirline(), new FakeAirlineWithBadOnChainData()]),
 * });
 * wtJsLibsWrapper.getWTAirlineIndex.restore();
 */

let fakeAirlineCounter = 1;

class FakeNiceAirline {
  constructor () {
    this.address = `nice-airline-${fakeAirlineCounter++}`;
    this.dataFormatVersion = '0.2.0';
    this.descriptionUri = `nice-airline-uri-${fakeAirlineCounter++}`;
  }
  get dataIndex () {
    return Promise.resolve({
      contents: {
        dataFormatVersion: this.dataFormatVersion,
        get descriptionUri () {
          return Promise.resolve({
            contents: {
              name: 'nice airline',
              description: 'nice airline desc',
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
              name: 'nice airline name',
              code: 'ai',
              contacts: { general: { email: 'email1' } },
              currency: '',
              updatedAt: '2018-12-12 12:00:00',
              defaultCancellationAmount: 20,
            },
          },
        },
      },
    };
  }
}

class FakeOldFormatAirline extends FakeNiceAirline {
  constructor () {
    super();
    this.dataFormatVersion = '0.1.0';
  }
}

class FakeWrongFormatAirline extends FakeNiceAirline {
  toPlainObject () {
    return {
      dataUri: {
        contents: {
          dataFormatVersion: this.dataFormatVersion,
          descriptionUri: {
            ref: this.descriptionUri,
            contents: {
              name: 'airline name',
              code: 23,
              contacts: { general: { email: 'email1' } },
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
  FakeOldFormatAirline,
  FakeWrongFormatAirline,
};
