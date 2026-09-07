#!/usr/bin/env bash
set -euo pipefail
# Run once on the fresh Oracle Linux instance after DNS points to this server.
DOMAIN="${1:-search.bodhisync.online}"
[[ "$DOMAIN" =~ ^[a-zA-Z0-9.-]+$ && "$DOMAIN" == *.* ]] || { echo 'Use a valid DNS hostname.'; exit 1; }
[[ $EUID -eq 0 ]] || { echo 'Run with sudo bash setup-oracle.sh'; exit 1; }
SOURCE_DIR="$(cd -- "$(dirname -- "$0")" && pwd)"
INSTALL_DIR=/opt/moonlight-search
[[ ! -e "$INSTALL_DIR" ]] || { echo 'Existing /opt/moonlight-search found. Stopped to avoid overwriting credentials or data.'; exit 1; }
dnf install -y podman
install -d -m 700 "$INSTALL_DIR" "$INSTALL_DIR/private" "$INSTALL_DIR/data" "$INSTALL_DIR/searxng" "$INSTALL_DIR/caddy-data" "$INSTALL_DIR/caddy-config"
install -m 644 "$SOURCE_DIR/server.mjs" "$SOURCE_DIR/create-testers.mjs" "$SOURCE_DIR/Containerfile" "$INSTALL_DIR/"
# Pull official images once; resolve digests so subsequent service restarts do not change versions.
podman pull docker.io/library/node:22-alpine
podman pull docker.io/library/caddy:2-alpine
podman pull docker.io/searxng/searxng:latest
CADDY_IMAGE="$(podman image inspect docker.io/library/caddy:2-alpine --format '{{index .RepoDigests 0}}')"
SEARX_IMAGE="$(podman image inspect docker.io/searxng/searxng:latest --format '{{index .RepoDigests 0}}')"
podman run --rm --user 0 -v "$INSTALL_DIR:/src:Z" -v "$INSTALL_DIR/private:/private:Z" docker.io/library/node:22-alpine node /src/create-testers.mjs /private
install -o 1000 -g 1000 -m 600 "$INSTALL_DIR/private/token-hashes.json" "$INSTALL_DIR/data/token-hashes.json"
chown 1000:1000 "$INSTALL_DIR/data"
SEARCH_SECRET="$(podman run --rm docker.io/library/node:22-alpine node -e 'process.stdout.write(require("crypto").randomBytes(32).toString("hex"))')"
cat > "$INSTALL_DIR/searxng/settings.yml" <<EOF
use_default_settings:
  engines:
    keep_only:
      - duckduckgo
      - bing
      - brave
general:
  debug: false
search:
  safe_search: 1
  formats:
    - html
    - json
server:
  secret_key: "$SEARCH_SECRET"
  bind_address: "0.0.0.0"
  port: 8080
  limiter: false
outgoing:
  request_timeout: 6.0
EOF
unset SEARCH_SECRET
# SearXNG is reachable only within the pod; the authenticated gateway enforces limits.
cat > "$INSTALL_DIR/Caddyfile" <<EOF
$DOMAIN {
  request_body {
    max_size 2KB
  }
  @search path /search
  handle @search {
    reverse_proxy 127.0.0.1:8787
  }
  handle {
    respond "Moonlight search" 200
  }
}
EOF
chmod 600 "$INSTALL_DIR/Caddyfile" "$INSTALL_DIR/searxng/settings.yml"
podman build -t localhost/moonlight-search:alpha "$INSTALL_DIR"
install -d /etc/containers/systemd
cat > /etc/containers/systemd/moonlight-search.pod <<EOF
[Unit]
Description=Moonlight private search pod
Wants=network-online.target
After=network-online.target
[Pod]
PodName=moonlight-search
PublishPort=80:80
PublishPort=443:443
[Install]
WantedBy=multi-user.target
EOF
cat > /etc/containers/systemd/moonlight-searxng.container <<EOF
[Unit]
Description=Private SearXNG
[Container]
Image=$SEARX_IMAGE
ContainerName=moonlight-searxng
Pod=moonlight-search.pod
Volume=$INSTALL_DIR/searxng:/etc/searxng:Z
[Service]
Restart=always
TimeoutStartSec=300
[Install]
WantedBy=multi-user.target
EOF
cat > /etc/containers/systemd/moonlight-gateway.container <<EOF
[Unit]
Description=Moonlight authenticated search gateway
After=moonlight-searxng.service
[Container]
Image=localhost/moonlight-search:alpha
ContainerName=moonlight-gateway
Pod=moonlight-search.pod
Volume=$INSTALL_DIR/data:/data:Z
Environment=SEARXNG_URL=http://127.0.0.1:8080
Environment=BIND_ADDRESS=127.0.0.1
[Service]
Restart=always
[Install]
WantedBy=multi-user.target
EOF
cat > /etc/containers/systemd/moonlight-caddy.container <<EOF
[Unit]
Description=Moonlight HTTPS entry point
After=moonlight-gateway.service
[Container]
Image=$CADDY_IMAGE
ContainerName=moonlight-caddy
Pod=moonlight-search.pod
Volume=$INSTALL_DIR/Caddyfile:/etc/caddy/Caddyfile:ro,Z
Volume=$INSTALL_DIR/caddy-data:/data:Z
Volume=$INSTALL_DIR/caddy-config:/config:Z
[Service]
Restart=always
[Install]
WantedBy=multi-user.target
EOF
if systemctl is-active --quiet firewalld; then
  firewall-cmd --permanent --add-service=http
  firewall-cmd --permanent --add-service=https
  firewall-cmd --reload
fi
systemctl daemon-reload
systemctl start moonlight-searxng.service moonlight-gateway.service moonlight-caddy.service
printf '\nSetup requested. Check service logs and HTTPS before distributing codes.\nSearch endpoint: https://%s/search\nPrivate tester codes: %s/private/tester-codes.json\n' "$DOMAIN" "$INSTALL_DIR"
