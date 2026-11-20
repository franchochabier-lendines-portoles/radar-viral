#!/bin/bash
# Actualiza el servidor con lo último del repositorio. Ejecutar en la VM: sudo bash ~radar/radar-viral/deploy/update.sh
set -euo pipefail
cd /home/radar/radar-viral
sudo -u radar git pull --ff-only
sudo -u radar npm ci --no-audit --no-fund
sudo -u radar npm run build
systemctl restart radar-web radar-worker
echo "Actualizado: $(cat /home/radar/URL)"
