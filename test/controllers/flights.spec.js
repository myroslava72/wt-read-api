/* eslint-env mocha */
const { expect } = require('chai');
const request = require('supertest');
const sinon = require('sinon');
const wtJsLibsWrapper = require('../../src/services/wt-js-libs');
const initSegment = require('../../src/config/index').initSegment;
const {
  deployAirlineIndex,
  deployFullAirline,
} = require('../../management/local-network');
const {
  AIRLINE_DESCRIPTION,
  AIRLINE_FLIGHTS,
  FLIGHT_INSTANCES,
} = require('../utils/test-data');
const {
  FakeAirlineWithBadOffChainData,
} = require('../utils/fake-airlines');

describe('Flights', function () {
  let server;
  let wtLibsInstance;
  let address, indexContract;
  let config;

  beforeEach(async () => {
    process.env.WT_SEGMENT = 'airlines';
    config = initSegment();
    wtJsLibsWrapper._setConfig(config);

    server = require('../../src/index');
    wtLibsInstance = wtJsLibsWrapper.getInstance();
    indexContract = await deployAirlineIndex();
    config.wtIndexAddress = indexContract.address;
    address = await deployFullAirline(await wtLibsInstance.getOffChainDataClient('in-memory'), indexContract, AIRLINE_DESCRIPTION, AIRLINE_FLIGHTS, FLIGHT_INSTANCES);
  });

  afterEach(() => {
    server.close();
  });

  describe('GET /airlines/:airlineAddress/flightinstances/:flightInstanceId', () => {
    it('should return a flight instance', async () => {
      const flightInstanceId = 'IeKeix6G-1';
      await request(server)
        .get(`/airlines/${address}/flightinstances/${flightInstanceId}`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect((res) => {
          expect(res.status).to.be.eql(200);
          expect(res.body).to.have.property('id', flightInstanceId);
          expect(res.body).to.have.property('departureDateTime', '2018-12-10 12:00:00');
          expect(res.body).to.have.property('bookingClasses');
          expect(res.body.bookingClasses.length).to.equal(2);
        });
    });

    it('should return 404 for unknown flight instance id', async () => {
      await request(server)
        .get(`/airlines/${address}/flightinstances/flight-instance-0000`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect(404);
    });

    it('should return 404 if airline has no flight instances', async () => {
      const airline = await deployFullAirline(await wtLibsInstance.getOffChainDataClient('in-memory'), indexContract, AIRLINE_DESCRIPTION);
      await request(server)
        .get(`/airlines/${airline}/flightinstances/flight-instance-0000`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect(404);
    });

    it('should return bad gateway for inaccessible data', async () => {
      sinon.stub(wtJsLibsWrapper, 'getWTAirlineIndex').resolves({
        getAirline: sinon.stub().resolves(new FakeAirlineWithBadOffChainData()),
      });
      const flightInstanceId = 'IeKeix6G-1';
      await request(server)
        .get(`/airlines/${address}/flightinstances/${flightInstanceId}`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect((res) => {
          expect(res.status).to.be.eql(502);
          wtJsLibsWrapper.getWTAirlineIndex.restore();
        });
    });
  });
});
