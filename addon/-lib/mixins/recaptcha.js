import { on } from '@ember/object/evented';
import { isPresent } from '@ember/utils';
import { getOwner } from '@ember/application';
import Mixin from '@ember/object/mixin';
import EmberObject, {
  computed,
  get,
  getWithDefault,
  observer
} from '@ember/object';

const ReCaptcha = EmberObject.extend ({
  /// Reset the ReCaptcha component
  reset: false,

  /// The verified value of the ReCaptcha.
  value: null,

  /// The ReCaptcha has expired.
  expired: false,

  componentName: computed ('type', function () {
    let type = this.get ('type');
    return `g-recaptcha-${type}`;
  })
});

export default Mixin.create ({
  init () {
    this._super (...arguments);

    let ENV = getOwner (this).resolveRegistration ('config:environment');
    let recaptcha = get (ENV, 'ember-cli-google.recaptcha');

    if (isPresent (recaptcha)) {
      let type = getWithDefault (recaptcha, 'type', 'invisible');
      this.set ('recaptcha', ReCaptcha.create ({type}));
    }
  },

  _resetReCaptcha: on ('error', function () {
    let recaptcha = this.get ('recaptcha');

    if (isPresent (recaptcha)) {
      recaptcha.set ('value');
    }
  }),

  _isHuman: observer ('recaptcha.value', function () {
    let {recaptcha} = this.getProperties (['recaptcha']);
    let {type, value} = recaptcha.getProperties (['type', 'value']);

    if (isPresent (value) && type === 'invisible') {
      this._doSubmit ();
    }
  }),
});
