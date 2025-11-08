#!/usr/bin/env bash
set -euo pipefail

# Test script for printer-server
# Usage: PRINTER_SERVER=http://<host>:4000 ./test-print.sh

SERVER=${PRINTER_SERVER:-http://localhost:4000}
echo "Using printer server: $SERVER"

echo
echo "== 1) Simple payload (old) =="
curl -sS -X POST "$SERVER/print" \
  -H "Content-Type: application/json" \
  -d '{"queueNumber":"TEST01","officeName":"Registrar"}' \
  -w "\nHTTP:%{http_code}\n"

echo
echo "== 2) Detailed payload (new) =="
curl -sS -X POST "$SERVER/print" \
  -H "Content-Type: application/json" \
  -d '{"queueNumber":"TEST02","transactionCode":"TC123","transactionArray":[{"transactionDetails":"Test 1","officeName":"Registrar","fee":0,"paymentStatus":"paid"},{"transactionDetails":"Test 2","officeName":"Cashier","fee":50,"paymentStatus":"unpaid"}]}' \
  -w "\nHTTP:%{http_code}\n"

echo
echo "Finished. If printing was attempted, check the server log: /home/iqueue/printer-server.log"
