#!/bin/bash
# Navigate to project
cd /home/iqueue/iQueue_Kiosk/iqueue-kiosk

# Start npm server in the background
npm start &

# Wait for the server to start (adjust seconds if needed)
sleep 10

# Launch Chromium in kiosk mode
/usr/bin/chromium-browser --noerrdialogs --kiosk http://localhost:3000 --incognito --disable-restore-session-state --disable-infobars
