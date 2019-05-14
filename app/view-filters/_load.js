/**
 * This is a convenience script that will attach all filters in this directory
 * to the given Nunjucks environment.
 */

const formatDateObject = require('./formatDateObject');
const renderAsAttributes = require('./renderAsAttributes');
const mergeObjects = require('./mergeObjects');
const mergeObjectsDeep = require('./mergeObjectsDeep');
const includes = require('./includes');

/**
 * Load filters into the given Nunjucks environment
 *
 * @param {NunjucksEnvironment} env Nunjucks environment
 * @returns {void}
 */
module.exports = function loadFilters(env) {
  env.addFilter('formatDateObject', formatDateObject);
  env.addFilter('renderAsAttributes', renderAsAttributes);
  env.addGlobal('mergeObjects', mergeObjects);
  env.addGlobal('mergeObjectsDeep', mergeObjectsDeep);
  env.addGlobal('includes', includes);
};
