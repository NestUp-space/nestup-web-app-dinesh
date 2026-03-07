# YOLO model weights (windows, doors, switchboards)

Place the trained `best.pt` file for each type in the corresponding folder:

- **windows/best.pt** — Window detection model
- **doors/best.pt** — Door detection model  
- **switchboards/best.pt** — Switchboard detection model

Copy these from your training output (e.g. from nestup_wallai training or `runs/detect/.../weights/best.pt`).

If a weight file is missing, that detector is skipped and a warning is logged; the rest of the pipeline still runs.
