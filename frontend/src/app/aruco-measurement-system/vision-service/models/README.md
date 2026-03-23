# YOLO model weights (windows, doors, switchboards)

Place the trained `best.pt` file for each type in the corresponding folder:

- **windows/best.pt** — Window detection model
- **doors/best.pt** — Door detection model  
- **switchboards/best.pt** — Switchboard detection model

Copy these from your training output (e.g. from nestup_wallai training or `runs/detect/.../weights/best.pt`).

If a weight file is missing, that detector is skipped and a warning is logged; the rest of the pipeline still runs.

## DigitalOcean / Docker image builds

Weights are **not** committed to git by default (files are large). Before building the production image, ensure each `best.pt` exists under `models/windows/`, `models/doors/`, and `models/switchboards/` locally or in CI.

**Options:**

1. **Copy before deploy** — After training, copy `best.pt` into the three folders, then push to a private branch or run `docker build` from a machine that has the files.
2. **Git LFS** — Track `*.pt` with [Git LFS](https://git-lfs.com/) if your org allows large binaries in the repo.
3. **CI download** — In your pipeline (or a DigitalOcean **build command** that runs before `docker build`), fetch weights from private storage (e.g. DigitalOcean Spaces, S3) using a secret token, into `models/*/` inside `vision-service/`.

ArUco wall measurement in `main.py` does not require YOLO weights; only window/door/switchboard detection needs them.
