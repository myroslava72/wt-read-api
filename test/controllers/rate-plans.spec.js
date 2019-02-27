/* eslint-env mocha */
const _ = require('lodash');
const { expect } = require('chai');
const request = require('supertest');
const sinon = require('sinon');
const wtJsLibsWrapper = require('../../src/services/wt-js-libs');
const { HOTEL_SEGMENT_ID, VALIDATION_WARNING_HEADER } = require('../../src/constants');
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

describe('Rate plans', function () {
  let server;
  let wtLibsInstance;
  let address, indexContract;

  beforeEach(async () => {
    server = require('../../src/index');
    wtLibsInstance = wtJsLibsWrapper.getInstance(HOTEL_SEGMENT_ID);
    indexContract = await deployHotelIndex();
    wtJsLibsWrapper._setIndexAddress(indexContract.address, HOTEL_SEGMENT_ID);
    address = await deployFullHotel(await wtLibsInstance.getOffChainDataClient('in-memory'), indexContract, HOTEL_DESCRIPTION, RATE_PLANS);
  });

  afterEach(() => {
    server.close();
  });

  describe('GET /hotels/:hotelAddress/ratePlans', () => {
    it('should return rate plans', async () => {
      await request(server)
        .get(`/hotels/${address}/ratePlans`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect((res) => {
          expect(res.status).to.be.eql(200);
          expect(res.body.items).to.eql(RATE_PLANS);
          for (let ratePlan of res.body.items) {
            expect(ratePlan).to.have.property('id');
          }
        });
    });

    it('should return bad gateway for inaccessible data', async () => {
      sinon.stub(wtJsLibsWrapper, 'getWTHotelIndex').resolves({
        getHotel: sinon.stub().resolves(new FakeHotelWithBadOffChainData()),
      });
      await request(server)
        .get(`/hotels/${address}/ratePlans`)
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
        .get(`/hotels/${hotel}/ratePlans`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect((res) => {
          expect(res.status).to.be.eql(200);
          const { items, warnings, errors } = res.body;
          expect(res.body).to.have.property('dataFormatVersion');
          expect(items.length).to.be.eql(0);
          expect(warnings.length).to.be.eql(2);
          expect(errors.length).to.be.eql(0);
          expect(warnings[0].msgLong).to.match(/^Unsupported data format version/);
        });
    });

    it('should return error for invalid data', async () => {
      let ratePlans = _.cloneDeep(RATE_PLANS);
      delete ratePlans[0].price;
      const hotel = await deployFullHotel(await wtLibsInstance.getOffChainDataClient('in-memory'), indexContract, HOTEL_DESCRIPTION, ratePlans, AVAILABILITY);
      await request(server)
        .get(`/hotels/${hotel}/ratePlans`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect((res) => {
          expect(res.status).to.be.eql(200);
          const { items, warnings, errors } = res.body;
          expect(res.body).to.have.property('dataFormatVersion');
          expect(items.length).to.be.eql(1);
          expect(warnings.length).to.be.eql(0);
          expect(errors.length).to.be.eql(1);
          expect(errors[0].msgLong).to.match(/^price is a required field/);
        });
    });

    it('should return 404 if hotel has no rate plans', async () => {
      const hotel = await deployFullHotel(await wtLibsInstance.getOffChainDataClient('in-memory'), indexContract, HOTEL_DESCRIPTION);
      await request(server)
        .get(`/hotels/${hotel}/ratePlans`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect(404);
    });

    it('should return 404 for unknown hotel id', async () => {
      await request(server)
        .get('/hotels/0xDbdc1F2800e6Ced54aFee6AaA450df627e4593F2/ratePlans')
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect(404);
    });
  });

  describe('GET /hotels/:hotelAddress/ratePlans/:ratePlanId', () => {
    it('should return a rate plan', async () => {
      await request(server)
        .get(`/hotels/${address}/ratePlans/rate-plan-1`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect((res) => {
          expect(res.body).to.have.property('id', 'rate-plan-1');
        });
    });

    it('should return 404 for unknown rate plan id', async () => {
      await request(server)
        .get(`/hotels/${address}/ratePlans/rate-plan-0000`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect(404);
    });

    it('should return 404 if hotel has no rate plans', async () => {
      const hotel = await deployFullHotel(await wtLibsInstance.getOffChainDataClient('in-memory'), indexContract, HOTEL_DESCRIPTION);
      await request(server)
        .get(`/hotels/${hotel}/ratePlans/rate-plan-0000`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect(404);
    });

    it('should return bad gateway for inaccessible data', async () => {
      sinon.stub(wtJsLibsWrapper, 'getWTHotelIndex').resolves({
        getHotel: sinon.stub().resolves(new FakeHotelWithBadOffChainData()),
      });
      await request(server)
        .get(`/hotels/${address}/ratePlans/rate-plan-1`)
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
        .get(`/hotels/${hotel}/ratePlans/rate-plan-1`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect(200)
        .expect((res) => {
          expect(res.headers).to.have.property(VALIDATION_WARNING_HEADER);
          expect(res.headers[VALIDATION_WARNING_HEADER]).to.match(/^Unsupported data format version 0\.1\.0\./);
        });
    });

    it('should return error for invalid data', async () => {
      let ratePlans = _.cloneDeep(RATE_PLANS);
      delete ratePlans[0].roomTypeIds;
      delete ratePlans[0].price;
      const hotel = await deployFullHotel(await wtLibsInstance.getOffChainDataClient('in-memory'), indexContract, HOTEL_DESCRIPTION, ratePlans, AVAILABILITY);
      await request(server)
        .get(`/hotels/${hotel}/ratePlans/rate-plan-1`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect((res) => {
          expect(res.status).to.be.eql(422);
          expect(res.body.long).to.match(/price is a required field/);
          expect(res.body.long).to.match(/roomTypeIds is a required field/);
        });
    });

    it('should return error for invalid nested data', async () => {
      let ratePlans = _.cloneDeep(RATE_PLANS);
      delete ratePlans[0].modifiers[0].unit;
      const hotel = await deployFullHotel(await wtLibsInstance.getOffChainDataClient('in-memory'), indexContract, HOTEL_DESCRIPTION, ratePlans, AVAILABILITY);
      await request(server)
        .get(`/hotels/${hotel}/ratePlans/rate-plan-1`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect((res) => {
          expect(res.status).to.be.eql(422);
          expect(res.body.long).to.match(/unit is a required field/);
        });
    });
  });
});
