const fetch = require('node-fetch');
const YAML = require('yamljs');
const path = require('path');
const _ = require('lodash');
const Validator = require('swagger-model-validator');

const {
  HttpValidationError,
  MisconfigurationError,
} = require('../errors');
const {
  DATA_FORMAT_VERSION,
  HOTEL_SCHEMA_MODEL,
} = require('../constants');

/**
 * Utility class for data format validation.
 */
class DataFormatValidator {
  /**
   * Static method to validate data against specific model in schema.
   * @param data
   * @param modelName
   * @param schemas The components.schemas part of swagger definition
   */
  static validateHotel (data, modelName, schemas) {
    if (!data.dataFormatVersion) { // TODO: warning?
      throw new HttpValidationError({ valid: false, errors: [`Missing property \`dataFormatVersion\` in hotel data for id ${data.id}`] });
    }
    if (DATA_FORMAT_VERSION !== data.dataFormatVersion) { // TODO: skip semver patch, warning?
      throw new HttpValidationError({ valid: false, errors: [`Unsupported data format version ${data.dataFormatVersion}. Supported versions: ${DATA_FORMAT_VERSION}`] });
    }
    if (!schemas.hasOwnProperty(modelName)) {
      throw new HttpValidationError({ valid: false, errors: [`Model ${modelName} not found in schemas.`] });
    }

    let validation = (new Validator()).validate(data, schemas[modelName], schemas, true); // TODO disallowExtraProperties?
    if (!validation.valid) {
      throw new HttpValidationError(validation);
    }
  }

  /**
   * Static method to load schema from URI. Use this to prevent multiple loading and improve performance.
   * @param schemaPath
   * @param fields Fields asked for in the request. Remove other required fields from schema to prevent validation errors.
   * @returns {Promise<String>}
   */
  static async loadSchemaFromPath (schemaPath, fields) {
    if (!DATA_FORMAT_VERSION) {
      throw new MisconfigurationError('Constant DATA_FORMAT_VERSION is not configured, check API deployment.');
    }
    let mainSchemaDocument;
    if (DataFormatValidator.CACHE.hasOwnProperty(schemaPath)) {
      mainSchemaDocument = _.cloneDeep(DataFormatValidator.CACHE[schemaPath]);
    } else {
      mainSchemaDocument = YAML.load(path.resolve(schemaPath));
      mainSchemaDocument = await this._loadSchema(mainSchemaDocument);
      DataFormatValidator.CACHE[schemaPath] = _.cloneDeep(mainSchemaDocument);
    }
    mainSchemaDocument.components.schemas = this._intersectRequiredFields(mainSchemaDocument.components.schemas, HOTEL_SCHEMA_MODEL, fields.mapped);
    return mainSchemaDocument;
  }

  static async _loadSchema (mainSchemaDocument) {
    let modelReferences = _.uniq(this._collectRemoteRefs(mainSchemaDocument.components.schemas));
    let schemasToLoad = _.uniq(modelReferences.map((ref) => {
      return ref.substring(0, ref.indexOf('#'));
    }));
    for (let schemaUri of schemasToLoad) {
      let schema = await this._fetchFileFromUri(schemaUri);
      schema = await this._loadSchema(schema);
      for (let key of Object.keys(schema.components.schemas)) {
        mainSchemaDocument.components.schemas[key] = schema.components.schemas[key];
      }
    }
    return mainSchemaDocument;
  }

  static async _fetchFileFromUri (uri) {
    let content = await fetch(uri).then(res => res.text());
    return YAML.parse(content);
  }

  static _collectRemoteRefs (data) {
    let res = [];
    if (data && data.hasOwnProperty('$ref') && data.$ref.startsWith('http')) {
      res.push(data.$ref);
      data.$ref = data.$ref.substring(data.$ref.indexOf('#'));
    }
    if (Array.isArray(data)) {
      for (let item of data) {
        res = res.concat(this._collectRemoteRefs(item));
      }
    } else if (typeof data === 'object') {
      for (let key in data) {
        res = res.concat(this._collectRemoteRefs(data[key]));
      }
    }
    return res;
  }

  /**
   * Remove fields the client did not ask for from required to prevent validation errors.
   * @param data Schemas definition
   * @param modelName
   * @param fields Fields asked for in request
   * @returns {*} Updated schemas definition
   * @private
   */
  static _intersectRequiredFields (data, modelName, fields) {
    let nestedBaseFields = {};
    for (let field of fields) {
      if (field.indexOf('.') > -1) {
        let [base, rest] = field.split('.', 2);
        if (base === 'availabilityUri') base = 'availability'; // TODO use property-mapping
        if (base === 'ratePlansUri') base = 'ratePlans';
        nestedBaseFields[base] = nestedBaseFields[base] || [];
        nestedBaseFields[base].push(rest);
      }
    }

    if (data[modelName] && data[modelName].hasOwnProperty('required') && Array.isArray(data[modelName].required)) {
      data[modelName].required = _.intersection(data[modelName].required, fields);
    }
    if (data[modelName] && data[modelName].hasOwnProperty('properties')) {
      for (let nestedField of Object.keys(nestedBaseFields)) {
        if (Object.keys(data[modelName].properties).indexOf(nestedField) > -1) {
          if (data[modelName].properties[nestedField].hasOwnProperty('$ref')) {
            let refName = this._getReferenceBaseName(data[modelName].properties[nestedField].$ref);
            data = this._intersectRequiredFields(data, refName, nestedBaseFields[nestedField]);
          } else {
            data[modelName] = this._intersectRequiredFields(data[modelName], nestedField, nestedBaseFields[nestedField]);
          }
        }
      }
    }
    if (data[modelName] && data[modelName].hasOwnProperty('$ref')) {
      let refName = this._getReferenceBaseName(data[modelName].$ref);
      data = this._intersectRequiredFields(data, refName, fields);
    }
    if (data[modelName].type === 'array') {
      let refName = this._getReferenceBaseName(data[modelName].items.$ref);
      data = this._intersectRequiredFields(data, refName, fields);
    }
    if (data[modelName] && data[modelName].hasOwnProperty('allOf')) {
      let i = 0;
      for (let part of data[modelName].allOf) {
        if (part.hasOwnProperty('$ref')) {
          let refName = this._getReferenceBaseName(part.$ref);
          data = this._intersectRequiredFields(data, refName, fields);
        } else {
          let propertiesModelName = `${modelName}.${i}`;
          data[propertiesModelName] = part;
          data = this._intersectRequiredFields(data, propertiesModelName, fields);
        }
        i += 1;
      }
    }
    return data;
  }

  static _getReferenceBaseName (ref) {
    return ref.substring(ref.indexOf(('#'))).replace('#/components/schemas/', '');
  }
}
DataFormatValidator.CACHE = {};

module.exports = {
  DataFormatValidator,
};
