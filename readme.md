# LifeLine

Personal life-management app (calendar, tasks, documents, notes). Monorepo:

- `back/` — Laravel 13 API (PHP 8.3), SSO auth, guest-invitation emails
- `front/` — Ionic 8 + Vue 3 + Capacitor 6 (offline-first, PWA)

## Development

```bash
cd back && php artisan serve     # API
cd front && pnpm run dev         # Web app
```

## Deployment

See [DEPLOY.md](DEPLOY.md). First-run on a fresh server is automated by
[`setup.sh`](setup.sh) (uploaded by `scripts/deploy/deploy.sh`, never run automatically):

```bash
cd <app-root>                                      # dir containing back/
LIFELINE_APP_URL=https://api.yourdomain.com ./setup.sh --non-interactive
```

It walks through the backend setup — `back/.env` from the production
example (APP_URL, CORS, DB, MAIL, SSO — re-runs keep previous answers as
defaults), `APP_KEY`, DB connectivity check, `storage:link`, permissions,
migrations and caches — ending with a health-check summary (it fails if
`APP_URL` is not a public https URL, because the invitation-email logo is
served from `{APP_URL}/assets/lifeline_v1.png`). All values can also be
passed via `LIFELINE_*` env vars with `--non-interactive`
(see `./setup.sh --help`). Idempotent: safe to re-run.
