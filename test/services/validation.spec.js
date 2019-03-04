/* eslint-env mocha */
/* eslint-disable no-unused-expressions */
const DataFormatValidator = require('../../src/services/validation').DataFormatValidator;
const { expect } = require('chai');
const _ = require('lodash');

describe('Validation', function () {
  const itemDef = {
    type: 'object',
    required: ['id', 'quantity'],
    properties: {},
  };
  const SCHEMAS = {
    Item: _.cloneDeep(itemDef),
    RefItemArray: {
      type: 'array',
      items: {
        $ref: '#/components/schemas/Item',
      },
    },
    DirectItemArray: {
      type: 'array',
      items: _.cloneDeep(itemDef),
    },
    ItemProxy: {
      $ref: '#/components/schemas/Item',
    },
    DirectItemArrayProperty: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: _.cloneDeep(itemDef),
        },
      },
    },
    RefItemArrayProperty: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: {
            $ref: '#/components/schemas/Item',
          },
        },
      },
    },
  };

  describe('intersecting fields', () => {
    let schemas;

    beforeEach(async () => {
      schemas = _.cloneDeep(SCHEMAS);
    });

    it('should remove non-fetched basic fields from required', async () => {
      DataFormatValidator._intersectRequiredFields(schemas, 'Item', ['id', 'name'], {});
      expect(schemas.Item.required).to.be.eql(['id']);
    });

    it('should work with an array type', async () => {
      DataFormatValidator._intersectRequiredFields(schemas, 'DirectItemArray', ['id', 'name'], {});
      expect(schemas.DirectItemArray.items.required).to.be.eql(['id']);
    });

    it('should work with a referenced array type', async () => {
      DataFormatValidator._intersectRequiredFields(schemas, 'RefItemArray', ['id', 'name'], {});
      expect(schemas.Item.required).to.be.eql(['id']);
    });

    it('should work with a proxy model', async () => {
      DataFormatValidator._intersectRequiredFields(schemas, 'ItemProxy', ['id', 'name'], {});
      expect(schemas.Item.required).to.be.eql(['id']);
    });

    it('should work with an array in property', async () => {
      DataFormatValidator._intersectRequiredFields(schemas, 'DirectItemArrayProperty', ['data.id', 'data.name'], {});
      expect(schemas.DirectItemArrayProperty.properties.data.items.required).to.be.eql(['id']);
    });

    it('should work with a referenced array in property', async () => {
      DataFormatValidator._intersectRequiredFields(schemas, 'RefItemArrayProperty', ['data.id', 'data.name'], {});
      expect(schemas.Item.required).to.be.eql(['id']);
    });
  });
});
