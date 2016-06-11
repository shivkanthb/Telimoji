var _ = require('lodash'),
    queryString = require('querystring'),
    constants = require('./constants'),
    https = require('https'),
    Promise = require('bluebird');

var Client = function (apiKey, apiSecret, apiVersion) {
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
    this.apiVersion = apiVersion;
};

_.extend(Client.prototype, {
    getCall: function (path, params) {
        return _private.performCall(this, 'GET', path, params);
    },

    postCall: function (path, params) {
        return _private.performCall(this, 'POST', path, params);
    }
});

var _private = {
    performCall: function (instance, method, path, params) {
        return _private.oauthRequest(instance)
            .then(function (oauth) {
                params = _.extend(params || {}, {
                    access_token: oauth.accessToken
                });
                return _private.httpsCall(instance, method, path, params, null);
            });
    },

    oauthRequest: function (instance) {
        return new Promise(function (resolve, reject) {
            var authPromise;
            if (!instance.oauth || !instance.oauth.accessToken || !instance.oauth.refreshToken) {
                authPromise = _private.httpsCall(
                    instance,
                    'POST',
                    constants.Endpoints.GetOAuthToken, {
                        grant_type: 'client_credentials'
                    }, {
                        Authorization: 'Basic ' + _private.oauthBearerToken(instance)
                    }
                );
            } else if (instance.oauth.expiration < new Date()) {
                authPromise = _private.httpsCall(
                    instance,
                    'POST',
                    constants.Endpoints.GetOAuthToken, {
                        grant_type: 'refresh_token',
                        refresh_token: instance.oauth.refreshToken
                    }, {
                        Authorization: 'Basic ' + _private.oauthBearerToken(instance)
                    }
                );
            } else {
                resolve(instance.oauth);
            }

            if (authPromise) {
                authPromise
                    .then(function (response) {
                        if (response.access_token) {
                            instance.oauth = {
                                accessToken: response.access_token,
                                refreshToken: response.refresh_token,
                                expiration: new Date(new Date().getTime() + (response.expires_in * 1000))
                            };

                            resolve(instance.oauth);
                        } else {
                            reject(_private.makeError('unable to verify oauth credentials'));
                        }
                    })
                    .catch(function (err) {
                        reject(err);
                    });
            }
        });
    },

    httpsCall: function (instance, method, path, params, headers) {
        return new Promise(function (resolve, reject) {
            params = params || {};

            var urlEncoded = method == 'POST' || method == 'PUT',
                urlParams = '';

            headers = _.extend(headers || {}, {
                'Imoji-SDK-Version': instance.apiVersion
            });

            if (params.locale) {
                headers['User-Locale'] = params.locale;
                params.locale = undefined;
            }

            if (urlEncoded) {
                params = queryString.stringify(params);
                headers = _.extend(headers || {}, {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Content-Length': params.length
                });
            } else {
                urlParams = _.isEmpty(params) ? '' : ('?' + queryString.stringify(params));
            }

            var request = https.request({
                host: constants.ImojiApiUrl.host,
                path: constants.ImojiApiUrl.path + '/' + path + urlParams,
                port: 443,
                method: method,
                headers: headers
            }, function (response) {
                var str = '';
                response.on('data', function (chunk) {
                    str += chunk;
                });
                response.on('end', function () {
                    try {
                        resolve(JSON.parse(str));
                    } catch (e) {
                        var parseError = new Error();
                        parseError.message = 'Unable to parse Imoji response';
                        reject(parseError);
                    }
                });
            });

            request.on('error', function (e) {
                console.log('error');
                var error = new Error();
                error.message = 'Unable to perform Imoji server call';
                error.innerError = e;

                reject(error);
            });

            if (urlEncoded) {
                request.write(params);
            }

            request.end();
        });
    },

    oauthBearerToken: function (instance) {
        return new Buffer(instance.apiKey + ':' + instance.apiSecret).toString('base64');
    },

    makeError: function (message, code, innerError) {
        var error = new Error();

        error.message = message;
        error.code = code;
        error.innerError = innerError;

        return error;
    }
};

module.exports = Client;
