# LifeLine - Deployment Guide

This guide covers deploying LifeLine on shared hosting with SSH support.

> **Note:** Deployment can be done **manually** (SSH, documented here)
> or **automatically** via GitLab CI/CD with tags (see section 8).

---

## 1. Prerequisites

- PHP 8.3+
- Composer
- Node.js 20+ (CI uses Node 24)
- pnpm
- MariaDB/MySQL (provided by hosting)
- Apache with mod_rewrite
- SSH access

---

## 2. SSO Authentication

LifeLine uses an external SSO server for authentication
([source code](https://gitlab.com/dowardev/sso)).
You must set up the SSO server first, then configure the app.

### Configure the SSO Server

1. Log into the SSO admin panel
2. Register LifeLine as a new application:
   - **Client ID:** pick a name (e.g. `lifeline`)
   - **Redirect URIs:** `https://app.yourdomain.com/callback`
   - **Client Secret:** auto-generated

### Auth Flow

1. Frontend redirects the user to the SSO login page
2. SSO returns a signed JWT after successful login
3. Backend verifies the JWT via the `dowardev/sso-server` package
4. Protected routes use the `sso.auth` / `sso.user` middleware

---

## 3. Backend Deployment

### 1. Build Backend Assets

The backend has its own Vite build (Laravel Vite) that compiles
`back/resources/` into `back/public/build/`:

```bash
cd back
pnpm install --frozen-lockfile
pnpm exec vite build
```

### 2. Install Dependencies

```bash
cd back
composer install --no-dev --optimize-autoloader
```

> `--no-dev` skips dev packages (tests, linters).
> `--optimize-autoloader` generates an optimized class map
> for better performance.

> **The SSO package comes from Packagist, not from the sibling monorepo.**
> `back/composer.json` depends on `dowardev/sso-server` through a composer
> *path* repository that points to the sibling `sso` monorepo
> (`../../sso/packages/sso-server`). That monorepo is not part of this
> repository, so it does not exist on a server (nor inside the build
> directory the deploy script creates) and composer fails with
> *"Source path ... is not found for package dowardev/sso-server"*.
> The package is published on Packagist, so the deploy resolves it from
> there — the same thing the CI does through
> `scripts/ci/backend-install.sh`. The deploy script runs that helper
> against the build directory, so the working tree is never touched and the
> artifact ships a real copy of the package (a path repository would be
> installed as a symlink, and the symlink would be broken on the server).

### 3. Configure Environment

Create `back/.env` from the example:

```bash
cp .env.example .env
php artisan key:generate
```

> **Automated first-run:** instead of doing this (and steps 4–5) by hand,
> run [`setup.sh`](setup.sh) on the server. `scripts/deploy/deploy.sh` uploads
> it to the
> app root when `SETUP_SCRIPT="setup.sh"` is configured in
> `scripts/deploy/deploy.conf` (it never runs it automatically):
>
> ```bash
> cd <app-root>   # dir containing back/
> LIFELINE_APP_URL=https://api.yourdomain.com ./setup.sh --non-interactive
> ```
>
> Idempotent — safe to re-run after any deploy (previous answers become
> defaults, so re-runs are Enter-through). It configures the full backend
> `.env` (APP_URL, CORS, DB, MAIL, SSO), proves the DB connection, links
> `public/storage`, runs migrations + caches, and ends with health checks.
> All values accept `LIFELINE_*` env-var overrides in `--non-interactive`
> mode (see `./setup.sh --help`). Note that `APP_URL` must be the public
> backend URL: the guest-invitation email logo is a public image served
> from `{APP_URL}/assets/lifeline_v1.png` (the health check fails if it is
> `localhost`/placeholder).

Edit the following variables in `.env`:

<!-- markdownlint-disable MD013 -->
| Variable               | Description              | Example                          |
| ---------------------- | ------------------------ | -------------------------------- |
| `APP_ENV`              | Environment              | `production`                     |
| `APP_DEBUG`            | Debug mode               | `false`                          |
| `APP_URL`              | Backend URL              | `https://api.yourdomain.com`     |
| `DB_HOST`              | MySQL host               | `[provider_host]`                |
| `DB_PORT`              | MySQL port               | `3306`                           |
| `DB_DATABASE`          | Database name            | `[db_name]`                      |
| `DB_USERNAME`          | Database user            | `[db_user]`                      |
| `DB_PASSWORD`          | Database password        | `[db_password]`                  |
| `SESSION_DRIVER`       | Session driver           | `database`                       |
| `CORS_ALLOWED_ORIGINS` | Frontend origins (CORS)  | `https://app.yourdomain.com`     |
| `SSO_URL`              | SSO Server API URL       | `https://auth.yourdomain.com/api`|
| `SSO_JWT_ISSUER`       | JWT issuer               | `https://auth.yourdomain.com`    |
| `SSO_CLIENT_ID`        | Your SSO client ID       | `lifeline`                       |
| `SSO_CLIENT_SECRET`    | Your SSO client secret   | `[your_client_secret]`           |
| `JWKS_CACHE_TTL`       | JWKS cache TTL (seconds) | `3600`                           |
| `MAIL_MAILER`          | Mail driver              | `smtp`                           |
| `MAIL_HOST`            | SMTP server              | `smtp.yourdomain.com`            |
| `MAIL_PORT`            | SMTP port                | `587`                            |
| `MAIL_USERNAME`        | SMTP user                | `[email]`                        |
| `MAIL_PASSWORD`        | SMTP password            | `[password]`                     |
| `MAIL_FROM_ADDRESS`    | Sender email             | `noreply@yourdomain.com`         |
| `QUEUE_CONNECTION`     | Queue driver             | `sync`                           |
<!-- markdownlint-enable MD013 -->

> See [section 2](#2-sso-authentication) to obtain SSO credentials.
>
> **JWT keys:** if your deployment validates JWTs with local RSA keys,
> generate them once with `php artisan jwt:generate-keys` (creates
> `back/keys/`). The test pipeline does the same.

### 4. Upload Files

Upload the `back/` folder to your hosting. Typical path:

- `/home/[user]/lifeline/back/`

### 5. Run Migrations & Cache

```bash
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan storage:link
```

> `--force` disables the interactive prompt.
> Required for automated / CI deployments.

---

## 4. Frontend Deployment

### 1. Configure Environment

Create `front/.env.production` from the example:

```bash
cp .env.production.example .env.production
```

<!-- markdownlint-disable MD013 -->
| Variable                | Description            | Example                          |
| ----------------------- | ---------------------- | -------------------------------- |
| `VITE_API_URL`          | Laravel backend URL    | `https://yourdomain.com/api/v1`  |
| `VITE_SSO_URL`          | SSO Server API URL     | `https://auth.yourdomain.com/api`|
| `VITE_SSO_FRONTEND_URL` | SSO frontend URL       | `https://auth.yourdomain.com`    |
| `VITE_SSO_CLIENT_ID`    | Your SSO client ID     | `lifeline`                       |
<!-- markdownlint-enable MD013 -->

> See [section 2](#2-sso-authentication) to obtain SSO credentials.
>
> The API base path is `/api/v1` (e.g. `https://yourdomain.com/api/v1`).
> The backend must be reachable at that path from the browser.

### 2. Build for Production

```bash
cd front
pnpm install --frozen-lockfile
pnpm exec vite build
```

### 3. Upload Frontend Files

Upload `front/dist/` to the hosting public directory:

- `/home/[user]/public_html/`

---

## 5. Apache Configuration

### .htaccess (SPA fallback)

Make sure `.htaccess` in `public_html/` contains:

```apache
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]
```

**Note:** In shared hosting, configure subdomains (`app.yourdomain.com`, `api.yourdomain.com`) through your hosting panel. The provider sets up the corresponding VirtualHost automatically.

---

## 6. SSL

Enable HTTPS through your hosting control panel
(most providers offer free Let's Encrypt certificates)
or configure your SSL certificate manually.

After enabling SSL, update `.env` files to use `https://`.

---

## 7. Deployment Checklist

- [ ] Backend files uploaded to hosting
- [ ] Backend Vite assets built (`back/public/build/`)
- [ ] Frontend built and uploaded to public directory
- [ ] Database created and migrations executed
- [ ] Environment variables configured for production
- [ ] SSO server set up and credentials obtained
- [ ] SSO URLs updated to production
- [ ] SSL/HTTPS enabled
- [ ] Rewrite rules working (SPA + API)
- [ ] Authentication flow tested
- [ ] Application logs verified

---

## 8. GitLab CI/CD

See `.gitlab-ci.yml` in the project root.

> **Pipelines run only on tags.** MR and branch pipelines never run.
> The tag regex is
> `vX.Y.Z`, `vX.Y.Z-alpha.N`, `vX.Y.Z-beta.N`, `vX.Y.Z-rc.N`, and
> `vX.Y.Z-dryrun.N`.

### Required CI/CD Variables

Configure these in GitLab → Settings → CI/CD → Variables:

<!-- markdownlint-disable MD013 -->
| Variable               | Description              | Example                        |
| ---------------------- | ------------------------ | ------------------------------ |
| `SSH_PRIVATE_KEY`      | Server SSH private key   | `[ssh_private_key]`            |
| `SSH_KNOWN_HOSTS`      | Server SSH known hosts   | `[ssh_known_hosts]`            |
| `SSH_HOST`             | Server host              | `yourdomain.com`               |
| `SSH_PORT`             | SSH port                 | `[ssh_port]`                   |
| `SSH_USER`             | SSH user                 | `your-user`                    |
| `DEPLOY_PATH_BACKEND`  | Backend path on server   | `/home/user/lifeline/back`     |
| `DEPLOY_PATH_FRONTEND` | Frontend path on server  | `/home/user/public_html`       |
<!-- markdownlint-enable MD013 -->

> Mark `SSH_PRIVATE_KEY` and `SSH_KNOWN_HOSTS` as **masked**.

The frontend build reads its `VITE_*` values from `front/.env.production`
during the `frontend_build` job, so commit that file (or a default example)
if the build needs production values.

### Trigger

```bash
git tag -a v1.0.0 -m "Release 1.0.0"
git push origin v1.0.0
```

The pipeline stages run in order: `lint` → `test` → `build` → `deploy` → `rollback`.

### Validate CI without a release (dryrun)

To exercise the pipeline against the real server without releasing, push a
tag with the `-dryrun.N` suffix:

```bash
git tag -a v0.0.0-dryrun.1 -m "dryrun: validate CI changes against server"
git push origin v0.0.0-dryrun.1
# ... watch pipeline, verify behaviour ...
git tag -d v0.0.0-dryrun.1
git push origin :refs/tags/v0.0.0-dryrun.1
```

> ⚠️ `dryrun` tags trigger the **full pipeline including deploy**, so the
> target server receives a build. Only use this to validate CI changes.

---

## 9. Rollback

The pipeline includes two **manual** rollback jobs (GitLab UI → Pipeline →
Run `rollback_backend` / `rollback_frontend`). Each job:

1. Finds the previous release tag (2nd highest `v*` tag)
2. Checks out that tag's `back/` or `front/` sources
3. Rebuilds (frontend only) and deploys the same way as the regular jobs

> Rollback runs migrations with `--force`, so ensure the previous release
> is compatible with the current database schema.

---

## 10. Domain Summary

| Service     | Development (default)      | Production                   |
| ----------- | -------------------------- | ---------------------------- |
| Frontend    | `http://localhost:5173`    | `https://app.yourdomain.com` |
| Backend API | `http://localhost:8004`    | `https://api.yourdomain.com` |
| SSO Server  | `http://localhost:8001`    | `https://auth.yourdomain.com`|
