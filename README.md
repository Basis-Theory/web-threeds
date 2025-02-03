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
