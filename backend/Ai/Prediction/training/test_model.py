import os
import cv2
import numpy as np
import tensorflow as tf

from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix
)

from matplotlib import font_manager
import matplotlib.pyplot as plt


# ==========================================
# Thai font config for matplotlib
# ==========================================


def configure_matplotlib_thai_font():

    candidate_fonts = [
        "Noto Sans Thai",
        "Noto Sans Thai UI",
        "Leelawadee UI",
        "Tahoma",
        "Microsoft Sans Serif",
        "Nirmala UI",
        "TH Sarabun New",
        "DejaVu Sans",
    ]

    available_fonts = {
        font.name
        for font in font_manager.fontManager.ttflist
    }

    for font_name in candidate_fonts:

        if font_name in available_fonts:

            plt.rcParams["font.family"] = font_name
            plt.rcParams["axes.unicode_minus"] = False
            return

    plt.rcParams["font.family"] = "DejaVu Sans"
    plt.rcParams["axes.unicode_minus"] = False


configure_matplotlib_thai_font()


# ==========================================
# SUPPRESS TF WARNING
# ==========================================

os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"


# ==========================================
# PATH CONFIG
# ==========================================

MODEL_PATH = r"C:\Users\USER\Desktop\MedicalApp\backend\Ai\Prediction\model\wound_prediction_model.h5"

TEST_DATASET_DIR = r"C:\Users\USER\Desktop\MedicalApp\backend\Ai\Prediction\dataset\test"


# ==========================================
# CONFIG
# ==========================================

IMG_SIZE = 224

CLASS_NAMES = [
    "แผลฉีกขาดขนาดเล็ก",
    "แผลฉีกขาดขนาดใหญ่",
    "แผลถลอก",
    "แผลน้ำร้อนลวก",
    "แผลฟกช้ำ",
    "ไม่มีบาดแผล"
]


# ==========================================
# READ IMAGE
# รองรับ path ภาษาไทย
# ==========================================

def read_image_unicode(path):

    try:

        data = np.fromfile(
            path,
            dtype=np.uint8
        )

        return cv2.imdecode(
            data,
            cv2.IMREAD_COLOR
        )

    except Exception:

        return None


# ==========================================
# EXTRACT WOUND FEATURES
# ต้องเหมือน train_model.py
# ==========================================

def extract_wound_features(image):

    h, w, _ = image.shape

    # -----------------------------
    # Gray
    # -----------------------------

    gray = cv2.cvtColor(
        image,
        cv2.COLOR_BGR2GRAY
    )

    # -----------------------------
    # Threshold
    # -----------------------------

    _, mask = cv2.threshold(
        gray,
        120,
        255,
        cv2.THRESH_BINARY_INV
    )

    # -----------------------------
    # Area ratio
    # -----------------------------

    area_ratio = (
        np.sum(mask > 0)
        / (h * w)
    )

    # -----------------------------
    # Contour
    # -----------------------------

    contours, _ = cv2.findContours(
        mask,
        cv2.RETR_EXTERNAL,
        cv2.CHAIN_APPROX_SIMPLE
    )

    if contours:

        c = max(
            contours,
            key=cv2.contourArea
        )

        _, _, bw, bh = cv2.boundingRect(c)

        length_ratio = (
            max(bw, bh)
            / max(h, w)
        )

    else:

        length_ratio = 0.0

    # -----------------------------
    # Edge density
    # -----------------------------

    edges = cv2.Canny(
        gray,
        100,
        200
    )

    edge_density = (
        np.sum(edges > 0)
        / (h * w)
    )

    # -----------------------------
    # Red intensity
    # -----------------------------

    red_intensity = (
        np.mean(image[:, :, 2])
        / 255.0
    )

    # -----------------------------
    # Depth score
    # -----------------------------

    depth_score = (
        red_intensity
        + edge_density
    )

    return np.array(
        [
            area_ratio,
            length_ratio,
            depth_score
        ],
        dtype=np.float32
    )


# ==========================================
# LOAD MODEL
# ==========================================

print("\n====================================")
print("กำลังโหลดโมเดล...")
print("====================================")

if not os.path.exists(MODEL_PATH):

    raise FileNotFoundError(
        f"ไม่พบโมเดล:\n{MODEL_PATH}"
    )

model = tf.keras.models.load_model(
    MODEL_PATH,
    compile=False
)

print("โหลดโมเดลสำเร็จ!")


# ==========================================
# LOAD TEST DATASET
# ==========================================

X_img = []
X_feat = []
y_true = []

print("\n====================================")
print("กำลังโหลดชุดทดสอบ...")
print("====================================")


for label, class_name in enumerate(CLASS_NAMES):

    class_path = os.path.join(
        TEST_DATASET_DIR,
        class_name
    )

    if not os.path.exists(class_path):

        print(
            f"WARNING: Missing folder: {class_name}"
        )

        continue

    files = os.listdir(class_path)

    count = 0

    for file in files:

        file_path = os.path.join(
            class_path,
            file
        )

        # -----------------------------
        # อ่านรูป
        # -----------------------------

        img = read_image_unicode(
            file_path
        )

        if img is None:

            print(
                f"Cannot read: {file_path}"
            )

            continue

        # -----------------------------
        # Resize
        # -----------------------------

        img = cv2.resize(
            img,
            (IMG_SIZE, IMG_SIZE)
        )

        # -----------------------------
        # Match training pipeline exactly
        # BGR -> RGB and keep 0..255 values
        # -----------------------------

        img_rgb = cv2.cvtColor(
            img,
            cv2.COLOR_BGR2RGB
        )

        img_float = img_rgb.astype(
            np.float32
        )

        # -----------------------------
        # Features (must match training)
        # -----------------------------

        img_for_features = cv2.cvtColor(
            img_rgb,
            cv2.COLOR_RGB2BGR
        )

        features = extract_wound_features(
            img_for_features
        )

        # -----------------------------
        # Append
        # -----------------------------

        X_img.append(
            img_float
        )

        X_feat.append(
            features
        )

        y_true.append(
            label
        )

        count += 1

    print(
        f"{class_name}: {count} ภาพ"
    )


# ==========================================
# CONVERT NUMPY
# ==========================================

X_img = np.array(
    X_img,
    dtype=np.float32
)

X_feat = np.array(
    X_feat,
    dtype=np.float32
)

y_true = np.array(
    y_true,
    dtype=np.int32
)


print("\n====================================")
print("สรุปข้อมูลชุดทดสอบ")
print("====================================")

print(
    "จำนวนภาพรวม:",
    len(y_true)
)

print(
    "รูปแบบภาพ:",
    X_img.shape
)

print(
    "รูปแบบ feature:",
    X_feat.shape
)


# ==========================================
# PREDICT
# ==========================================

print("\n====================================")
print("กำลังทำนาย...")
print("====================================")


predictions = model.predict(
    [X_img, X_feat],
    verbose=1
)


# ==========================================
# GET PREDICTED CLASS
# ==========================================

y_pred = np.argmax(
    predictions,
    axis=1
)


# ==========================================
# ACCURACY
# ==========================================

accuracy = accuracy_score(
    y_true,
    y_pred
)

print("\n====================================")
print("ผลลัพธ์")
print("====================================")

print(
    f"ความแม่นยำ: {accuracy * 100:.2f}%"
)


# ==========================================
# CLASSIFICATION REPORT
# ==========================================

print("\n====================================")
print("รายงานการจำแนก")
print("====================================")

print(
    classification_report(
        y_true,
        y_pred,
        target_names=CLASS_NAMES,
        digits=4,
        zero_division=0
    )
)


# ==========================================
# CONFUSION MATRIX
# ==========================================

cm = confusion_matrix(
    y_true,
    y_pred
)

print("\n====================================")
print("เมทริกซ์สับสน (Confusion Matrix)")
print("====================================")

print(cm)


# ==========================================
# PLOT CONFUSION MATRIX
# ==========================================

plt.figure(
    figsize=(10, 8)
)

plt.imshow(cm)

plt.title(
    "เมทริกซ์สับสน"
)

plt.colorbar()

plt.xticks(
    range(len(CLASS_NAMES)),
    CLASS_NAMES,
    rotation=45,
    ha="right"
)

plt.yticks(
    range(len(CLASS_NAMES)),
    CLASS_NAMES
)

plt.xlabel(
    "ป้ายกำกับที่ทำนาย"
)

plt.ylabel(
    "ป้ายกำกับจริง"
)


# แสดงตัวเลขในแต่ละช่อง

for i in range(len(CLASS_NAMES)):

    for j in range(len(CLASS_NAMES)):

        plt.text(
            j,
            i,
            cm[i, j],
            ha="center",
            va="center"
        )


plt.tight_layout()

# ==========================================
# SAVE CONFUSION MATRIX
# ==========================================

output_path = os.path.join(
    os.path.dirname(__file__),
    "confusion_matrix.png"
)

plt.savefig(
    output_path,
    dpi=300,
    bbox_inches="tight"
)

print(
    f"\nบันทึกเมทริกซ์สับสนไว้ที่:\n{output_path}"
)

plt.show()