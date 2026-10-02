#!/usr/bin/env bash
# =============================================================================
# БасТур — синхронизация nginx-конфига с репозиторием (идемпотентно).
#
# Вызывается deploy.sh на КАЖДОМ деплое от root. Безопасно: новый конфиг
# проходит `nginx -t`, при ошибке откатывается к бэкапу
# (/etc/nginx/bastur-backup/), деплой приложения при этом не блокируется.
#
# Что делает:
#   1. snippets/bastur-http.conf  -> /etc/nginx/conf.d/bastur-http.conf
#      (зоны, gzip; + brotli, если модуль есть или поставился из apt)
#   2. snippets/bastur-proxy.conf -> /etc/nginx/snippets/bastur-proxy.conf
#      (заголовки, location'ы, микрокеш — общее для :80 и :443)
#   3. генерирует /etc/nginx/sites-available/bastur.conf:
#      server:80 (редирект на https, если сертификат уже есть) +
#      server:443 ssl с HTTP/2. Пути к сертификатам берёт из текущего
#      конфига (как их прописал certbot) или из /etc/letsencrypt/live/<домен>/.
#      Пока сертификата нет — только :80 (certbot --nginx допишет 443 сам,
#      а следующий деплой перегенерирует блок уже с HTTP/2).
#   4. nginx -t && systemctl reload nginx
#
# Ручной запуск: sudo bash ops/nginx/apply.sh
# Отключить brotli-установку: BASTUR_NGINX_BROTLI=0
# =============================================================================
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SRC="$ROOT/ops/nginx/snippets"
# Пути переопределяются только в самопроверке (ops/nginx/selfcheck.sh)
ETC="${BASTUR_NGINX_ETC:-/etc/nginx}"
LE="${BASTUR_LETSENCRYPT_DIR:-/etc/letsencrypt}"
CACHE_DIR="${BASTUR_NGINX_CACHE_DIR:-/var/cache/nginx}"
SITE="$ETC/sites-available/bastur.conf"
SITE_ENABLED="$ETC/sites-enabled/bastur.conf"
PROXY_DST="$ETC/snippets/bastur-proxy.conf"
HTTP_DST="$ETC/conf.d/bastur-http.conf"
BACKUP_DIR="$ETC/bastur-backup"
BROTLI_UNSUPPORTED_MARK="$ETC/.bastur-brotli-unsupported"

log()  { echo "[nginx] $*"; }
warn() { echo "[nginx] ВНИМАНИЕ: $*" >&2; }

command -v nginx >/dev/null 2>&1 || { log "nginx не установлен — пропускаю"; exit 0; }
[ "$(id -u)" -eq 0 ] || [ -n "${BASTUR_NGINX_ETC:-}" ] || { warn "нужен root (sudo bash ops/nginx/apply.sh) — пропускаю"; exit 0; }
[ -f "$SRC/bastur-proxy.conf" ] && [ -f "$SRC/bastur-http.conf" ] || { warn "нет ops/nginx/snippets/* — пропускаю"; exit 0; }

# --- Домен: NEXT_PUBLIC_SITE_URL из окружения или .env ------------------------
DOMAIN="${NEXT_PUBLIC_SITE_URL:-}"
if [ -z "$DOMAIN" ] && [ -f "$ROOT/.env" ]; then
  DOMAIN="$(grep -E '^NEXT_PUBLIC_SITE_URL=' "$ROOT/.env" | tail -1 | cut -d= -f2- | tr -d "\"' ")"
fi
DOMAIN="${DOMAIN#http://}"; DOMAIN="${DOMAIN#https://}"; DOMAIN="${DOMAIN%%/*}"; DOMAIN="${DOMAIN%%:*}"
[ -n "$DOMAIN" ] || DOMAIN="bus-tour.by"
BARE="${DOMAIN#www.}"

# server_name: домен + www + всё, что уже было в текущем конфиге (без дублей),
# чтобы не потерять старый домен/IP, по которым сайт ещё открывают.
NAMES="$BARE www.$BARE"
if [ -f "$SITE" ]; then
  EXISTING="$(sed -nE 's/^[[:space:]]*server_name[[:space:]]+([^;]+);.*/\1/p' "$SITE" | tr -s ' \t' '\n' | grep -vE '^(_|)$' || true)"
  NAMES="$(printf '%s\n' $NAMES $EXISTING | awk 'NF && !seen[$0]++' | tr '\n' ' ' | sed 's/ $//')"
fi

# --- TLS: сертификаты из текущего конфига (certbot) или стандартного пути ------
CERT=""; KEY=""
if [ -f "$SITE" ]; then
  CERT="$(sed -nE 's/^[[:space:]]*ssl_certificate[[:space:]]+([^;]+);.*/\1/p' "$SITE" | head -1 || true)"
  KEY="$(sed -nE 's/^[[:space:]]*ssl_certificate_key[[:space:]]+([^;]+);.*/\1/p' "$SITE" | head -1 || true)"
fi
# Путь из конфига может устареть (certbot пересоздал live/<домен>-0001 и т.п.) —
# тогда берём стандартный live/<домен>/.
if { [ -z "$CERT" ] || [ ! -f "$CERT" ] || [ ! -f "${KEY:-/nonexistent}" ]; } && [ -f "$LE/live/$BARE/fullchain.pem" ]; then
  CERT="$LE/live/$BARE/fullchain.pem"
  KEY="$LE/live/$BARE/privkey.pem"
fi
TLS=0
if [ -n "$CERT" ] && [ -n "$KEY" ] && [ -f "$CERT" ] && [ -f "$KEY" ]; then TLS=1; fi

# --- HTTP/2: синтаксис зависит от версии nginx (http2 on; появился в 1.25.1) ---
read -r V1 V2 V3 <<<"$(nginx -v 2>&1 | sed -nE 's#.*nginx/([0-9]+)\.([0-9]+)\.([0-9]+).*#\1 \2 \3#p')"
V1="${V1:-0}"; V2="${V2:-0}"; V3="${V3:-0}"
if [ "$V1" -gt 1 ] || { [ "$V1" -eq 1 ] && { [ "$V2" -gt 25 ] || { [ "$V2" -eq 25 ] && [ "$V3" -ge 1 ]; }; }; }; then
  LISTEN_443=$'    listen 443 ssl;\n    listen [::]:443 ssl;\n    http2 on;'
else
  LISTEN_443=$'    listen 443 ssl http2;\n    listen [::]:443 ssl http2;'
fi

# --- Brotli: используем, если модуль уже загружен; иначе пробуем apt -----------
brotli_loaded() {
  ls "$ETC"/modules-enabled/*brotli* >/dev/null 2>&1 || nginx -V 2>&1 | grep -q brotli
}
BROTLI=0
if brotli_loaded; then
  BROTLI=1
elif [ "${BASTUR_NGINX_BROTLI:-1}" = "1" ] && [ ! -f "$BROTLI_UNSUPPORTED_MARK" ] && command -v apt-get >/dev/null 2>&1; then
  if apt-cache policy libnginx-mod-http-brotli-filter 2>/dev/null | grep -qE 'Candidate: [0-9]'; then
    log "Ставлю модуль brotli (libnginx-mod-http-brotli-filter)"
    if DEBIAN_FRONTEND=noninteractive apt-get install -y -qq libnginx-mod-http-brotli-filter >/dev/null 2>&1 \
       && nginx -t >/dev/null 2>&1; then
      BROTLI=1
    else
      # Модуль из репозитория Ubuntu не подходит к nginx из другого источника —
      # снимаем и больше не пытаемся (маркер), сжимаем gzip.
      warn "brotli-модуль несовместим с установленным nginx — удаляю, остаёмся на gzip"
      DEBIAN_FRONTEND=noninteractive apt-get remove -y -qq libnginx-mod-http-brotli-filter >/dev/null 2>&1 || true
      touch "$BROTLI_UNSUPPORTED_MARK"
    fi
  else
    log "Пакета brotli для nginx нет в репозитории — остаёмся на gzip"
    touch "$BROTLI_UNSUPPORTED_MARK"
  fi
fi

# --- Сборка новых файлов во временную директорию ------------------------------
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

# --- Каталог загрузок для прямой раздачи nginx -------------------------------
# Тот же источник правды, что у приложения (lib/upload-fs.ts): UPLOADS_DIR из
# окружения/.env, иначе <репозиторий>/public/uploads. Плейсхолдер в сниппете
# заменяем здесь; в пути допускаем только безопасные для nginx-конфига символы,
# иначе остаёмся на проксировании через приложение.
UPLOADS_DIR_VALUE="${UPLOADS_DIR:-}"
if [ -z "$UPLOADS_DIR_VALUE" ] && [ -f "$ROOT/.env" ]; then
  UPLOADS_DIR_VALUE="$(grep -E '^UPLOADS_DIR=' "$ROOT/.env" | tail -1 | cut -d= -f2- | tr -d "\"' ")"
fi
[ -n "$UPLOADS_DIR_VALUE" ] || UPLOADS_DIR_VALUE="$ROOT/public/uploads"
UPLOADS_DIR_VALUE="${UPLOADS_DIR_VALUE%/}"
if printf '%s' "$UPLOADS_DIR_VALUE" | grep -qE '^/[A-Za-z0-9._/-]+$'; then
  awk -v dir="$UPLOADS_DIR_VALUE" '{ gsub(/__BASTUR_UPLOADS_DIR__/, dir); print }' "$SRC/bastur-proxy.conf" >"$TMP/proxy.conf"
else
  warn "UPLOADS_DIR содержит недопустимые для nginx символы ($UPLOADS_DIR_VALUE) — медиа раздаёт приложение"
  awk '
    /^location ~\* \^\/uploads\// { skip = 1 }
    skip && /^}/ { skip = 0; next }
    !skip { print }
  ' "$SRC/bastur-proxy.conf" >"$TMP/proxy.conf"
fi

cp "$SRC/bastur-http.conf" "$TMP/http.conf"
if [ "$BROTLI" -eq 1 ]; then
  cat >>"$TMP/http.conf" <<'EOF'

# Brotli (модуль ngx_brotli найден) — на 15–20 % меньше gzip для HTML/CSS/JS.
brotli on;
brotli_comp_level 5;
brotli_min_length 1024;
brotli_types text/plain text/css text/xml application/json application/javascript
             application/xml application/rss+xml image/svg+xml font/woff2;
EOF
fi

{
  echo "# Сгенерировано ops/nginx/apply.sh из репозитория — НЕ править руками:"
  echo "# правки затираются на следующем деплое. Меняй ops/nginx/snippets/* в git."
  echo "# Бэкапы предыдущих версий: $BACKUP_DIR/"
  echo
  echo "server {"
  echo "    listen 80;"
  echo "    listen [::]:80;"
  echo "    server_name $NAMES;"
  if [ "$TLS" -eq 1 ]; then
    cat <<'EOF'

    # ACME-челлендж certbot (webroot) — отдаём без редиректа
    location ^~ /.well-known/acme-challenge/ {
        root /var/www/html;
        default_type "text/plain";
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

server {
EOF
    echo "$LISTEN_443"
    echo "    server_name $NAMES;"
    echo
    echo "    ssl_certificate $CERT;"
    echo "    ssl_certificate_key $KEY;"
    if [ -f "$LE/options-ssl-nginx.conf" ]; then
      echo "    include $LE/options-ssl-nginx.conf;"
    else
      echo "    ssl_protocols TLSv1.2 TLSv1.3;"
      echo "    ssl_prefer_server_ciphers off;"
      echo "    ssl_session_cache shared:bastur_ssl:10m;"
      echo "    ssl_session_timeout 1d;"
    fi
    if [ -f "$LE/ssl-dhparams.pem" ]; then
      echo "    ssl_dhparam $LE/ssl-dhparams.pem;"
    fi
    echo
    echo "    include snippets/bastur-proxy.conf;"
    echo "}"
  else
    echo
    echo "    include snippets/bastur-proxy.conf;"
    echo "}"
  fi
} >"$TMP/site.conf"

# --- Ничего не поменялось — выходим без reload ---------------------------------
# cmp/diff (diffutils) на минимальных образах может не быть — сравниваем хэшами.
same_file() { [ -f "$2" ] && [ "$(sha256sum <"$1")" = "$(sha256sum <"$2")" ]; }
if same_file "$TMP/site.conf" "$SITE" \
   && same_file "$TMP/proxy.conf" "$PROXY_DST" \
   && same_file "$TMP/http.conf" "$HTTP_DST" \
   && [ -L "$SITE_ENABLED" ]; then
  log "конфиг актуален (HTTP/2: $([ "$TLS" -eq 1 ] && echo да || echo 'нет — ждём сертификат'), brotli: $([ "$BROTLI" -eq 1 ] && echo да || echo нет))"
  exit 0
fi

# --- Бэкап и установка ----------------------------------------------------------
mkdir -p "$BACKUP_DIR" "$ETC/snippets" "$ETC/conf.d" "$ETC/sites-available" "$ETC/sites-enabled" "$CACHE_DIR/bastur"
STAMP="$(date +%Y%m%d-%H%M%S)"
HAD_SITE=0; HAD_PROXY=0; HAD_HTTP=0
[ -f "$SITE" ]      && { HAD_SITE=1;  cp -a "$SITE"      "$BACKUP_DIR/bastur.conf.$STAMP"; }
[ -f "$PROXY_DST" ] && { HAD_PROXY=1; cp -a "$PROXY_DST" "$BACKUP_DIR/bastur-proxy.conf.$STAMP"; }
[ -f "$HTTP_DST" ]  && { HAD_HTTP=1;  cp -a "$HTTP_DST"  "$BACKUP_DIR/bastur-http.conf.$STAMP"; }

install -m 0644 "$TMP/proxy.conf" "$PROXY_DST"
install -m 0644 "$TMP/http.conf"  "$HTTP_DST"
install -m 0644 "$TMP/site.conf"  "$SITE"
ln -sf "$SITE" "$SITE_ENABLED"
rm -f "$ETC/sites-enabled/default"
if id www-data >/dev/null 2>&1; then chown -R www-data:www-data "$CACHE_DIR" 2>/dev/null || true; fi

rollback() {
  warn "nginx -t не прошёл — откатываю конфиг к предыдущему состоянию"
  if [ "$HAD_SITE" -eq 1 ];  then cp -a "$BACKUP_DIR/bastur.conf.$STAMP"       "$SITE";      else rm -f "$SITE" "$SITE_ENABLED"; fi
  if [ "$HAD_PROXY" -eq 1 ]; then cp -a "$BACKUP_DIR/bastur-proxy.conf.$STAMP" "$PROXY_DST"; else rm -f "$PROXY_DST"; fi
  if [ "$HAD_HTTP" -eq 1 ];  then cp -a "$BACKUP_DIR/bastur-http.conf.$STAMP"  "$HTTP_DST";  else rm -f "$HTTP_DST"; fi
  if nginx -t >/dev/null 2>&1; then
    systemctl reload nginx || true
    warn "откат выполнен, nginx работает на старом конфиге"
  else
    warn "старый конфиг тоже не проходит nginx -t — nginx НЕ перезагружался, работает прежний процесс"
  fi
}

if nginx -t 2>"$TMP/nginx-t.log"; then
  systemctl reload nginx
  log "конфиг обновлён и применён: HTTP/2: $([ "$TLS" -eq 1 ] && echo да || echo 'нет — включится после certbot'), brotli: $([ "$BROTLI" -eq 1 ] && echo да || echo нет), server_name: $NAMES"
else
  cat "$TMP/nginx-t.log" >&2 || true
  rollback
fi

# Держим не больше 30 бэкапов (по 3 файла на запуск)
ls -1t "$BACKUP_DIR" 2>/dev/null | tail -n +31 | while read -r f; do rm -f "$BACKUP_DIR/$f"; done
exit 0
