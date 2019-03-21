const path = require('path');
const YAML = require('yamljs');
const { SCHEMA_PATH } = require('../constants');
const { config } = require('../config');
const { version } = require('../../package.json');

const MODEL_DEFINITIONS = [
  '@windingtree/wt-shared-schemas',
  '@windingtree/wt-hotel-schemas',
  '@windingtree/wt-airline-schemas',
];

/**
 * Update $refs in model definition to local references.
 * @param model
 */
const resolveRefs = (model) => {
  if (model.$ref && model.$ref.startsWith('@windingtree/')) {
    for (let path of MODEL_DEFINITIONS) {
      model.$ref = model.$ref.replace(`${path}/swagger.yaml`, '');
    }
  }
  if (typeof model === 'object') {
    for (let property in model) {
      resolveRefs(model[property]);
    }
  }
};

/**
 * Add referenced models to enable $ref resolution
 * @param model
 */
const addDefinitions = (model) => {
  for (let path of MODEL_DEFINITIONS) {
    const refDef = YAML.load(`node_modules/${path}/dist/swagger.yaml`);
    resolveRefs(refDef);
    model.components.schemas = Object.assign(model.components.schemas, refDef.components.schemas);
  }
  return model;
};

const getSchema = (schemaPath = SCHEMA_PATH) => {
  let swaggerDocument = YAML.load(path.resolve(schemaPath));
  swaggerDocument.servers = [{ url: config.baseUrl }];
  swaggerDocument.info.version = version;
  resolveRefs(swaggerDocument);
  return addDefinitions(swaggerDocument);
};

module.exports = {
  resolveRefs,
  addDefinitions,
  getSchema,
};
