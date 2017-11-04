module.exports = {
  normalizeEntityName() {}, // no-op since we're just adding dependencies

  afterInstall () {
    return this.addAddonsToProject ({
      packages: [
        {name: '@onehilltech/ember-cli-storage', target: '^0.2.1'},
        {name: 'ember-cli-mdl', target: '^0.14.0'},
        {name: 'ember-cli-google', target: '^0.4.2'},
        {name: 'ember-api-actions', target: '^0.1.7'},
      ]
    });
  }
};
