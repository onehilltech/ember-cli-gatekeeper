import { KJUR } from "jsrsasign";

export default class Jwt {
  value = null;

  constructor (value) {
    this.value = value;
  }

  /**
   * Create an access token from a string value.
   *
   * @param str
   */
  static fromString (str) {
    let parsed = KJUR.jws.JWS.parse (str);
    return new Jwt (parsed.payloadObj);
  }
}
