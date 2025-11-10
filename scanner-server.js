/*
  scanner-server.js
  - Listens for barcode scanner input piped into stdin (keyboard-event device)
  - Exposes:
    GET  /api/status        -> { status: 'READY'|'WAITING', lastCode, waitingCount }
    POST /api/trigger-scan -> waits for next scan and returns { success:true, qrCode }
    GET  /api/stream-scans -> Server-Sent Events streaming all scans as { qrCode }

  Run example (replace device path):
    sudo node scanner-server.js < /dev/input/by-id/usb-TEKLEAD_* -p 4001

  If you get permission issues reading /dev/input, add a udev rule or run under sudo.
*/

const express = require('express');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || process.argv[2] || 4001;
// Optional device path (evdev). Can be provided via env DEVICE_PATH or argv[3]
const DEVICE_PATH = process.env.DEVICE_PATH || process.argv[3] || null;

let lastScannedCode = null;
let pendingResolvers = []; // array of { resolve, reject, timer }
let sseClients = [];

function broadcastScan(code) {
  const payload = JSON.stringify({ qrCode: code });
  sseClients.forEach(({ res }) => {
    try {
      res.write(`data: ${payload}\n\n`);
    } catch (e) {
      // ignore
    }
  });
}

// Option A: STDIN reading (scanner piped into stdin) - legacy
function setupStdinReader() {
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (data) => {
    const raw = String(data || '').trim();
    if (!raw) return;
    // Some devices or middleware might include extra quotes/newlines; keep raw as-is
    const code = raw;
    console.log('[SCANNER][stdin] got:', code);
    lastScannedCode = code;

    // Resolve oldest pending trigger if any
    if (pendingResolvers.length > 0) {
      const item = pendingResolvers.shift();
      clearTimeout(item.timer);
      try {
        item.resolve(code);
      } catch (e) {
        console.error('Error resolving pending scan promise', e);
      }
    }

    // Broadcast to SSE clients
    broadcastScan(code);
  });

  process.stdin.on('error', (err) => {
    console.error('[STDIN ERROR]', err);
  });
}

// Option B: Read Linux evdev event device (/dev/input/eventX) and decode key events
// into characters. This works when the scanner exposes a raw input event device.
function setupEvdevReader(devicePath) {
  const fs = require('fs');
  if (!devicePath || !fs.existsSync(devicePath)) {
    console.error('[EVDEV] device path not provided or does not exist:', devicePath);
    return;
  }

  console.log('[EVDEV] opening device:', devicePath);
  const stream = fs.createReadStream(devicePath, { encoding: null });

  // Buffer incomplete chunks
  let carry = Buffer.alloc(0);
  // Buffer for the current composed scanned string
  let current = '';
  let shift = false;

  // Minimal keycode -> char mapping for typical USB keyboard layouts (EN)
  const keyMap = {
    2: '1', 3: '2', 4: '3', 5: '4', 6: '5', 7: '6', 8: '7', 9: '8', 10: '9', 11: '0',
    16: 'q', 17: 'w', 18: 'e', 19: 'r', 20: 't', 21: 'y', 22: 'u', 23: 'i', 24: 'o', 25: 'p',
    30: 'a', 31: 's', 32: 'd', 33: 'f', 34: 'g', 35: 'h', 36: 'j', 37: 'k', 38: 'l',
    44: 'z', 45: 'x', 46: 'c', 47: 'v', 48: 'b', 49: 'n', 50: 'm',
    12: '-', 13: '=', 26: '[', 27: ']', 39: ';', 40: "'", 51: ',', 52: '.', 53: '/',
    57: ' ', 28: '\n', // enter
  };

  const keyMapShift = Object.assign({}, keyMap, {
    2: '!', 3: '@', 4: '#', 5: '$', 6: '%', 7: '^', 8: '&', 9: '*', 10: '(', 11: ')',
    12: '_', 13: '+', 26: '{', 27: '}', 39: ':', 40: '"', 51: '<', 52: '>', 53: '?',
  });

  stream.on('data', (chunk) => {
    const buf = Buffer.concat([carry, Buffer.from(chunk)]);
    const EVENT_SIZE = 24; // Linux input_event struct size on x86_64
    const fullEvents = Math.floor(buf.length / EVENT_SIZE);
    const remainder = buf.length % EVENT_SIZE;

    for (let i = 0; i < fullEvents; i++) {
      const offset = i * EVENT_SIZE;
      // tv_sec (8), tv_usec (8), type (2), code (2), value (4)
      const type = buf.readUInt16LE(offset + 16);
      const code = buf.readUInt16LE(offset + 18);
      const value = buf.readInt32LE(offset + 20);

      // EV_KEY === 1
      if (type === 1) {
        // Shift keys: 42 (left shift), 54 (right shift)
        if ((code === 42 || code === 54)) {
          if (value === 1) shift = true; // down
          if (value === 0) shift = false; // up
          continue;
        }

        // Key press (value === 1) or auto-repeat (2)
        if (value === 1 || value === 2) {
          // Enter
          if (code === 28) {
            const scanned = current.trim();
            if (scanned.length > 0) {
              console.log('[EVDEV] scanned:', scanned);
              lastScannedCode = scanned;
              // resolve pending
              if (pendingResolvers.length > 0) {
                const item = pendingResolvers.shift();
                clearTimeout(item.timer);
                try {
                  item.resolve(scanned);
                } catch (e) {
                  console.error('Error resolving pending scan promise', e);
                }
              }
              broadcastScan(scanned);
            }
            current = '';
            continue;
          }

          // Map to character
          const map = shift ? keyMapShift : keyMap;
          const ch = map[code];
          if (ch) {
            // Append space-preserving keys and normal letters
            if (ch === '\n') {
              // handled above
            } else {
              current += ch;
            }
          } else {
            // Unknown key code - ignore or log for debugging
            // console.debug('[EVDEV] unknown key code', code, 'shift=', shift);
          }
        }
        // key release (value === 0) -> we may want to ignore
      }
    }

    // keep remainder bytes in carry
    if (remainder > 0) {
      carry = buf.slice(buf.length - remainder);
    } else {
      carry = Buffer.alloc(0);
    }
  });

  stream.on('error', (err) => {
    console.error('[EVDEV] stream error', err);
  });

  stream.on('close', () => {
    console.log('[EVDEV] device stream closed');
  });
}

// GET /api/status
app.get('/api/status', (req, res) => {
  res.json({
    status: pendingResolvers.length > 0 ? 'WAITING' : 'READY',
    lastCode: lastScannedCode,
    waitingCount: pendingResolvers.length,
  });
});

// POST /api/trigger-scan -> wait for one scan, respond with it
app.post('/api/trigger-scan', async (req, res) => {
  // Create a promise that resolves with the next scan or rejects after timeout
  try {
    const waitMs = Number(process.env.SCAN_TIMEOUT_MS || 30000);
    const p = new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        // remove from queue if still present
        const idx = pendingResolvers.findIndex(x => x.resolve === resolve);
        if (idx !== -1) pendingResolvers.splice(idx, 1);
        reject(new Error('Scan timed out'));
      }, waitMs);
      pendingResolvers.push({ resolve, reject, timer });
    });

    const code = await p; // wait for scanner stdin to give data
    res.json({ success: true, qrCode: code });
  } catch (err) {
    console.error('[TRIGGER-SCAN] error', err.message || err);
    res.status(500).json({ success: false, error: String(err.message || err) });
  }
});

// SSE endpoint: GET /api/stream-scans
app.get('/api/stream-scans', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });
  res.write('\n');

  const client = { id: Date.now() + Math.random(), res };
  sseClients.push(client);
  console.log('[SSE] client connected, total=', sseClients.length);

  req.on('close', () => {
    sseClients = sseClients.filter(c => c.id !== client.id);
    console.log('[SSE] client disconnected, total=', sseClients.length);
  });
});

app.listen(PORT, () => {
  console.log(`Scanner server listening on port ${PORT}`);
  console.log('Endpoints: GET /api/status  POST /api/trigger-scan  GET /api/stream-scans');
  console.log('Start this process by piping an input device into stdin. Example:');
  console.log('  sudo node scanner-server.js < /dev/input/by-id/usb-TEKLEAD_...-event-kbd');
});

// Choose input source: evdev device if provided, otherwise stdin
if (DEVICE_PATH) {
  console.log('[INIT] using evdev device:', DEVICE_PATH);
  try {
    setupEvdevReader(DEVICE_PATH);
  } catch (err) {
    console.error('[INIT] failed to setup evdev reader', err);
    console.log('[INIT] falling back to stdin reader');
    setupStdinReader();
  }
} else {
  console.log('[INIT] no device path provided - using stdin reader');
  setupStdinReader();
}
