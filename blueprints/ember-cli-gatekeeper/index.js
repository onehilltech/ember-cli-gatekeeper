module.exports = {
  normalizeEntityName() {}, // no-op since we're just adding dependencies

  afterInstall () {
    return this.addAddonsToProject ({
      packages: [
        {name: '@onehilltech/ember-cli-storage', target: '^0.2.1'},
        {name: 'ember-cli-mdl', target: '^0.21.1'},
        {name: 'ember-cli-google-recaptcha', target: '^1.0.0'},
        {name: 'ember-api-actions', target: '^0.1.7'},
        {name: 'ember-browserify', target: '^1.2.2'}
      ]
    }).then (() => {
      // Add npm packages to package.json
      return this.addPackagesToProject([
        {name: 'ember-browserify'},
        {name: 'micromatch'}
      ]);
    }).then (() => {
      return this.addBowerPackagesToProject ([
        {name: 'jsrsasign', target: '^8.0.7'}
      ]);
    });
  }
};
