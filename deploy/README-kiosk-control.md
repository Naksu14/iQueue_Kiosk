# iQueue kiosk-control deploy

This folder contains helper files to install the kiosk-control server as a systemd service and allow the kiosk user to perform shutdown/reboot from the UI.

Files
- `iqueue-kiosk-control.service` - systemd unit you can install to run `kiosk-control-server.js` as the `iqueue` user with `ALLOW_SHUTDOWN=1`.
- `iqueue-kiosk-control.sudoers` - sudoers snippet (install to `/etc/sudoers.d/iqueue-kiosk`) that permits `iqueue` to run `/sbin/shutdown` and `/sbin/reboot` without a password.
- `install-kiosk-control.sh` - convenience script that copies the files into place and enables the service. Run it as a normal user with sudo privileges.

Important security notes
- The recommended approach is to run the server as an unprivileged user (`iqueue`) and use a narrow sudoers snippet that only allows the shutdown/reboot binaries. Do NOT run the server as root unless you understand the security implications.
- Make sure to restrict `ALLOWED_ORIGINS` in the server environment if the kiosk UI is reachable over a network.

Installation (quick)
1. From the repository root, run:

```bash
# run as a normal user with sudo privileges
./deploy/install-kiosk-control.sh
```

2. Inspect the service status and logs:

```bash
sudo systemctl status iqueue-kiosk-control
sudo journalctl -u iqueue-kiosk-control -f
```

3. Test via the UI: the shutdown/reboot actions will now execute for real (be careful).

If you prefer a manual install:

```bash
# copy sudoers
sudo cp deploy/iqueue-kiosk-control.sudoers /etc/sudoers.d/iqueue-kiosk
sudo chmod 0440 /etc/sudoers.d/iqueue-kiosk
sudo visudo -c

# copy service
sudo cp deploy/iqueue-kiosk-control.service /etc/systemd/system/iqueue-kiosk-control.service
sudo systemctl daemon-reload
sudo systemctl enable --now iqueue-kiosk-control.service
```

Testing and troubleshooting
- To verify the sudoers entry: `sudo -l -U iqueue` (run as a sudoer)
- To check whether the server executed the action, look in the server logs (syslog/journal) for lines like:
  - `[kiosk-control] executing: /sbin/reboot`
  - or errors from `sudo` in the logs

If you want an extra safe test before enabling real reboots, modify `kiosk-control-server.js` to run a harmless command (e.g., `touch /tmp/kiosk-test`) while you test the UI. Revert when ready.
kiosk-control-server

This small server accepts POST requests from the kiosk UI to perform control actions (shutdown, reboot).

Files:
- `kiosk-control-server.js` - Express server. Defaults:
  - PORT=3001
  - KIOSK_ADMIN_PASSWORD=admin
  - ALLOW_SHUTDOWN=0 (safe default: do not run system commands)

Usage (development)

1) Start the server (development, simulated mode):

```bash
# run in project root
node kiosk-control-server.js
# or with env vars
KIOSK_ADMIN_PASSWORD=mysecret ALLOW_SHUTDOWN=0 node kiosk-control-server.js
```

2) From the kiosk UI the modal already POSTs to http://localhost:3001/kiosk-control. It sends JSON `{ password, action }`.

Enable real shutdown/reboot (production)

1) Ensure you understand the security implications: do NOT expose this server to the public internet.

2) Configure a secure password and enable ALLOW_SHUTDOWN:

```bash
sudo cp deploy/iqueue-scanner.env /etc/default/iq-kiosk-control.env # optional
export KIOSK_ADMIN_PASSWORD="very-strong-password"
export ALLOW_SHUTDOWN=1
```

3) Configure sudoers so the kiosk user can run only the shutdown/reboot commands without a password. Create `/etc/sudoers.d/iqueue-kiosk-control` with:

```
# Allow user 'iqueue' to run shutdown and reboot without password
iqueue ALL=(root) NOPASSWD: /sbin/shutdown, /sbin/reboot
```

Make sure the file permissions are correct:

```bash
sudo chmod 0440 /etc/sudoers.d/iqueue-kiosk-control
```

4) Start the server as the kiosk user (or via systemd). Example run as the kiosk user:

```bash
sudo -u iqueue KIOSK_ADMIN_PASSWORD=yourpass ALLOW_SHUTDOWN=1 node kiosk-control-server.js
```

Optional: Create a systemd service to run the server on boot. (Not included automatically.)

Security notes

- Keep `KIOSK_ADMIN_PASSWORD` secret and change the default.
- Prefer running the server bound only to localhost and the kiosk workstation network.
- Use the `ALLOW_SHUTDOWN` flag to prevent accidental shutdowns while testing.

```bash
# quick test (simulated)
curl -X POST http://localhost:3001/kiosk-control -H 'Content-Type: application/json' -d '{"password":"admin","action":"shutdown"}'
```
