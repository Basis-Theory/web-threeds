# `web-threeds`

## Overview

The web-threeds package is a JavaScript/TypeScript library designed to simplify the implementation of 3DS (3D Secure) authentication processes in web applications. It provides a streamlined interface for handling both the session creation and challenge steps of the 3DS process.

The web-threeds package exposes two main methods: `createSession` and `startChallenge`. These methods facilitate the initiation and handling of 3DS sessions and challenges.

## Methods

### `createSession`

```typescript
createSession({ pan }: Create3dsSessionRequest): Promise<Create3dsSessionResponse>
```

This method initiates a 3DS session by making a request to the server with the provided PAN (Primary Account Number). It returns a promise that resolves to a Create3dsSessionResponse object containing session details.

### `startChallenge`

```typescript
startChallenge(options: ThreeDSChallengeRequest): Promise<void>
```

This method starts a 3DS challenge by making a request to the ACS (Access Control Server) with the necessary parameters. It handles the challenge process and returns a promise.

## Usage Examples

### Creating a 3DS Session

```typescript
import { BasisTheory3ds } from '3ds-web';

const apiKey = 'your_api_key';
const { createSession } = BasisTheory3ds(apiKey);

const session = await createSession({
  pan: '<BASIS_THEORY_TOKEN_ID>',
});
```

### Start Challenge

```typescript
import { BasisTheory3ds } from '3ds-web';

const apiKey = 'your_api_key';
const { startChallenge } = BasisTheory3ds(apiKey);

await startChallenge({
  sessionId: 'session_id',
  acsTransactionId: 'acs_transaction_id',
  acsChallengeUrl: 'acs_challenge_url',
  threeDSVersion: '2.2.0',
  windowSize: '05', // Optional, defaults to 'THREE'
});
```

## Error Handling

Both `createSession` and `startChallenge` may throw errors that include detailed information about what went wrong.

- **API errors** (from `createSession`) are returned as Error objects with additional properties containing the full error details from the 3DS service
- **Challenge errors** (from `startChallenge`) are returned as standard Error objects with descriptive messages

### Error Structure

```typescript
try {
  const session = await createSession({ tokenId: 'token_id' });
} catch (error) {
  // Error object properties:
  console.log(error.message); // Human-readable error message
  console.log(error.title); // Error title (e.g., "3DS Service Error")
  console.log(error.status); // HTTP status code (e.g., 424)
  console.log(error.detail); // Detailed description

  // Nested error object with additional context (normalized to camelCase):
  if (error.error) {
    console.log(error.error.serviceStatus); // HTTP status from 3DS service (e.g., "403")
    console.log(error.error.sessionId); // Session ID for debugging
    console.log(error.error.errorSource); // Which service failed (e.g., "3DS Server", "ACS")
    console.log(error.error.message); // Detailed error message
    console.log(error.error.detail); // Additional error context
  }
}
```

### Common Error Scenarios

#### 1. 3DS Service Errors (Status 424)

These errors occur when the 3DS service or card issuer returns an error:

```typescript
try {
  const session = await createSession({ tokenId: 'token_id' });
} catch (error) {
  if (error.status === 424) {
    // Handle 3DS service errors
    switch (error.error?.serviceStatus) {
      case '403':
        // Access denied by issuer
        console.log('Merchant configuration issue:', error.error.detail);
        break;
      case '401':
        // Authentication failed
        console.log('Authentication failed:', error.error.message);
        break;
      default:
        console.log('3DS service error:', error.message);
    }
  }
}
```

#### 2. Validation Errors (Status 400)

These errors occur when the request parameters are invalid:

```typescript
try {
  const session = await createSession({ tokenId: 'invalid_token' });
} catch (error) {
  if (error.status === 400) {
    console.log('Validation error:', error.message);
  }
}
```

### Example: Comprehensive Error Handling

```typescript
import { BasisTheory3ds } from '@basis-theory/web-threeds';

const bt3ds = BasisTheory3ds('your_api_key');

try {
  const session = await bt3ds.createSession({ tokenId: 'token_id' });

  // Continue with challenge if needed
  try {
    await bt3ds.startChallenge({
      sessionId: session.id,
      acsTransactionId: 'acs_transaction_id',
      acsChallengeUrl: 'acs_challenge_url',
      threeDSVersion: '2.2.0',
    });
  } catch (challengeError) {
    // Handle challenge-specific errors
    console.error('Challenge error:', challengeError.message);
    if (challengeError.message.includes('Timed out')) {
      showErrorToUser('Challenge timed out. Please try again.');
    } else if (challengeError.message.includes('Invalid challenge request')) {
      showErrorToUser('Invalid challenge configuration.');
    } else {
      showErrorToUser('Challenge failed. Please try again.');
    }
    throw challengeError; // Re-throw to outer catch
  }
} catch (error) {
  // Log full error details for debugging
  console.error('3DS Error:', {
    message: error.message,
    title: error.title,
    status: error.status,
    detail: error.detail,
    error: error.error,
  });

  // Determine action based on error type
  if (error.status === 424 && error.error?.errorSource === '3DS Server') {
    // Merchant configuration issue - contact support
    showErrorToUser(
      'Payment authentication unavailable. Please try a different card.'
    );
  } else if (error.status === 424 && error.error?.errorSource === 'ACS') {
    // Issuer authentication issue
    showErrorToUser('Card authentication failed. Please contact your bank.');
  } else if (error.status === 400) {
    // Validation error
    showErrorToUser('Invalid card information. Please check and try again.');
  } else {
    // Generic error (could be challenge error or session error)
    showErrorToUser('An error occurred. Please try again later.');
  }
}
```

## Configuration Options

### Challenge Request

`challengeContainerOptions` allows you to customize the `id` property of the 3DS challenge container so you can target it and apply styling using CSS. It enables precise positioning of the 3DS challenge interface within your app's layout.

```typescript
const { startChallenge } = BasisTheory3ds(apiKey, {
  challengeConfigurationOptions: {
    id: 'customId',
  },
});
```
