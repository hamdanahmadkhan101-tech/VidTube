# Vercel Speed Insights

## Status

Speed Insights is integrated in the frontend entrypoint.

Confirmed in `vidtube-frontend/src/main.tsx`:

- `SpeedInsights` import from `@vercel/speed-insights/react`
- `<SpeedInsights />` mounted in the app root tree

## Package

Installed dependency:

- `@vercel/speed-insights`

## What It Provides

- Real-user performance telemetry from production traffic
- Core Web Vitals trends in Vercel dashboard
- Low-friction instrumentation without custom client metrics code

## Where to View Metrics

1. Deploy frontend to Vercel
2. Open Vercel project dashboard
3. Navigate to Speed Insights tab

## Operational Notes

- Data appears only after production traffic is received
- Local development does not represent real-user metrics
- Keep analysis focused on trend movement over single-run variance

## Recommended KPI Targets

- LCP < 2.5s
- INP < 200ms
- CLS < 0.1
- FCP < 1.8s
- TTFB < 800ms

## Build Verification

```bash
cd vidtube-frontend
npm run build
npm run preview
```

If build and preview pass, instrumentation is ready for production deployment.
