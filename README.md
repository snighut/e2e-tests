# e2e-tests

Playwright checks used for scheduled synthetic activity against nighutlabs.dev.

## Supabase activity test

This project contains a deterministic test that logs in using the app's `/login` form.

Required environment variables:

- `BASE_URL` (example: `https://nighutlabs.dev`)
- `E2E_AUTH_EMAIL`
- `E2E_AUTH_PASSWORD`

For local development, copy `.env.example` to `.env` and fill real values.

Run locally:

```bash
npm install
npx playwright install --with-deps chromium
npm run test:supabase-activity
```

Run visually (headed + slow motion):

```bash
npm run test:watch-login
```

To change the speed, set `PW_SLOWMO` (milliseconds), for example:

```bash
PW_SLOWMO=900 npm run test:supabase-activity -- --headed
```
