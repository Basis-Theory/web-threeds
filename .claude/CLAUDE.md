# Web 3DS

Web SDK for 3D Secure authentication — provides client-side 3DS session management and challenge handling.

## Development Workflow

```bash
yarn install
yarn build            # Build (generates types, bundles with Parcel)
yarn watch            # Watch mode for development
```

## Testing

```bash
yarn lint             # ESLint
yarn lint:fix         # Auto-fix
yarn test             # Unit tests (Jest)
npx jest --testPathPattern="<pattern>"   # Targeted test
yarn test:coverage    # Tests with coverage
```

## Feedback Loops

Use `yarn watch` for live rebuilds + `npx jest --testPathPattern="<pattern>"` for targeted tests.

When a failing test is discovered, always verify it passes using the appropriate feedback loop before considering the fix complete.

## Standards & Conventions

- TypeScript, Parcel for bundling, Jest for testing
- `yarn` for package management
- Type generation via `tsc --emitDeclarationOnly`

## Links

- [3DS docs](https://developers.basistheory.com/docs/features/3d-secure/)
