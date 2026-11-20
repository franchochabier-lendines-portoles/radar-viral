#!/bin/bash
# Instala Radar viral en una VM Ubuntu de Oracle Cloud (Always Free) en el primer arranque.
# deploy/render.sh rellena __REPO__ y __DEPLOY_KEY__. Registro: /var/log/radar-setup.log
set -euxo pipefail
exec > /var/log/radar-setup.log 2>&1
export DEBIAN_FRONTEND=noninteractive
APP=/home/radar/radar-viral

# 2 GB de swap: la VM gratuita AMD solo tiene 1 GB de RAM y "next build" lo necesita
if ! swapon --show | grep -q /swapfile; then
  fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

apt-get update
apt-get install -y ca-certificates curl gnupg git build-essential python3 debian-keyring debian-archive-keyring apt-transport-https

curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y nodejs

curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' -o /etc/apt/sources.list.d/caddy-stable.list
apt-get update && apt-get install -y caddy

# Las imágenes de Ubuntu de Oracle traen iptables cerrado salvo SSH
iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
netfilter-persistent save || true

id radar || useradd -m -s /bin/bash radar
install -d -m 700 -o radar -g radar /home/radar/.ssh
cat > /home/radar/.ssh/id_ed25519 <<'KEY'
__DEPLOY_KEY__
KEY
chmod 600 /home/radar/.ssh/id_ed25519
ssh-keyscan github.com >> /home/radar/.ssh/known_hosts
chown -R radar:radar /home/radar/.ssh
[ -d "$APP" ] || sudo -u radar git clone __REPO__ "$APP"

PUBLIC_IP=$(curl -fsS https://api.ipify.org || curl -fsS https://ifconfig.me)
HOST="$(echo "$PUBLIC_IP" | tr . -).sslip.io"
cat > "$APP/.env.local" <<ENV
PUBLIC_READONLY=1
DASHBOARD_URL=https://$HOST
RADAR_DB=$APP/data/radar.db
INGEST_EVERY_MINUTES=5
DIGEST_HOURS=9,14,20
TZ=Europe/Madrid
ENV
chown radar:radar "$APP/.env.local"

cd "$APP"
sudo -u radar npm ci --no-audit --no-fund
sudo -u radar npm run build
sudo -u radar npm run ingest || sudo -u radar npm run seed

cat > /etc/systemd/system/radar-web.service <<UNIT
[Unit]
Description=Radar viral (web)
After=network-online.target
[Service]
User=radar
WorkingDirectory=$APP
EnvironmentFile=$APP/.env.local
Environment=NODE_ENV=production
ExecStart=/usr/bin/npx next start -p 3000 -H 127.0.0.1
Restart=always
[Install]
WantedBy=multi-user.target
UNIT

cat > /etc/systemd/system/radar-worker.service <<UNIT
[Unit]
Description=Radar viral (ingesta y correo)
After=network-online.target
[Service]
User=radar
WorkingDirectory=$APP
ExecStart=/usr/bin/npm run worker
Restart=always
RestartSec=30
[Install]
WantedBy=multi-user.target
UNIT

cat > /etc/caddy/Caddyfile <<CADDY
$HOST {
  encode gzip
  reverse_proxy 127.0.0.1:3000
}
CADDY

systemctl daemon-reload
systemctl enable --now radar-web radar-worker
systemctl reload caddy || systemctl restart caddy
echo "https://$HOST" > /home/radar/URL
echo "RADAR LISTO: https://$HOST"
