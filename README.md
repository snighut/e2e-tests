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

## Collaboration journey suite

This suite validates realistic end-to-end flows against the live app:

- Projects loading, count visibility, and project navigation.
- Title edit persistence in project listing with automatic revert.
- Save behavior for existing and new designs, with cleanup (revert/delete).

The suite automatically selects the first project from `/mydesigns` for existing-design journeys.

Run it with:

```bash
npm run test:collab-journeys
```

Run it visually:

```bash
npm run test:watch-collab-journeys
```

To change the speed, set `PW_SLOWMO` (milliseconds), for example:

```bash
PW_SLOWMO=900 npm run test:supabase-activity -- --headed
```

## Trigger one-off run in Kubernetes

After you push changes to this repository, you can manually trigger the CronJob clone/run path from this directory.

```bash
npm run k8s:trigger-supabase-activity
```

Follow logs of the latest job:

```bash
npm run k8s:logs-latest-job
```

Prerequisites:

- `kubectl` is installed
- current context points to your production cluster
- Flux has already applied the `supabase-activity-playwright` CronJob
