export function initialize (application) {
  if (!!application.inject) {
    application.inject ('route', 'session', 'service:session');
    application.inject ('controller', 'session', 'service:session');
    application.inject ('adapter', 'session', 'service:session');
  }
}

export default {
  name: 'gatekeeper-session',
  initialize
};
