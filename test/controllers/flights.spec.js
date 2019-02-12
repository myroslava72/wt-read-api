/* eslint-env mocha */
const { expect } = require('chai');
const request = require('supertest');
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

  describe('GET /airlines/:airlineAddress/flights/:flightId/meta', () => {
    it('should return flight instances', async () => {
      const flightId = 'IeKeix6G';
      await request(server)
        .get(`/airlines/${address}/flights/${flightId}/meta/`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect((res) => {
          expect(res.status).to.be.eql(200);
          expect(res.body.flightInstancesUri).to.match(/^in-memory:\/\//);
        });
    });

    it('should return 404 for unknown flight id', async () => {
      const flightId = 'flight-000';
      await request(server)
        .get(`/airlines/${address}/flights/${flightId}/meta/`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect(404)
        .expect((res) => {
          expect(res.body.code).to.eql('#flightNotFound');
        });
    });
  });
});
