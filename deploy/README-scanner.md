Automatic scanner-server startup and device permissions

This folder contains helper files to run `scanner-server.js` on boot and allow it to read the scanner device under `/dev/input`.

Files added:
- `iqueue-scanner.service` - systemd unit (place in `/etc/systemd/system/iqueue-scanner.service`)
- `99-iqueue-scanner.rules` - example udev rule (place in `/etc/udev/rules.d/99-iqueue-scanner.rules`)
- `start-scanner.sh` - simple helper script to launch the server (optional)

Steps to install on the Raspberry Pi

1) (Optional) Inspect and update values
- Update the `DEVICE_PATH` in the service file to match the symlink under `/dev/input/by-id/` for your scanner.
- You can find the device with:
```bash
ls -l /dev/input/by-id
# example: usb-SM_SM-2D_PRODUCT_HID_KBW_APP-000000000-event-kbd -> /dev/input/event6
```

2) Install the udev rule so the `input` group can read the device
```bash
sudo cp deploy/99-iqueue-scanner.rules /etc/udev/rules.d/99-iqueue-scanner.rules
sudo udevadm control --reload
sudo udevadm trigger
```
This sets device mode to 0660 and group to `input` for the matched vendor/product. Adjust the vendor/product in the rule if necessary.

3) Add the kiosk user to the `input` group (so it can read /dev/input/event*)
```bash
sudo usermod -aG input iqueue
# You must log out / log in or reboot the Pi for group membership to take effect for that user.
```

4) Install the systemd service
```bash
sudo cp deploy/iqueue-scanner.service /etc/systemd/system/iqueue-scanner.service
# Optionally edit the service to set the correct DEVICE_PATH inside the file (Environment=DEVICE_PATH=...)
sudo systemctl daemon-reload
sudo systemctl enable --now iqueue-scanner.service

Alternative (recommended): use the environment file
------------------------------------------------
You can place configuration in `/etc/default/iqueue-scanner` so you won't need to edit the unit file.
Copy the sample env file and edit values:
```bash
sudo cp deploy/iqueue-scanner.env /etc/default/iqueue-scanner
sudo nano /etc/default/iqueue-scanner
```
The systemd unit is written to read the optional `/etc/default/iqueue-scanner` file and will pick up `PORT`, `DEVICE_PATH`, `NODE_BIN` and `SCRIPT_PATH` from it.
```

5) Check that it's running and tail logs
```bash
sudo systemctl status iqueue-scanner.service
sudo journalctl -u iqueue-scanner.service -f
```

6) Test the HTTP API
```bash
curl http://localhost:4001/api/status
# POST to trigger-scan (it will wait until the next scan is presented)
curl -X POST http://localhost:4001/api/trigger-scan
# OR use the SSE stream
curl http://localhost:4001/api/stream-scans
```

Notes & troubleshooting
- If the service cannot open the device, check permissions and that the `iqueue` user is in the `input` group.
- If the device uses a different vendor/product id, update `99-iqueue-scanner.rules` accordingly (use `lsusb` to find ids).
- If you prefer to run the server as root instead, change `User=` and `Group=` in the unit (not recommended).
- You can also start manually with the helper script:
```bash
chmod +x deploy/start-scanner.sh
./deploy/start-scanner.sh 4001 /dev/input/by-id/usb-SM_SM-2D_PRODUCT_HID_KBW_APP-000000000-event-kbd
```

If you want, I can also generate a `systemctl` drop-in that pulls `DEVICE_PATH` from `/etc/default/iqueue-scanner` (EnvironmentFile) so it's easier to change without editing the unit file.