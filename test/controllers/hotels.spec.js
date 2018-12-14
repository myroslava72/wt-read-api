/* eslint-env mocha */
/* eslint-disable no-unused-expressions */
const { expect } = require('chai');
const _ = require('lodash');
const sinon = require('sinon');
const request = require('supertest');
const wtJsLibsWrapper = require('../../src/services/wt-js-libs');
const { DATA_FORMAT_VERSION } = require('../../src/constants');
const {
  deployIndex,
  deployFullHotel,
} = require('../../management/local-network');
const {
  HOTEL_DESCRIPTION,
  RATE_PLANS,
  AVAILABILITY,
} = require('../utils/test-data');
const {
  DEFAULT_PAGE_SIZE,
} = require('../../src/constants');
const {
  FakeNiceHotel,
  FakeHotelWithBadOnChainData,
  FakeHotelWithBadOffChainData,
  FakeOldFormatHotel,
  FakeWrongFormatHotel,
} = require('../utils/fake-hotels');

describe('Hotels', function () {
  let server;
  let wtLibsInstance, indexContract;
  let hotel0address, hotel1address;
  beforeEach(async () => {
    server = require('../../src/index');
    const config = require('../../src/config');
    wtLibsInstance = wtJsLibsWrapper.getInstance();
    indexContract = await deployIndex();
    config.wtIndexAddress = indexContract.address;
  });

  afterEach(() => {
    server.close();
  });

  describe('GET /hotels', () => {
    beforeEach(async () => {
      hotel0address = await deployFullHotel(await wtLibsInstance.getOffChainDataClient('in-memory'), indexContract, HOTEL_DESCRIPTION, RATE_PLANS);
      hotel1address = await deployFullHotel(await wtLibsInstance.getOffChainDataClient('in-memory'), indexContract, HOTEL_DESCRIPTION, RATE_PLANS);
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
          expect(items[0]).to.have.property('id', hotel0address);
          expect(items[0]).to.have.property('name');
          expect(items[0]).to.have.property('location');
          expect(items[1]).to.have.property('id', hotel1address);
          expect(items[1]).to.have.property('name');
          expect(items[1]).to.have.property('location');
        });
    });

    it('should return validation errors if they happen to individual hotels', async () => {
      sinon.stub(wtJsLibsWrapper, 'getWTIndex').resolves({
        getAllHotels: sinon.stub().resolves([new FakeOldFormatHotel(), new FakeWrongFormatHotel()]),
      });
      await request(server)
        .get('/hotels?fields=description,name,contacts,address,timezone,currency,updatedAt,defaultCancellationAmount')
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect(200)
        .expect((res) => {
          const { items, errors } = res.body;
          expect(items.length).to.be.eql(0);
          expect(errors.length).to.be.eql(2);
          expect(errors[0].originalError.errors[0].toString()).to.match(/^Unsupported data format version/);
          expect(errors[1].originalError.errors[0].toString()).to.match(/^Error: Unable to validate a model with a type: number, expected: string/);
          wtJsLibsWrapper.getWTIndex.restore();
        });
    });

    it('should return errors if they happen to individual hotels', async () => {
      sinon.stub(wtJsLibsWrapper, 'getWTIndex').resolves({
        getAllHotels: sinon.stub().resolves([new FakeNiceHotel(), new FakeHotelWithBadOnChainData()]),
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
          wtJsLibsWrapper.getWTIndex.restore();
        });
    });

    it('should try to fullfill the requested limit of valid hotels', async () => {
      sinon.stub(wtJsLibsWrapper, 'getWTIndex').resolves({
        getAllHotels: sinon.stub().resolves([
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
          wtJsLibsWrapper.getWTIndex.restore();
        });
    });

    it('should not break when requesting much more hotels than actually available', async () => {
      sinon.stub(wtJsLibsWrapper, 'getWTIndex').resolves({
        getAllHotels: sinon.stub().resolves([
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
          wtJsLibsWrapper.getWTIndex.restore();
        });
    });

    it('should not provide next if all hotels are broken', async () => {
      sinon.stub(wtJsLibsWrapper, 'getWTIndex').resolves({
        getAllHotels: sinon.stub().resolves([
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
          wtJsLibsWrapper.getWTIndex.restore();
        });
    });

    it('should try to fullfill the requested limit of valid hotels and provide valid next', async () => {
      const nextNiceHotel = new FakeNiceHotel();
      sinon.stub(wtJsLibsWrapper, 'getWTIndex').resolves({
        getAllHotels: sinon.stub().resolves([
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
          wtJsLibsWrapper.getWTIndex.restore();
        });
    });

    it('should return all fields that a client asks for in hotel list', async () => {
      const fields = [
        'managerAddress',
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
        'dataFormatVersion',
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
          expect(next).to.be.eql(`http://example.com/hotels?limit=1&fields=id,location,name&startWith=${hotel1address}`);

          items.forEach(hotel => {
            expect(hotel).to.have.property('id');
            expect(hotel).to.have.property('name');
            expect(hotel).to.have.property('location');
          });
        });
    });

    it('should paginate', async () => {
      await request(server)
        .get(`/hotels?limit=1&startWith=${hotel1address}`)
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
      sinon.stub(wtJsLibsWrapper, 'getWTIndex').resolves({
        getAllHotels: sinon.stub().resolves([
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
          wtJsLibsWrapper.getWTIndex.restore();
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
          expect(next).to.be.eql(`http://example.com/hotels?limit=1&fields=id,name&startWith=${hotel1address}`);
          items.forEach(hotel => {
            expect(hotel).to.have.property('id');
            expect(hotel).to.have.property('name');
          });
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

    it('should not touch off-chain data if only on-chain data is requested', async () => {
      const niceHotel = new FakeNiceHotel();
      const toPlainObjectSpy = sinon.spy(niceHotel, 'toPlainObject');
      sinon.stub(wtJsLibsWrapper, 'getWTIndex').resolves({
        getAllHotels: sinon.stub().resolves([niceHotel, new FakeHotelWithBadOnChainData()]),
      });
      await request(server)
        .get('/hotels?limit=1&fields=id')
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect((res) => {
          expect(toPlainObjectSpy.callCount).to.be.eql(0);
          wtJsLibsWrapper.getWTIndex.restore();
        });
    });
  });

  describe('GET /hotels/:hotelAddress', () => {
    let address;
    beforeEach(async () => {
      address = await deployFullHotel(await wtLibsInstance.getOffChainDataClient('in-memory'), indexContract, HOTEL_DESCRIPTION, RATE_PLANS, AVAILABILITY);
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
        'dataFormatVersion',
      ];
      await request(server)
        .get(`/hotels/${address}`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect(200)
        .expect((res) => {
          expect(res.body).to.have.all.keys(defaultHotelFields);
        });
    });

    it('should return validation errors for default field', async () => {
      let hotelDescription = _.cloneDeep(HOTEL_DESCRIPTION);
      hotelDescription.description = 23;
      address = await deployFullHotel(await wtLibsInstance.getOffChainDataClient('in-memory'), indexContract, hotelDescription, RATE_PLANS, AVAILABILITY);
      await request(server)
        .get(`/hotels/${address}`)
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
      address = await deployFullHotel(await wtLibsInstance.getOffChainDataClient('in-memory'), indexContract, hotelDescription, RATE_PLANS, AVAILABILITY);
      await request(server)
        .get(`/hotels/${address}`)
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
      address = await deployFullHotel(await wtLibsInstance.getOffChainDataClient('in-memory'), indexContract, hotelDescription, RATE_PLANS, AVAILABILITY);
      await request(server)
        .get(`/hotels/${address}?fields=timezone`)
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
      address = await deployFullHotel(await wtLibsInstance.getOffChainDataClient('in-memory'), indexContract, hotelDescription, RATE_PLANS, AVAILABILITY);
      await request(server)
        .get(`/hotels/${address}?fields=defaultCancellationAmount`)
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
      address = await deployFullHotel(await wtLibsInstance.getOffChainDataClient('in-memory'), indexContract, hotelDescription, RATE_PLANS, AVAILABILITY);
      await request(server)
        .get(`/hotels/${address}`)
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
      address = await deployFullHotel(await wtLibsInstance.getOffChainDataClient('in-memory'), indexContract, hotelDescription, RATE_PLANS, AVAILABILITY);
      await request(server)
        .get(`/hotels/${address}?fields=location.latitude`)
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
        'managerAddress',
        'defaultCancellationAmount',
        'notificationsUri',
        'bookingUri',
        'dataFormatVersion',
      ];
      const query = `fields=${fields.join()}`;

      await request(server)
        .get(`/hotels/${address}?${query}`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect((res) => {
          expect(res.body).to.have.all.keys([...fields, 'id']);
        })
        .expect(200);
      const query2 = (fields.map((f) => `fields=${f}`)).join('&');
      await request(server)
        .get(`/hotels/${address}?${query2}`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect((res) => {
          expect(res.body).to.have.all.keys([...fields, 'id']);
        })
        .expect(200);
    });

    it('should return all the nested fields that a client asks for', async () => {
      const fields = ['managerAddress', 'name', 'timezone', 'address.postalCode', 'address.line1'];
      const query = `fields=${fields.join()}`;

      await request(server)
        .get(`/hotels/${address}?${query}`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect((res) => {
          expect(res.body).to.have.property('id');
          expect(res.body).to.have.property('managerAddress');
          expect(res.body).to.have.property('name');
          expect(res.body).to.have.property('timezone');
          expect(res.body).to.have.property('address');
          expect(res.body.address).to.have.property('postalCode');
          expect(res.body.address).to.have.property('line1');
          expect(res.body.address.country).to.be.undefined;
          expect(res.body.address.city).to.be.undefined;
        })
        .expect(200);
    });

    it('should return all nested fields even from an object of objects', async () => {
      const fields = ['name', 'timezone', 'roomTypes.name', 'roomTypes.description', 'roomTypes.id'];
      const query = `fields=${fields.join()}`;

      await request(server)
        .get(`/hotels/${address}?${query}`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect((res) => {
          expect(res.body).to.have.all.keys(['name', 'timezone', 'roomTypes', 'id', 'dataFormatVersion']);
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
        .get(`/hotels/${address}?${query}`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect((res) => {
          expect(res.body).to.have.all.keys(['name', 'timezone', 'roomTypes', 'ratePlans', 'id', 'dataFormatVersion']);
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
        .get(`/hotels/${address}?${query}`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect((res) => {
          expect(res.body).to.have.all.keys(['name', 'timezone', 'roomTypes', 'id', 'availability', 'dataFormatVersion']);
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

    it('should return 502 when on-chain data is inaccessible', async () => {
      sinon.stub(wtJsLibsWrapper, 'getWTIndex').resolves({
        getHotel: sinon.stub().resolves(new FakeHotelWithBadOnChainData()),
      });

      await request(server)
        .get(`/hotels/${address}`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect(502)
        .expect((res) => {
          wtJsLibsWrapper.getWTIndex.restore();
        });
    });

    it('should return 502 when off-chain data is inaccessible', async () => {
      sinon.stub(wtJsLibsWrapper, 'getWTIndex').resolves({
        getHotel: sinon.stub().resolves(new FakeHotelWithBadOffChainData()),
      });

      await request(server)
        .get(`/hotels/${address}`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect(502)
        .expect((res) => {
          wtJsLibsWrapper.getWTIndex.restore();
        });
    });

    it('should not return any non-existent fields even if a client asks for them', async () => {
      const fields = ['managerAddress', 'name', 'dataFormatVersion'];
      const invalidFields = ['invalid', 'invalidField'];
      const query = `fields=${fields.join()},${invalidFields.join()}`;

      await request(server)
        .get(`/hotels/${address}?${query}`)
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
        .get('/hotels/meta')
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect(422);
    });

    it('should not work for an address in a badly checksummed format', async () => {
      await request(server)
        .get(`/hotels/${address.toUpperCase()}`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect((res) => {
          expect(res.body).to.have.property('code', '#hotelChecksum');
        })
        .expect(422);
    });
  });

  describe('GET /hotels/:hotelAddress/meta', () => {
    it('should return all fields', async () => {
      const hotel = await deployFullHotel(await wtLibsInstance.getOffChainDataClient('in-memory'), indexContract, HOTEL_DESCRIPTION, RATE_PLANS, AVAILABILITY);
      await request(server)
        .get(`/hotels/${hotel}/meta`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect((res) => {
          expect(res.body).to.have.property('address', hotel);
          expect(res.body).to.have.property('dataUri');
          expect(res.body).to.have.property('descriptionUri');
          expect(res.body).to.have.property('ratePlansUri');
          expect(res.body).to.have.property('availabilityUri');
          expect(res.body).to.have.property('dataFormatVersion', DATA_FORMAT_VERSION);
          expect(res.body.dataUri).to.match(/^in-memory:\/\//);
          expect(res.body.descriptionUri).to.match(/^in-memory:\/\//);
          expect(res.body.ratePlansUri).to.match(/^in-memory:\/\//);
          expect(res.body.availabilityUri).to.match(/^in-memory:\/\//);
        })
        .expect(200);
    });

    it('should not return unspecified optional fields', async () => {
      const hotel = await deployFullHotel(await wtLibsInstance.getOffChainDataClient('in-memory'), indexContract, HOTEL_DESCRIPTION);
      await request(server)
        .get(`/hotels/${hotel}/meta`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect((res) => {
          expect(res.body).to.have.property('address', hotel);
          expect(res.body).to.have.property('dataUri');
          expect(res.body).to.have.property('descriptionUri');
          expect(res.body).to.have.property('dataFormatVersion');
          expect(res.body).to.not.have.property('ratePlansUri');
          expect(res.body).to.not.have.property('availabilityUri');
        })
        .expect(200);
    });
  });
});
