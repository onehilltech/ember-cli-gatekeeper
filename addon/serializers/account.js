import DS from 'ember-data';
import { underscore } from '@ember/string';

export default class AccountSerializer extends DS.RESTSerializer {
  primaryKey = '_id';

  keyForAttribute (key) {
    return underscore (key);
  }

  serializeAttribute (snapshot, json, key, attributes) {
    // Do not serialize any attributes that are null.
    const attrs = snapshot.changedAttributes();
    const changed = attrs[key];

    if (changed && snapshot.attr (key)) {
      super.serializeAttribute (snapshot, json, key, attributes);
    }
  }
}
