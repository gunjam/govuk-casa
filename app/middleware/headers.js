/*
 * Manipulate or parse headers.
 */
const cspKeyScriptSrc = 'script-src';
const isIE8 = /MSIE\s*8/i;
const isStaticAsset = /\.(js|jpe?g|css|png|svg|woff2?|eot|ttf|otf)(\?.*)?$/i;
const oneDay = 86400000;

/**
 * Setup middleware.
 *
 * @param  {express} app Express app
 * @param  {object} cspConfig object containing CSP directives
 * @param  {array} disabledHeadersConfig Headers that should not be set here
 * @return {object} Applied middleware functions
 */
module.exports = function mwHeaders(app, cspConfig, disabledHeadersConfig) {
  // ETags are disabled by default here. See also "static" middleware, where
  // they are re-enabled on a case-by-case basis.
  app.set('etag', false);

  // Remove powered by express header
  app.set('x-powered-by', false);

  const csp = cspConfig || {};
  const disabledHeaders = disabledHeadersConfig || [];

  // Default headers to set on all responses
  const headers = {
    // Cross-site protections
    'X-Content-Type-Options': 'nosniff',
    'X-XSS-Protection': '1; mode=block',
    'X-Frame-Options': 'DENY',
    // Caching policy
    'Cache-Control': 'no-cache, no-store, must-revalidate, private',
    Pragma: 'no-cache',
    Expires: 0,
  };

  // Use Content-Security-Policy directives from config or set empty default
  let cspDirectives = Object.getOwnPropertyNames(csp).length > 0 ? csp : {
    [cspKeyScriptSrc]: [],
  };

  // If config object does not contain a script-src property, set emtpty default
  if (!Object.prototype.hasOwnProperty.call(cspDirectives, cspKeyScriptSrc)) {
    cspDirectives[cspKeyScriptSrc] = [];
  }

  // CASA requires these script-src entries to be included in the CSP
  const requiredScriptSources = [
    '\'self\'',
    // hash of inline GOV.UK template JS to add 'js-enabled' body class
    '\'sha256-+6WnXIl4mbFTCARd8N3COQmT3bJJmo32N8q8ZSQAIcU=\'',
    'https://www.google-analytics.com/',
    'https://www.googletagmanager.com/',
  ];

  // Add required script sources to CSP directives object
  requiredScriptSources.forEach((source) => {
    if (!cspDirectives[cspKeyScriptSrc].includes(source)) {
      cspDirectives[cspKeyScriptSrc].push(source);
    }
  });

  // Compile the CSP and add to default headers
  cspDirectives = Object.keys(cspDirectives).map(directive => `${directive} ${cspDirectives[directive].join(' ')}`);
  headers['Content-Security-Policy'] = cspDirectives.join('; ');

  /**
   * Define some common headers for all requests.
   * Remove security-sensitive headers that may otherwise reveal information.
   *
   * @param {Request} req Request
   * @param {Response} res Response
   * @param {Function} next Next route handler
   * @returns {void}
   */
  const handleHeaders = (req, res, next) => {
    // X-XSS-Protection introduces a security bug into IE8, so disable it if IE8
    if (isIE8.test(req.headers['user-agent'])) {
      headers['X-XSS-Protection'] = '0';
    }

    // Cache static assets more agressively
    if (isStaticAsset.test(req.url)) {
      headers['Cache-Control'] = 'public';
      headers.Pragma = 'cache';
      headers.Expires = new Date(Date.now() + oneDay).toUTCString();
    }

    // Write headers
    const headerNames = Object.keys(headers);
    for (let i = 0, l = headerNames.length; i < l; i++) {
      if (!disabledHeaders.includes(headerNames[i])) {
        res.setHeader(headerNames[i], headers[headerNames[i]]);
      }
    }

    next();
  };

  app.use(handleHeaders);

  return {
    handleHeaders,
  };
};
