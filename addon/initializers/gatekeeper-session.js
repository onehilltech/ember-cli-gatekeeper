export function initialize (application) {
  application.inject ('route', 'session', 'service:session');
  application.inject ('controller', 'session', 'service:session');
  application.inject ('adapter', 'session', 'service:session');
}

export default {
  name: 'gatekeeper-session',
  initialize
};
