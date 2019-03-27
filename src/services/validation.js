const fetch = require('node-fetch');
const path = require('path');
const YAML = require('yamljs');
const semver = require('semver');
const _ = require('lodash');
const Validator = require('swagger-model-validator');

const {
  HttpValidationError,
  MisconfigurationError,
} = require('../errors');
const {
  config,
} = require('../config');

/**
 * Utility class for data format validation.
 */
class DataFormatValidator {
  /**
   * Static method to validate data against specific model in schema.
   * @param data
   * @param modelName
   * @param schemas The components.schemas part of swagger definition
   * @param desiredDataFormatVersion Version range that the declared data format version is checked
   * @param declaredDataFormatVersion If the data doesn't contain `dataFormatVersion` field, you may provide an overriding value here.
   * @param type human-readable name that is used in error messages
   * @param fields Fields to resolve
   */
  static validate (data, modelName, schemas, desiredDataFormatVersion, declaredDataFormatVersion = undefined, type = 'model', fields = []) {
    let dataFormatVersion = declaredDataFormatVersion;
    // don't validate dataFormatVersion when only fetching on-chain data
    if (!fields || !fields.length || !(fields.length === 1 && fields[0] === 'id')) {
      dataFormatVersion = data.dataFormatVersion || declaredDataFormatVersion;
      if (!dataFormatVersion) {
        const error = new HttpValidationError();
        error.data = {
          valid: false,
          errors: [`Missing property \`dataFormatVersion\` in ${type} data for id ${data.id || data.data.id}`],
          data: {
            id: data.id || (data.data && data.data.id),
          },
        };
        throw error;
      }
      if (!semver.satisfies(dataFormatVersion, desiredDataFormatVersion)) {
        const error = new HttpValidationError();
        error.data = {
          valid: true,
          errors: [`Unsupported data format version ${dataFormatVersion}. Supported versions: ${desiredDataFormatVersion}`],
          data: {
            id: data.id || (data.data && data.data.id),
          },
        };
        throw error;
      }
    }
    if (!schemas.hasOwnProperty(modelName)) {
      const error = new HttpValidationError();
      error.data = { valid: false, errors: [`Model ${modelName} not found in schemas.`] };
      throw error;
    }
    let validation = (new Validator()).validate(data, schemas[modelName], schemas, true, false);
    if (!validation.valid) {
      const error = new HttpValidationError();
      error.data = validation;
      throw error;
    }
  }

  /**
   * Static method to load schema from URI. Use this to prevent multiple loading and improve performance.
   * @param schemaPath
   * @param schemaModel Main model schema to validate against
   * @param fields Fields asked for in the request. Remove other required fields from schema to prevent validation errors.
   * @param fieldsMapping
   * @returns {Promise<String>}
   */
  static async loadSchemaFromPath (schemaPath, schemaModel, fields = undefined, fieldsMapping = {}) {
    if (!config.dataFormatVersions) {
      throw new MisconfigurationError('config.dataFormatVersions is not configured, check API deployment.');
    }
    let mainSchemaDocument;
    if (DataFormatValidator.CACHE.hasOwnProperty(schemaPath)) {
      mainSchemaDocument = _.cloneDeep(DataFormatValidator.CACHE[schemaPath]);
    } else {
      mainSchemaDocument = YAML.load(path.resolve(schemaPath));
      mainSchemaDocument = await this._loadSchema(mainSchemaDocument);
      DataFormatValidator.CACHE[schemaPath] = _.cloneDeep(mainSchemaDocument);
    }
    mainSchemaDocument.components.schemas = this._intersectRequiredFields(mainSchemaDocument.components.schemas, schemaModel, fields, fieldsMapping);
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
   * @param reversedFieldMapping
   * @returns {*} Updated schemas definition
   * @private
   */
  static _intersectRequiredFields (data, modelName, fields = undefined, reversedFieldMapping = {}) {
    let nestedBaseFields = {};
    if (fields) {
      for (let field of fields) {
        if (field.indexOf('.') > -1) {
          let [base, ...rest] = field.split('.');
          rest = rest.join('.');
          if (base in reversedFieldMapping) {
            base = reversedFieldMapping[base];
          }
          nestedBaseFields[base] = nestedBaseFields[base] || [];
          nestedBaseFields[base].push(rest);
        }
      }
    }

    if (data[modelName] && data[modelName].hasOwnProperty('required') && Array.isArray(data[modelName].required)) {
      if (!_.isUndefined(fields)) {
        data[modelName].required = _.intersection(data[modelName].required, fields);
      }
    }
    if (data[modelName] && data[modelName].hasOwnProperty('properties')) {
      for (let nestedField of Object.keys(nestedBaseFields)) {
        if (Object.keys(data[modelName].properties).indexOf(nestedField) > -1) {
          if (data[modelName].properties[nestedField].hasOwnProperty('$ref')) {
            let refName = this._getReferenceBaseName(data[modelName].properties[nestedField].$ref);
            data = this._intersectRequiredFields(data, refName, nestedBaseFields[nestedField], reversedFieldMapping);
          } else if (data[modelName].properties[nestedField].type === 'array') {
            if (data[modelName].properties[nestedField].items.hasOwnProperty('$ref')) {
              let refName = this._getReferenceBaseName(data[modelName].properties[nestedField].items.$ref);
              data = this._intersectRequiredFields(data, refName, nestedBaseFields[nestedField], reversedFieldMapping);
            } else {
              let refName = `${modelName}.${nestedField}`;
              data[refName] = data[modelName].properties[nestedField].items;
              data = this._intersectRequiredFields(data, refName, nestedBaseFields[nestedField], reversedFieldMapping);
            }
          } else {
            data[modelName] = this._intersectRequiredFields(data[modelName], nestedField, nestedBaseFields[nestedField], reversedFieldMapping);
          }
        }
      }
    }
    if (data[modelName] && data[modelName].hasOwnProperty('$ref')) {
      let refName = this._getReferenceBaseName(data[modelName].$ref);
      data = this._intersectRequiredFields(data, refName, fields, reversedFieldMapping);
    }
    if (data[modelName] && data[modelName].type === 'array') {
      if (data[modelName] && data[modelName].items.hasOwnProperty('$ref')) {
        let refName = this._getReferenceBaseName(data[modelName].items.$ref);
        data = this._intersectRequiredFields(data, refName, fields, reversedFieldMapping);
      } else {
        let refName = `${modelName}.0`;
        data[refName] = data[modelName].items;
        data = this._intersectRequiredFields(data, refName, fields, reversedFieldMapping);
      }
    }
    if (data[modelName] && data[modelName].hasOwnProperty('allOf')) {
      let i = 0;
      for (let part of data[modelName].allOf) {
        if (part.hasOwnProperty('$ref')) {
          let refName = this._getReferenceBaseName(part.$ref);
          data = this._intersectRequiredFields(data, refName, fields, reversedFieldMapping);
        } else {
          let propertiesModelName = `${modelName}.${i}`;
          data[propertiesModelName] = part;
          data = this._intersectRequiredFields(data, propertiesModelName, fields, reversedFieldMapping);
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
