export default function override (target, name, override) {
  const orig = target[name];

  target[name] = function () {
    // Replace the current _super method with the one for this message.
    let _super = this._super;
    this._super = orig;

    // Call the overridden method.
    override.call (this, ...arguments);

    // Restore the original super method.
    this._super = _super;
  }
}
