const YAML = require('yamljs');

const _cache = {};

const getSchemaVersion = (packageName) => {
  if (!_cache[packageName]) {
    let refDef = YAML.load(`node_modules/${packageName}/dist/swagger.yaml`);
    _cache[packageName] = refDef.info.version;
  }
  return _cache[packageName];
};

module.exports = {
  getSchemaVersion,
};
