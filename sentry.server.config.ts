import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: 'https://aa0d7257341b497a64ec3cfed19fe525@o4507140733730816.ingest.de.sentry.io/4507140734189648',
  tracesSampleRate: 1,
  debug: false,
});
