import config from './config/environment';
import EmberRouter from '@ember/routing/router';

export default class Router extends EmberRouter {
  location = config.locationType;
  rootURL = config.rootURL;
}

Router.map(function() {
  this.route('unauthorized');
  this.route('authenticated', { path: '/'});

  this.route('sign-up', function() {
    this.route('standard');
    this.route('recaptcha-invisible');
    this.route('recaptcha-v2');
  });
  this.route('sign-in', function() {
    this.route('standard');
    this.route('recaptcha-v2');
    this.route('recaptcha-invisible');
    this.route('custom');
    this.route('custom-recaptcha');
  });
});
