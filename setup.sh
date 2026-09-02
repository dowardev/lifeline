#!/usr/bin/env bash
# LifeLine — server first-run setup script.
#
# Uploaded to the server app root by scripts/deploy.sh (SETUP_SCRIPT in
# scripts/deploy.conf). The deploy pipeline NEVER runs it automatically:
# run it once per server after the first deploy, from the app root
# (the directory containing back/ and front/):
#
#   cd <app-root> && ./setup.sh                 # interactive
#   cd <app-root> && ./setup.sh --non-interactive
#
# Non-interactive mode reads overrides from LIFELINE_* env vars, e.g.:
#   LIFELINE_APP_URL=https://api.yourdomain.com \
#   LIFELINE_DB_HOST=... LIFELINE_DB_DATABASE=... \
#   LIFELINE_DB_USERNAME=... LIFELINE_DB_PASSWORD=... \
#   LIFELINE_MAIL_HOST=... LIFELINE_MAIL_USERNAME=... LIFELINE_MAIL_PASSWORD=... \
#   LIFELINE_SSO_URL=... LIFELINE_SSO_JWT_ISSUER=... LIFELINE_SSO_CLIENT_SECRET=... \
#   ./setup.sh --non-interactive
#
# Why APP_URL matters: the guest-invitation email logo is a public image
# served from {APP_URL}/assets/lifeline_v1.png — a wrong/localhost APP_URL
# means broken images in every invitation email.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACK_DIR="$SCRIPT_DIR/back"
BACKUP_KEEP=5
CURRENT_STEP=0

DEV_MODE=false
NON_INTERACTIVE=false
NO_BACKUP=false
HEALTH_OK=true
HEALTH_RESULTS=()

color()     { printf '\033[3%sm%s\033[0m' "$1" "$2"; }
log_ok()    { echo "  $(color 2 '[OK]')  $1"; }
log_info()  { echo "  $(color 6 '[..]')  $1"; }
log_warn()  { echo "  $(color 3 '[!]')   $1"; }
log_error() { echo "  $(color 1 '[ER]')  $1"; }

confirm() {
    local prompt="$1" default="${2:-N}"
    if [ "$NON_INTERACTIVE" = true ]; then
        [[ "$default" =~ ^[Yy]$ ]]
        return $?
    fi
    local yn
    if [[ "$default" =~ ^[Yy]$ ]]; then
        printf '%s [Y/n]: ' "$prompt" >&2; read -r yn || true; yn="${yn:-Y}"
    else
        printf '%s [y/N]: ' "$prompt" >&2; read -r yn || true; yn="${yn:-N}"
    fi
    [[ "$yn" =~ ^[Yy]$ ]]
}

ask() {
    local prompt="$1" default="$2"
    if [ "$NON_INTERACTIVE" = true ]; then
        echo "$default"
        return 0
    fi
    local val
    printf '%s [%s]: ' "$prompt" "$default" >&2
    read -r val || true
    echo "${val:-$default}"
}

ask_secret() {
    local prompt="$1" default="$2"
    if [ "$NON_INTERACTIVE" = true ]; then
        echo "$default"
        return 0
    fi
    local val
    printf '%s: ' "$prompt" >&2
    read -s -r val || true
    echo >&2
    echo "${val:-$default}"
}

get_env_default() {
    local key="$1" file="$2"
    grep -E "^${key}=" "$file" 2>/dev/null | cut -d= -f2- || true
}

unquote_env_val() {
    local val="$1"
    if [[ "$val" == \"*\" ]] && [ "${#val}" -ge 2 ]; then
        val="${val:1:${#val}-2}"
        val="$(printf '%s' "$val" | sed 's/\\\\/\\/g; s/\\"/"/g')"
    fi
    printf '%s' "$val"
}

require_cmd() {
    local bin="$1" hint="${2:-}"
    if ! command -v "$bin" >/dev/null 2>&1; then
        log_error "Required command not found: $bin"
        [ -n "$hint" ] && log_error "Hint: $hint"
        exit 2
    fi
}

backup_file() {
    local path="$1"
    [ "$NO_BACKUP" = true ] && return 0
    [ ! -f "$path" ] && return 0
    local ts
    ts="$(date +%Y%m%d_%H%M%S)"
    cp "$path" "${path}.bak.${ts}"
    local backups=()
    local f
    for f in "${path}.bak".*; do
        [ -f "$f" ] && backups+=("$f")
    done
    local count=${#backups[@]}
    if [ "$count" -gt "$BACKUP_KEEP" ]; then
        for f in $(printf '%s\n' "${backups[@]}" | sort | head -n $((count - BACKUP_KEEP))); do
            rm -f "$f"
        done
    fi
}

sed_set() {
    local file="$1" key="$2" val="$3"
    local escaped_val="$val" needs_quoting=false
    if [[ "$val" =~ [[:space:]#\"\'] ]] || [ -z "$val" ]; then
        needs_quoting=true
        escaped_val="${escaped_val//\"/\\\"}"
    fi
    escaped_val="${escaped_val//\\/\\\\}"
    escaped_val="${escaped_val//&/\\&}"
    escaped_val="${escaped_val//|/\\|}"
    if [ "$needs_quoting" = true ]; then
        escaped_val="\"${escaped_val}\""
    fi
    if grep -qE "^\s*${key}=" "$file" 2>/dev/null; then
        sed -i "s|^[[:space:]]*${key}=.*|${key}=${escaped_val}|" "$file"
    else
        echo "${key}=${escaped_val}" >> "$file"
    fi
}

normalize_url() {
    local value="$1"
    value="${value#"${value%%[![:space:]]*}"}"
    value="${value%"${value##*[![:space:]]}"}"
    if [ -z "$value" ]; then
        return 1
    fi
    if [[ ! "$value" =~ ^https?:// ]]; then
        value="https://$value"
    fi
    echo "$value"
}

usage() {
    cat <<EOF
Usage: $0 [OPTIONS]

LifeLine server first-run setup (Laravel backend).

Options:
  --dev               Use .env.development.example instead of the production one
  --non-interactive   Non-interactive mode (reads LIFELINE_* env vars)
  --no-backup         Skip backups of existing config files
  --help              Show this help and exit

Overrides read from env (non-interactive): LIFELINE_APP_URL,
LIFELINE_CORS_ALLOWED_ORIGINS, LIFELINE_DB_HOST, LIFELINE_DB_PORT,
LIFELINE_DB_DATABASE, LIFELINE_DB_USERNAME, LIFELINE_DB_PASSWORD,
LIFELINE_MAIL_HOST, LIFELINE_MAIL_PORT, LIFELINE_MAIL_USERNAME,
LIFELINE_MAIL_PASSWORD, LIFELINE_MAIL_FROM_ADDRESS,
LIFELINE_SSO_URL, LIFELINE_SSO_JWT_ISSUER, LIFELINE_SSO_CLIENT_ID,
LIFELINE_SSO_CLIENT_SECRET

Exit codes: 0 ok · 2 missing prerequisite · 3 missing env var ·
4 DB check failed / no TTY · 5 artisan step failed · 6 missing files
EOF
    exit "${1:-0}"
}

while [ $# -gt 0 ]; do
    case "$1" in
        --dev) DEV_MODE=true; shift ;;
        --non-interactive) NON_INTERACTIVE=true; shift ;;
        --no-backup) NO_BACKUP=true; shift ;;
        --help) usage ;;
        *) log_error "Unknown option: $1"; usage 2 ;;
    esac
done

error_handler() {
    local exit_code=$?
    log_error "Error on line $1 (exit code: $exit_code)"
    exit "$exit_code"
}
trap 'error_handler $LINENO' ERR

banner() {
    echo ""
    echo "  +------------------------------------------+"
    echo "  |   LifeLine — Server Setup                |"
    echo "  +------------------------------------------+"
    echo ""
}

check_prereqs() {
    CURRENT_STEP=$((CURRENT_STEP + 1))
    log_info "Step $CURRENT_STEP: Checking prerequisites..."

    require_cmd php "Install PHP 8.3+"
    require_cmd composer "Install Composer (https://getcomposer.org)"

    local php_ver
    php_ver="$(php -v | head -1 | sed -E 's/^PHP[[:space:]]+//; s/[[:space:]].*//')"
    if printf '%s\n%s\n' "$php_ver" "8.3.0" | sort -V | head -1 | grep -qF "8.3.0"; then
        log_ok "PHP $php_ver"
    elif [ -n "$php_ver" ]; then
        log_error "PHP 8.3+ required, found $php_ver"
        exit 2
    fi

    log_ok "Prerequisites met"
}

configure_backend() {
    CURRENT_STEP=$((CURRENT_STEP + 1))
    log_info "Step $CURRENT_STEP: Configuring backend .env..."

    cd "$BACK_DIR"

    local example_file
    if [ "$DEV_MODE" = true ]; then
        example_file=".env.development.example"
    else
        example_file=".env.production.example"
    fi
    if [ ! -f "$example_file" ]; then
        log_warn "Backend example not found: $example_file — falling back to .env.example"
        example_file=".env.example"
    fi
    if [ ! -f "$example_file" ]; then
        log_error "No backend env example found (tried production/development/.env.example)"
        exit 6
    fi

    # Preserve existing values so a re-run keeps them as defaults.
    local prev_app_url="" prev_cors=""
    local prev_db_host="" prev_db_port="" prev_db_database="" prev_db_username="" prev_db_password=""
    local prev_mail_host="" prev_mail_port="" prev_mail_username="" prev_mail_password="" prev_mail_from=""
    local prev_sso_url="" prev_sso_issuer="" prev_sso_client_id="" prev_sso_client_secret=""
    if [ -f ".env" ]; then
        prev_app_url="$(unquote_env_val "$(get_env_default APP_URL .env)")"
        prev_cors="$(unquote_env_val "$(get_env_default CORS_ALLOWED_ORIGINS .env)")"
        prev_db_host="$(unquote_env_val "$(get_env_default DB_HOST .env)")"
        prev_db_port="$(unquote_env_val "$(get_env_default DB_PORT .env)")"
        prev_db_database="$(unquote_env_val "$(get_env_default DB_DATABASE .env)")"
        prev_db_username="$(unquote_env_val "$(get_env_default DB_USERNAME .env)")"
        prev_db_password="$(unquote_env_val "$(get_env_default DB_PASSWORD .env)")"
        prev_mail_host="$(unquote_env_val "$(get_env_default MAIL_HOST .env)")"
        prev_mail_port="$(unquote_env_val "$(get_env_default MAIL_PORT .env)")"
        prev_mail_username="$(unquote_env_val "$(get_env_default MAIL_USERNAME .env)")"
        prev_mail_password="$(unquote_env_val "$(get_env_default MAIL_PASSWORD .env)")"
        prev_mail_from="$(unquote_env_val "$(get_env_default MAIL_FROM_ADDRESS .env)")"
        prev_sso_url="$(unquote_env_val "$(get_env_default SSO_URL .env)")"
        prev_sso_issuer="$(unquote_env_val "$(get_env_default SSO_JWT_ISSUER .env)")"
        prev_sso_client_id="$(unquote_env_val "$(get_env_default SSO_CLIENT_ID .env)")"
        prev_sso_client_secret="$(unquote_env_val "$(get_env_default SSO_CLIENT_SECRET .env)")"
    fi

    if [ "$NON_INTERACTIVE" = true ]; then
        # Require the LIFELINE_DB_* overrides (or values already persisted in a
        # previous run's .env). Must run BEFORE the example copy below:
        # otherwise the defaults baked into the example file would shadow the
        # real check and deploy with 127.0.0.1 placeholders.
        local missing=false
        local var
        for var in LIFELINE_DB_HOST LIFELINE_DB_DATABASE LIFELINE_DB_USERNAME; do
            local key="${var#LIFELINE_}"
            local prev_key="prev_$(echo "$key" | tr 'A-Z' 'a-z')"
            if [ -z "${!var:-}" ] && [ -z "${!prev_key:-}" ]; then
                log_error "Missing required env var: $var (and no previous value in .env)"
                missing=true
            fi
        done
        [ "$missing" = true ] && exit 3
    fi

    backup_file ".env"
    if [ ! -f ".env" ]; then
        cp "$example_file" ".env"
    fi

    local app_url cors
    local db_host db_port db_database db_username db_password
    local mail_host mail_port mail_username mail_password mail_from
    local sso_url sso_issuer sso_client_id sso_client_secret

    if [ "$NON_INTERACTIVE" = true ]; then
        app_url="$(normalize_url "${LIFELINE_APP_URL:-$prev_app_url}" || true)"
        cors="${LIFELINE_CORS_ALLOWED_ORIGINS:-$prev_cors}"
        db_host="${LIFELINE_DB_HOST:-$prev_db_host}"
        db_port="${LIFELINE_DB_PORT:-${prev_db_port:-3306}}"
        db_database="${LIFELINE_DB_DATABASE:-$prev_db_database}"
        db_username="${LIFELINE_DB_USERNAME:-$prev_db_username}"
        db_password="${LIFELINE_DB_PASSWORD:-$prev_db_password}"
        mail_host="${LIFELINE_MAIL_HOST:-$prev_mail_host}"
        mail_port="${LIFELINE_MAIL_PORT:-${prev_mail_port:-587}}"
        mail_username="${LIFELINE_MAIL_USERNAME:-$prev_mail_username}"
        mail_password="${LIFELINE_MAIL_PASSWORD:-$prev_mail_password}"
        mail_from="${LIFELINE_MAIL_FROM_ADDRESS:-$prev_mail_from}"
        sso_url="${LIFELINE_SSO_URL:-$prev_sso_url}"
        sso_issuer="${LIFELINE_SSO_JWT_ISSUER:-$prev_sso_issuer}"
        sso_client_id="${LIFELINE_SSO_CLIENT_ID:-${prev_sso_client_id:-lifeline}}"
        sso_client_secret="${LIFELINE_SSO_CLIENT_SECRET:-$prev_sso_client_secret}"
    else
        while :; do
            app_url="$(ask "APP_URL (public backend URL — powers the email logo at {APP_URL}/assets)" "${prev_app_url:-https://api.yourdomain.com}")"
            app_url="$(normalize_url "$app_url")" && break
            log_error "URL cannot be empty"
        done
        sed_set ".env" "APP_URL" "$app_url"

        cors="$(ask "CORS_ALLOWED_ORIGINS (frontend origin)" "${prev_cors:-https://app.yourdomain.com}")"
        sed_set ".env" "CORS_ALLOWED_ORIGINS" "$cors"

        db_host="$(ask "DB host" "${prev_db_host:-127.0.0.1}")"
        db_port="$(ask "DB port" "${prev_db_port:-3306}")"
        db_database="$(ask "DB database" "${prev_db_database:-lifeline}")"
        db_username="$(ask "DB username" "${prev_db_username:-root}")"
        db_password="$(ask_secret "DB password" "$prev_db_password")"
        sed_set ".env" "DB_HOST" "$db_host"
        sed_set ".env" "DB_PORT" "$db_port"
        sed_set ".env" "DB_DATABASE" "$db_database"
        sed_set ".env" "DB_USERNAME" "$db_username"
        sed_set ".env" "DB_PASSWORD" "$db_password"

        mail_host="$(ask "MAIL_HOST" "${prev_mail_host:-}")"
        mail_port="$(ask "MAIL_PORT" "${prev_mail_port:-587}")"
        mail_username="$(ask "MAIL_USERNAME" "${prev_mail_username:-}")"
        mail_password="$(ask_secret "MAIL_PASSWORD" "$prev_mail_password")"
        mail_from="$(ask "MAIL_FROM_ADDRESS" "${prev_mail_from:-noreply@$(echo "${app_url:-localhost}" | sed -E 's|^https?://([^/]+).*|\1|')}")"
        sed_set ".env" "MAIL_HOST" "$mail_host"
        sed_set ".env" "MAIL_PORT" "$mail_port"
        sed_set ".env" "MAIL_USERNAME" "$mail_username"
        sed_set ".env" "MAIL_PASSWORD" "$mail_password"
        sed_set ".env" "MAIL_FROM_ADDRESS" "$mail_from"

        sso_url="$(ask "SSO_URL (SSO server API)" "${prev_sso_url:-https://auth.yourdomain.com/api}")"
        sso_issuer="$(ask "SSO_JWT_ISSUER" "${prev_sso_issuer:-https://auth.yourdomain.com}")"
        sso_client_id="$(ask "SSO_CLIENT_ID" "${prev_sso_client_id:-lifeline}")"
        sso_client_secret="$(ask_secret "SSO_CLIENT_SECRET" "$prev_sso_client_secret")"
        sed_set ".env" "SSO_URL" "$sso_url"
        sed_set ".env" "SSO_JWT_ISSUER" "$sso_issuer"
        sed_set ".env" "SSO_CLIENT_ID" "$sso_client_id"
        sed_set ".env" "SSO_CLIENT_SECRET" "$sso_client_secret"
    fi

    sed_set ".env" "APP_URL" "$app_url"
    sed_set ".env" "CORS_ALLOWED_ORIGINS" "$cors"
    sed_set ".env" "DB_HOST" "$db_host"
    sed_set ".env" "DB_PORT" "$db_port"
    sed_set ".env" "DB_DATABASE" "$db_database"
    sed_set ".env" "DB_USERNAME" "$db_username"
    sed_set ".env" "DB_PASSWORD" "$db_password"
    sed_set ".env" "MAIL_HOST" "$mail_host"
    sed_set ".env" "MAIL_PORT" "$mail_port"
    sed_set ".env" "MAIL_USERNAME" "$mail_username"
    sed_set ".env" "MAIL_PASSWORD" "$mail_password"
    sed_set ".env" "MAIL_FROM_ADDRESS" "$mail_from"
    sed_set ".env" "SSO_URL" "$sso_url"
    sed_set ".env" "SSO_JWT_ISSUER" "$sso_issuer"
    sed_set ".env" "SSO_CLIENT_ID" "$sso_client_id"
    sed_set ".env" "SSO_CLIENT_SECRET" "$sso_client_secret"

    log_ok "Backend .env configured"
    cd "$SCRIPT_DIR"
}

check_db() {
    CURRENT_STEP=$((CURRENT_STEP + 1))
    log_info "Step $CURRENT_STEP: Verifying DB connection..."

    cd "$BACK_DIR"
    local db_check
    db_check="$(php -r '
        $vars = [];
        foreach (file(".env", FILE_IGNORE_NEW_LINES) as $line) {
            if (preg_match("/^([A-Z_]+)=\"?([^\"]*)\"?/", $line, $m)) {
                $vars[$m[1]] = $m[2];
            }
        }
        $dsn = "mysql:host={$vars["DB_HOST"]};port={$vars["DB_PORT"]};dbname={$vars["DB_DATABASE"]}";
        try {
            new PDO($dsn, $vars["DB_USERNAME"] ?? "", $vars["DB_PASSWORD"] ?? "");
            echo "OK";
        } catch (\PDOException $e) {
            echo "FAIL:" . $e->getMessage();
        }
    ' 2>/dev/null || echo "FAIL:Could not run PHP check")"
    if [[ "$db_check" == OK* ]]; then
        log_ok "DB connection verified"
    else
        log_error "DB connection failed: ${db_check#FAIL:}"
        log_error "Fix DB_* in back/.env and re-run"
        exit 4
    fi
    cd "$SCRIPT_DIR"
}

install_deps() {
    CURRENT_STEP=$((CURRENT_STEP + 1))
    log_info "Step $CURRENT_STEP: Installing Composer dependencies..."

    cd "$BACK_DIR"
    if [ -d "vendor" ]; then
        log_info "vendor/ already exists — running install anyway to sync"
    fi
    composer install --no-dev --no-interaction --optimize-autoloader
    log_ok "Composer dependencies ready"
    cd "$SCRIPT_DIR"
}

generate_app_key() {
    CURRENT_STEP=$((CURRENT_STEP + 1))
    log_info "Step $CURRENT_STEP: Ensuring APP_KEY..."

    cd "$BACK_DIR"
    if grep -qE "^APP_KEY=base64:.+" ".env" 2>/dev/null; then
        log_ok "APP_KEY already set, skipping"
    else
        php artisan key:generate --force
        grep -qE "^APP_KEY=base64:" ".env" || { log_error "APP_KEY generation failed"; exit 5; }
        log_ok "APP_KEY generated"
    fi
    cd "$SCRIPT_DIR"
}

link_storage() {
    CURRENT_STEP=$((CURRENT_STEP + 1))
    log_info "Step $CURRENT_STEP: Linking public storage..."

    cd "$BACK_DIR"
    if [ -L "public/storage" ]; then
        log_ok "public/storage already linked"
    elif [ -d "public" ] && [ -d "storage/app/public" ]; then
        # Plain ln -s: shared hosts often disable PHP exec()/symlink(), which
        # makes `artisan storage:link` fail.
        if ln -s ../storage/app/public public/storage 2>/dev/null; then
            log_ok "public/storage linked"
        else
            log_warn "Could not link public/storage — uploaded files may 404"
        fi
    else
        log_warn "public/ or storage/app/public missing — skipping storage link"
    fi
    cd "$SCRIPT_DIR"
}

fix_permissions() {
    CURRENT_STEP=$((CURRENT_STEP + 1))
    log_info "Step $CURRENT_STEP: Fixing storage permissions..."

    cd "$BACK_DIR"
    mkdir -p storage/framework/views storage/framework/cache/data storage/framework/sessions
    chmod -R 775 storage bootstrap/cache
    log_ok "Permissions OK"
    cd "$SCRIPT_DIR"
}

migrate_and_cache() {
    CURRENT_STEP=$((CURRENT_STEP + 1))
    log_info "Step $CURRENT_STEP: Running migrations and refreshing caches..."

    cd "$BACK_DIR"
    php artisan migrate --force || { log_error "Migration failed"; exit 5; }
    php artisan config:cache || { log_error "config:cache failed"; exit 5; }
    php artisan route:cache || { log_error "route:cache failed"; exit 5; }
    log_ok "Migrated + caches rebuilt"
    cd "$SCRIPT_DIR"
}

healthcheck() {
    CURRENT_STEP=$((CURRENT_STEP + 1))
    log_info "Step $CURRENT_STEP: Running health checks..."

    cd "$BACK_DIR"
    HEALTH_RESULTS=()
    local all_ok=true

    # DB was already verified in check_db.
    HEALTH_RESULTS+=("PASS|DB connection")

    # APP_URL must be public — the invitation-email logo is {APP_URL}/assets/...
    local app_url_val
    app_url_val="$(unquote_env_val "$(get_env_default APP_URL .env)")"
    case "$app_url_val" in
        https://*)
            HEALTH_RESULTS+=("PASS|APP_URL is https ($app_url_val)")
            ;;
        http://localhost*|http://yourdomain*|http://127.0.0.1*|"")
            HEALTH_RESULTS+=("FAIL|APP_URL not public ($app_url_val) — email logo will be broken")
            all_ok=false
            ;;
        *)
            HEALTH_RESULTS+=("WARN|APP_URL is http (not https): $app_url_val")
            ;;
    esac

    if [ -f "public/assets/lifeline_v1.png" ]; then
        HEALTH_RESULTS+=("PASS|Email logo asset present (public/assets/lifeline_v1.png)")
    else
        HEALTH_RESULTS+=("WARN|public/assets/lifeline_v1.png missing — email logo will fall back to text")
    fi

    if php artisan route:list --no-ansi 2>/dev/null | grep -q "api/"; then
        HEALTH_RESULTS+=("PASS|API routes registered")
    else
        HEALTH_RESULTS+=("FAIL|No api routes registered")
        all_ok=false
    fi

    if { php artisan migrate:status --no-ansi 2>&1 || true; } | grep -q "Pending"; then
        HEALTH_RESULTS+=("FAIL|Pending migrations detected")
        all_ok=false
    else
        HEALTH_RESULTS+=("PASS|All migrations applied")
    fi

    local sso_secret
    sso_secret="$(unquote_env_val "$(get_env_default SSO_CLIENT_SECRET .env)")"
    if [ -n "$sso_secret" ]; then
        HEALTH_RESULTS+=("PASS|SSO_CLIENT_SECRET set")
    else
        HEALTH_RESULTS+=("WARN|SSO_CLIENT_SECRET empty — SSO auth will fail")
    fi

    HEALTH_OK=$all_ok
    cd "$SCRIPT_DIR"
}

print_summary() {
    echo ""
    echo "  +------------------------------------------+"
    echo "  |   LifeLine — Setup Complete              |"
    echo "  +------------------------------------------+"
    echo ""

    echo "  Configuration"
    echo "    APP_URL:        $(unquote_env_val "$(get_env_default APP_URL "$BACK_DIR/.env")")"
    echo "    CORS origins:   $(unquote_env_val "$(get_env_default CORS_ALLOWED_ORIGINS "$BACK_DIR/.env")")"
    echo "    DB:             $(get_env_default DB_HOST "$BACK_DIR/.env"):$(get_env_default DB_PORT "$BACK_DIR/.env")/$(get_env_default DB_DATABASE "$BACK_DIR/.env")"
    echo "    SSO:            $(unquote_env_val "$(get_env_default SSO_URL "$BACK_DIR/.env")")"
    echo ""

    echo "  Health Checks"
    local result
    for result in "${HEALTH_RESULTS[@]}"; do
        local status="${result%%|*}"
        local label="${result#*|}"
        case "$status" in
            PASS) printf "    \033[32m[PASS]\033[0m %s\n" "$label" ;;
            WARN) printf "    \033[33m[WARN]\033[0m %s\n" "$label" ;;
            *)    printf "    \033[31m[FAIL]\033[0m %s\n" "$label" ;;
        esac
    done
    echo ""

    if [ "$HEALTH_OK" != true ]; then
        log_error "Some health checks failed — fix the FAIL items above and re-run (safe: the script is idempotent)"
        exit 5
    fi
}

main() {
    if [ ! -t 0 ] && [ "$NON_INTERACTIVE" != true ]; then
        log_error "No TTY available. Use --non-interactive for unattended setup."
        exit 4
    fi

    banner

    if [ "$NON_INTERACTIVE" != true ]; then
        if ! confirm "This script will configure the LifeLine backend on this server. Continue?" "Y"; then
            log_info "Setup cancelled by user"
            exit 0
        fi
    fi

    if [ ! -d "$BACK_DIR" ]; then
        log_error "Backend directory not found: $BACK_DIR"
        log_error "Run this script from the server app root (the dir containing back/)"
        exit 6
    fi

    check_prereqs
    configure_backend
    check_db
    install_deps
    generate_app_key
    link_storage
    fix_permissions
    migrate_and_cache
    healthcheck
    print_summary

    log_ok "LifeLine setup complete"
}

main "$@"
