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
    it('should apply defaults if fields is undefined', () => {
      const fields = _calculateFields(undefined, ['a', 'b'], (f) => f, [], [], []);
      expect(fields).to.have.property('mapped');
      expect(fields.mapped.length).to.be.eql(2);
      expect(fields.mapped[0]).to.be.eql('a');
      expect(fields.mapped[1]).to.be.eql('b');
    });

    it('should apply defaults if fields is empty string', () => {
      const fields = _calculateFields('', ['a', 'b'], (f) => f, [], [], []);
      expect(fields).to.have.property('mapped');
      expect(fields.mapped.length).to.be.eql(2);
      expect(fields.mapped[0]).to.be.eql('a');
      expect(fields.mapped[1]).to.be.eql('b');
    });

    it('should not apply defaults if fields is []', () => {
      const fields = _calculateFields([], ['a', 'b'], (f) => f, [], [], []);
      expect(fields).to.have.property('mapped');
      expect(fields.mapped.length).to.be.eql(0);
    });

    it('should work when fields is non-empty string', () => {
      const fields = _calculateFields('a,b', [], (f) => f, [], [], []);
      expect(fields).to.have.property('mapped');
      expect(fields.mapped.length).to.be.eql(2);
      expect(fields.mapped[0]).to.be.eql('a');
      expect(fields.mapped[1]).to.be.eql('b');
    });

    it('should apply mappingSpec', () => {
      const mappingSpec = sinon.stub().returns([]);
      _calculateFields('a,b', [], mappingSpec, [], [], []);
      expect(mappingSpec.callCount).to.be.eql(1);
    });
  });

  describe('_airlineFields', () => {
    it('should categorize on-chain fields', () => {
      const fields = _airlineFields(['manager'], []);
      expect(fields.onChain.length).to.be.eql(1);
      expect(fields.onChain[0]).to.be.eql('manager');
    });

    it('should apply airline mapping', () => {
      const fields = _airlineFields(['managerAddress'], []);
      expect(fields.mapped.length).to.be.eql(1);
      expect(fields.mapped[0]).to.be.eql('manager');
      expect(fields.onChain.length).to.be.eql(1);
      expect(fields.onChain[0]).to.be.eql('manager');
    });

    it('should nest description fields', () => {
      const fields = _airlineFields(['contacts'], []);
      expect(fields.onChain.length).to.be.eql(0);
      expect(fields.toFlatten.length).to.be.eql(1);
      expect(fields.toFlatten[0]).to.be.eql('descriptionUri.contacts');
    });

    it('should keep dataUri fields', () => {
      const fields = _airlineFields(['flightsUri', 'notificationsUri', 'bookingUri'], []);
      expect(fields.onChain.length).to.be.eql(0);
      expect(fields.toFlatten.length).to.be.eql(3);
      expect(fields.toFlatten[0]).to.be.eql('flightsUri');
      expect(fields.toFlatten[1]).to.be.eql('notificationsUri');
      expect(fields.toFlatten[2]).to.be.eql('bookingUri');
    });

    it('should drop unknown fields', () => {
      const fields = _airlineFields(['bookingUri', 'managerAddress', 'contacts', '__stuff'], []);
      expect(fields.onChain.length).to.be.eql(1);
      expect(fields.onChain[0]).to.be.eql('manager');
      expect(fields.toFlatten.length).to.be.eql(2);
      expect(fields.toFlatten[0]).to.be.eql('bookingUri');
      expect(fields.toFlatten[1]).to.be.eql('descriptionUri.contacts');
    });
  });

  describe('_hotelFields', () => {
    it('should categorize on-chain fields', () => {
      const fields = _hotelFields(['manager'], []);
      expect(fields.onChain.length).to.be.eql(1);
      expect(fields.onChain[0]).to.be.eql('manager');
    });

    it('should apply hotel mapping', () => {
      const fields = _hotelFields(['managerAddress'], []);
      expect(fields.mapped.length).to.be.eql(1);
      expect(fields.mapped[0]).to.be.eql('manager');
      expect(fields.onChain.length).to.be.eql(1);
      expect(fields.onChain[0]).to.be.eql('manager');
    });

    it('should nest description fields', () => {
      const fields = _hotelFields(['contacts'], []);
      expect(fields.onChain.length).to.be.eql(0);
      expect(fields.toFlatten.length).to.be.eql(1);
      expect(fields.toFlatten[0]).to.be.eql('descriptionUri.contacts');
    });

    it('should keep dataUri fields', () => {
      const fields = _hotelFields([
        'ratePlansUri',
        'availabilityUri',
        'notificationsUri',
        'bookingUri',
        'defaultLocale',
      ], []);
      expect(fields.onChain.length).to.be.eql(0);
      expect(fields.toFlatten.length).to.be.eql(5);
      expect(fields.toFlatten[0]).to.be.eql('ratePlansUri');
      expect(fields.toFlatten[1]).to.be.eql('availabilityUri');
      expect(fields.toFlatten[2]).to.be.eql('notificationsUri');
      expect(fields.toFlatten[3]).to.be.eql('bookingUri');
      expect(fields.toFlatten[4]).to.be.eql('defaultLocale');
    });

    it('should drop unknown fields', () => {
      const fields = _hotelFields(['bookingUri', 'managerAddress', 'contacts', '__stuff'], []);
      expect(fields.onChain.length).to.be.eql(1);
      expect(fields.onChain[0]).to.be.eql('manager');
      expect(fields.toFlatten.length).to.be.eql(2);
      expect(fields.toFlatten[0]).to.be.eql('bookingUri');
      expect(fields.toFlatten[1]).to.be.eql('descriptionUri.contacts');
    });
  });
});
