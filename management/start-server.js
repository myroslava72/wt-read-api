#! /usr/bin/env node

const swagger = require('./resolve-swagger-references');
swagger.convertSchema();
require('../src/index.js');
