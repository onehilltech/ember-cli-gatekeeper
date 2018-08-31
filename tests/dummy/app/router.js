import config from './config/environment';
import EmberRouter from '@ember/routing/router';

const Router = EmberRouter.extend({
  location: config.locationType,
  rootURL: config.rootURL
});

Router.map(function() {
  this.route('index', {path: '/'});
  this.route('unauthorized');
  this.route('sign-up');
  this.route('sign-in', function() {
    this.route('standard');
    this.route('recaptcha-v2');
  });
});

export default Router;
