/* eslint-env mocha */
const _ = require('lodash');
const { expect } = require('chai');
const request = require('supertest');
const sinon = require('sinon');
const wtJsLibsWrapper = require('../../src/services/wt-js-libs');
const { getSchemaVersion } = require('../utils/schemas');
const { config } = require('../../src/config');
const { VALIDATION_WARNING_HEADER } = require('../../src/constants');
const {
  deployAirlineApp,
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

describe('Flight instances', function () {
  let server;
  let wtLibsInstance, app, deploymentOptions;
  let airline;

  beforeEach(async () => {
    server = require('../../src/index');
    wtLibsInstance = wtJsLibsWrapper.getInstance();
    app = await deployAirlineApp(config);
    deploymentOptions = {
      schemaVersion: getSchemaVersion('@windingtree/wt-airline-schemas'),
      offChainDataClient: await wtLibsInstance.getOffChainDataClient('in-memory'),
      app: app,
    };
    airline = await deployFullAirline(deploymentOptions, AIRLINE_DESCRIPTION, AIRLINE_FLIGHTS, FLIGHT_INSTANCES);
  });

  afterEach(() => {
    server.close();
  });

  describe('GET /airlines/:airlineAddress/flights/:flightId/instances', () => {
    const flightId = 'IeKeix6G';

    it('should return flight instances', async () => {
      await request(server)
        .get(`/airlines/${airline.address}/flights/${flightId}/instances`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect((res) => {
          expect(res.status).to.be.eql(200);
          const { items } = res.body;
          expect(items.length).to.be.eql(2);
          for (let instance of items) {
            expect(instance).to.have.property('id');
            expect(instance).to.have.property('departureDateTime');
            expect(instance).to.have.property('bookingClasses');
          }
          expect(items[0].bookingClasses.length).to.equal(2);
          expect(items[1].bookingClasses.length).to.equal(1);
        });
    });

    it('should return warning for old data format version', async () => {
      const airline = await deployFullAirline({
        ...deploymentOptions,
        schemaVersion: '0.1.0',
      }, AIRLINE_DESCRIPTION, AIRLINE_FLIGHTS, FLIGHT_INSTANCES);
      await request(server)
        .get(`/airlines/${airline.address}/flights/${flightId}/instances`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect((res) => {
          expect(res.status).to.be.eql(200);
          const { items, warnings, errors } = res.body;
          expect(items.length).to.be.eql(0);
          expect(warnings.length).to.be.eql(2);
          expect(errors.length).to.be.eql(0);
          expect(warnings[0].msgLong).to.match(/^Unsupported data format version/);
        });
    });

    it('should return error for invalid data', async () => {
      let flightInstances = _.cloneDeep(FLIGHT_INSTANCES);
      delete flightInstances[0].bookingClasses;
      const airline = await deployFullAirline(deploymentOptions, AIRLINE_DESCRIPTION, AIRLINE_FLIGHTS, flightInstances);
      await request(server)
        .get(`/airlines/${airline.address}/flights/${flightId}/instances`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect((res) => {
          expect(res.status).to.be.eql(200);
          const { items, warnings, errors } = res.body;
          expect(items.length).to.be.eql(1);
          expect(warnings.length).to.be.eql(0);
          expect(errors.length).to.be.eql(1);
          expect(errors[0].msgLong).to.match(/^bookingClasses is a required field/);
        });
    });

    it('should return 404 for unknown flight id', async () => {
      const flightId = 'flight-000';
      await request(server)
        .get(`/airlines/${airline.address}/flights/${flightId}/instances`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect(404)
        .expect((res) => {
          expect(res.body.code).to.eql('#flightNotFound');
        });
    });
  });

  describe('GET /airlines/:airlineAddress/flights/:flightId/instances/:flightInstanceId', () => {
    it('should return a flight instance', async () => {
      const flightInstanceId = 'IeKeix6G-1';
      const flightId = 'IeKeix6G';
      await request(server)
        .get(`/airlines/${airline.address}/flights/${flightId}/instances/${flightInstanceId}`)
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
        .get(`/airlines/${airline.address}/flights/${flightId}/instances/${flightInstanceId}`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect(404);
    });

    it('should return 404 if airline has no flight instances', async () => {
      const airline = await deployFullAirline(deploymentOptions, AIRLINE_DESCRIPTION);
      const flightInstanceId = 'flight-instance-0000';
      const flightId = 'IeKeix6G';
      await request(server)
        .get(`/airlines/${airline.address}/flights/${flightId}/instances/${flightInstanceId}`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect(404);
    });

    it('should return bad gateway for inaccessible data', async () => {
      sinon.stub(wtJsLibsWrapper, 'getAirlineDirectory').resolves({
        getOrganization: sinon.stub().resolves(new FakeAirlineWithBadOffChainData()),
      });
      const flightInstanceId = 'IeKeix6G-1';
      const flightId = 'IeKeix6G';
      await request(server)
        .get(`/airlines/${airline.address}/flights/${flightId}/instances/${flightInstanceId}`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect((res) => {
          expect(res.status).to.be.eql(502);
          wtJsLibsWrapper.getAirlineDirectory.restore();
        });
    });

    it('should return warning for old data format version', async () => {
      const airline = await deployFullAirline({
        ...deploymentOptions,
        schemaVersion: '0.1.0',
      }, AIRLINE_DESCRIPTION, AIRLINE_FLIGHTS, FLIGHT_INSTANCES);
      await request(server)
        .get(`/airlines/${airline.address}/flights/IeKeix6G/instances/IeKeix6G-1`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect((res) => {
          expect(res.status).to.be.eql(200);
          expect(res.headers).to.have.property(VALIDATION_WARNING_HEADER);
          expect(res.headers[VALIDATION_WARNING_HEADER]).to.match(/^Unsupported data format version 0\.1\.0\./);
        });
    });

    it('should return error for invalid data', async () => {
      let flightInstances = _.cloneDeep(FLIGHT_INSTANCES);
      delete flightInstances[0].segments;
      const airline = await deployFullAirline(deploymentOptions, AIRLINE_DESCRIPTION, AIRLINE_FLIGHTS, flightInstances);
      await request(server)
        .get(`/airlines/${airline.address}/flights/IeKeix6G/instances/IeKeix6G-1`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect((res) => {
          expect(res.status).to.be.eql(422);
          expect(res.body.long).to.match(/^segments is a required field/);
        });
    });
  });
});
