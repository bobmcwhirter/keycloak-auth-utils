/*
 * Copyright 2014 Red Hat, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/* jshint sub: true */

var Q = require('q');

var URL = require('url');
var http = require('http');

var Form = require('./form');

var Grant = require('./grant');

function GrantManager(config) {
  this.realmUrl = config.realmUrl;
  this.clientId = config.clientId;
  this.secret   = config.secret;
}

GrantManager.prototype.obtainDirectly = function(username, password, callback) {

  var deferred = Q.defer();

  var self = this;

  var url = this.realmUrl + '/tokens/grants/access';

  var options = URL.parse( url );

  options.method = 'POST';
  options.headers = {
    'Content-Type': 'application/x-www-form-urlencoded',
  };

  var params = new Form( {
    username: username,
    password: password,
  });

  if ( this.public ) {
    params.set( 'client_id', this.clientId );
  } else {
    options.headers['Authorization'] = 'Basic ' + new Buffer( this.clientId + ':' + this.secret ).toString( 'base64' );
  }

  var req = http.request( options, function(response) {
    if ( response.statusCode < 200 || response.statusCode > 299 ) {
      return deferred.reject( response.statusCode + ':' + http.STATUS_CODES[ response.statusCode ] );
    }
    var json = '';
    response.on('data', function(d) {
      json += d.toString();
    });
    response.on( 'end', function() {
      try {
        var grant = JSON.parse( json );
        deferred.resolve( new Grant( grant ) );
      } catch (err) {
        deferred.reject( err );
      }
    });
  });

  req.write( params.encode() );
  req.end();

  return deferred.promise.nodeify( callback );
};


GrantManager.prototype.ensureFreshness = function(grant, callback) {

  if ( ! grant.expired() ) {
    return Q(grant).nodeify( callback );
  }

  var self = this;
  var deferred = Q.defer();

  var opts = URL.parse( this.realmUrl + '/tokens/refresh' );

  opts.method = 'POST';

  opts.headers = {
    'Content-Type': 'application/x-www-form-urlencoded',
  };

  opts.headers['Authorization'] = 'Basic ' + new Buffer( this.clientId + ':' + this.secret ).toString( 'base64' );

  var params = new Form( {
    grant_type: 'refresh_token',
    refresh_token: grant.refresh_token,
  });

  var request = http.request( opts, function(response) {
    var json = '';
    response.on( 'data', function(d) {
      json += d.toString();
    });
    response.on( 'end', function() {
      var data = JSON.parse( json );
      grant.update( data );
      deferred.resolve(grant);
    });

  });

  request.write( params.encode() );
  request.end();

  return deferred.promise.nodeify(callback);
};

module.exports = GrantManager;