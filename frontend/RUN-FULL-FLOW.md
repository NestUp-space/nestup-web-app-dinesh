# Run the full flow locally (measure wall → Continue to design → Visualiser)

You need **two** processes. Use two terminals.

**Single port:** The whole site runs on **http://localhost:3000**. The ArUco wall measurement app is built into the Next.js app at **http://localhost:3000/measurements**. One portal, one port.

**Optional:** In `frontend/.env.local` set `NEXT_PUBLIC_SHOW_WALL_MEASURE=true` so the Visualiser page shows the "Open wall measurement app" block. If you prefer to keep it hidden on the main site, leave this unset and open http://localhost:3000/measurements directly.

---

## Terminal 1: Vision service (measurement API)

```powershell
cd frontend\src\app\aruco-measurement-system\vision-service
pip install -r requirements.txt
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

Leave it running. Backend: **http://localhost:8000**

---

## Terminal 2: Next.js (Visualiser + designer + measurements)

```powershell
cd frontend
npm install
npm run dev
```

Leave it running. **http://localhost:3000** (or 3001, 3002 if 3000 is in use — note the port in the terminal).

- Visualiser landing: `http://localhost:<PORT>/visualiser`
- Wall measurement: `http://localhost:<PORT>/measurements`
- Designer (after "Continue to design"): `http://localhost:<PORT>/visualiser/designer`

**Optional env:** Set `NEXT_PUBLIC_MEASUREMENT_API_URL=http://127.0.0.1:8000` in `frontend/.env.local` if the vision service is not on the default host/port.

---

## Test the flow

1. Open **http://localhost:3000/measurements** (single portal on port 3000).
2. Upload or capture a wall image (with ArUco/ChArUco markers) and run measurement.
3. On the **Results** page, click **"Continue to design"**.
4. You should be redirected to the **Visualiser designer** with **one wall already created** using the measured width and height (in mm).
