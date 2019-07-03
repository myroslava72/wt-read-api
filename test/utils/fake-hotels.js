const { errors: wtJsLibsErrors } = require('@windingtree/wt-js-libs');
const Web3 = require('web3');
const { getSchemaVersion } = require('./schemas');

const provider = new Web3.providers.HttpProvider('http://localhost:8545');
const web3 = new Web3(provider);

const getGuarantee = async (address, time, accountIdx = 0) => {
  const accounts = await web3.eth.getAccounts();
  const rawClaim = {
    'hotel': address,
    'guarantor': accounts[accountIdx],
    'expiresAt': time.getTime(),
  };
  const claim = web3.utils.utf8ToHex(JSON.stringify(rawClaim));
  return {
    claim: claim,
    signature: await web3.eth.sign(claim, accounts[accountIdx]),
  };
};

/**
 * Usage:
 * const wtJsLibsWrapper = require('../../src/services/wt-js-libs');
 * sinon.stub(wtJsLibsWrapper, 'getWThotelDirectory').resolves({
 *   getOrganization: sinon.stub().resolves(new FakeHotelWithBadOnChainData()),
 *   getAllHotels: sinon.stub().resolves([new FakeNiceHotel(), new FakeHotelWithBadOnChainData()]),
 * });
 * wtJsLibsWrapper.getWThotelDirectory.restore();
 */

let fakeHotelCounter = 1;

class FakeNiceHotel {
  constructor () {
    this.address = `nice-hotel-${fakeHotelCounter}`;
    this.dataFormatVersion = getSchemaVersion('@windingtree/wt-hotel-schemas');
    this.descriptionUri = `nice-hotel-uri-${fakeHotelCounter++}`;
    this.monthFromNow = new Date();
    this.monthFromNow.setMonth(this.monthFromNow.getMonth() + 1);
  }

  getWindingTreeApi () {
    return {
      hotel: [
        this,
      ],
    };
  }
  
  async toPlainObject () {
    return {
      contents: {
        dataFormatVersion: this.dataFormatVersion,
        guarantee: await getGuarantee(this.address, this.monthFromNow),
        descriptionUri: {
          ref: this.descriptionUri,
          contents: {
            name: 'nice hotel name',
            description: 'nice hotel desc',
            contacts: {
              general: {
                email: 'me@home.com',
              },
            },
            address: { road: 'Main', houseNumber: '1', city: 'Asgard', countryCode: 'USA' },
            timezone: '',
            currency: 'USD',
            updatedAt: (new Date()).toISOString(),
            defaultCancellationAmount: 20,
          },
        },
      },
    };
  }
}

class FakeNotTrustworthyHotel extends FakeNiceHotel {
  async toPlainObject () {
    const data = await super.toPlainObject();
    data.contents.guarantee = await getGuarantee(this.address, this.monthFromNow, 1);
    return data;
  }
}

class FakeOldFormatHotel extends FakeNiceHotel {
  constructor () {
    super();
    this.dataFormatVersion = '0.1.0';
  }
}

class FakeWrongFormatHotel extends FakeNiceHotel {
  async toPlainObject () {
    return {
      contents: {
        address: this.address,
        dataFormatVersion: this.dataFormatVersion,
        guarantee: await getGuarantee(this.address, this.monthFromNow),
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
    };
  }
}

class FakeHotelWithBadOnChainData {
  constructor () {
    this.address = `fake-hotel-on-chain-${fakeHotelCounter++}`;
  }
  getWindingTreeApi () {
    return {
      hotel: [
        this,
      ],
    };
  }
  toPlainObject () {
    throw new wtJsLibsErrors.RemoteDataReadError('something');
  }
}

class FakeHotelWithBadOffChainData {
  constructor () {
    this.address = `fake-hotel-off-chain-${fakeHotelCounter++}`;
  }
  getWindingTreeApi () {
    return {
      hotel: [
        this,
      ],
    };
  }
  toPlainObject () {
    throw new wtJsLibsErrors.StoragePointerError('something');
  }
}

module.exports = {
  FakeNiceHotel,
  FakeNotTrustworthyHotel,
  FakeHotelWithBadOnChainData,
  FakeHotelWithBadOffChainData,
  FakeOldFormatHotel,
  FakeWrongFormatHotel,
};
