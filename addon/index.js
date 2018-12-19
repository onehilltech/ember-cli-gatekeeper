import { default as SignInController } from './-lib/controllers/sign-in';
import { default as SignInComponent } from './-lib/components/sign-in';
import { default as SignInRoute } from './-lib/routes/sign-in';
import { default as User } from './-lib/user';
import { default as CreateAccountComponent } from './components/gatekeeper-create-account';
import { default as SignInVerticalComponent } from './components/gatekeeper-sign-in-vertical';

export default {
  CreateAccountComponent,
  User,
  SignInComponent,
  SignInVerticalComponent,
  SignInController,
  SignInRoute,
};
