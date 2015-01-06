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

var Form = require('./form');
var Token = require('./token');

var Q = require('q');

var http = require('http');
var URL  = require('url');

function Grant(grant) {
  this.update( grant );
}

Grant.prototype.update = function(grant) {
  // intentional naming with under_scores instead of
  // CamelCase to match both Keycloak's grant JSON
  // and to allow new Grant(new Grant(kc)) copy-ctor

  this.access_token  = grant.access_token;
  this.refresh_token = grant.refresh_token;
  this.id_token      = grant.id_token;

  this.token_type    = grant.token_type;
  this.expires_in    = grant.expires_in;
};

Grant.prototype.toString = function() {
  return this.__raw;
}

Grant.prototype.isExpired = function() {
  if ( ! this.access_token ) {
    return true;
  }
  return this.access_token.isExpired();
}

module.exports = Grant;