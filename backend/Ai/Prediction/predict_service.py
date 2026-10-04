import os
import sys
import json
import logging

# ============================================================
# Configure UTF-8 output
# ============================================================
# Fix UnicodeEncodeError on Windows console (cp1252)
try:
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")
except AttributeError:
    pass


# ============================================================
# Suppress TensorFlow logging
# ============================================================
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"

import cv2
import numpy as np
import tensorflow as tf

from datetime import datetime, timezone, timedelta


# ============================================================
# TensorFlow / Keras logging
# ============================================================
logging.getLogger("tensorflow").setLevel(logging.CRITICAL)
logging.getLogger("tensorflow.python").setLevel(logging.CRITICAL)
logging.getLogger("keras").setLevel(logging.CRITICAL)
logging.getLogger("absl").setLevel(logging.CRITICAL)

if hasattr(tf, "get_logger"):
    try:
        tf.get_logger().setLevel("ERROR")
    except Exception:
        pass


# ============================================================
# Import project utilities
# ============================================================
sys.path.insert(
    0,
    os.path.dirname(os.path.abspath(__file__))
)

from utils.image_utils import load_image
from utils.feature_extractor import extract_wound_features
from utils.wound_assessment import assess_wound


# ============================================================
# Wound Classes
# ============================================================
CLASS_NAMES = [
    "แผลฉีกขาดขนาดเล็ก",
    "แผลฉีกขาดขนาดใหญ่",
    "แผลถลอก",
    "แผลน้ำร้อนลวก",
    "แผลฟกช้ำ",
    "ไม่มีบาดแผล"
]


# ============================================================
# Load Model
# ============================================================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

MODEL_PATH = os.path.join(
    BASE_DIR,
    "model",
    "wound_prediction_model.h5"
)

if not os.path.exists(MODEL_PATH):
    raise FileNotFoundError(
        f"Model file not found: {MODEL_PATH}"
    )

model = tf.keras.models.load_model(
    MODEL_PATH,
    compile=False
)


# ============================================================
# Predict Function
# ============================================================
def predict_wound(image_path):

    try:

        # ----------------------------------------------------
        # Read image
        # ----------------------------------------------------
        with open(image_path, "rb") as f:
            image_data = f.read()


        # ----------------------------------------------------
        # Preprocess image
        # ----------------------------------------------------
        raw_img, img_norm = load_image(image_data)


        # ----------------------------------------------------
        # Extract wound features
        # ----------------------------------------------------
        features = extract_wound_features(raw_img)


        # ----------------------------------------------------
        # Prepare model inputs
        # ----------------------------------------------------
        img_input = np.expand_dims(
            img_norm,
            axis=0
        )

        feat_input = np.expand_dims(
            features,
            axis=0
        )


        # ----------------------------------------------------
        # Model prediction
        # ----------------------------------------------------
        preds = model.predict(
            [img_input, feat_input],
            verbose=0
        )[0]


        # ----------------------------------------------------
        # Get predicted class
        # ----------------------------------------------------
        idx = int(np.argmax(preds))

        predicted_class = CLASS_NAMES[idx]


        # ----------------------------------------------------
        # Confidence
        # ----------------------------------------------------
        confidence = round(
            float(preds[idx] * 100),
            2
        )


        # ----------------------------------------------------
        # Wound assessment
        # ----------------------------------------------------
        assessment = assess_wound(
            features,
            predicted_class
        )


        # ----------------------------------------------------
        # Prediction date - Thailand timezone (UTC+7)
        # ----------------------------------------------------
        predicted_at = datetime.now(
            timezone(timedelta(hours=7))
        ).strftime("%d/%m/%Y")


        # ----------------------------------------------------
        # Return successful result
        # ----------------------------------------------------
        return {
            "success": True,
            "predicted_class": predicted_class,
            "confidence_percent": confidence,
            "assessment": assessment,
            "predicted_at": predicted_at
        }


    except Exception as e:

        # ----------------------------------------------------
        # Return error result
        # ----------------------------------------------------
        return {
            "success": False,
            "error": str(e)
        }


# ============================================================
# Main
# ============================================================
if __name__ == "__main__":

    # --------------------------------------------------------
    # Check image path argument
    # --------------------------------------------------------
    if len(sys.argv) != 2:

        error_result = {
            "success": False,
            "error": "Image path required as argument"
        }

        print(
            json.dumps(
                error_result,
                ensure_ascii=False
            )
        )

        sys.exit(1)


    # --------------------------------------------------------
    # Get image path
    # --------------------------------------------------------
    image_path = sys.argv[1]


    # --------------------------------------------------------
    # Run prediction
    # --------------------------------------------------------
    result = predict_wound(image_path)


    # --------------------------------------------------------
    # Output JSON
    # --------------------------------------------------------
    print(
        json.dumps(
            result,
            ensure_ascii=False
        )
    )


    # --------------------------------------------------------
    # Exit code
    # --------------------------------------------------------
    sys.exit(
        0 if result.get("success", False) else 1
    )