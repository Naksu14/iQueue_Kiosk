#!/usr/bin/env bash
# Helper script to start scanner-server.js with device path and port
# Usage: ./start-scanner.sh [PORT] [DEVICE_PATH]

set -euo pipefail


# Load env file if present for easier configuration
ENV_FILE="/etc/default/iqueue-scanner"
if [ -f "$ENV_FILE" ]; then
  # shellcheck disable=SC1090
  . "$ENV_FILE"
fi

PORT=${1:-${PORT:-4001}}
DEVICE=${2:-${DEVICE_PATH:-/dev/input/by-id/usb-SM_SM-2D_PRODUCT_HID_KBW_APP-000000000-event-kbd}}

NODE_BIN=${NODE_BIN:-/usr/bin/node}
SCRIPT_PATH=${SCRIPT_PATH:-/home/iqueue/iQueue_Kiosk/scanner-server.js}

if [ ! -x "$NODE_BIN" ]; then
  echo "Node binary not found at $NODE_BIN"
  exit 1
fi

if [ ! -f "$SCRIPT_PATH" ]; then
  echo "scanner-server.js not found at $SCRIPT_PATH"
  exit 1
fi

if [ ! -e "$DEVICE" ]; then
  echo "Device $DEVICE does not exist"
  exit 1
fi

exec sudo -u iqueue $NODE_BIN "$SCRIPT_PATH" "$PORT" "$DEVICE"
