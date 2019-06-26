/* eslint-env mocha */
/* eslint-disable no-unused-expressions */
const { expect } = require('chai');
const _ = require('lodash');
const sinon = require('sinon');
const request = require('supertest');
const wtJsLibsWrapper = require('../../src/services/wt-js-libs');
const { getSchemaVersion } = require('../utils/schemas');
const { config } = require('../../src/config');
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
  DEFAULT_PAGE_SIZE,
  VALIDATION_WARNING_HEADER,
} = require('../../src/constants');
const {
  FakeNiceAirline,
  FakeAirlineWithBadOnChainData,
  FakeAirlineWithBadOffChainData,
  FakeOldFormatAirline,
  FakeWrongFormatAirline,
} = require('../utils/fake-airlines');

describe('Airlines', function () {
  let server;
  let wtLibsInstance, app, deploymentOptions;
  let airline0, airline1;

  beforeEach(async () => {
    server = require('../../src/index');
    wtLibsInstance = wtJsLibsWrapper.getInstance();
    app = await deployAirlineApp(config);
    deploymentOptions = {
      schemaVersion: getSchemaVersion('@windingtree/wt-airline-schemas'),
      offChainDataClient: await wtLibsInstance.getOffChainDataClient('in-memory'),
      app: app,
    };
  });

  afterEach(() => {
    server.close();
  });

  describe('GET /airlines', () => {
    beforeEach(async () => {
      airline0 = await deployFullAirline(deploymentOptions, AIRLINE_DESCRIPTION, AIRLINE_FLIGHTS, FLIGHT_INSTANCES);
      airline1 = await deployFullAirline(deploymentOptions, AIRLINE_DESCRIPTION, AIRLINE_FLIGHTS, FLIGHT_INSTANCES);
    });

    it('should return default fields for airlines list', async () => {
      await request(server)
        .get('/airlines')
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect(200)
        .expect((res) => {
          const { items, errors } = res.body;
          expect(items.length).to.be.eql(2);
          expect(errors.length).to.be.eql(0);
          expect(items[0]).to.have.property('id', airline0.address);
          expect(items[0]).to.have.property('name');
          expect(items[0]).to.have.property('code');
          expect(items[1]).to.have.property('id', airline1.address);
          expect(items[1]).to.have.property('name');
          expect(items[1]).to.have.property('code');
          expect(items[1]).to.not.have.property('flights');
        });
    });

    it('should return validation errors if they happen to individual airlines', async () => {
      sinon.stub(wtJsLibsWrapper, 'getAirlineDirectory').resolves({
        getOrganizations: sinon.stub().resolves([new FakeOldFormatAirline(), new FakeWrongFormatAirline()]),
      });
      await request(server)
        .get('/airlines?fields=code,name,contacts,updatedAt,defaultCancellationAmount')
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect(200)
        .expect((res) => {
          const { items, warnings, errors } = res.body;
          expect(items.length).to.be.eql(0);
          expect(warnings.length).to.be.eql(1);
          expect(errors.length).to.be.eql(1);
          expect(warnings[0].originalError).to.match(/^Unsupported data format version/);
          expect(errors[0].originalError).to.match(/^Error: Unable to validate a model with a type: number, expected: string/);
          wtJsLibsWrapper.getAirlineDirectory.restore();
        });
    });

    it('should return flights for airlines when asked for', async () => {
      await request(server)
        .get('/airlines?fields=id,name,code,flights')
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect(200)
        .expect((res) => {
          const { items, errors } = res.body;
          expect(items.length).to.be.eql(2);
          expect(errors.length).to.be.eql(0);
          expect(items[0]).to.have.property('id', airline0.address);
          expect(items[0]).to.have.property('name');
          expect(items[0]).to.have.property('code');
          expect(items[0]).to.have.property('flights');
          expect(items[1]).to.have.property('id', airline1.address);
          expect(items[1]).to.have.property('name');
          expect(items[1]).to.have.property('code');
          expect(items[1]).to.have.property('flights');
          for (let airline of res.body.items) {
            for (let flight of airline.flights.items) {
              expect(flight).to.not.have.property('flightInstances');
              expect(flight).to.have.property('origin');
            }
          }
        });
    });

    it('should return flight instances for airlines when asked for', async () => {
      await request(server)
        .get('/airlines?fields=id,name,code,flights,flights.items.flightInstances')
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect(200)
        .expect((res) => {
          const { items, errors } = res.body;
          expect(items.length).to.be.eql(2);
          expect(errors.length).to.be.eql(0);
          expect(items[0]).to.have.property('id', airline0.address);
          expect(items[0]).to.have.property('name');
          expect(items[0]).to.have.property('code');
          expect(items[1]).to.have.property('id', airline1.address);
          expect(items[1]).to.have.property('name');
          expect(items[1]).to.have.property('code');
          for (let airline of res.body.items) {
            for (let flight of airline.flights.items) {
              expect(flight).to.have.property('flightInstances');
              expect(flight).to.have.property('origin');
              expect(flight).to.have.property('destination');
              expect(flight).to.have.property('segments');
            }
          }
        });
    });

    it('should return full flight instances for airlines when asked for', async () => {
      await request(server)
        .get('/airlines?fields=id,name,code,flights,flights.items.flightInstances')
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect(200)
        .expect((res) => {
          const { items, errors } = res.body;
          expect(items.length).to.be.eql(2);
          expect(errors.length).to.be.eql(0);
          expect(items[0]).to.have.property('id', airline0.address);
          expect(items[0]).to.have.property('name');
          expect(items[0]).to.have.property('code');
          expect(items[1]).to.have.property('id', airline1.address);
          expect(items[1]).to.have.property('name');
          expect(items[1]).to.have.property('code');
          for (let airline of res.body.items) {
            for (let flight of airline.flights.items) {
              expect(flight).to.have.property('flightInstances');
              expect(flight).to.have.property('origin');
            }
          }
        });
    });

    it('should return just id when asked for', async () => {
      await request(server)
        .get('/airlines?fields=id')
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect(200)
        .expect((res) => {
          const { items, warnings, errors } = res.body;
          expect(items.length).to.be.eql(2);
          expect(warnings.length).to.be.eql(0);
          expect(errors.length).to.be.eql(0);
          expect(items[0]).to.eql({ id: airline0.address });
          expect(items[1]).to.eql({ id: airline1.address });
        });
    });

    it('should return errors if they happen to individual airlines', async () => {
      sinon.stub(wtJsLibsWrapper, 'getAirlineDirectory').resolves({
        getOrganizations: sinon.stub().resolves([new FakeNiceAirline(), new FakeAirlineWithBadOnChainData()]),
      });
      await request(server)
        .get('/airlines')
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect(200)
        .expect((res) => {
          const { items, errors } = res.body;
          expect(items.length).to.be.eql(1);
          expect(errors.length).to.be.eql(1);
          wtJsLibsWrapper.getAirlineDirectory.restore();
        });
    });

    it('should try to fullfill the requested limit of valid airlines', async () => {
      sinon.stub(wtJsLibsWrapper, 'getAirlineDirectory').resolves({
        getOrganizations: sinon.stub().resolves([
          new FakeAirlineWithBadOnChainData(),
          new FakeAirlineWithBadOffChainData(),
          new FakeNiceAirline(),
          new FakeNiceAirline(),
        ]),
      });
      await request(server)
        .get('/airlines?limit=2')
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect(200)
        .expect((res) => {
          const { items, errors, next } = res.body;
          expect(items.length).to.be.eql(2);
          expect(errors.length).to.be.eql(2);
          expect(next).to.be.undefined;
          wtJsLibsWrapper.getAirlineDirectory.restore();
        });
    });

    it('should not break when requesting much more airlines than actually available', async () => {
      sinon.stub(wtJsLibsWrapper, 'getAirlineDirectory').resolves({
        getOrganizations: sinon.stub().resolves([
          new FakeAirlineWithBadOnChainData(),
          new FakeAirlineWithBadOffChainData(),
          new FakeNiceAirline(),
          new FakeNiceAirline(),
        ]),
      });
      await request(server)
        .get('/airlines?limit=200')
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect(200)
        .expect((res) => {
          const { items, errors, next } = res.body;
          expect(items.length).to.be.eql(2);
          expect(errors.length).to.be.eql(2);
          expect(next).to.be.undefined;
          wtJsLibsWrapper.getAirlineDirectory.restore();
        });
    });

    it('should not provide next if all airlines are broken', async () => {
      sinon.stub(wtJsLibsWrapper, 'getAirlineDirectory').resolves({
        getOrganizations: sinon.stub().resolves([
          new FakeAirlineWithBadOnChainData(),
          new FakeAirlineWithBadOffChainData(),
          new FakeAirlineWithBadOnChainData(),
          new FakeAirlineWithBadOffChainData(),
          new FakeAirlineWithBadOnChainData(),
          new FakeAirlineWithBadOffChainData(),
        ]),
      });
      await request(server)
        .get('/airlines?limit=2')
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect(200)
        .expect((res) => {
          const { items, errors, next } = res.body;
          expect(items.length).to.be.eql(0);
          expect(errors.length).to.be.eql(6);
          expect(next).to.be.undefined;
          wtJsLibsWrapper.getAirlineDirectory.restore();
        });
    });

    it('should try to fullfill the requested limit of valid airlines and provide valid next', async () => {
      const nextNiceAirline = new FakeNiceAirline();
      sinon.stub(wtJsLibsWrapper, 'getAirlineDirectory').resolves({
        getOrganizations: sinon.stub().resolves([
          new FakeAirlineWithBadOnChainData(),
          new FakeAirlineWithBadOffChainData(),
          new FakeNiceAirline(),
          new FakeNiceAirline(),
          new FakeNiceAirline(),
          new FakeNiceAirline(),
          nextNiceAirline,
        ]),
      });
      await request(server)
        .get('/airlines?limit=4')
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect(200)
        .expect((res) => {
          const { items, errors, next } = res.body;
          expect(items.length).to.be.eql(4);
          expect(errors.length).to.be.eql(2);
          expect(next).to.be.equal(`http://example.com/airlines?limit=4&fields=id,name,code,defaultCancellationAmount,contacts&startWith=${nextNiceAirline.address}`);
          wtJsLibsWrapper.getAirlineDirectory.restore();
        });
    });

    it('should return all fields that a client asks for in airline list', async () => {
      const fields = [
        'ownerAddress',
        'name',
        'contacts',
        'flights',
        'updatedAt',
        'notificationsUri',
        'bookingUri',
      ];
      const queryFields = fields.concat(['flights.items.flightInstances']);
      const query = `fields=${queryFields.join()}`;

      await request(server)
        .get(`/airlines?${query}`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect(200)
        .expect((res) => {
          const { items } = res.body;
          expect(items.length).to.be.eql(2);
          items.forEach(airline => {
            expect(airline).to.have.all.keys(fields.concat(['id']));
            for (let flight of airline.flights.items) {
              expect(flight).to.have.property('flightInstances');
              for (let instance of flight.flightInstances) {
                expect(instance).to.have.property('id');
              }
            }
          });
        });
      const query2 = (queryFields.map((f) => `fields=${f}`)).join('&');
      await request(server)
        .get(`/airlines?${query2}`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect(200)
        .expect((res) => {
          const { items } = res.body;
          expect(items.length).to.be.eql(2);
          items.forEach(airline => {
            expect(airline).to.have.all.keys(fields.concat(['id']));
            for (let flight of airline.flights.items) {
              expect(flight).to.have.property('flightInstances');
              for (let instance of flight.flightInstances) {
                expect(instance).to.have.property('id');
              }
            }
          });
        });
    });

    it('should apply limit', async () => {
      await request(server)
        .get('/airlines?limit=1')
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect((res) => {
          const { items, next } = res.body;
          expect(items.length).to.be.eql(1);
          expect(next).to.be.eql(`http://example.com/airlines?limit=1&fields=id,name,code,defaultCancellationAmount,contacts&startWith=${airline1.address}`);

          items.forEach(airline => {
            expect(airline).to.have.property('id');
            expect(airline).to.have.property('name');
            expect(airline).to.have.property('code');
          });
        });
    });

    it('should paginate', async () => {
      await request(server)
        .get(`/airlines?limit=1&startWith=${airline1.address}`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect((res) => {
          const { items, next } = res.body;
          expect(items.length).to.be.eql(1);
          expect(next).to.be.undefined;
          items.forEach(airline => {
            expect(airline).to.have.property('id');
            expect(airline).to.have.property('name');
            expect(airline).to.have.property('code');
          });
        });
    });

    it('should properly transfer limit even if not in querystring', async () => {
      const nextNiceAirline = new FakeNiceAirline();
      sinon.stub(wtJsLibsWrapper, 'getAirlineDirectory').resolves({
        getOrganizations: sinon.stub().resolves([
          new FakeAirlineWithBadOnChainData(),
          new FakeAirlineWithBadOnChainData(),
        ].concat([...Array(30).keys()].map(() => new FakeNiceAirline()))
          .concat([nextNiceAirline])
        ),
      });
      await request(server)
        .get('/airlines')
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect(200)
        .expect((res) => {
          const { items, errors, next } = res.body;
          expect(items.length).to.be.eql(30);
          expect(errors.length).to.be.eql(2);
          expect(next).to.be.equal(`http://example.com/airlines?limit=${DEFAULT_PAGE_SIZE}&fields=id,name,code,defaultCancellationAmount,contacts&startWith=${nextNiceAirline.address}`);
          wtJsLibsWrapper.getAirlineDirectory.restore();
        });
    });

    it('should transfer fields from request into next field in response', async () => {
      await request(server)
        .get('/airlines?limit=1&fields=id,name')
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect((res) => {
          const { items, next } = res.body;
          expect(items.length).to.be.eql(1);
          expect(next).to.be.eql(`http://example.com/airlines?limit=1&fields=id,name&startWith=${airline1.address}`);
          items.forEach(airline => {
            expect(airline).to.have.property('id');
            expect(airline).to.have.property('name');
          });
        });
    });

    it('should return 422 #paginationLimitError on negative limit', async () => {
      const pagination = 'limit=-500';
      await request(server)
        .get(`/airlines?${pagination}`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect((res) => {
          expect(res.body).to.have.property('code', '#paginationLimitError');
        })
        .expect(422);
    });

    it('should return 404 #paginationStartWithError if the startWith does not exist', async () => {
      const pagination = 'limit=1&startWith=random-airline-address';
      await request(server)
        .get(`/airlines?${pagination}`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect((res) => {
          expect(res.body).to.have.property('code', '#paginationStartWithError');
        })
        .expect(404);
    });
  });

  describe('GET /airlines/:airlineAddress', () => {
    let airline;
    beforeEach(async () => {
      airline = await deployFullAirline(deploymentOptions, AIRLINE_DESCRIPTION, AIRLINE_FLIGHTS, FLIGHT_INSTANCES);
    });

    it('should return default fields for airline detail', async () => {
      const defaultAirlineFields = [
        'name',
        'contacts',
        'code',
        'defaultCancellationAmount',
      ];
      await request(server)
        .get(`/airlines/${airline.address}`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect((res) => {
          expect(res.body).to.have.all.keys(['id', ...defaultAirlineFields]);
          expect(res.body).to.not.have.property('flights');
        })
        .expect(200);
    });

    it('should return validation warning for unsupported version', async () => {
      airline = await deployFullAirline({
        ...deploymentOptions,
        schemaVersion: '0.1.0',
      }, AIRLINE_DESCRIPTION, AIRLINE_FLIGHTS, FLIGHT_INSTANCES);
      await request(server)
        .get(`/airlines/${airline.address}`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect(200)
        .expect((res) => {
          expect(res.headers).to.have.property(VALIDATION_WARNING_HEADER);
          expect(res.headers[VALIDATION_WARNING_HEADER]).to.match(/^Unsupported data format version 0\.1\.0\./);
        });
    });

    it('should not return validation warning when data differs in patch version', async () => {
      airline = await deployFullAirline({
        ...deploymentOptions,
        schemaVersion: '0.7.99',
      }, AIRLINE_DESCRIPTION, AIRLINE_FLIGHTS, FLIGHT_INSTANCES);
      await request(server)
        .get(`/airlines/${airline.address}`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect(200)
        .expect((res) => {
          expect(res.headers).to.not.have.property(VALIDATION_WARNING_HEADER);
        });
    });

    it('should not break down when no off-chain data is requested', async () => {
      await request(server)
        .get(`/airlines/${airline.address}?fields=id`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect(200)
        .expect((res) => {
          expect(res.headers).to.not.have.property(VALIDATION_WARNING_HEADER);
        });
    });

    it('should return validation errors for default field', async () => {
      let airlineDescription = _.cloneDeep(AIRLINE_DESCRIPTION);
      airlineDescription.code = 23;
      airline = await deployFullAirline(deploymentOptions, airlineDescription, AIRLINE_FLIGHTS, FLIGHT_INSTANCES);
      await request(server)
        .get(`/airlines/${airline.address}`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect(422)
        .expect((res) => {
          expect(res.body.long).to.match(/^Unable to validate a model with a type: number, expected: string/);
        });
    });

    it('should return validation errors for missing default field', async () => {
      let airlineDescription = Object.assign({}, AIRLINE_DESCRIPTION);
      delete airlineDescription.code;
      airline = await deployFullAirline(deploymentOptions, airlineDescription, AIRLINE_FLIGHTS, FLIGHT_INSTANCES);
      await request(server)
        .get(`/airlines/${airline.address}`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect(422)
        .expect((res) => {
          expect(res.body.long).to.match(/^code is a required field/);
        });
    });

    it('should return validation errors for non-default field', async () => {
      let airlineDescription = _.cloneDeep(AIRLINE_DESCRIPTION);
      airlineDescription.updatedAt = false;
      airline = await deployFullAirline(deploymentOptions, airlineDescription, AIRLINE_FLIGHTS, FLIGHT_INSTANCES);
      await request(server)
        .get(`/airlines/${airline.address}?fields=updatedAt`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect(422)
        .expect((res) => {
          expect(res.body.long).to.match(/^updatedAt \(false\) is not a type of date-time/);
        });
    });

    it('should return validation errors for missing non-default field', async () => {
      let airlineDescription = Object.assign({}, AIRLINE_DESCRIPTION);
      delete airlineDescription.defaultCancellationAmount;
      airline = await deployFullAirline(deploymentOptions, airlineDescription, AIRLINE_FLIGHTS, FLIGHT_INSTANCES);
      await request(server)
        .get(`/airlines/${airline.address}?fields=defaultCancellationAmount`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect(422)
        .expect((res) => {
          expect(res.body.long).to.match(/^defaultCancellationAmount is a required field/);
        });
    });

    it('should return validation errors for missing value in nested field', async () => {
      let airlineDescription = _.cloneDeep(AIRLINE_DESCRIPTION);
      delete airlineDescription.contacts.general;
      airline = await deployFullAirline(deploymentOptions, airlineDescription, AIRLINE_FLIGHTS, FLIGHT_INSTANCES);
      await request(server)
        .get(`/airlines/${airline.address}`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect(422)
        .expect((res) => {
          expect(res.body.long).to.match(/^general is a required field/);
        });
    });

    it('should return validation errors for missing nested exact field', async () => {
      let airlineDescription = _.cloneDeep(AIRLINE_DESCRIPTION);
      delete airlineDescription.contacts.general;
      airline = await deployFullAirline(deploymentOptions, airlineDescription, AIRLINE_FLIGHTS, FLIGHT_INSTANCES);
      await request(server)
        .get(`/airlines/${airline.address}?fields=contacts.general`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect(422)
        .expect((res) => {
          expect(res.body.long).to.match(/^general is a required field/);
        });
    });

    it('should return all fields that a client asks for in airline detail', async () => {
      // defaultCancellationAmount was problematic when set to 0
      const fields = [
        'name',
        'ownerAddress',
        'defaultCancellationAmount',
        'notificationsUri',
        'bookingUri',
      ];
      const query = `fields=${fields.join()}`;

      await request(server)
        .get(`/airlines/${airline.address}?${query}`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect((res) => {
          expect(res.body).to.have.all.keys([...fields, 'id']);
        })
        .expect(200);
      const query2 = (fields.map((f) => `fields=${f}`)).join('&');
      await request(server)
        .get(`/airlines/${airline.address}?${query2}`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect((res) => {
          expect(res.body).to.have.all.keys([...fields, 'id']);
        })
        .expect(200);
    });

    it('should return all the nested fields that a client asks for', async () => {
      const fields = ['ownerAddress', 'name', 'code', 'contacts.general.email', 'contacts.general.phone'];
      const query = `fields=${fields.join()}`;

      await request(server)
        .get(`/airlines/${airline.address}?${query}`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect((res) => {
          expect(res.body).to.have.property('id');
          expect(res.body).to.have.property('ownerAddress');
          expect(res.body).to.have.property('name');
          expect(res.body).to.have.property('code');
          expect(res.body).to.have.property('contacts');
          expect(res.body.contacts.general).to.have.property('email');
          expect(res.body.contacts.general).to.have.property('phone');
          expect(res.body.contacts.general.url).to.be.undefined;
        })
        .expect(200);
    });

    it('should return all fields the client asks for even from an object of objects', async () => {
      const fields = ['name', 'code', 'flights.items.id', 'flights.items.origin', 'flights.items.flightInstances', 'flights.updatedAt'];
      const query = `fields=${fields.join()}`;

      await request(server)
        .get(`/airlines/${airline.address}?${query}`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect((res) => {
          expect(res.body).to.have.all.keys(['name', 'code', 'flights', 'id']);
          expect(res.body.address).to.be.undefined;
          expect(res.body.flights.items.length).to.be.gt(0);
          for (let flight of res.body.flights.items) {
            expect(flight).to.have.property('id');
            expect(flight).to.have.property('origin');
            expect(flight).to.have.property('flightInstances');
            expect(flight).to.not.have.property('destination');
            expect(flight).to.not.have.property('segments');
          }
        })
        .expect(200);
    });

    it('should return all nested fields even from an object of objects', async () => {
      const fields = ['name', 'code', 'flights'];
      const query = `fields=${fields.join()}`;

      await request(server)
        .get(`/airlines/${airline.address}?${query}`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect((res) => {
          expect(res.body).to.have.all.keys(['name', 'code', 'flights', 'id']);
          expect(res.body.address).to.be.undefined;
          expect(res.body.flights.items.length).to.be.gt(0);
          for (let flight of res.body.flights.items) {
            expect(flight).to.have.property('id');
            expect(flight).to.have.property('origin');
            expect(flight).to.have.property('destination');
            expect(flight).to.have.property('segments');
            expect(flight).to.not.have.property('flightInstances');
          }
        })
        .expect(200);
    });

    it('should return flights if asked for', async () => {
      const fields = ['name', 'flights.items.destination', 'flights.items.id', 'flights.updatedAt'];
      const query = `fields=${fields.join()}`;

      await request(server)
        .get(`/airlines/${airline.address}?${query}`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect((res) => {
          expect(res.body).to.have.all.keys(['name', 'flights', 'id']);
          expect(res.body.address).to.be.undefined;
          expect(res.body.flights.items.length).to.be.gt(0);
          for (let flight of res.body.flights.items) {
            expect(flight).to.have.property('id');
            expect(flight).to.have.property('destination');
            expect(flight).to.not.have.property('origin');
          }
        })
        .expect(200);
    });

    it('should return flight instances if asked for', async () => {
      const fields = ['id', 'name', 'flights.items.flightInstances', 'flights'];
      const query = `fields=${fields.join()}`;

      await request(server)
        .get(`/airlines/${airline.address}?${query}`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect((res) => {
          expect(res.body).to.have.all.keys(['name', 'flights', 'id']);
          expect(res.body.code).to.be.undefined;
          expect(res.body.flights.items.length).to.be.gt(0);
          for (let flight of res.body.flights.items) {
            expect(flight).to.have.property('id');
            expect(flight).to.have.property('origin');
            expect(flight).to.have.property('destination');
            expect(flight).to.have.property('flightInstances');
            for (let instance of flight.flightInstances) {
              expect(instance).to.have.property('id');
              expect(instance).to.have.property('departureDateTime');
              expect(instance).to.have.property('bookingClasses');
            }
          }
          expect(res.body.flights).to.have.property('updatedAt');
        })
        .expect(200);
    });

    it('should return just id when asked for', async () => {
      await request(server)
        .get(`/airlines/${airline.address}?fields=id`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect(200)
        .expect((res) => {
          expect(res.body).to.eql({ id: airline.address });
        });
    });

    it('should return 502 when on-chain data is inaccessible', async () => {
      sinon.stub(wtJsLibsWrapper, 'getAirlineDirectory').resolves({
        getOrganization: sinon.stub().resolves(new FakeAirlineWithBadOnChainData()),
      });

      await request(server)
        .get(`/airlines/${airline.address}`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect(502)
        .expect((res) => {
          wtJsLibsWrapper.getAirlineDirectory.restore();
        });
    });

    it('should return 502 when off-chain data is inaccessible', async () => {
      sinon.stub(wtJsLibsWrapper, 'getAirlineDirectory').resolves({
        getOrganization: sinon.stub().resolves(new FakeAirlineWithBadOffChainData()),
      });

      await request(server)
        .get(`/airlines/${airline.address}`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect(502)
        .expect((res) => {
          wtJsLibsWrapper.getAirlineDirectory.restore();
        });
    });

    it('should not return any non-existent fields even if a client asks for them', async () => {
      const fields = ['ownerAddress', 'name'];
      const invalidFields = ['invalid', 'invalidField'];
      const query = `fields=${fields.join()},${invalidFields.join()}`;

      await request(server)
        .get(`/airlines/${airline.address}?${query}`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect((res) => {
          expect(res.body).to.have.all.keys([...fields, 'id']);
          expect(res.body).to.not.have.all.keys(invalidFields);
        })
        .expect(200);
    });

    it('should return a 404 for a non-existent address', async () => {
      await request(server)
        .get('/airlines/0x7135422D4633901AE0D2469886da96A8a72CB264')
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect(404);
    });

    it('should return a 422 for an invalid address', async () => {
      await request(server)
        .get('/airlines/meta')
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect(422);
    });

    it('should not work for an address in a badly checksummed format', async () => {
      await request(server)
        .get(`/airlines/${airline.address.toUpperCase()}`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect((res) => {
          expect(res.body).to.have.property('code', '#airlineChecksum');
        })
        .expect(422);
    });
  });

  describe('GET /airlines/:airlineAddress/meta', () => {
    it('should return all fields', async () => {
      const airline = await deployFullAirline(deploymentOptions, AIRLINE_DESCRIPTION, AIRLINE_FLIGHTS, FLIGHT_INSTANCES);
      await request(server)
        .get(`/airlines/${airline.address}/meta`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect((res) => {
          expect(res.body).to.have.property('address', airline.address);
          expect(res.body).to.have.property('orgJsonUri');
          expect(res.body).to.have.property('descriptionUri');
          expect(res.body).to.have.property('flightsUri');
          expect(res.body).to.have.property('dataFormatVersion', getSchemaVersion('@windingtree/wt-airline-schemas'));
          expect(res.body.orgJsonUri).to.match(/^in-memory:\/\//);
          expect(res.body.descriptionUri).to.match(/^in-memory:\/\//);
          expect(res.body.flightsUri).to.match(/^in-memory:\/\//);
        })
        .expect(200);
    });

    it('should not return unspecified optional fields', async () => {
      const airline = await deployFullAirline(deploymentOptions, AIRLINE_DESCRIPTION);
      await request(server)
        .get(`/airlines/${airline.address}/meta`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect((res) => {
          expect(res.body).to.have.property('address', airline.address);
          expect(res.body).to.have.property('orgJsonUri');
          expect(res.body).to.have.property('descriptionUri');
          expect(res.body).to.have.property('dataFormatVersion', getSchemaVersion('@windingtree/wt-airline-schemas'));
          expect(res.body).to.not.have.property('flightsUri');
        })
        .expect(200);
    });
  });
});
