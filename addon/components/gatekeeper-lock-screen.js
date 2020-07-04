import Component from '@ember/component';
import layout from '../templates/components/gatekeeper-lock-screen';

export default Component.extend({
  layout,

  classNames: ['gatekeeper-lock-screen'],
  classNameBindings: ['hidden:gatekeeper-lock-screen--hidden']
});
