/* eslint-env mocha */
/* eslint-disable no-unused-expressions */
const { expect } = require('chai');
const sinon = require('sinon');
const {
  _calculateFields,
  _airlineFields,
  _hotelFields,
} = require('../../src/services/fields');

describe('Fields', function () {
  describe('_calculateFields', () => {
    it('should work when fields is array', () => {
      const fields = _calculateFields(['a', 'b'], (f) => f);
      expect(fields).to.have.property('mapped');
      expect(fields.mapped.length).to.be.eql(2);
      expect(fields.mapped[0]).to.be.eql('a');
      expect(fields.mapped[1]).to.be.eql('b');
    });

    it('should apply mappingSpec', () => {
      const mappingSpec = sinon.stub().returns([]);
      _calculateFields(['a', 'b'], mappingSpec);
      expect(mappingSpec.callCount).to.be.eql(1);
    });
  });

  describe('_airlineFields', () => {
    it('should work when fields is non-empty string', () => {
      const fields = _airlineFields('owner,contacts', (f) => f);
      expect(fields).to.have.property('mapped');
      expect(fields.mapped.length).to.be.eql(3);
      expect(fields.mapped[0]).to.be.eql('owner');
      expect(fields.mapped[1]).to.be.eql('contacts');
      expect(fields.mapped[2]).to.be.eql('dataFormatVersion');
    });

    it('should apply defaults if fields is undefined', () => {
      const fields = _airlineFields(undefined, ['a', 'b'], (f) => f);
      expect(fields).to.have.property('mapped');
      expect(fields.mapped.length).to.be.eql(3);
      expect(fields.mapped[0]).to.be.eql('a');
      expect(fields.mapped[1]).to.be.eql('b');
      expect(fields.mapped[2]).to.be.eql('dataFormatVersion');
    });

    it('should apply defaults if fields is empty string', () => {
      const fields = _airlineFields('', ['a', 'b'], (f) => f);
      expect(fields).to.have.property('mapped');
      expect(fields.mapped.length).to.be.eql(3);
      expect(fields.mapped[0]).to.be.eql('a');
      expect(fields.mapped[1]).to.be.eql('b');
      expect(fields.mapped[2]).to.be.eql('dataFormatVersion');
    });

    it('should not apply defaults if fields is []', () => {
      const fields = _airlineFields([], ['a', 'b'], (f) => f);
      expect(fields).to.have.property('mapped');
      expect(fields.mapped.length).to.be.eql(1);
      expect(fields.mapped[0]).to.be.eql('dataFormatVersion');
      expect(fields.toDrop.length).to.be.eql(1);
      expect(fields.toDrop[0]).to.be.eql('dataFormatVersion');
    });

    it('should categorize on-chain fields', () => {
      const fields = _airlineFields(['owner'], []);
      expect(fields.onChain.length).to.be.eql(1);
      expect(fields.onChain[0]).to.be.eql('owner');
    });

    it('should apply airline mapping', () => {
      const fields = _airlineFields(['ownerAddress'], []);
      expect(fields.mapped.length).to.be.eql(2);
      expect(fields.mapped[0]).to.be.eql('owner');
      expect(fields.mapped[1]).to.be.eql('dataFormatVersion');
      expect(fields.onChain.length).to.be.eql(1);
      expect(fields.onChain[0]).to.be.eql('owner');
    });

    it('should nest description fields', () => {
      const fields = _airlineFields(['contacts'], []);
      expect(fields.onChain.length).to.be.eql(0);
      expect(fields.toFlatten.length).to.be.eql(2);
      expect(fields.toFlatten[0]).to.be.eql('descriptionUri.contacts');
      expect(fields.toFlatten[1]).to.be.eql('dataFormatVersion');
    });

    it('should keep dataIndex fields', () => {
      const fields = _airlineFields(['flightsUri', 'notificationsUri', 'bookingUri'], []);
      expect(fields.onChain.length).to.be.eql(0);
      expect(fields.toFlatten.length).to.be.eql(4);
      expect(fields.toFlatten[0]).to.be.eql('flightsUri');
      expect(fields.toFlatten[1]).to.be.eql('notificationsUri');
      expect(fields.toFlatten[2]).to.be.eql('bookingUri');
      expect(fields.toFlatten[3]).to.be.eql('dataFormatVersion');
    });

    it('should drop unknown fields', () => {
      const fields = _airlineFields(['bookingUri', 'ownerAddress', 'contacts', '__stuff'], []);
      expect(fields.onChain.length).to.be.eql(1);
      expect(fields.onChain[0]).to.be.eql('owner');
      expect(fields.toFlatten.length).to.be.eql(3);
      expect(fields.toFlatten[0]).to.be.eql('bookingUri');
      expect(fields.toFlatten[1]).to.be.eql('descriptionUri.contacts');
      expect(fields.toFlatten[2]).to.be.eql('dataFormatVersion');
    });

    it('should mark dataFormatVersion to drop if not requested', () => {
      const fields = _airlineFields([], ['a', 'b'], (f) => f);
      expect(fields).to.have.property('mapped');
      expect(fields.mapped.length).to.be.eql(1);
      expect(fields.mapped[0]).to.be.eql('dataFormatVersion');
      expect(fields.toDrop.length).to.be.eql(1);
      expect(fields.toDrop[0]).to.be.eql('dataFormatVersion');
    });

    it('should not mark dataFormatVersion to drop if requested', () => {
      const fields = _airlineFields(['dataFormatVersion'], ['a', 'b'], (f) => f);
      expect(fields).to.have.property('mapped');
      expect(fields.mapped.length).to.be.eql(1);
      expect(fields.mapped[0]).to.be.eql('dataFormatVersion');
      expect(fields.toDrop.length).to.be.eql(0);
    });
  });

  describe('_hotelFields', () => {
    it('should work when fields is non-empty string', () => {
      const fields = _hotelFields('owner,contacts', (f) => f);
      expect(fields).to.have.property('mapped');
      expect(fields.mapped.length).to.be.eql(4);
      expect(fields.mapped[0]).to.be.eql('owner');
      expect(fields.mapped[1]).to.be.eql('contacts');
      expect(fields.mapped[2]).to.be.eql('dataFormatVersion');
      expect(fields.mapped[3]).to.be.eql('guarantee');
    });

    it('should apply defaults if fields is undefined', () => {
      const fields = _hotelFields(undefined, ['a', 'b'], (f) => f, [], [], []);
      expect(fields).to.have.property('mapped');
      expect(fields.mapped.length).to.be.eql(4);
      expect(fields.mapped[0]).to.be.eql('a');
      expect(fields.mapped[1]).to.be.eql('b');
      expect(fields.mapped[2]).to.be.eql('dataFormatVersion');
      expect(fields.mapped[3]).to.be.eql('guarantee');
      expect(fields.toDrop.length).to.be.eql(2);
      expect(fields.toDrop[0]).to.be.eql('dataFormatVersion');
      expect(fields.toDrop[1]).to.be.eql('guarantee');
    });

    it('should apply defaults if fields is empty string', () => {
      const fields = _hotelFields('', ['a', 'b'], (f) => f, [], [], []);
      expect(fields).to.have.property('mapped');
      expect(fields.mapped.length).to.be.eql(4);
      expect(fields.mapped[0]).to.be.eql('a');
      expect(fields.mapped[1]).to.be.eql('b');
      expect(fields.mapped[2]).to.be.eql('dataFormatVersion');
      expect(fields.mapped[3]).to.be.eql('guarantee');
    });

    it('should not apply defaults if fields is []', () => {
      const fields = _hotelFields([], ['a', 'b'], (f) => f, [], [], []);
      expect(fields).to.have.property('mapped');
      expect(fields.mapped.length).to.be.eql(2);
      expect(fields.mapped[0]).to.be.eql('dataFormatVersion');
      expect(fields.mapped[1]).to.be.eql('guarantee');
    });

    it('should categorize on-chain fields', () => {
      const fields = _hotelFields(['owner'], []);
      expect(fields.onChain.length).to.be.eql(1);
      expect(fields.onChain[0]).to.be.eql('owner');
    });

    it('should apply hotel mapping', () => {
      const fields = _hotelFields(['ownerAddress'], []);
      expect(fields.mapped.length).to.be.eql(3);
      expect(fields.mapped[0]).to.be.eql('owner');
      expect(fields.mapped[1]).to.be.eql('dataFormatVersion');
      expect(fields.mapped[2]).to.be.eql('guarantee');
      expect(fields.onChain.length).to.be.eql(1);
      expect(fields.onChain[0]).to.be.eql('owner');
    });

    it('should nest description fields', () => {
      const fields = _hotelFields(['contacts'], []);
      expect(fields.onChain.length).to.be.eql(0);
      expect(fields.toFlatten.length).to.be.eql(3);
      expect(fields.toFlatten[0]).to.be.eql('descriptionUri.contacts');
      expect(fields.toFlatten[1]).to.be.eql('dataFormatVersion');
      expect(fields.toFlatten[2]).to.be.eql('guarantee');
    });

    it('should keep dataIndex fields', () => {
      const fields = _hotelFields([
        'ratePlansUri',
        'availabilityUri',
        'notificationsUri',
        'bookingUri',
        'defaultLocale',
      ], []);
      expect(fields.onChain.length).to.be.eql(0);
      expect(fields.toFlatten.length).to.be.eql(7);
      expect(fields.toFlatten[0]).to.be.eql('ratePlansUri');
      expect(fields.toFlatten[1]).to.be.eql('availabilityUri');
      expect(fields.toFlatten[2]).to.be.eql('notificationsUri');
      expect(fields.toFlatten[3]).to.be.eql('bookingUri');
      expect(fields.toFlatten[4]).to.be.eql('defaultLocale');
      expect(fields.toFlatten[5]).to.be.eql('dataFormatVersion');
      expect(fields.toFlatten[6]).to.be.eql('guarantee');
    });

    it('should drop unknown fields', () => {
      const fields = _hotelFields(['bookingUri', 'ownerAddress', 'contacts', '__stuff'], []);
      expect(fields.onChain.length).to.be.eql(1);
      expect(fields.onChain[0]).to.be.eql('owner');
      expect(fields.toFlatten.length).to.be.eql(4);
      expect(fields.toFlatten[0]).to.be.eql('bookingUri');
      expect(fields.toFlatten[1]).to.be.eql('descriptionUri.contacts');
      expect(fields.toFlatten[2]).to.be.eql('dataFormatVersion');
      expect(fields.toFlatten[3]).to.be.eql('guarantee');
    });

    it('should mark dataFormatVersion, guarantee to drop if not requested', () => {
      const fields = _hotelFields([], ['a', 'b'], (f) => f);
      expect(fields).to.have.property('mapped');
      expect(fields.mapped.length).to.be.eql(2);
      expect(fields.mapped[0]).to.be.eql('dataFormatVersion');
      expect(fields.mapped[1]).to.be.eql('guarantee');
      expect(fields.toDrop.length).to.be.eql(2);
      expect(fields.toDrop[0]).to.be.eql('dataFormatVersion');
      expect(fields.toDrop[1]).to.be.eql('guarantee');
    });

    it('should not mark dataFormatVersion to drop if requested', () => {
      const fields = _hotelFields(['dataFormatVersion', 'guarantee'], ['a', 'b'], (f) => f);
      expect(fields).to.have.property('mapped');
      expect(fields.mapped.length).to.be.eql(2);
      expect(fields.mapped[0]).to.be.eql('dataFormatVersion');
      expect(fields.mapped[1]).to.be.eql('guarantee');
      expect(fields.toDrop.length).to.be.eql(0);
    });
  });
});
