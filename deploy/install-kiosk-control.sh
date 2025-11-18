#!/usr/bin/env bash
set -euo pipefail

# INSTALLER: copies sudoers snippet and systemd unit into place and enables the service.
# Run this as a user with sudo privileges on the Pi. It will NOT reboot the machine.

REPO_DIR="/home/iqueue/iQueue_Kiosk"
SUDOERS_SRC="$REPO_DIR/deploy/iqueue-kiosk-control.sudoers"
SUDOERS_DEST="/etc/sudoers.d/iqueue-kiosk"
SERVICE_SRC="$REPO_DIR/deploy/iqueue-kiosk-control.service"
SERVICE_DEST="/etc/systemd/system/iqueue-kiosk-control.service"

if [ "$EUID" -eq 0 ]; then
  echo "Please run this script as a normal user with sudo privileges (not as root)."
  exit 1
fi

echo "Copying sudoers snippet to $SUDOERS_DEST (requires sudo)"
sudo cp "$SUDOERS_SRC" "$SUDOERS_DEST"
sudo chmod 0440 "$SUDOERS_DEST"
echo "Validating sudoers syntax..."
sudo visudo -c || { echo "visudo reported problems"; exit 2; }

echo "Installing systemd unit to $SERVICE_DEST"
sudo cp "$SERVICE_SRC" "$SERVICE_DEST"
sudo chmod 0644 "$SERVICE_DEST"

echo "Reloading systemd and enabling service"
sudo systemctl daemon-reload
sudo systemctl enable --now iqueue-kiosk-control.service

echo "Status of iqueue-kiosk-control.service:"
sudo systemctl status --no-pager iqueue-kiosk-control.service -n 50 || true

echo "Installation complete. The kiosk-control server should now run as 'iqueue' with ALLOW_SHUTDOWN=1."
echo "Logs: sudo journalctl -u iqueue-kiosk-control -f"
