import Route from '@ember/routing/route';
import Authenticated from 'ember-cli-gatekeeper/mixins/authenticated';

export default Route.extend (Authenticated, {
  model () {
    return this.get ('store').findAll ('dummy');
  }
});
