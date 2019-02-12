/* eslint-env mocha */
const { expect } = require('chai');
const request = require('supertest');
const sinon = require('sinon');
const wtJsLibsWrapper = require('../../src/services/wt-js-libs');
const { AIRLINE_SEGMENT_ID } = require('../../src/constants');
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

  beforeEach(async () => {
    server = require('../../src/index');
    wtLibsInstance = wtJsLibsWrapper.getInstance(AIRLINE_SEGMENT_ID);
    indexContract = await deployAirlineIndex();
    wtJsLibsWrapper._setIndexAddress(indexContract.address, AIRLINE_SEGMENT_ID);
    address = await deployFullAirline(await wtLibsInstance.getOffChainDataClient('in-memory'), indexContract, AIRLINE_DESCRIPTION, AIRLINE_FLIGHTS, FLIGHT_INSTANCES);
  });

  afterEach(() => {
    server.close();
  });

  describe('GET /airlines/:airlineAddress/flights/:flightId/instances/:flightInstanceId', () => {
    it('should return a flight instance', async () => {
      const flightInstanceId = 'IeKeix6G-1';
      const flightId = 'IeKeix6G';
      await request(server)
        .get(`/airlines/${address}/flights/${flightId}/instances/${flightInstanceId}`)
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
      const flightInstanceId = 'flight-instance-0000';
      const flightId = 'IeKeix6G';
      await request(server)
        .get(`/airlines/${address}/flights/${flightId}/instances/${flightInstanceId}`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect(404);
    });

    it('should return 404 if airline has no flight instances', async () => {
      const airline = await deployFullAirline(await wtLibsInstance.getOffChainDataClient('in-memory'), indexContract, AIRLINE_DESCRIPTION);
      const flightInstanceId = 'flight-instance-0000';
      const flightId = 'IeKeix6G';
      await request(server)
        .get(`/airlines/${airline}/flights/${flightId}/instances/${flightInstanceId}`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect(404);
    });

    it('should return bad gateway for inaccessible data', async () => {
      sinon.stub(wtJsLibsWrapper, 'getWTAirlineIndex').resolves({
        getAirline: sinon.stub().resolves(new FakeAirlineWithBadOffChainData()),
      });
      const flightInstanceId = 'IeKeix6G-1';
      const flightId = 'IeKeix6G';
      await request(server)
        .get(`/airlines/${address}/flights/${flightId}/instances/${flightInstanceId}`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect((res) => {
          expect(res.status).to.be.eql(502);
          wtJsLibsWrapper.getWTAirlineIndex.restore();
        });
    });
  });
});
