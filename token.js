function Token(token) {

  this.token = token;

  if ( token ) {
    try {
      var parts = token.split('.');
      this.header = JSON.parse( new Buffer( parts[0], 'base64' ).toString() );
      this.content = JSON.parse( new Buffer( parts[1], 'base64' ).toString() );
      this.signature = new Buffer( parts[2], 'base64' );
      this.signed = parts[0] + '.' + parts[1];
    } catch (err) {
      this.content = {
        expiresAt: 0
      }
    }
  }
}

Token.prototype.isExpired = function() {
  if ( ( this.content.exp * 1000 ) < Date.now() ) {
    return true;
  }
}

module.exports = Token
