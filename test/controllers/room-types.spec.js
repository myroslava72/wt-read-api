/* eslint-env mocha */
const _ = require('lodash');
const { expect } = require('chai');
const request = require('supertest');
const sinon = require('sinon');
const { getSchemaVersion } = require('../utils/schemas');
const { config } = require('../../src/config');
const wtJsLibsWrapper = require('../../src/services/wt-js-libs');
const { VALIDATION_WARNING_HEADER } = require('../../src/constants');
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
  FakeHotelWithBadOffChainData,
} = require('../utils/fake-hotels');

let _compareRoomTypes = function (roomType1, roomType2) {
  expect(roomType1.id).to.eql(roomType2.id);
  expect(roomType1.totalQuantity).to.eql(roomType2.totalQuantity);
  expect(roomType1.amenities).to.eql(roomType2.amenities);
  expect(roomType1.name).to.eql(roomType2.name);
  expect(roomType1.description).to.eql(roomType2.description);
  expect(roomType1.images).to.eql(roomType2.images);
  expect(roomType1.updatedAt).to.eql(roomType2.updatedAt);
  expect(roomType1.properties).to.eql(roomType2.properties);
};

describe('Room types', function () {
  let server;
  let wtLibsInstance, app, deploymentOptions;
  let hotel;

  beforeEach(async () => {
    server = require('../../src/index');
    wtLibsInstance = wtJsLibsWrapper.getInstance();
    app = await deployHotelApp(config);
    deploymentOptions = {
      schemaVersion: getSchemaVersion('@windingtree/wt-hotel-schemas'),
      offChainDataClient: await wtLibsInstance.getOffChainDataClient('in-memory'),
      app: app,
    };
    hotel = await deployFullHotel(deploymentOptions, HOTEL_DESCRIPTION, RATE_PLANS, AVAILABILITY);
  });

  afterEach(() => {
    server.close();
  });

  describe('GET /hotels/:hotelAddress/roomTypes', () => {
    it('should return room types', async () => {
      await request(server)
        .get(`/hotels/${hotel.address}/roomTypes`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect((res) => {
          expect(res.body.items).to.eql(HOTEL_DESCRIPTION.roomTypes);
          for (let roomType of res.body.items) {
            expect(roomType).to.have.property('id');
          }
        });
    });

    it('should include ratePlans if fields is present', async () => {
      await request(server)
        .get(`/hotels/${hotel.address}/roomTypes?fields=ratePlans`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect((res) => {
          let i = 0;
          for (let roomType of res.body.items) {
            expect(roomType).to.have.property('id');
            expect(roomType).to.have.property('ratePlans');
            _compareRoomTypes(roomType, HOTEL_DESCRIPTION.roomTypes[i++]);
          }
        });
    });

    it('should include availability if fields is present', async () => {
      await request(server)
        .get(`/hotels/${hotel.address}/roomTypes?fields=availability`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect((res) => {
          let i = 0;
          for (let roomType of res.body.items) {
            expect(roomType).to.have.property('id');
            expect(roomType).to.have.property('availability');
            _compareRoomTypes(roomType, HOTEL_DESCRIPTION.roomTypes[i++]);
          }
        });
    });

    it('should include ratePlans and availability if fields is present', async () => {
      await request(server)
        .get(`/hotels/${hotel.address}/roomTypes?fields=ratePlans,availability`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect((res) => {
          let i = 0;
          for (let roomType of res.body.items) {
            expect(roomType).to.have.property('id');
            expect(roomType).to.have.property('availability');
            expect(roomType).to.have.property('ratePlans');
            _compareRoomTypes(roomType, HOTEL_DESCRIPTION.roomTypes[i++]);
          }
        });
      await request(server)
        .get(`/hotels/${hotel.address}/roomTypes?fields=ratePlans&fields=availability`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect((res) => {
          let i = 0;
          for (let roomType of res.body.items) {
            expect(roomType).to.have.property('id');
            expect(roomType).to.have.property('availability');
            expect(roomType).to.have.property('ratePlans');
            _compareRoomTypes(roomType, HOTEL_DESCRIPTION.roomTypes[i++]);
          }
        });
    });

    it('should return 404 for a hotel that does not pass the trustworthiness test', async () => {
      const hotel = await deployFullHotel(deploymentOptions, HOTEL_DESCRIPTION, RATE_PLANS, AVAILABILITY, 1);
      await request(server)
        .get(`/hotels/${hotel.address}/roomTypes`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect(404);
    });

    it('should return warning for old data format version', async () => {
      const hotel = await deployFullHotel({
        ...deploymentOptions,
        schemaVersion: '0.1.0',
      }, HOTEL_DESCRIPTION, RATE_PLANS, AVAILABILITY);
      await request(server)
        .get(`/hotels/${hotel.address}/roomTypes`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect((res) => {
          expect(res.status).to.be.eql(200);
          const { items, warnings, errors } = res.body;
          expect(items.length).to.be.eql(0);
          expect(warnings.length).to.be.eql(3);
          expect(errors.length).to.be.eql(0);
          expect(warnings[0].msgLong).to.match(/^Unsupported data format version/);
        });
    });

    it('should return error for invalid data', async () => {
      let hotelDescription = _.cloneDeep(HOTEL_DESCRIPTION);
      delete hotelDescription.roomTypes[0].occupancy.max;
      const hotel = await deployFullHotel(deploymentOptions, hotelDescription, RATE_PLANS, AVAILABILITY);
      await request(server)
        .get(`/hotels/${hotel.address}/roomTypes`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect((res) => {
          expect(res.status).to.be.eql(200);
          const { items, warnings, errors } = res.body;
          expect(items.length).to.be.eql(2);
          expect(warnings.length).to.be.eql(0);
          expect(errors.length).to.be.eql(1);
          expect(errors[0].msgLong).to.match(/^max is a required field/);
        });
    });

    it('should return 404 for non existing hotel', async () => {
      await request(server)
        .get('/hotels/0x0Fd60495d705F4Fb86e1b36Be396757689FbE8B3/roomTypes/room-type-0000')
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect(404);
    });

    it('should return bad gateway for inaccessible data', async () => {
      sinon.stub(wtJsLibsWrapper, 'getHotelDirectory').resolves({
        getOrganization: sinon.stub().resolves(new FakeHotelWithBadOffChainData()),
      });
      await request(server)
        .get(`/hotels/${hotel.address}/roomTypes`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect((res) => {
          expect(res.status).to.be.eql(502);
          wtJsLibsWrapper.getHotelDirectory.restore();
        });
    });
  });

  describe('GET /hotels/:hotelAddress/roomTypes/:roomTypeId', () => {
    it('should return a room type', async () => {
      await request(server)
        .get(`/hotels/${hotel.address}/roomTypes/room-type-1111`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect((res) => {
          expect(res.body).to.have.property('id', 'room-type-1111');
        });
    });

    it('should include ratePlans if fields is present', async () => {
      await request(server)
        .get(`/hotels/${hotel.address}/roomTypes/room-type-1111?fields=ratePlans`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect((res) => {
          expect(res.body).to.have.property('id', 'room-type-1111');
          expect(res.body).to.have.property('ratePlans');
          expect(res.body.ratePlans.length).to.be.eql(1);
        });
    });

    it('should include ratePlans and availability if fields is present', async () => {
      await request(server)
        .get(`/hotels/${hotel.address}/roomTypes/room-type-1111?fields=ratePlans,availability`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect((res) => {
          expect(res.body).to.have.property('id', 'room-type-1111');
          expect(res.body).to.have.property('ratePlans');
          expect(res.body.ratePlans.length).to.be.eql(1);
        });
      await request(server)
        .get(`/hotels/${hotel.address}/roomTypes/room-type-1111?fields=ratePlans&fields=availability`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect((res) => {
          expect(res.body).to.have.property('id', 'room-type-1111');
          expect(res.body).to.have.property('ratePlans');
          expect(res.body.ratePlans.length).to.be.eql(1);
        });
    });

    it('should return 404 for a hotel that does not pass the trustworthiness test', async () => {
      const hotel = await deployFullHotel(deploymentOptions, HOTEL_DESCRIPTION, RATE_PLANS, AVAILABILITY, 1);
      await request(server)
        .get(`/hotels/${hotel.address}/roomTypes/room-type-1111`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect(404);
    });

    it('should return warning for old data format version', async () => {
      const hotel = await deployFullHotel({
        ...deploymentOptions,
        schemaVersion: '0.1.0',
      }, HOTEL_DESCRIPTION, RATE_PLANS, AVAILABILITY);
      await request(server)
        .get(`/hotels/${hotel.address}/roomTypes/room-type-1111`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect(200)
        .expect((res) => {
          expect(res.headers).to.have.property(VALIDATION_WARNING_HEADER);
          expect(res.headers[VALIDATION_WARNING_HEADER]).to.match(/^Unsupported data format version 0\.1\.0\./);
        });
    });

    it('should return error for invalid data', async () => {
      let hotelDescription = _.cloneDeep(HOTEL_DESCRIPTION);
      delete hotelDescription.roomTypes[0].name;
      delete hotelDescription.roomTypes[0].occupancy;
      const hotel = await deployFullHotel(deploymentOptions, hotelDescription, RATE_PLANS, AVAILABILITY);
      await request(server)
        .get(`/hotels/${hotel.address}/roomTypes/room-type-1111`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect((res) => {
          expect(res.status).to.be.eql(422);
          expect(res.body.long).to.match(/name is a required field/);
          expect(res.body.long).to.match(/occupancy is a required field/);
        });
    });

    it('should return empty ratePlans if hotel does not have ratePlansUri', async () => {
      const hotel = await deployFullHotel(deploymentOptions, HOTEL_DESCRIPTION);
      await request(server)
        .get(`/hotels/${hotel.address}/roomTypes/room-type-1111?fields=ratePlans`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect((res) => {
          expect(res.body).to.have.property('id', 'room-type-1111');
          expect(res.body).to.have.property('ratePlans');
          expect(res.body.ratePlans.length).to.be.eql(0);
        });
    });

    it('should include availability if fields is present', async () => {
      let roomType = 'room-type-1111';
      await request(server)
        .get(`/hotels/${hotel.address}/roomTypes/${roomType}?fields=availability`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect((res) => {
          expect(res.body).to.have.property('id', 'room-type-1111');
          expect(res.body).to.have.property('availability');
          expect(res.body.availability).to.have.property('updatedAt');
          expect(res.body.availability).to.have.property('roomTypes');
          expect(res.body.availability.roomTypes.filter((rt) => { return rt.roomTypeId === roomType; }).length).to.be.eql(9);
        });
    });

    it('should return empty availability if hotel does not have ratePlansUri', async () => {
      const hotel = await deployFullHotel(deploymentOptions, HOTEL_DESCRIPTION);
      await request(server)
        .get(`/hotels/${hotel.address}/roomTypes/room-type-1111?fields=availability`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect((res) => {
          expect(res.body).to.have.property('id', 'room-type-1111');
          expect(res.body).to.have.property('availability');
          expect(res.body.availability.length).to.be.eql(0);
        });
    });

    it('should return 404 for non existing room type', async () => {
      await request(server)
        .get(`/hotels/${hotel.address}/roomTypes/room-type-0000`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect(404);
    });

    it('should return bad gateway for inaccessible data', async () => {
      sinon.stub(wtJsLibsWrapper, 'getHotelDirectory').resolves({
        getOrganization: sinon.stub().resolves(new FakeHotelWithBadOffChainData()),
      });
      await request(server)
        .get(`/hotels/${hotel.address}/roomTypes/room-type-1111`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect((res) => {
          expect(res.status).to.be.eql(502);
          wtJsLibsWrapper.getHotelDirectory.restore();
        });
    });
  });

  describe('GET /hotels/:hotelAddress/roomTypes/:roomTypeId/ratePlans', () => {
    it('should return all appropriate rate plans', async () => {
      await request(server)
        .get(`/hotels/${hotel.address}/roomTypes/room-type-1111/ratePlans`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect((res) => {
          const ratePlans = res.body.items;
          expect(ratePlans.length).to.be.eql(1);
          expect(ratePlans[0]).to.have.property('id', 'rate-plan-1');
        });
    });

    it('should return 404 for a hotel that does not pass the trustworthiness test', async () => {
      const hotel = await deployFullHotel(deploymentOptions, HOTEL_DESCRIPTION, RATE_PLANS, AVAILABILITY, 1);
      await request(server)
        .get(`/hotels/${hotel.address}/roomTypes/room-type-1111/ratePlans`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect(404);
    });

    it('should return empty object if no rate plans are associated', async () => {
      await request(server)
        .get(`/hotels/${hotel.address}/roomTypes/room-type-2222/ratePlans`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect(200)
        .expect((res) => {
          const ratePlans = res.body.items;
          expect(ratePlans.length).to.be.eql(0);
        });
    });

    it('should return warning for old data format version', async () => {
      const hotel = await deployFullHotel({
        ...deploymentOptions,
        schemaVersion: '0.1.0',
      }, HOTEL_DESCRIPTION, RATE_PLANS, AVAILABILITY);
      await request(server)
        .get(`/hotels/${hotel.address}/roomTypes/room-type-1111/ratePlans`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect((res) => {
          expect(res.status).to.be.eql(200);
          const { items, warnings, errors } = res.body;
          expect(items.length).to.be.eql(0);
          expect(warnings.length).to.be.eql(1);
          expect(errors.length).to.be.eql(0);
          expect(warnings[0].msgLong).to.match(/^Unsupported data format version/);
        });
    });

    it('should return error for invalid data', async () => {
      let ratePlans = _.cloneDeep(RATE_PLANS);
      delete ratePlans[0].price;
      const hotel = await deployFullHotel(deploymentOptions, HOTEL_DESCRIPTION, ratePlans, AVAILABILITY);
      await request(server)
        .get(`/hotels/${hotel.address}/roomTypes/room-type-1111/ratePlans`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect((res) => {
          expect(res.status).to.be.eql(200);
          const { items, warnings, errors } = res.body;
          expect(items.length).to.be.eql(0);
          expect(warnings.length).to.be.eql(0);
          expect(errors.length).to.be.eql(1);
          expect(errors[0].msgLong).to.match(/^price is a required field/);
        });
    });

    it('should return 404 for non existing hotel', async () => {
      await request(server)
        .get('/hotels/0x0Fd60495d705F4Fb86e1b36Be396757689FbE8B3/roomTypes/room-type-2222/ratePlans')
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect(404);
    });

    it('should return 404 for non existing room type', async () => {
      await request(server)
        .get(`/hotels/${hotel.address}/roomTypes/room-type-0000/ratePlans`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect(404);
    });

    it('should return 404 for a hotel without rate plans', async () => {
      const hotel = await deployFullHotel(deploymentOptions, HOTEL_DESCRIPTION);
      await request(server)
        .get(`/hotels/${hotel.address}/roomTypes/room-type-2222/ratePlans`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect(404);
    });

    it('should return bad gateway for inaccessible data', async () => {
      sinon.stub(wtJsLibsWrapper, 'getHotelDirectory').resolves({
        getOrganization: sinon.stub().resolves(new FakeHotelWithBadOffChainData()),
      });
      await request(server)
        .get(`/hotels/${hotel.address}/roomTypes/room-type-2222/ratePlans`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect((res) => {
          expect(res.status).to.be.eql(502);
          wtJsLibsWrapper.getHotelDirectory.restore();
        });
    });
  });

  describe('GET /hotels/:hotelAddress/roomTypes/:roomTypeId/availability', () => {
    it('should return availability data', async () => {
      let roomType = 'room-type-1111';
      await request(server)
        .get(`/hotels/${hotel.address}/roomTypes/${roomType}/availability`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect((res) => {
          expect(res.body).to.have.property('updatedAt');
          expect(res.body).to.have.property('items');
          expect(res.body).to.have.property('warnings');
          expect(res.body).to.have.property('errors');
          let data = res.body.items.filter((rt) => { return rt.roomTypeId === roomType; });
          expect(data.length).to.be.eql(9);
        });
    });

    it('should return empty object if no availability is associated', async () => {
      let roomType = 'room-type-1111';
      await request(server)
        .get(`/hotels/${hotel.address}/roomTypes/${roomType}/availability`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect(200)
        .expect((res) => {
          expect(res.body).to.have.property('updatedAt');
          let data = res.body.items.filter((rt) => { return rt.id === roomType; });
          expect(data.length).to.be.eql(0);
        });
    });

    it('should return warning for old data format version', async () => {
      const hotel = await deployFullHotel({
        ...deploymentOptions,
        schemaVersion: '0.1.0',
      }, HOTEL_DESCRIPTION, RATE_PLANS, AVAILABILITY);
      await request(server)
        .get(`/hotels/${hotel.address}/roomTypes/room-type-1111/availability`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect((res) => {
          expect(res.status).to.be.eql(200);
          const { items, warnings, errors } = res.body;
          expect(items.length).to.be.eql(0);
          expect(warnings.length).to.be.eql(9);
          expect(errors.length).to.be.eql(0);
          expect(warnings[0].msgLong).to.match(/^Unsupported data format version/);
        });
    });

    it('should return 404 for a hotel that does not pass the trustworthiness test', async () => {
      const hotel = await deployFullHotel(deploymentOptions, HOTEL_DESCRIPTION, RATE_PLANS, AVAILABILITY, 1);
      await request(server)
        .get(`/hotels/${hotel.address}/roomTypes/room-type-1111/availability`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect(404);
    });

    it('should return error for invalid data', async () => {
      let availability = _.cloneDeep(AVAILABILITY);
      delete availability.roomTypes[0].date;
      const hotel = await deployFullHotel(deploymentOptions, HOTEL_DESCRIPTION, RATE_PLANS, availability);
      await request(server)
        .get(`/hotels/${hotel.address}/roomTypes/room-type-1111/availability`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect((res) => {
          expect(res.status).to.be.eql(200);
          const { items, warnings, errors } = res.body;
          expect(items.length).to.be.eql(8);
          expect(warnings.length).to.be.eql(0);
          expect(errors.length).to.be.eql(1);
          expect(errors[0].msgLong).to.match(/^date is a required field/);
        });
    });

    it('should return 404 for non existing hotel', async () => {
      await request(server)
        .get('/hotels/0x0Fd60495d705F4Fb86e1b36Be396757689FbE8B3/roomTypes/room-type-2222/availability')
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect(404);
    });

    it('should return 404 for non existing room type', async () => {
      await request(server)
        .get(`/hotels/${hotel.address}/roomTypes/room-type-0000/availability`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect(404);
    });

    it('should return 404 for a hotel without availability', async () => {
      const hotel = await deployFullHotel(deploymentOptions, HOTEL_DESCRIPTION, RATE_PLANS);
      await request(server)
        .get(`/hotels/${hotel.address}/roomTypes/room-type-2222/availability`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect(404);
    });

    it('should return bad gateway for inaccessible data', async () => {
      sinon.stub(wtJsLibsWrapper, 'getHotelDirectory').resolves({
        getOrganization: sinon.stub().resolves(new FakeHotelWithBadOffChainData()),
      });
      await request(server)
        .get(`/hotels/${hotel.address}/roomTypes/room-type-2222/availability`)
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .expect((res) => {
          expect(res.status).to.be.eql(502);
          wtJsLibsWrapper.getHotelDirectory.restore();
        });
    });
  });
});
