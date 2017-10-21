export function initialize (application) {
  application.inject ('route', 'gatekeeper', 'service:gatekeeper');
  application.inject ('controller', 'gatekeeper', 'service:gatekeeper');
}

export default {
  name: 'gatekeeper',
  initialize
};
