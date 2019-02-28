/* eslint-env mocha */
const _ = require('lodash');
const { expect } = require('chai');
const request = require('supertest');
const sinon = require('sinon');
const wtJsLibsWrapper = require('../../src/services/wt-js-libs');
const { HOTEL_SEGMENT_ID, DATA_FORMAT_VERSION } = require('../../src/constants');
const {
  deployHotelIndex,
  deployFullHotel,
} = require('../../management/local-network');
const {
  HOTEL_DESCRIPTION,
  RATE_PLANS,
  AVAILABILITY,
} = require('../utils/test-data');
const {
  FakeHotelWithBadOffChainData,
} = require('../utils/fake-hotels');

describe('Availability', function () {
  let server;
  let wtLibsInstance;
  let address, indexContract;

  beforeEach(async () => {
    server = require('../../src/index');
    wtLibsInstance = wtJsLibsWrapper.getInstance(HOTEL_SEGMENT_ID);
    indexContract = await deployHotelIndex();
    wtJsLibsWrapper._setIndexAddress(indexContract.address, HOTEL_SEGMENT_ID);
    address = await deployFullHotel(await wtLibsInstance.getOffChainDataClient('in-memory'), indexContract, HOTEL_DESCRIPTION, RATE_PLANS, AVAILABILITY);
  });

  afterEach(() => {
    server.close();
  });

  describe('GET /hotels/:hotelAddress/availability', () => {
    it('should return availability', async () => {
      await request(server)
        .get(`/hotels/${address}/availability`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect((res) => {
          expect(res.status).to.be.eql(200);
          expect(res.body.items).to.eql(AVAILABILITY.roomTypes);
          expect(res.body).to.have.property('updatedAt');
          expect(res.body).to.have.property('warnings');
          expect(res.body).to.have.property('errors');
          expect(res.body.warnings.length).to.eql(0);
          expect(res.body.errors.length).to.eql(0);
        });
    });

    it('should return bad gateway for inaccessible data', async () => {
      sinon.stub(wtJsLibsWrapper, 'getWTHotelIndex').resolves({
        getHotel: sinon.stub().resolves(new FakeHotelWithBadOffChainData()),
      });
      await request(server)
        .get(`/hotels/${address}/availability`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect((res) => {
          expect(res.status).to.be.eql(502);
          wtJsLibsWrapper.getWTHotelIndex.restore();
        });
    });

    it('should return warning for old data format version', async () => {
      let dataFormatVersion = '0.1.0';
      const hotel = await deployFullHotel(await wtLibsInstance.getOffChainDataClient('in-memory'), indexContract, HOTEL_DESCRIPTION, RATE_PLANS, AVAILABILITY, dataFormatVersion);
      await request(server)
        .get(`/hotels/${hotel}/availability`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect((res) => {
          expect(res.status).to.be.eql(200);
          const { items, warnings, errors } = res.body;
          expect(items.length).to.be.eql(0);
          expect(warnings.length).to.be.eql(18);
          expect(errors.length).to.be.eql(0);
          expect(warnings[0].msgLong).to.match(/^Unsupported data format version/);
        });
    });

    it('should return error for invalid data', async () => {
      let availability = _.cloneDeep(AVAILABILITY);
      delete availability.roomTypes[0].date;
      const hotel = await deployFullHotel(await wtLibsInstance.getOffChainDataClient('in-memory'), indexContract, HOTEL_DESCRIPTION, RATE_PLANS, availability);
      await request(server)
        .get(`/hotels/${hotel}/availability`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect((res) => {
          expect(res.status).to.be.eql(200);
          const { items, warnings, errors } = res.body;
          expect(items.length).to.be.eql(17);
          expect(warnings.length).to.be.eql(0);
          expect(errors.length).to.be.eql(1);
          expect(errors[0].msgLong).to.match(/^date is a required field/);
        });
    });

    it('should return 404 if hotel has no availability', async () => {
      let hotel = await deployFullHotel(await wtLibsInstance.getOffChainDataClient('in-memory'), indexContract, HOTEL_DESCRIPTION, RATE_PLANS);
      await request(server)
        .get(`/hotels/${hotel}/availability`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect(404);
    });
  });
});
