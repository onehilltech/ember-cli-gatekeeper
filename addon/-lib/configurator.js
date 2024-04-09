export default class Configurator {

}

export class DefaultConfigurator extends Configurator {
  constructor (config) {
    super ();

    this.config = config;
  }

  get baseUrl () {
    return this.config.baseUrl;
  }

  get tokenOptions () {
    return this.config.tokenOptions;
  }

  get authenticateUrl () {
    return this.config.authenticateUrl;
  }

  get storageLocation () {
    const { storage = 'local' } = this.config;

    return storage;
  }

  get secretOrPublicKey () {
    return this.config.secret || this.config.publicKey;
  }

  get verifyOptions () {
    return this.config.verifyOptions;
  }

  get publicCert () {
    return this.config.publicCert;
  }
}
