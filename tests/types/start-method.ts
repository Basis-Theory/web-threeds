import {
  BasisTheory3ds,
  ThreeDSMethodRequest,
  ThreeDSMethodResponse,
} from '../../dist/types';

const sdk = BasisTheory3ds('public-api-key');
const request: ThreeDSMethodRequest = {
  sessionId: 'existing-session',
  methodUrl: 'https://issuer.example/method',
  methodNotificationUrl: 'https://api.example/notify',
};

const response: Promise<ThreeDSMethodResponse> = sdk.startMethod(request);
void response;

// @ts-expect-error The published method requires both URLs.
sdk.startMethod({ sessionId: 'existing-session' });

sdk.startMethod(request).then((result) => {
  const completed: boolean = result.isCompleted;
  void completed;

  // @ts-expect-error The published result must retain its boolean type.
  const invalid: string = result.isCompleted;
  void invalid;
});
