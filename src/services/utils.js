const { HttpValidationError } = require('../errors');

/**
 * Prepare fields for `flattenObject`.
 * In case the query contains overlapping keys (e.g. `flights` and `flights.items`) these need to be reverse sorted,
 * otherwise only `flights.items` will be resolved.
 *
 * @param fields
 * @private
 */
function _sortFields (fields) {
  fields.sort();
  fields.reverse();
}

/**
 * Format error to API response format.
 * @param e
 * @private
 */
function formatError (e) {
  let err = new HttpValidationError();
  if (e.data && e.data.hasOwnProperty('GetFormattedErrors')) {
    err.msgLong = e.data.GetFormattedErrors().map((err) => { return err.message; }).toString();
  } else {
    err.msgLong = e.data.errors.toString();
  }
  return err;
}

/**
 * Flatten resolved storage pointers (off-chain data) to simple object.
 *
 * @param contents Object containing storage pointers
 * @param fields Fields to flatten
 * @returns {Object} POJO object
 */
const flattenObject = (contents, fields) => {
  _sortFields(fields);
  let currentFieldDef = {},
    currentLevelName,
    result = {};
  for (let field of fields) {
    let remainingPath;
    if (field.indexOf('.') === -1) {
      currentLevelName = field;
    } else {
      currentLevelName = field.substring(0, field.indexOf('.'));
      remainingPath = field.substring(field.indexOf('.') + 1);
    }
    if (remainingPath) {
      if (!currentFieldDef[currentLevelName]) {
        currentFieldDef[currentLevelName] = [];
      }
      currentFieldDef[currentLevelName].push(remainingPath);
    } else {
      currentFieldDef[currentLevelName] = undefined;
    }
  }

  for (let field in currentFieldDef) {
    if (contents[field] !== undefined) {
      // No specific children selected
      if (!currentFieldDef[field]) {
        // Differentiate between storage pointers and plain objects
        result[field] = contents[field] && contents[field].contents ? contents[field].contents : contents[field];
      // Specific children selected
      } else {
        let searchSpace;
        if (contents[field].ref && contents[field].contents) { // StoragePointer
          searchSpace = contents[field].contents;
        } else { // POJO
          searchSpace = contents[field];
        }
        result[field] = flattenObject(searchSpace, currentFieldDef[field]);
      }
    } else if (contents && typeof contents === 'object') { // Mapping object such as roomTypes
      if (Array.isArray(contents)) {
        if (!result || Object.keys(result).length === 0) {
          result = contents.map((x) => {
            let res = {};
            if (x[field].ref && x[field].contents) {
              res[field] = x[field].contents;
            } else {
              res[field] = x[field];
            }
            return res;
          });
        } else {
          result = result.map((x, idx, r) => { let res = r[idx]; res[field] = contents[idx][field]; return res; });
        }
      } else {
        for (let key in contents) {
          if (contents[key] && contents[key][field] !== undefined) {
            if (!result[key]) {
              result[key] = {};
            }
            result[key][field] = contents[key] && contents[key][field];
          }
        }
      }
    }
  }

  return result;
};

module.exports = {
  flattenObject,
  formatError,
};
