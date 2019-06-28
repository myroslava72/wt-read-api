/* eslint-env mocha */
const _ = require('lodash');
const { expect } = require('chai');
const request = require('supertest');
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

describe('Flights', function () {
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

  describe('GET /airlines/:airlineAddress/flights', () => {
    it('should enforce strict routing', async () => {
      await request(server)
        .get(`/airlines/${airline.address}/flights/`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect(301);
    });

    it('should return flight list', async () => {
      await request(server)
        .get(`/airlines/${airline.address}/flights`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect((res) => {
          expect(res.status).to.be.eql(200);
          expect(res.body).to.have.property('updatedAt');
          expect(res.body).to.have.property('items');
          expect(res.body.items.length).to.eql(2);
          for (let flight of res.body.items) {
            expect(flight).to.have.property('id');
            expect(flight).to.have.property('origin');
            expect(flight).to.have.property('destination');
            expect(flight).to.have.property('segments');
            expect(flight).to.not.have.property('flightInstances');
          }
        });
    });

    it('should return flight list with instances', async () => {
      await request(server)
        .get(`/airlines/${airline.address}/flights?fields=flightInstances`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect((res) => {
          expect(res.status).to.be.eql(200);
          expect(res.body).to.have.property('updatedAt');
          expect(res.body).to.have.property('items');
          expect(res.body.items.length).to.eql(2);
          for (let flight of res.body.items) {
            expect(flight).to.have.property('id');
            expect(flight).to.have.property('origin');
            expect(flight).to.have.property('destination');
            expect(flight).to.have.property('segments');
            expect(flight).to.have.property('flightInstances');
            expect(flight.flightInstances.length).to.eql(2);
          }
        });
    });

    it('should return warning for old data format version', async () => {
      const airline = await deployFullAirline({
        ...deploymentOptions,
        schemaVersion: '0.1.0',
      }, AIRLINE_DESCRIPTION, AIRLINE_FLIGHTS, FLIGHT_INSTANCES);
      await request(server)
        .get(`/airlines/${airline.address}/flights`)
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
      let airlineFlights = _.cloneDeep(AIRLINE_FLIGHTS);
      delete airlineFlights.items[0].origin;
      const airline = await deployFullAirline(deploymentOptions, AIRLINE_DESCRIPTION, airlineFlights, FLIGHT_INSTANCES);
      await request(server)
        .get(`/airlines/${airline.address}/flights`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect((res) => {
          expect(res.status).to.be.eql(200);
          const { items, warnings, errors } = res.body;
          expect(items.length).to.be.eql(1);
          expect(warnings.length).to.be.eql(0);
          expect(errors.length).to.be.eql(1);
          expect(errors[0].msgLong).to.match(/^origin is a required field/);
        });
    });

    it('should return 404 for unknown airline id', async () => {
      let airlineId = '0x994afd347B160be3973B41F0A144819496d175e9';
      await request(server)
        .get(`/airlines/${airlineId}/flights`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect(404);
    });

    it('should return 404 if airline has no flights', async () => {
      const airline = await deployFullAirline(deploymentOptions, AIRLINE_DESCRIPTION);
      await request(server)
        .get(`/airlines/${airline.address}/flights`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect(404);
    });
  });

  describe('GET /airlines/:airlineAddress/flights/:flightId/meta', () => {
    it('should return flight instances', async () => {
      const flightId = 'IeKeix6G';
      await request(server)
        .get(`/airlines/${airline.address}/flights/${flightId}/meta`)
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
        .get(`/airlines/${airline.address}/flights/${flightId}/meta`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect(404)
        .expect((res) => {
          expect(res.body.code).to.eql('#flightNotFound');
        });
    });
  });

  describe('GET /airlines/:airlineAddress/flights/:flightId', () => {
    it('should return a flight', async () => {
      const flightId = 'IeKeix6G';
      await request(server)
        .get(`/airlines/${airline.address}/flights/${flightId}`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect((res) => {
          expect(res.status).to.be.eql(200);
          expect(res.body).to.have.property('id', flightId);
          expect(res.body).to.have.property('origin', 'PRG');
          expect(res.body).to.have.property('destination', 'LAX');
          expect(res.body).to.not.have.property('flightInstances');
          expect(res.body).to.not.have.property('flightInstancesUri');
        });
    });

    it('should return a flight with instances', async () => {
      const flightId = 'IeKeix6G';
      await request(server)
        .get(`/airlines/${airline.address}/flights/${flightId}?fields=flightInstances`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect((res) => {
          expect(res.status).to.be.eql(200);
          expect(res.body).to.have.property('id', flightId);
          expect(res.body).to.have.property('origin', 'PRG');
          expect(res.body).to.have.property('destination', 'LAX');
          expect(res.body).to.have.property('flightInstances');
          expect(res.body).to.not.have.property('flightInstancesUri');
          expect(res.body.flightInstances.length).to.eql(2);
          for (let instance of res.body.flightInstances) {
            expect(instance).to.have.property('id');
            expect(instance).to.have.property('departureDateTime');
            expect(instance).to.have.property('bookingClasses');
          }
        });
    });

    it('should return 404 for unknown flight id', async () => {
      const flightId = 'flight-000';
      await request(server)
        .get(`/airlines/${airline.address}/flights/${flightId}`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect(404);
    });

    it('should return 404 if airline has no flights', async () => {
      const airline = await deployFullAirline(deploymentOptions, AIRLINE_DESCRIPTION);
      const flightId = 'IeKeix6G';
      await request(server)
        .get(`/airlines/${airline.address}/flights/${flightId}`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect(404);
    });

    it('should return warning for old data format version', async () => {
      const airline = await deployFullAirline({
        ...deploymentOptions,
        schemaVersion: '0.1.0',
      }, AIRLINE_DESCRIPTION, AIRLINE_FLIGHTS, FLIGHT_INSTANCES);
      await request(server)
        .get(`/airlines/${airline.address}/flights/IeKeix6G`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect((res) => {
          expect(res.status).to.be.eql(200);
          expect(res.headers).to.have.property(VALIDATION_WARNING_HEADER);
          expect(res.headers[VALIDATION_WARNING_HEADER]).to.match(/^Unsupported data format version 0\.1\.0\./);
        });
    });

    it('should return error for invalid data', async () => {
      let airlineFlights = _.cloneDeep(AIRLINE_FLIGHTS);
      delete airlineFlights.items[0].segments;
      const airline = await deployFullAirline(deploymentOptions, AIRLINE_DESCRIPTION, airlineFlights, FLIGHT_INSTANCES);
      await request(server)
        .get(`/airlines/${airline.address}/flights/IeKeix6G`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect((res) => {
          expect(res.status).to.be.eql(422);
          expect(res.body.long).to.match(/^segments is a required field/);
        });
    });
  });
});
