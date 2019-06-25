const { errors: wtJsLibsErrors } = require('@windingtree/wt-js-libs');
const { getSchemaVersion } = require('./schemas');

/**
 * Usage:
 * const wtJsLibsWrapper = require('../../src/services/wt-js-libs');
 * sinon.stub(wtJsLibsWrapper, 'getAirlineDirectory').resolves({
 *   getAirline: sinon.stub().resolves(new FakeAirlineWithBadOffChainData()),
 *   getOrganizations: sinon.stub().resolves([new FakeNiceAirline(), new FakeAirlineWithBadOnChainData()]),
 * });
 * wtJsLibsWrapper.getAirlineDirectory.restore();
 */

let fakeAirlineCounter = 1;

class FakeNiceAirline {
  constructor () {
    this.address = `nice-airline-${fakeAirlineCounter++}`;
    this.dataFormatVersion = getSchemaVersion('@windingtree/wt-airline-schemas');
    this.descriptionUri = `nice-airline-uri-${fakeAirlineCounter++}`;
  }
  getWindingTreeApi () {
    return {
      airline: [
        this,
      ],
    };
  }
  toPlainObject () {
    return {
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
    };
  }
}

class FakeAirlineWithBadOnChainData {
  constructor () {
    this.address = `fake-airline-on-chain-${fakeAirlineCounter++}`;
  }
  getWindingTreeApi () {
    return {
      airline: [
        this,
      ],
    };
  }
  toPlainObject () {
    throw new wtJsLibsErrors.RemoteDataReadError('something');
  }
}

class FakeAirlineWithBadOffChainData {
  constructor () {
    this.address = `fake-airline-off-chain-${fakeAirlineCounter++}`;
  }
  getWindingTreeApi () {
    return {
      airline: [
        this,
      ],
    };
  }
  toPlainObject () {
    throw new wtJsLibsErrors.StoragePointerError('something');
  }
}

module.exports = {
  FakeNiceAirline,
  FakeAirlineWithBadOnChainData,
  FakeAirlineWithBadOffChainData,
  FakeOldFormatAirline,
  FakeWrongFormatAirline,
};
