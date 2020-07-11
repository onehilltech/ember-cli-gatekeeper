import { get, getWithDefault } from '@ember/object';
import { getOwner } from '@ember/application';

import { Mixin as M } from 'base-object';

const UnauthenticatedMixin = M.create ({
  beforeModel () {
    this._super (...arguments);
    this._checkNotSignedIn ();
  },

  _checkNotSignedIn () {
    let isSignedIn = get (this, 'session.isSignedIn');

    if (isSignedIn) {
      let ENV = getOwner (this).resolveRegistration ('config:environment');
      let signInRoute = getWithDefault (ENV, 'gatekeeper.startRoute', 'index');

      this.replaceWith (signInRoute);
    }
  },
});

function applyMixin (Clazz) {
  return UnauthenticatedMixin.apply (Clazz.prototype);
}

export default function unauthenticated (param) {
  return applyMixin (param);
}