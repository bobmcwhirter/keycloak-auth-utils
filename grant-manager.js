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

var URL    = require('url');
var http   = require('http');
var crypto = require('crypto');

var Form = require('./form');
var Grant = require('./grant');
var Token = require('./token');

function GrantManager(config) {
  this.realmUrl  = config.realmUrl;
  this.clientId  = config.clientId;
  this.secret    = config.secret;
  this.publicKey = config.publicKey
  this.notBefore = 0;
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
        var data = JSON.parse( json );
        return deferred.resolve( self.createGrant( data ) );
      } catch (err) {
        return deferred.reject( err );
      }
    });
  });

  req.write( params.encode() );
  req.end();

  return deferred.promise.nodeify( callback );
};


GrantManager.prototype.obtainFromCode = function(code, sessionId, sessionHost, callback) {
  var deferred = Q.defer();
  var self = this;

  var params = 'code=' + code + '&application_session_state=' + sessionId + '&application_session_host=' + sessionHost;

  var options = URL.parse( this.realmUrl + '/tokens/access/codes' );
  options.method = 'POST';
  options.agent = false;
  options.headers = {
    'Content-Length': params.length,
    'Content-Type': 'application/x-www-form-urlencoded',
    'Authorization': 'Basic ' + new Buffer( this.clientId + ':' + this.secret ).toString('base64' ),
  };

  var request = http.request( options, function(response) {
    var json = '';
    response.on('data', function(d) {
      json += d.toString();
    })
    response.on( 'end', function() {
      try {
        //var data = JSON.parse( json );
        return deferred.resolve( self.createGrant( json ) );
      } catch (err) {
        return deferred.reject( err );
      }
    })
  } );

  request.write( params );
  request.end();

  return deferred.promise.nodeify( callback );
}


GrantManager.prototype.ensureFreshness = function(grant, callback) {

  if ( ! grant.isExpired() ) {
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
    refresh_token: grant.refresh_token.token,
  });

  var request = http.request( opts, function(response) {
    var json = '';
    response.on( 'data', function(d) {
      json += d.toString();
    });
    response.on( 'end', function() {
      try {
        //var data = JSON.parse( json );
        grant.update( self.createGrant( json ) );
        return deferred.resolve(grant);
      } catch (err) {
        return deferred.reject( err );
      }
    });

  });

  request.write( params.encode() );
  request.end();

  return deferred.promise.nodeify(callback);
};

GrantManager.prototype.createGrant = function(rawData) {

  var grantData = JSON.parse( rawData );

  var access_token;
  var refresh_token;
  var id_token;

  if ( grantData.access_token ) {
    access_token = new Token( grantData.access_token, this.clientId );
  }

  if ( grantData.refresh_token ) {
    refresh_token = new Token( grantData.refresh_token );
  }

  if ( grantData.id_token ) {
    id_token = new Token( grantData.id_token );
  }

  var grant = new Grant( {
    access_token: access_token,
    refresh_token: refresh_token,
    id_token: id_token,
    expires_in: grantData.expires_in,
    token_type: grantData.token_type,
  })

  grant.__raw = rawData;

  return this.validateGrant( grant );
}

GrantManager.prototype.validateGrant = function(grant) {
  grant.access_token  = this.validateToken( grant.access_token );
  grant.refresh_token = this.validateToken( grant.refresh_token );
  grant.id_token      = this.validateToken( grant.id_token );

  return grant;
}

GrantManager.prototype.validateToken = function(token) {
  if ( ! token ) {
    return;
  }

  if ( token.isExpired() ) {
    return;
  }

  if ( token.content.issuedAt < this.notBefore ) {
    return;
  }

  var verify = crypto.createVerify('RSA-SHA256');
  verify.update( token.signed );
  if ( ! verify.verify( this.publicKey, token.signature, 'base64' ) ) {
    return;
  }

  return token;
}

module.exports = GrantManager;