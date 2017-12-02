import Ember from 'ember';

const ReCaptcha = Ember.Object.extend ({
  /// Reset the ReCaptcha component
  reset: false,

  /// The verified value of the ReCaptcha.
  value: null,

  /// The ReCaptcha has expired.
  expired: false,

  componentName: Ember.computed ('type', function () {
    let type = this.get ('type');
    return `g-recaptcha-${type}`;
  })
});

export default Ember.Mixin.create ({
  init () {
    this._super (...arguments);

    let ENV = Ember.getOwner (this).resolveRegistration ('config:environment');
    let recaptcha = Ember.get (ENV, 'ember-cli-google.recaptcha');

    if (Ember.isPresent (recaptcha)) {
      let type = Ember.getWithDefault (recaptcha, 'type', 'invisible');
      this.set ('recaptcha', ReCaptcha.create ({type}));
    }
  },

  _resetReCaptcha: Ember.on ('error', function () {
    let recaptcha = this.get ('recaptcha');

    if (Ember.isPresent (recaptcha)) {
      recaptcha.set ('value');
    }
  }),

  _isHuman: Ember.observer ('recaptcha.value', function () {
    let {recaptcha} = this.getProperties (['recaptcha']);
    let {type, value} = recaptcha.getProperties (['type', 'value']);

    if (Ember.isPresent (value) && type === 'invisible') {
      this._doSubmit ();
    }
  }),
});
