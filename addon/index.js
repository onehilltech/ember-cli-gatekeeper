import {default as TokenMetadata} from './-lib/token-metadata';

import SignInControllerMixin from './-lib/mixins/sign-in-controller-mixin';
import SignInComponent from './components/gatekeeper-sign-in';

import SignUpControllerMixin from './-lib/mixins/sign-up-controller-mixin';
import SignUpComponent from './components/gatekeeper-sign-up';

import {default as SignInRoute} from './-lib/routes/sign-in';

import {default as AuthenticatedRoute } from './-lib/user/authenticated-route';
import {default as AuthenticatedRouteMixin } from './-lib/mixins/authenticated-route';

import {default as supports} from './-lib/user/capability';

import {default as User} from './-lib/user';


export {
  supports,
  AuthenticatedRoute,
  AuthenticatedRouteMixin,
  User,

  SignInComponent,
  SignUpComponent,

  SignInControllerMixin,
  SignUpControllerMixin,

  SignInRoute,
  TokenMetadata
};
