const { installer: { installAddons, installPackages } } = require ('ember-cli-blueprint-helpers');

module.exports = {
  normalizeEntityName () {
    // no-op since we're just adding dependencies
  },

  afterInstall () {
    return this.addBowerPackagesToProject ([
      {name: 'jsrsasign', target: '^8.0.7'}
    ]).then (() => {
      return installPackages (this, [
        {name: 'ember-browserify'},
        {name: 'micromatch'}
      ])
    }).then (() => {
      return installAddons (this, {
        packages: [
          {name: '@onehilltech/ember-cli-storage', target: '^0.2.1'},
          {name: 'ember-cli-mdc-form'},
          {name: 'ember-cli-mdc-snackbar'},
          {name: 'ember-cli-google-recaptcha', target: '^1.0.0'},
          {name: 'ember-api-actions', target: '^0.1.7'},
          {name: 'ember-browserify', target: '^1.2.2'}
        ]
      })
    });
  }
};
