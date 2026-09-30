#!/usr/bin/env bash
# Самопроверка ops/nginx/apply.sh без root и без настоящего nginx:
# фейковые nginx/systemctl/apt-cache в PATH, временный "/etc/nginx".
# Запуск: bash ops/nginx/selfcheck.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
T="$(mktemp -d)"; trap 'rm -rf "$T"' EXIT
FAKE="$T/bin"; ETC="$T/etc-nginx"; LE="$T/letsencrypt"
mkdir -p "$FAKE" "$ETC/sites-available" "$ETC/sites-enabled" "$LE/live/bus-tour.by"

fake_nginx() { # $1 — версия, $2 — код выхода nginx -t
  printf '#!/bin/sh\ncase "$1" in -v|-V) echo "nginx version: nginx/%s" >&2;; -t) [ %s -eq 0 ] || echo "bad config" >&2; exit %s;; esac\n' "$1" "$2" "$2" >"$FAKE/nginx"
  chmod +x "$FAKE/nginx"
}
printf '#!/bin/sh\necho "  (systemctl $*)"\n' >"$FAKE/systemctl"
printf '#!/bin/sh\nexit 1\n' >"$FAKE/apt-cache"   # «пакета brotli нет в репозитории»
printf '#!/bin/sh\nexit 0\n' >"$FAKE/apt-get"
chmod +x "$FAKE"/*
touch "$LE/live/bus-tour.by/fullchain.pem" "$LE/live/bus-tour.by/privkey.pem" "$LE/options-ssl-nginx.conf" "$LE/ssl-dhparams.pem"

# Конфиг, как его оставил certbot: путь к сертификату в нём устарел (-0001 нет на диске)
cat >"$ETC/sites-available/bastur.conf" <<'EOF'
server {
    server_name bus-tour.by www.bus-tour.by 185.10.10.10;
    listen [::]:443 ssl ipv6only=on; # managed by Certbot
    listen 443 ssl; # managed by Certbot
    ssl_certificate /nonexistent/bus-tour.by-0001/fullchain.pem; # managed by Certbot
    ssl_certificate_key /nonexistent/bus-tour.by-0001/privkey.pem; # managed by Certbot
}
EOF

run() { PATH="$FAKE:$PATH" BASTUR_NGINX_ETC="$ETC" BASTUR_LETSENCRYPT_DIR="$LE" BASTUR_NGINX_CACHE_DIR="$T/cache" \
        NEXT_PUBLIC_SITE_URL=https://bus-tour.by bash "$ROOT/ops/nginx/apply.sh"; }
fail() { echo "FAIL: $*" >&2; exit 1; }

echo "1) nginx 1.24, старый certbot-конфиг → 80 redirect + 443 http2 (listen-синтаксис), fallback на live/<домен>"
fake_nginx 1.24.0 0; run
SITE="$ETC/sites-available/bastur.conf"
grep -q 'listen 443 ssl http2;' "$SITE" || fail "нет 'listen 443 ssl http2' для nginx 1.24"
grep -q "ssl_certificate $LE/live/bus-tour.by/fullchain.pem;" "$SITE" || fail "нет fallback на live/<домен>"
grep -q 'server_name bus-tour.by www.bus-tour.by 185.10.10.10;' "$SITE" || fail "server_name потерял имена из старого конфига"
grep -q 'return 301 https://$host$request_uri;' "$SITE" || fail "нет редиректа 80→443"
grep -q 'include snippets/bastur-proxy.conf;' "$SITE" || fail "нет include сниппета"
grep -q 'bastur_hsts' "$ETC/conf.d/bastur-http.conf" || fail "нет map bastur_hsts в conf.d"
! grep -q 'brotli on' "$ETC/conf.d/bastur-http.conf" || fail "brotli включён без модуля"
[ -L "$ETC/sites-enabled/bastur.conf" ] || fail "нет симлинка sites-enabled"
[ -f "$ETC/.bastur-brotli-unsupported" ] || fail "нет маркера brotli-unsupported"
ls "$ETC/bastur-backup"/bastur.conf.* >/dev/null || fail "нет бэкапа"

echo "2) повторный запуск → без изменений"
out="$(run)"; echo "$out" | grep -q 'конфиг актуален' || fail "второй запуск не идемпотентен: $out"

echo "3) nginx 1.26 + модуль brotli → 'http2 on;' и brotli"
mkdir -p "$ETC/modules-enabled"; touch "$ETC/modules-enabled/50-mod-http-brotli-filter.conf"
fake_nginx 1.26.0 0; run
grep -q 'http2 on;' "$SITE" || fail "нет 'http2 on;' для nginx 1.26"
grep -q 'brotli on;' "$ETC/conf.d/bastur-http.conf" || fail "brotli не включился при наличии модуля"

echo "4) nginx -t падает → откат к предыдущему конфигу"
cp "$SITE" "$T/before.conf"
rm "$ETC/modules-enabled/50-mod-http-brotli-filter.conf"   # изменение → будет попытка применить
fake_nginx 1.26.0 1; run 2>/dev/null || true
[ "$(sha256sum <"$SITE")" = "$(sha256sum <"$T/before.conf")" ] || fail "после провала nginx -t конфиг не откатился"

echo "5) без сертификата → только :80 со сниппетом"
rm -rf "$LE/live" "$ETC/sites-available/bastur.conf"; fake_nginx 1.24.0 0; run
! grep -q 'listen 443' "$SITE" || fail "443 без сертификата"
grep -q 'include snippets/bastur-proxy.conf;' "$SITE" || fail ":80 без сниппета"

echo "OK: ops/nginx/apply.sh — все сценарии прошли"
