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

var path = require('path');
var fs   = require('fs');

function Config(config) {
  if ( ! config ) {
    config = path.join( process.cwd(), 'keycloak.json' );
  }

  if ( typeof config == 'string' ) {
    this.loadConfiguration( config );
  } else {
    this.configure( config );
  }
}

Config.prototype.loadConfiguration = function(configPath) {
  var json = fs.readFileSync( configPath );
  var config = JSON.parse( json.toString() );
  this.configure( config );
};

Config.prototype.configure = function(config) {
  this.authServerUrl  = config['auth-server-url']            || config.authServerUrl;
  this.realm          = config['realm']                      || config.realm;
  this.clientId       = config['resource']                   || config.clientId;
  this.secret         = (config['credentials'] || {}).secret || config.secret;
  this.public         = config['public-client'] || config.public || false;

  this.realmUrl      = this.authServerUrl + '/realms/' + this.realm;
  this.realmAdminUrl = this.authServerUrl + '/admin/realms/' + this.realm;
};

module.exports = Config;