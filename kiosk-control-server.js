#!/usr/bin/env node
/**
 * kiosk-control-server.js
 * Minimal Express server to accept kiosk control requests from the React UI
 * POST /kiosk-control
 *   body: { password: string, action: 'shutdown'|'reboot' }
 *
 * Behavior:
 * - Verifies password against env KIOSK_ADMIN_PASSWORD (default: 'admin')
 * - If password matches and ALLOW_SHUTDOWN=1, executes the requested command via sudo
 * - If ALLOW_SHUTDOWN!=1 the server only simulates the action (safe default)
 * - Responds with JSON { success: boolean, message: string }
 *
 * Security notes (read README in deploy/ for instructions):
 * - You should create a dedicated user and add a sudoers rule to allow only
 *   the shutdown/reboot executables without a password.
 * - Do NOT expose this server to the open internet.
 */

import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import util from 'util';
import { exec as execCb } from 'child_process';

const exec = util.promisify(execCb);

const app = express();
const PORT = process.env.PORT || 3001;

// Configure CORS: if ALLOWED_ORIGINS is provided (comma-separated) use it,
// otherwise reflect the request origin (helps when the frontend is served
// from the Pi's IP or a different host during kiosk deployment).
const ALLOWED_ORIGINS_RAW = process.env.ALLOWED_ORIGINS;
if (ALLOWED_ORIGINS_RAW) {
  const ALLOWED_ORIGINS = ALLOWED_ORIGINS_RAW.split(',');
  console.log('[kiosk-control] ALLOWED_ORIGINS=', ALLOWED_ORIGINS);
  app.use(cors({ origin: ALLOWED_ORIGINS, credentials: true }));
} else {
  console.log('[kiosk-control] ALLOWED_ORIGINS not set — reflecting request origin for CORS');
  app.use(cors({ origin: true, credentials: true }));
}
app.use(bodyParser.json());

const ADMIN_PASSWORD = process.env.KIOSK_ADMIN_PASSWORD || 'iqueue2025';
const ALLOW_SHUTDOWN = String(process.env.ALLOW_SHUTDOWN || '0') === '1';

app.get('/ping', (req, res) => res.json({ ok: true }));

// Validate password without performing any action. Useful for the UI step
app.post('/kiosk-validate', (req, res) => {
  try {
    console.log('[kiosk-validate] origin=', req.get('origin'));
    const { password } = req.body || {};
    if (!password) return res.status(400).json({ success: false, message: 'Missing password' });
    if (password !== ADMIN_PASSWORD) return res.status(401).json({ success: false, message: 'Invalid password' });
    return res.json({ success: true, message: 'Password valid' });
  } catch (err) {
    console.error('[kiosk-validate] error', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.post('/kiosk-control', async (req, res) => {
  try {
    const { password, action } = req.body || {};
    if (!password) return res.status(400).json({ success: false, message: 'Missing password' });
    if (!action) return res.status(400).json({ success: false, message: 'Missing action' });

    // Simple password check
    if (password !== ADMIN_PASSWORD) {
      return res.status(401).json({ success: false, message: 'Invalid password' });
    }

    const act = String(action).toLowerCase();
    if (!['shutdown', 'reboot'].includes(act)) {
      return res.status(400).json({ success: false, message: 'Invalid action' });
    }

    // If ALLOW_SHUTDOWN is not enabled, do not execute system commands — safe default
    if (!ALLOW_SHUTDOWN) {
      console.log(`[kiosk-control] Simulated ${act} (ALLOW_SHUTDOWN!=1)`);
      return res.json({ success: true, message: `Simulated ${act}. To enable real execution set ALLOW_SHUTDOWN=1` });
    }

    // Map actions to commands — use full path to be explicit
    const COMMANDS = {
      shutdown: '/sbin/shutdown -h now',
      reboot: '/sbin/reboot',
    };

    const cmd = COMMANDS[act];
    console.log('[kiosk-control] executing:', cmd);

    // Exec with sudo to ensure privileges. It's recommended to create a sudoers
    // entry so the kiosk user can run only these commands without a password.
    const fullCmd = `sudo ${cmd}`;
    const { stdout, stderr } = await exec(fullCmd);
    console.log('[kiosk-control] stdout:', stdout);
    if (stderr) console.warn('[kiosk-control] stderr:', stderr);

    return res.json({ success: true, message: `${act} command executed` });
  } catch (err) {
    console.error('[kiosk-control] error', err);
    return res.status(500).json({ success: false, message: 'Server error', details: String(err) });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`kiosk-control-server listening on port ${PORT}. ALLOW_SHUTDOWN=${ALLOW_SHUTDOWN}`);
});
