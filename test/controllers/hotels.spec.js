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
  deployHotelApp,
  deployFullHotel,
} = require('../../management/local-network');
const {
  HOTEL_DESCRIPTION,
  RATE_PLANS,
  AVAILABILITY,
} = require('../utils/test-data');
const {
  DEFAULT_PAGE_SIZE,
  VALIDATION_WARNING_HEADER,
} = require('../../src/constants');
const {
  FakeNiceHotel,
  FakeNotTrustworthyHotel,
  FakeHotelWithBadOnChainData,
  FakeHotelWithBadOffChainData,
  FakeOldFormatHotel,
  FakeWrongFormatHotel,
} = require('../utils/fake-hotels');

describe('Hotels', function () {
  let server;
  let wtLibsInstance, app, deploymentOptions;
  let hotel0, hotel1;
  beforeEach(async () => {
    server = require('../../src/index');
    wtLibsInstance = wtJsLibsWrapper.getInstance();
    app = await deployHotelApp(config);
    deploymentOptions = {
      schemaVersion: getSchemaVersion('@windingtree/wt-hotel-schemas'),
      offChainDataClient: await wtLibsInstance.getOffChainDataClient('in-memory'),
      app: app,
    };
  });

  afterEach(() => {
    server.close();
  });

  describe('GET /hotels', () => {
    beforeEach(async () => {
      hotel0 = await deployFullHotel(deploymentOptions, HOTEL_DESCRIPTION, RATE_PLANS);
      hotel1 = await deployFullHotel(deploymentOptions, HOTEL_DESCRIPTION, RATE_PLANS);
    });

    it('should enforce strict routing', async () => {
      await request(server)
        .get('/hotels/')
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect(301);
    });

    it('should return default fields for hotels', async () => {
      await request(server)
        .get('/hotels')
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect(200)
        .expect((res) => {
          const { items, errors } = res.body;
          expect(items.length).to.be.eql(2);
          expect(errors.length).to.be.eql(0);
          expect(items[0]).to.have.property('id', hotel0.address);
          expect(items[0]).to.have.property('name');
          expect(items[0]).to.have.property('location');
          expect(items[1]).to.have.property('id', hotel1.address);
          expect(items[1]).to.have.property('name');
          expect(items[1]).to.have.property('location');
        });
    });

    it('should not return hotels that do not pass the trustworthiness test', async () => {
      sinon.stub(wtJsLibsWrapper, 'getHotelDirectory').resolves({
        getOrganizations: sinon.stub().resolves([new FakeNiceHotel(), new FakeNotTrustworthyHotel()]),
      });
      await request(server)
        .get('/hotels')
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect(200)
        .expect((res) => {
          const { items, errors } = res.body;
          expect(items.length).to.be.eql(1);
          expect(errors.length).to.be.eql(0);
          wtJsLibsWrapper.getHotelDirectory.restore();
        });
    });

    it('should return validation errors if they happen to individual hotels', async () => {
      sinon.stub(wtJsLibsWrapper, 'getHotelDirectory').resolves({
        getOrganizations: sinon.stub().resolves([new FakeOldFormatHotel(), new FakeWrongFormatHotel()]),
      });
      await request(server)
        .get('/hotels?fields=description,name,contacts,address,timezone,currency,updatedAt,defaultCancellationAmount')
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
          wtJsLibsWrapper.getHotelDirectory.restore();
        });
    });

    it('should return errors if they happen to individual hotels', async () => {
      sinon.stub(wtJsLibsWrapper, 'getHotelDirectory').resolves({
        getOrganizations: sinon.stub().resolves([new FakeNiceHotel(), new FakeHotelWithBadOnChainData()]),
      });
      await request(server)
        .get('/hotels')
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect(200)
        .expect((res) => {
          const { items, errors } = res.body;
          expect(items.length).to.be.eql(1);
          expect(errors.length).to.be.eql(1);
          wtJsLibsWrapper.getHotelDirectory.restore();
        });
    });

    it('should try to fullfill the requested limit of valid hotels', async () => {
      sinon.stub(wtJsLibsWrapper, 'getHotelDirectory').resolves({
        getOrganizations: sinon.stub().resolves([
          new FakeHotelWithBadOnChainData(),
          new FakeHotelWithBadOffChainData(),
          new FakeNiceHotel(),
          new FakeNiceHotel(),
        ]),
      });
      await request(server)
        .get('/hotels?limit=2')
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect(200)
        .expect((res) => {
          const { items, errors, next } = res.body;
          expect(items.length).to.be.eql(2);
          expect(errors.length).to.be.eql(2);
          expect(next).to.be.undefined;
          wtJsLibsWrapper.getHotelDirectory.restore();
        });
    });

    it('should not break when requesting much more hotels than actually available', async () => {
      sinon.stub(wtJsLibsWrapper, 'getHotelDirectory').resolves({
        getOrganizations: sinon.stub().resolves([
          new FakeHotelWithBadOnChainData(),
          new FakeHotelWithBadOffChainData(),
          new FakeNiceHotel(),
          new FakeNiceHotel(),
        ]),
      });
      await request(server)
        .get('/hotels?limit=200')
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect(200)
        .expect((res) => {
          const { items, errors, next } = res.body;
          expect(items.length).to.be.eql(2);
          expect(errors.length).to.be.eql(2);
          expect(next).to.be.undefined;
          wtJsLibsWrapper.getHotelDirectory.restore();
        });
    });

    it('should not provide next if all hotels are broken', async () => {
      sinon.stub(wtJsLibsWrapper, 'getHotelDirectory').resolves({
        getOrganizations: sinon.stub().resolves([
          new FakeHotelWithBadOnChainData(),
          new FakeHotelWithBadOffChainData(),
          new FakeHotelWithBadOnChainData(),
          new FakeHotelWithBadOffChainData(),
          new FakeHotelWithBadOnChainData(),
          new FakeHotelWithBadOffChainData(),
        ]),
      });
      await request(server)
        .get('/hotels?limit=2')
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect(200)
        .expect((res) => {
          const { items, errors, next } = res.body;
          expect(items.length).to.be.eql(0);
          expect(errors.length).to.be.eql(6);
          expect(next).to.be.undefined;
          wtJsLibsWrapper.getHotelDirectory.restore();
        });
    });

    it('should try to fullfill the requested limit of valid hotels and provide valid next', async () => {
      const nextNiceHotel = new FakeNiceHotel();
      sinon.stub(wtJsLibsWrapper, 'getHotelDirectory').resolves({
        getOrganizations: sinon.stub().resolves([
          new FakeHotelWithBadOnChainData(),
          new FakeHotelWithBadOffChainData(),
          new FakeNiceHotel(),
          new FakeNiceHotel(),
          new FakeNiceHotel(),
          new FakeNiceHotel(),
          nextNiceHotel,
        ]),
      });
      await request(server)
        .get('/hotels?limit=4')
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect(200)
        .expect((res) => {
          const { items, errors, next } = res.body;
          expect(items.length).to.be.eql(4);
          expect(errors.length).to.be.eql(2);
          expect(next).to.be.equal(`http://example.com/hotels?limit=4&fields=id,location,name&startWith=${nextNiceHotel.address}`);
          wtJsLibsWrapper.getHotelDirectory.restore();
        });
    });

    it('should return all fields that a client asks for in hotel list', async () => {
      const fields = [
        'ownerAddress',
        'id',
        'name',
        'description',
        'location',
        'contacts',
        'address',
        'roomTypes',
        'timezone',
        'currency',
        'images',
        'amenities',
        'updatedAt',
        'notificationsUri',
        'bookingUri',
      ];
      const query = `fields=${fields.join()}`;

      await request(server)
        .get(`/hotels?${query}`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect(200)
        .expect((res) => {
          const { items } = res.body;
          expect(items.length).to.be.eql(2);
          items.forEach(hotel => {
            expect(hotel).to.have.all.keys(fields);
            for (let roomType of hotel.roomTypes) {
              expect(roomType).to.have.property('id');
            }
          });
        });
      const query2 = (fields.map((f) => `fields=${f}`)).join('&');
      await request(server)
        .get(`/hotels?${query2}`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect(200)
        .expect((res) => {
          const { items } = res.body;
          expect(items.length).to.be.eql(2);
          items.forEach(hotel => {
            expect(hotel).to.have.all.keys(fields);
            for (let roomType of hotel.roomTypes) {
              expect(roomType).to.have.property('id');
            }
          });
        });
    });

    it('should apply limit', async () => {
      await request(server)
        .get('/hotels?limit=1')
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect((res) => {
          const { items, next } = res.body;
          expect(items.length).to.be.eql(1);
          expect(next).to.be.eql(`http://example.com/hotels?limit=1&fields=id,location,name&startWith=${hotel1.address}`);

          items.forEach(hotel => {
            expect(hotel).to.have.property('id');
            expect(hotel).to.have.property('name');
            expect(hotel).to.have.property('location');
          });
        });
    });

    it('should paginate', async () => {
      await request(server)
        .get(`/hotels?limit=1&startWith=${hotel1.address}`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect((res) => {
          const { items, next } = res.body;
          expect(items.length).to.be.eql(1);
          expect(next).to.be.undefined;
          items.forEach(hotel => {
            expect(hotel).to.have.property('id');
            expect(hotel).to.have.property('name');
            expect(hotel).to.have.property('location');
          });
        });
    });

    it('should properly transfer limit even if not in querystring', async () => {
      const nextNiceHotel = new FakeNiceHotel();
      sinon.stub(wtJsLibsWrapper, 'getHotelDirectory').resolves({
        getOrganizations: sinon.stub().resolves([
          new FakeHotelWithBadOnChainData(),
          new FakeHotelWithBadOnChainData(),
        ].concat([...Array(30).keys()].map(() => new FakeNiceHotel()))
          .concat([nextNiceHotel])
        ),
      });
      await request(server)
        .get('/hotels')
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect(200)
        .expect((res) => {
          const { items, errors, next } = res.body;
          expect(items.length).to.be.eql(30);
          expect(errors.length).to.be.eql(2);
          expect(next).to.be.equal(`http://example.com/hotels?limit=${DEFAULT_PAGE_SIZE}&fields=id,location,name&startWith=${nextNiceHotel.address}`);
          wtJsLibsWrapper.getHotelDirectory.restore();
        });
    });

    it('should transfer fields from request into next field in response', async () => {
      await request(server)
        .get('/hotels?limit=1&fields=id,name')
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect((res) => {
          const { items, next } = res.body;
          expect(items.length).to.be.eql(1);
          expect(next).to.be.eql(`http://example.com/hotels?limit=1&fields=id,name&startWith=${hotel1.address}`);
          items.forEach(hotel => {
            expect(hotel).to.have.property('id');
            expect(hotel).to.have.property('name');
          });
        });
    });

    it('should return just id when asked for', async () => {
      await request(server)
        .get('/hotels?fields=id')
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect(200)
        .expect((res) => {
          const { items, warnings, errors } = res.body;
          expect(items.length).to.be.eql(2);
          expect(warnings.length).to.be.eql(0);
          expect(errors.length).to.be.eql(0);
          expect(items[0]).to.eql({ id: hotel0.address });
          expect(items[1]).to.eql({ id: hotel1.address });
        });
    });

    it('should return 422 #paginationLimitError on negative limit', async () => {
      const pagination = 'limit=-500';
      await request(server)
        .get(`/hotels?${pagination}`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect((res) => {
          expect(res.body).to.have.property('code', '#paginationLimitError');
        })
        .expect(422);
    });

    it('should return 404 #paginationStartWithError if the startWith does not exist', async () => {
      const pagination = 'limit=1&startWith=random-hotel-address';
      await request(server)
        .get(`/hotels?${pagination}`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect((res) => {
          expect(res.body).to.have.property('code', '#paginationStartWithError');
        })
        .expect(404);
    });
  });

  describe('GET /hotels/:hotelAddress', () => {
    let hotel;
    beforeEach(async () => {
      hotel = await deployFullHotel(deploymentOptions, HOTEL_DESCRIPTION, RATE_PLANS, AVAILABILITY);
    });

    it('should return default fields for hotel detail', async () => {
      const defaultHotelFields = [
        'id',
        'location',
        'name',
        'description',
        'contacts',
        'address',
        'currency',
        'images',
        'amenities',
        'updatedAt',
      ];
      await request(server)
        .get(`/hotels/${hotel.address}`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect(200)
        .expect((res) => {
          expect(res.body).to.have.all.keys(defaultHotelFields);
        });
    });

    it('should not break down when no off-chain data is requested', async () => {
      await request(server)
        .get(`/hotels/${hotel.address}?fields=owner`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect(200)
        .expect((res) => {
          expect(res.headers).to.not.have.property(VALIDATION_WARNING_HEADER);
        });
    });

    it('should return validation warning for unsupported version', async () => {
      hotel = await deployFullHotel({
        ...deploymentOptions,
        schemaVersion: '0.1.0',
      }, HOTEL_DESCRIPTION, RATE_PLANS, AVAILABILITY);
      await request(server)
        .get(`/hotels/${hotel.address}`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect(200)
        .expect((res) => {
          expect(res.headers).to.have.property(VALIDATION_WARNING_HEADER);
          expect(res.headers[VALIDATION_WARNING_HEADER]).to.match(/^Unsupported data format version 0\.1\.0\./);
        });
    });

    it('should not return validation warning when data differs in patch version', async () => {
      hotel = await deployFullHotel({
        ...deploymentOptions,
        schemaVersion: '0.8.99',
      }, HOTEL_DESCRIPTION, RATE_PLANS, AVAILABILITY);
      await request(server)
        .get(`/hotels/${hotel.address}`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect(200)
        .expect((res) => {
          expect(res.headers).to.not.have.property(VALIDATION_WARNING_HEADER);
        });
    });

    it('should return validation errors for default field', async () => {
      let hotelDescription = _.cloneDeep(HOTEL_DESCRIPTION);
      hotelDescription.description = 23;
      hotel = await deployFullHotel(deploymentOptions, hotelDescription, RATE_PLANS, AVAILABILITY);
      await request(server)
        .get(`/hotels/${hotel.address}`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect(422)
        .expect((res) => {
          expect(res.body.long).to.match(/^Unable to validate a model with a type: number, expected: string/);
        });
    });

    it('should return validation errors for missing default field', async () => {
      let hotelDescription = Object.assign({}, HOTEL_DESCRIPTION);
      delete hotelDescription.description;
      hotel = await deployFullHotel(deploymentOptions, hotelDescription, RATE_PLANS, AVAILABILITY);
      await request(server)
        .get(`/hotels/${hotel.address}`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect(422)
        .expect((res) => {
          expect(res.body.long).to.match(/^description is a required field/);
        });
    });

    it('should return validation errors for non-default field', async () => {
      let hotelDescription = _.cloneDeep(HOTEL_DESCRIPTION);
      hotelDescription.timezone = false;
      hotel = await deployFullHotel(deploymentOptions, hotelDescription, RATE_PLANS, AVAILABILITY);
      await request(server)
        .get(`/hotels/${hotel.address}?fields=timezone`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect(422)
        .expect((res) => {
          expect(res.body.long).to.match(/^Unable to validate a model with a type: boolean, expected: string/);
        });
    });

    it('should return validation errors for missing non-default field', async () => {
      let hotelDescription = Object.assign({}, HOTEL_DESCRIPTION);
      delete hotelDescription.defaultCancellationAmount;
      hotel = await deployFullHotel(deploymentOptions, hotelDescription, RATE_PLANS, AVAILABILITY);
      await request(server)
        .get(`/hotels/${hotel.address}?fields=defaultCancellationAmount`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect(422)
        .expect((res) => {
          expect(res.body.long).to.match(/^defaultCancellationAmount is a required field/);
        });
    });

    it('should return validation errors for missing value in nested field', async () => {
      let hotelDescription = _.cloneDeep(HOTEL_DESCRIPTION);
      delete hotelDescription.location.latitude;
      hotel = await deployFullHotel(deploymentOptions, hotelDescription, RATE_PLANS, AVAILABILITY);
      await request(server)
        .get(`/hotels/${hotel.address}`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect(422)
        .expect((res) => {
          expect(res.body.long).to.match(/^latitude is a required field/);
        });
    });

    it('should return validation errors for missing nested exact field', async () => {
      let hotelDescription = _.cloneDeep(HOTEL_DESCRIPTION);
      delete hotelDescription.location.latitude;
      hotel = await deployFullHotel(deploymentOptions, hotelDescription, RATE_PLANS, AVAILABILITY);
      await request(server)
        .get(`/hotels/${hotel.address}?fields=location.latitude`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect(422)
        .expect((res) => {
          expect(res.body.long).to.match(/^latitude is a required field/);
        });
    });

    it('should return all fields that a client asks for in hotel detail', async () => {
      // defaultCancellationAmount was problematic when set to 0
      const fields = [
        'name',
        'location',
        'ownerAddress',
        'defaultCancellationAmount',
        'notificationsUri',
        'category',
        'bookingUri',
        'defaultLocale',
      ];
      const query = `fields=${fields.join()}`;

      await request(server)
        .get(`/hotels/${hotel.address}?${query}`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect((res) => {
          expect(res.body).to.have.all.keys([...fields, 'id']);
        })
        .expect(200);
      const query2 = (fields.map((f) => `fields=${f}`)).join('&');
      await request(server)
        .get(`/hotels/${hotel.address}?${query2}`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect((res) => {
          expect(res.body).to.have.all.keys([...fields, 'id']);
        })
        .expect(200);
    });

    it('should return all the nested fields that a client asks for', async () => {
      const fields = ['ownerAddress', 'name', 'timezone', 'address.postcode', 'address.road'];
      const query = `fields=${fields.join()}`;

      await request(server)
        .get(`/hotels/${hotel.address}?${query}`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect((res) => {
          expect(res.body).to.have.property('id');
          expect(res.body).to.have.property('ownerAddress');
          expect(res.body).to.have.property('name');
          expect(res.body).to.have.property('timezone');
          expect(res.body).to.have.property('address');
          expect(res.body.address).to.have.property('postcode');
          expect(res.body.address).to.have.property('road');
          expect(res.body.address.country).to.be.undefined;
          expect(res.body.address.city).to.be.undefined;
        })
        .expect(200);
    });

    it('should return all nested fields even from an object of objects', async () => {
      const fields = ['name', 'timezone', 'roomTypes.name', 'roomTypes.description', 'roomTypes.id'];
      const query = `fields=${fields.join()}`;

      await request(server)
        .get(`/hotels/${hotel.address}?${query}`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect((res) => {
          expect(res.body).to.have.all.keys(['name', 'timezone', 'roomTypes', 'id']);
          expect(res.body.address).to.be.undefined;
          expect(res.body.roomTypes.length).to.be.gt(0);
          for (let roomType of res.body.roomTypes) {
            expect(roomType).to.have.all.keys(['name', 'description', 'id']);
            expect(roomType).to.have.property('id');
            expect(roomType).to.have.property('name');
            expect(roomType).to.have.property('description');
            expect(roomType).to.not.have.property('amenities');
          }
        })
        .expect(200);
    });

    it('should return ratePlans if asked for', async () => {
      const fields = ['name', 'timezone', 'roomTypes.name', 'roomTypes.id', 'ratePlans.price', 'ratePlans.id'];
      const query = `fields=${fields.join()}`;

      await request(server)
        .get(`/hotels/${hotel.address}?${query}`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect((res) => {
          expect(res.body).to.have.all.keys(['name', 'timezone', 'roomTypes', 'ratePlans', 'id']);
          expect(res.body.address).to.be.undefined;
          expect(res.body.roomTypes.length).to.be.gt(0);
          for (let roomType of res.body.roomTypes) {
            expect(roomType).to.have.property('id');
            expect(roomType).to.have.property('name');
            expect(roomType).to.not.have.property('amenities');
          }
          expect(res.body.ratePlans.length).to.be.gt(0);
          for (let ratePlan of res.body.ratePlans) {
            expect(ratePlan).to.have.property('id');
            expect(ratePlan).to.have.property('price');
            expect(ratePlan).to.not.have.property('description');
          }
        })
        .expect(200);
    });

    it('should return availability if asked for', async () => {
      const fields = ['name', 'timezone', 'roomTypes.name', 'roomTypes.id', 'availability.updatedAt'];
      const query = `fields=${fields.join()}`;

      await request(server)
        .get(`/hotels/${hotel.address}?${query}`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect((res) => {
          expect(res.body).to.have.all.keys(['name', 'timezone', 'roomTypes', 'id', 'availability']);
          expect(res.body.address).to.be.undefined;
          expect(res.body.roomTypes.length).to.be.gt(0);
          for (let roomType of res.body.roomTypes) {
            expect(roomType).to.have.property('id');
            expect(roomType).to.have.property('name');
            expect(roomType).to.not.have.property('amenities');
          }
          expect(res.body.availability).to.have.property('updatedAt');
        })
        .expect(200);
    });

    it('should return just id when asked for', async () => {
      await request(server)
        .get(`/hotels/${hotel.address}?fields=id`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect(200)
        .expect((res) => {
          expect(res.body).to.eql({ id: hotel.address });
        });
    });

    it('should return 404 for a hotel that does not pass the trustworthiness test', async () => {
      sinon.stub(wtJsLibsWrapper, 'getHotelDirectory').resolves({
        getOrganization: sinon.stub().resolves(new FakeNotTrustworthyHotel()),
      });

      await request(server)
        .get(`/hotels/${hotel.address}`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect(404)
        .expect((res) => {
          wtJsLibsWrapper.getHotelDirectory.restore();
        });
    });

    it('should return 502 when on-chain data is inaccessible', async () => {
      sinon.stub(wtJsLibsWrapper, 'getHotelDirectory').resolves({
        getOrganization: sinon.stub().resolves(new FakeHotelWithBadOnChainData()),
      });

      await request(server)
        .get(`/hotels/${hotel.address}`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect(502)
        .expect((res) => {
          wtJsLibsWrapper.getHotelDirectory.restore();
        });
    });

    it('should return a warning when on-chain data is outdated', async () => {
      sinon.stub(wtJsLibsWrapper, 'getHotelDirectory').resolves({
        getOrganization: sinon.stub().resolves(new FakeOldFormatHotel()),
      });

      await request(server)
        .get(`/hotels/${hotel.address}`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect(200)
        .expect((res) => {
          expect(res.headers).to.have.property(VALIDATION_WARNING_HEADER);
          expect(res.headers[VALIDATION_WARNING_HEADER]).to.match(/^Unsupported data format version 0\.1\.0\./);
          wtJsLibsWrapper.getHotelDirectory.restore();
        });
    });

    it('should return 502 when off-chain data is inaccessible', async () => {
      sinon.stub(wtJsLibsWrapper, 'getHotelDirectory').resolves({
        getOrganization: sinon.stub().resolves(new FakeHotelWithBadOffChainData()),
      });

      await request(server)
        .get(`/hotels/${hotel.address}`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect(502)
        .expect((res) => {
          wtJsLibsWrapper.getHotelDirectory.restore();
        });
    });

    it('should not return any non-existent fields even if a client asks for them', async () => {
      const fields = ['ownerAddress', 'name'];
      const invalidFields = ['invalid', 'invalidField'];
      const query = `fields=${fields.join()},${invalidFields.join()}`;

      await request(server)
        .get(`/hotels/${hotel.address}?${query}`)
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
        .get('/hotels/0x7135422D4633901AE0D2469886da96A8a72CB264')
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect(404);
    });

    it('should return a 422 for an invalid address', async () => {
      await request(server)
        .get('/hotels/bad-address')
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect(422);
    });

    it('should not work for an address in a badly checksummed format', async () => {
      await request(server)
        .get(`/hotels/${hotel.address.toUpperCase()}`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect((res) => {
          expect(res.body).to.have.property('code', '#hotelChecksum');
        })
        .expect(422);
    });
  });

  describe('GET /hotels/:hotelAddress/meta', () => {
    let hotel;
    beforeEach(async () => {
      hotel = await deployFullHotel(deploymentOptions, HOTEL_DESCRIPTION, RATE_PLANS, AVAILABILITY);
    });

    it('should return all fields', async () => {
      await request(server)
        .get(`/hotels/${hotel.address}/meta`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect((res) => {
          expect(res.body).to.have.property('address', hotel.address);
          expect(res.body).to.have.property('orgJsonUri');
          expect(res.body).to.have.property('dataIndexUri');
          expect(res.body).to.have.property('descriptionUri');
          expect(res.body).to.have.property('ratePlansUri');
          expect(res.body).to.have.property('availabilityUri');
          expect(res.body).to.have.property('dataFormatVersion', getSchemaVersion('@windingtree/wt-hotel-schemas'));
          expect(res.body).to.have.property('defaultLocale', 'en');
          expect(res.body).to.have.property('guarantee');
          expect(res.body.orgJsonUri).to.match(/^in-memory:\/\//);
          expect(res.body.descriptionUri).to.match(/^in-memory:\/\//);
          expect(res.body.ratePlansUri).to.match(/^in-memory:\/\//);
          expect(res.body.availabilityUri).to.match(/^in-memory:\/\//);
        })
        .expect(200);
    });

    it('should return 404 for a hotel that does not pass the trustworthiness test', async () => {
      sinon.stub(wtJsLibsWrapper, 'getHotelDirectory').resolves({
        getOrganization: sinon.stub().resolves(new FakeNotTrustworthyHotel()),
      });

      await request(server)
        .get(`/hotels/${hotel.address}/meta`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect(404)
        .expect((res) => {
          wtJsLibsWrapper.getHotelDirectory.restore();
        });
    });

    it('should not return unspecified optional fields', async () => {
      const hotel = await deployFullHotel(deploymentOptions, HOTEL_DESCRIPTION);
      await request(server)
        .get(`/hotels/${hotel.address}/meta`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect((res) => {
          expect(res.body).to.have.property('address', hotel.address);
          expect(res.body).to.have.property('orgJsonUri');
          expect(res.body).to.have.property('descriptionUri');
          expect(res.body).to.have.property('dataFormatVersion', getSchemaVersion('@windingtree/wt-hotel-schemas'));
          expect(res.body).to.not.have.property('ratePlansUri');
          expect(res.body).to.not.have.property('availabilityUri');
          expect(res.body).to.have.property('defaultLocale', 'en');
        })
        .expect(200);
    });
  });
});
