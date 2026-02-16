"""
Télécharge le poids YOLOv8 ‘cap_yolov8.pt’ depuis Roboflow.
Usage :
    python tools/get_cap_model.py --api-key <ROBOFLOW_API_KEY> \
        --workspace cap-defect-detection --project bottle-cap-defect-2 --version 1
Le fichier sera placé dans backend/models/cap_yolov8.pt
"""

import argparse, os, pathlib, sys
from roboflow import Roboflow


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--api-key", required=True)
    p.add_argument("--workspace", required=True)
    p.add_argument("--project", required=True)
    p.add_argument("--version", type=int, default=1)
    args = p.parse_args()

    rf = Roboflow(api_key=args.api_key)
    project = rf.workspace(args.workspace).project(args.project)
    model = project.version(args.version).model
    weight_path = model.download("yolov8").model_path  # returns full path
    dest = pathlib.Path("backend/models/cap_yolov8.pt")
    dest.parent.mkdir(parents=True, exist_ok=True)
    os.replace(weight_path, dest)
    print(f"✅  Modèle téléchargé → {dest.resolve()}")


if __name__ == "__main__":
    sys.exit(main())
