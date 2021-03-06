'use strict';


let _       = require('lodash'),
    path    = require('path');

class Config {

    constructor(pkg, options, basePath) {
        let legacyLayouts;
        /* application overrides */
        this.options = options;

        /* base path of the applicaiton normally __dirname */
        this.basePath = basePath;

        /* maximum cache lifetime in seconds */
        this.cacheControlHeader = process.env.CACHE_CONTROL || this.options.maxAge || 'max-age=60';

        /* application custom headers */
        this.customHeaders = this.options.customHeaders || [];

        /* application description */
        this.description = this.options.description || pkg.description;

        /* application environment */
        this.env = process.env.ENVIRONMENT || process.env.NODE_ENV || this.options.environment || '';

        /* production environment name */
        this.envProd = this.options.envProd || 'production';

        /* application port */
        this.port = process.env.PORT || this.options.port || 3000;

        /* application host */
        this.host = process.env.HOST || this.options.host || '0.0.0.0';

        /* application name */
        this.name = this.options.name || pkg.name;
        this.surrogateControlHeader = process.env.SURROGATE_CACHE_CONTROL || this.options.surrogateCacheControl || 'max-age=360, stale-while-revalidate=60, stale-if-error=86400';

        /* swagger options */
        this.withSwagger = this.options.withSwagger || false;
        this.contactEmail = this.options.contactEmail || undefined;
        this.contactName = this.options.contactName || undefined;
        this.contactUrl = this.options.contactUrl || undefined;
        this.licenseName = this.options.licenseName || undefined;
        this.licenseUrl = this.options.licenseUrl || undefined;
        this.termsOfService = this.options.termsOfService || undefined;
        /* end swagger options */

        /* set max # of listeners for a particular event */
        this.maxListeners = process.env.DEFAULT_MAX_LISTENERS || this.options.maxListeners;

        /* application metrics */
        this.metricOptions = Object.create(null);
        this.metricOptions.app = this.name;
        this.metricOptions.flushEvery = process.env.DEFAULT_METRICS_FLUSH_INTERVAL || this.options.flushEvery;

        this.metrics = this.options.metrics || Object.create(null);
        this.metrics.provider = this.metrics.provider || null;
        this.metrics.options = this.metrics.options || this.metricOptions;
        /* end application metrics */

        this.withGoodConsole = this.options.withGoodConsole || false;

        /* application views */
        this.withHandlebars = this.options.withHandlebars || false;
        this.layoutsDir = this.options.layoutsDir || '';

        legacyLayouts = (this.layoutsDir.split(path.sep).length > 1) ? true : false;
        legacyLayouts = (legacyLayouts) ? this.layoutsDir.split(path.sep) : false;

        this.layoutsDir = (legacyLayouts) ? legacyLayouts[legacyLayouts.length - 2] : this.layoutsDir;
        this.partialsPath = this.options.partialsPath || '';
        this.helpersPath = this.options.helpersPath || '';
        /* end application views */

        this.healthChecks = [];

        /* unused legacy options */
        this.withBackendAuthentication = this.options.withBackendAuthentication || true;
        this.withFlags = this.options.withFlags || true;
    }

    get cacheHeaders() {
        let cacheHeaders = Object.create(null);

        cacheHeaders.cacheControlHeader     = this.cacheControlHeader;
        cacheHeaders.surrogateCacheControl  = this.surrogateControlHeader;

        return cacheHeaders;
    }

    get connectionOptions() {
        let connectionOptions = Object.create(null);

        connectionOptions.host      = this.host;
        connectionOptions.labels    = this.env || 'dev';
        connectionOptions.port      = this.port;
        connectionOptions.tls       = (this.options.tls) ? this.options.tls : null;
        connectionOptions.routes    = (this.options.routes) ? this.options.routes : {};
        connectionOptions.routes.files  = {relativeTo: path.join(this.basePath, this.layoutsDir)};
        connectionOptions.routes.cors   = {};
        connectionOptions.routes.state  = {};

        if (_.get(this.options, 'connections.routes.files', false)) {
            connectionOptions.routes.files = this.options.connections.routes.files;
        }

        if (_.get(this.options, 'connections.routes.cors', false)) {
            connectionOptions.routes.cors = this.options.connections.routes.cors;
        }

        if (_.get(this.options, 'connections.routes.state', false)) {
            connectionOptions.routes.state = this.options.connections.routes.state;
        }

        return connectionOptions;
    }

    get metricsProvider() {
        let nullProvider = this.metrics.provider === null;
        return (!nullProvider) ? this.metrics.provider.init(this.metricOptions) : null;
    }

    /**
     * Set up cache control headers
     * @param {object} request - Request object
     * @param {object} headers - The cache control headers to set
     */
    setCacheControlHeaders(request, headers) {
        let surrogateControl = headers.surrogateCacheControl ? headers.surrogateCacheControl : false,
            cacheControl = headers.cacheControlHeader ? headers.cacheControlHeader : false;

        if (typeof request.response === 'object' &&
            request.response !== null &&
            typeof request.response.header === 'function') {
            if (typeof surrogateControl === 'string') {
                request.response.header('Surrogate-Control', surrogateControl);
            }

            if (typeof cacheControl === 'string') {
                request.response.header('Cache-Control', cacheControl);
            }
        }
    }

    /**
     * Set up custom headers
     * @param {object} request - Request object
     * @param {object} customHeaders - The custome headers to set
     */
    setCustomHeaders(request, customHeaders) {
        let hasHeaders = require('./helpers').hasHeaders,
            header,
            length,
            i = 0;

        if (hasHeaders(request) === true) {
            length = customHeaders.length;
            for (; i < length; i++) {
                header = customHeaders[i];
                if (header.name && header.value) {
                    request.response.header(header.name, header.value);
                }
            }
        }
    }
}

module.exports = Config;
