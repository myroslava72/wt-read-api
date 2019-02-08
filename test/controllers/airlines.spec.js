/* eslint-env mocha */
/* eslint-disable no-unused-expressions */
const { expect } = require('chai');
const sinon = require('sinon');
const request = require('supertest');
const wtJsLibsWrapper = require('../../src/services/wt-js-libs');
const { AIRLINE_SEGMENT_ID, DATA_FORMAT_VERSION } = require('../../src/constants');
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
  DEFAULT_PAGE_SIZE,
} = require('../../src/constants');
const {
  FakeNiceAirline,
  FakeAirlineWithBadOnChainData,
  FakeAirlineWithBadOffChainData,
} = require('../utils/fake-airlines');

describe('Airlines', function () {
  let server;
  let wtLibsInstance, indexContract;
  let airline0address, airline1address;

  beforeEach(async () => {
    server = require('../../src/index');
    wtLibsInstance = wtJsLibsWrapper.getInstance(AIRLINE_SEGMENT_ID);
    indexContract = await deployAirlineIndex();
    wtJsLibsWrapper._setIndexAddress(indexContract.address, AIRLINE_SEGMENT_ID);
  });

  afterEach(() => {
    server.close();
  });

  describe('GET /airlines', () => {
    beforeEach(async () => {
      airline0address = await deployFullAirline(await wtLibsInstance.getOffChainDataClient('in-memory'), indexContract, AIRLINE_DESCRIPTION, AIRLINE_FLIGHTS, FLIGHT_INSTANCES);
      airline1address = await deployFullAirline(await wtLibsInstance.getOffChainDataClient('in-memory'), indexContract, AIRLINE_DESCRIPTION, AIRLINE_FLIGHTS, FLIGHT_INSTANCES);
    });

    it('should return default fields for airlines', async () => {
      await request(server)
        .get('/airlines')
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect(200)
        .expect((res) => {
          const { items, errors } = res.body;
          expect(items.length).to.be.eql(2);
          expect(errors.length).to.be.eql(0);
          expect(items[0]).to.have.property('id', airline0address);
          expect(items[0]).to.have.property('name');
          expect(items[0]).to.have.property('code');
          expect(items[1]).to.have.property('id', airline1address);
          expect(items[1]).to.have.property('name');
          expect(items[1]).to.have.property('code');
        });
    });

    it('should return errors if they happen to individual airlines', async () => {
      sinon.stub(wtJsLibsWrapper, 'getWTAirlineIndex').resolves({
        getAllAirlines: sinon.stub().resolves([new FakeNiceAirline(), new FakeAirlineWithBadOnChainData()]),
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
          wtJsLibsWrapper.getWTAirlineIndex.restore();
        });
    });

    it('should try to fullfill the requested limit of valid airlines', async () => {
      sinon.stub(wtJsLibsWrapper, 'getWTAirlineIndex').resolves({
        getAllAirlines: sinon.stub().resolves([
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
          wtJsLibsWrapper.getWTAirlineIndex.restore();
        });
    });

    it('should not break when requesting much more airlines than actually available', async () => {
      sinon.stub(wtJsLibsWrapper, 'getWTAirlineIndex').resolves({
        getAllAirlines: sinon.stub().resolves([
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
          wtJsLibsWrapper.getWTAirlineIndex.restore();
        });
    });

    it('should not provide next if all airlines are broken', async () => {
      sinon.stub(wtJsLibsWrapper, 'getWTAirlineIndex').resolves({
        getAllAirlines: sinon.stub().resolves([
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
          wtJsLibsWrapper.getWTAirlineIndex.restore();
        });
    });

    it('should try to fullfill the requested limit of valid airlines and provide valid next', async () => {
      const nextNiceAirline = new FakeNiceAirline();
      sinon.stub(wtJsLibsWrapper, 'getWTAirlineIndex').resolves({
        getAllAirlines: sinon.stub().resolves([
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
          expect(next).to.be.equal(`http://example.com/airlines?limit=4&fields=id,name,code&startWith=${nextNiceAirline.address}`);
          wtJsLibsWrapper.getWTAirlineIndex.restore();
        });
    });

    it('should return all fields that a client asks for in airline list', async () => {
      const fields = [
        'managerAddress',
        'id',
        'name',
        'description',
        'contacts',
        'flights',
        'currency',
        'updatedAt',
        'notificationsUri',
        'bookingUri',
      ];
      const query = `fields=${fields.join()}`;

      await request(server)
        .get(`/airlines?${query}`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect(200)
        .expect((res) => {
          const { items } = res.body;
          expect(items.length).to.be.eql(2);
          items.forEach(airline => {
            expect(airline).to.have.all.keys(fields);
            for (let flight of airline.flights.items) {
              for (let instance of flight.flightInstancesUri.contents) {
                expect(instance).to.have.property('id');
              }
            }
          });
        });
      const query2 = (fields.map((f) => `fields=${f}`)).join('&');
      await request(server)
        .get(`/airlines?${query2}`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect(200)
        .expect((res) => {
          const { items } = res.body;
          expect(items.length).to.be.eql(2);
          items.forEach(airline => {
            expect(airline).to.have.all.keys(fields);
            for (let flight of airline.flights.items) {
              for (let instance of flight.flightInstancesUri.contents) {
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
          expect(next).to.be.eql(`http://example.com/airlines?limit=1&fields=id,name,code&startWith=${airline1address}`);

          items.forEach(airline => {
            expect(airline).to.have.property('id');
            expect(airline).to.have.property('name');
            expect(airline).to.have.property('code');
          });
        });
    });

    it('should paginate', async () => {
      await request(server)
        .get(`/airlines?limit=1&startWith=${airline1address}`)
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
      sinon.stub(wtJsLibsWrapper, 'getWTAirlineIndex').resolves({
        getAllAirlines: sinon.stub().resolves([
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
          expect(next).to.be.equal(`http://example.com/airlines?limit=${DEFAULT_PAGE_SIZE}&fields=id,name,code&startWith=${nextNiceAirline.address}`);
          wtJsLibsWrapper.getWTAirlineIndex.restore();
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
          expect(next).to.be.eql(`http://example.com/airlines?limit=1&fields=id,name&startWith=${airline1address}`);
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

    it('should not touch off-chain data if only on-chain data is requested', async () => {
      const niceAirline = new FakeNiceAirline();
      const toPlainObjectSpy = sinon.spy(niceAirline, 'toPlainObject');
      sinon.stub(wtJsLibsWrapper, 'getWTAirlineIndex').resolves({
        getAllAirlines: sinon.stub().resolves([niceAirline, new FakeAirlineWithBadOnChainData()]),
      });
      await request(server)
        .get('/airlines?limit=1&fields=id')
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect((res) => {
          expect(toPlainObjectSpy.callCount).to.be.eql(0);
          wtJsLibsWrapper.getWTAirlineIndex.restore();
        });
    });
  });

  describe('GET /airlines/:airlineAddress', () => {
    let address;
    beforeEach(async () => {
      address = await deployFullAirline(await wtLibsInstance.getOffChainDataClient('in-memory'), indexContract, AIRLINE_DESCRIPTION, AIRLINE_FLIGHTS, FLIGHT_INSTANCES);
    });

    it('should return default fields', async () => {
      const defaultAirlineFields = [
        'id',
        'name',
        'description',
        'contacts',
        'currency',
        'updatedAt',
      ];
      await request(server)
        .get(`/airlines/${address}`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect((res) => {
          expect(res.body).to.have.all.keys(defaultAirlineFields);
        })
        .expect(200);
    });

    it('should return all fields that a client asks for in airline detail', async () => {
      // defaultCancellationAmount was problematic when set to 0
      const fields = [
        'name',
        'managerAddress',
        'defaultCancellationAmount',
        'notificationsUri',
        'bookingUri',
      ];
      const query = `fields=${fields.join()}`;

      await request(server)
        .get(`/airlines/${address}?${query}`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect((res) => {
          expect(res.body).to.have.all.keys([...fields, 'id']);
        })
        .expect(200);
      const query2 = (fields.map((f) => `fields=${f}`)).join('&');
      await request(server)
        .get(`/airlines/${address}?${query2}`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect((res) => {
          expect(res.body).to.have.all.keys([...fields, 'id']);
        })
        .expect(200);
    });

    it('should return all the nested fields that a client asks for', async () => {
      const fields = ['managerAddress', 'name', 'currency', 'contacts.general.email', 'contacts.general.phone'];
      const query = `fields=${fields.join()}`;

      await request(server)
        .get(`/airlines/${address}?${query}`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect((res) => {
          expect(res.body).to.have.property('id');
          expect(res.body).to.have.property('managerAddress');
          expect(res.body).to.have.property('name');
          expect(res.body).to.have.property('currency');
          expect(res.body).to.have.property('contacts');
          expect(res.body.contacts.general).to.have.property('email');
          expect(res.body.contacts.general).to.have.property('phone');
          expect(res.body.contacts.general.url).to.be.undefined;
        })
        .expect(200);
    });

    it('should return all fields the client asks for even from an object of objects', async () => {
      const fields = ['name', 'currency', 'flights.items.id', 'flights.items.origin', 'flights.items.flightInstancesUri', 'flights.updatedAt'];
      const query = `fields=${fields.join()}`;

      await request(server)
        .get(`/airlines/${address}?${query}`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect((res) => {
          expect(res.body).to.have.all.keys(['name', 'currency', 'flights', 'id']);
          expect(res.body.address).to.be.undefined;
          expect(res.body.flights.items.length).to.be.gt(0);
          for (let flight of res.body.flights.items) {
            expect(flight).to.have.property('id');
            expect(flight).to.have.property('origin');
            expect(flight).to.not.have.property('destination');
            expect(flight).to.not.have.property('segments');
          }
        })
        .expect(200);
    });

    it('should return all nested fields even from an object of objects', async () => {
      const fields = ['name', 'currency', 'flights'];
      const query = `fields=${fields.join()}`;

      await request(server)
        .get(`/airlines/${address}?${query}`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect((res) => {
          expect(res.body).to.have.all.keys(['name', 'currency', 'flights', 'id']);
          expect(res.body.address).to.be.undefined;
          expect(res.body.flights.items.length).to.be.gt(0);
          for (let flight of res.body.flights.items) {
            expect(flight).to.have.property('id');
            expect(flight).to.have.property('origin');
            expect(flight).to.have.property('destination');
            expect(flight).to.have.property('segments');
          }
        })
        .expect(200);
    });

    it('should return flights if asked for', async () => {
      const fields = ['name', 'flightsUri.items.destination', 'flightsUri.items.id', 'flightsUri.updatedAt'];
      const query = `fields=${fields.join()}`;

      await request(server)
        .get(`/airlines/${address}?${query}`)
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
      const fields = ['id', 'name', 'flights.updatedAt', 'flights.items.flightInstancesUri', 'flights.items.id'];
      const query = `fields=${fields.join()}`;

      await request(server)
        .get(`/airlines/${address}?${query}`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect((res) => {
          expect(res.body).to.have.all.keys(['name', 'flights', 'id']);
          expect(res.body.code).to.be.undefined;
          expect(res.body.flights.items.length).to.be.gt(0);
          for (let flight of res.body.flights.items) {
            expect(flight).to.have.property('id');
            for (let instance of flight.flightInstancesUri.contents) {
              expect(instance).to.have.property('id');
              expect(instance).to.have.property('departureDateTime');
              expect(instance).to.have.property('bookingClasses');
            }
          }
          expect(res.body.flights).to.have.property('updatedAt');
        })
        .expect(200);
    });

    it('should return 502 when on-chain data is inaccessible', async () => {
      sinon.stub(wtJsLibsWrapper, 'getWTAirlineIndex').resolves({
        getAirline: sinon.stub().resolves(new FakeAirlineWithBadOnChainData()),
      });

      await request(server)
        .get(`/airlines/${address}`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect(502)
        .expect((res) => {
          wtJsLibsWrapper.getWTAirlineIndex.restore();
        });
    });

    it('should return 502 when off-chain data is inaccessible', async () => {
      sinon.stub(wtJsLibsWrapper, 'getWTAirlineIndex').resolves({
        getAirline: sinon.stub().resolves(new FakeAirlineWithBadOffChainData()),
      });

      await request(server)
        .get(`/airlines/${address}`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect(502)
        .expect((res) => {
          wtJsLibsWrapper.getWTAirlineIndex.restore();
        });
    });

    it('should not return any non-existent fields even if a client asks for them', async () => {
      const fields = ['managerAddress', 'name'];
      const invalidFields = ['invalid', 'invalidField'];
      const query = `fields=${fields.join()},${invalidFields.join()}`;

      await request(server)
        .get(`/airlines/${address}?${query}`)
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
        .get(`/airlines/${address.toUpperCase()}`)
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
      const airline = await deployFullAirline(await wtLibsInstance.getOffChainDataClient('in-memory'), indexContract, AIRLINE_DESCRIPTION, AIRLINE_FLIGHTS, FLIGHT_INSTANCES);
      await request(server)
        .get(`/airlines/${airline}/meta`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect((res) => {
          expect(res.body).to.have.property('address', airline);
          expect(res.body).to.have.property('dataUri');
          expect(res.body).to.have.property('descriptionUri');
          expect(res.body).to.have.property('flightsUri');
          expect(res.body).to.have.property('dataFormatVersion', DATA_FORMAT_VERSION);
          expect(res.body.dataUri).to.match(/^in-memory:\/\//);
          expect(res.body.descriptionUri).to.match(/^in-memory:\/\//);
          expect(res.body.flightsUri).to.match(/^in-memory:\/\//);
        })
        .expect(200);
    });

    it('should not return unspecified optional fields', async () => {
      const airline = await deployFullAirline(await wtLibsInstance.getOffChainDataClient('in-memory'), indexContract, AIRLINE_DESCRIPTION);
      await request(server)
        .get(`/airlines/${airline}/meta`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect((res) => {
          expect(res.body).to.have.property('address', airline);
          expect(res.body).to.have.property('dataUri');
          expect(res.body).to.have.property('descriptionUri');
          expect(res.body).to.have.property('dataFormatVersion');
          expect(res.body).to.not.have.property('flightsUri');
        })
        .expect(200);
    });
  });
});
