import Response from 'ember-cli-mirage/response';

const TOKENS = [
  {token_type: 'Bearer', access_token: '1234567890', refresh_token: '0987654321'},
  {token_type: 'Bearer', access_token: 'abcdefghij', refresh_token: 'jihgfedcba'},
  {token_type: 'Bearer', access_token: '!@#$%^&*()'}
];

export default function() {
  this.urlPrefix = 'http://gatekeeper';
  this.namespace = '/v1';

  function doAuthenticatedRequest (req, accessToken, f) {
    let authorization = req.requestHeaders['Authorization'];

    if (!authorization) {
      return new Response (403, {'Content-Type': 'application/json'}, {
        errors: {
          status: 403,
          message: 'Missing Authorization HTTP header'
        }
      });
    }

    let parts = authorization.split (' ');

    if (parts.length !== 2) {
      return new Response (403, {'Content-Type': 'application/json'}, {
        errors: {
          status: 403,
          message: 'Invalid HTTP Authorization header'
        }
      });
    }
    else if (parts[0] !== 'Bearer') {
      return new Response (403, {'Content-Type': 'application/json'}, {
        errors: {
          status: 403,
          message: 'Missing Bearer strategy'
        }
      });
    }
    else if (parts[1] !== accessToken) {
      return new Response (403, {'Content-Type': 'application/json'}, {
        errors: {
          status: 403,
          message: 'Invalid access token'
        }
      });
    }
    else {
      return f (req);
    }
  }

  this.post ('/oauth2/token', (schema, req) => {
    let body = JSON.parse (req.requestBody);

    if (body.client_id !== 'dummy') {
      return new Response (400, {'Content-Type': 'application/json'}, {
        errors: {code: 'invalid_client', message: 'Your client id is not valid.'}
      });
    }

    if (body.grant_type === 'password') {
      // working with token.0

      if (body.username !== 'username') {
        return new Response (400, {'Content-Type': 'application/json'}, {
          errors: {code: 'invalid_username', message: 'Your username is incorrect.'}
        });
      }
      else if (body.password !== 'password') {
        return new Response (400, {'Content-Type': 'application/json'}, {
          errors: {code: 'invalid_password', message: 'Your password is incorrect.'}
        });
      }
      else {
        return TOKENS[0];
      }
    }
    else if (body.grant_type === 'refresh_token') {
      // working with token.1

      if (body.refresh_token !== TOKENS[0].refresh_token) {
        return new Response (400, {'Content-Type': 'application/json'}, {
          errors: {status: 400, message: 'Missing/invalid refresh token'}
        });
      }
      else {
        return TOKENS[1];
      }
    }
    else if (body.grant_type === 'client_credentials') {
      if (body.client_secret !== 'ssshhh') {
        return new Response (400, {'Content-Type': 'application/json'}, {
          errors: {status: 400, message: 'Missing/invalid client secret'}
        });
      }
      else {
        return TOKENS[2];
      }
    }
    else {
      return new Response (400, {'Content-Type': 'application/json'}, {
        errors: {status: 400, message: `Unsupported grant type: ${body.grant_type}`}
      });
    }
  });

  this.post ('/oauth2/logout', function (schema, req) {
    return doAuthenticatedRequest (req, TOKENS[0].access_token, () => {
      return new Response (200, {'Content-Type': 'application/json'}, true);
    });
  });

  this.post ('/accounts', function (schema, req) {
    return doAuthenticatedRequest (req, TOKENS[2].access_token, () => {
      let body = JSON.parse (req.requestBody);

      if (body.account.username === 'username' &&
          body.account.password === 'password' &&
          body.account.email === 'email')
      {
        return {
          account: {
            _id: 1,
            username: 'username',
            password: 'password',
            email: 'email'
          }
        }
      }
      else {
        return new Response (500, {'Content-Type': 'application/json'}, {
          errors: {status: 500, message: 'Internal Server Error'}
        });
      }
    });
  });

  this.get ('/accounts/me', function (schema, req) {
    return doAuthenticatedRequest (req, TOKENS[0].access_token, () => {
      return {
        account: {
          _id: 1,
          email: 'tester@no-reply.com',
          username: 'tester'
        }
      }
    });
  });
}
