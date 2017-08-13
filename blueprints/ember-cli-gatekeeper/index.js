// blueprints/ember-cli-gatekeeper/index.js

module.exports = {
  normalizeEntityName() {}, // no-op since we're just adding dependencies

  afterInstall () {
    return this.addAddonsToProject ({
      packages: [
        {name: '@onehilltech/ember-cli-materializecss', target: '^0.4.3'},
      ]
    });
  }
};