import config from './config/environment';
import EmberRouter from '@ember/routing/router';

const Router = EmberRouter.extend({
  location: config.locationType,
  rootURL: config.rootURL
});

Router.map(function() {
  this.route('index', {path: '/'});
  this.route('unauthorized');
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
  });
});

export default Router;
