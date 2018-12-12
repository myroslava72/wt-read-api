/* eslint-env mocha */
const { expect } = require('chai');
const request = require('supertest');
const sinon = require('sinon');
const wtJsLibsWrapper = require('../../src/services/wt-js-libs');
const {
  deployIndex,
  deployFullHotel,
} = require('../../management/local-network');
const {
  HOTEL_DESCRIPTION,
  RATE_PLANS,
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
    const config = require('../../src/config');
    wtLibsInstance = wtJsLibsWrapper.getInstance();
    indexContract = await deployIndex();
    config.wtIndexAddress = indexContract.address;
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
          expect(res.body).to.eql(RATE_PLANS);
          for (let ratePlan of res.body) {
            expect(ratePlan).to.have.property('id');
          }
        });
    });

    it('should return bad gateway for inaccessible data', async () => {
      sinon.stub(wtJsLibsWrapper, 'getWTIndex').resolves({
        getHotel: sinon.stub().resolves(new FakeHotelWithBadOffChainData()),
      });
      await request(server)
        .get(`/hotels/${address}/ratePlans`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect((res) => {
          expect(res.status).to.be.eql(502);
          wtJsLibsWrapper.getWTIndex.restore();
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
      sinon.stub(wtJsLibsWrapper, 'getWTIndex').resolves({
        getHotel: sinon.stub().resolves(new FakeHotelWithBadOffChainData()),
      });
      await request(server)
        .get(`/hotels/${address}/ratePlans/rate-plan-1`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect((res) => {
          expect(res.status).to.be.eql(502);
          wtJsLibsWrapper.getWTIndex.restore();
        });
    });
  });
});
