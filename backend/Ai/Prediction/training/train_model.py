import os

# ==========================================
# SUPPRESS TF WARNING
# ==========================================

os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"

import cv2
import numpy as np
import tensorflow as tf

import keras
from keras import layers, models
from keras.applications import EfficientNetB0
from keras.callbacks import (
    EarlyStopping,
    ReduceLROnPlateau,
    ModelCheckpoint
)
from sklearn.model_selection import train_test_split
from sklearn.utils.class_weight import compute_class_weight


# ==========================================
# PATH CONFIG
# ==========================================

DEFAULT_DATASET_DIR = (
    r"C:\Users\USER\Desktop\MedicalApp"
    r"\backend\Ai\Prediction\dataset\image"
)

DEFAULT_MODEL_DIR = (
    r"C:\Users\USER\Desktop\MedicalApp"
    r"\backend\Ai\Prediction\model"
)

DATASET_DIR = os.getenv(
    "DATASET_DIR",
    DEFAULT_DATASET_DIR
)

MODEL_DIR = os.getenv(
    "MODEL_DIR",
    DEFAULT_MODEL_DIR
)

MODEL_PATH = os.path.join(
    MODEL_DIR,
    "wound_prediction_model.h5"
)

os.makedirs(
    MODEL_DIR,
    exist_ok=True
)


# ==========================================
# TRAIN CONFIG
# ==========================================

IMG_SIZE = 224

BATCH_SIZE = 16

STAGE1_EPOCHS = 20
STAGE2_EPOCHS = 20

TOTAL_EPOCHS = (
    STAGE1_EPOCHS
    + STAGE2_EPOCHS
)

TEST_SIZE = 0.20

RANDOM_STATE = 42


# ==========================================
# CLASS NAMES
# ==========================================

CLASS_NAMES = [
    "แผลฉีกขาดขนาดเล็ก",
    "แผลฉีกขาดขนาดใหญ่",
    "แผลถลอก",
    "แผลน้ำร้อนลวก",
    "แผลฟกช้ำ",
    "ไม่มีบาดแผล"
]

NUM_CLASSES = len(CLASS_NAMES)


# ==========================================
# READ IMAGE
# รองรับชื่อ folder ภาษาไทย
# ==========================================

def read_image_unicode(path):

    try:

        data = np.fromfile(
            path,
            dtype=np.uint8
        )

        image = cv2.imdecode(
            data,
            cv2.IMREAD_COLOR
        )

        return image

    except Exception:

        return None


# ==========================================
# FEATURE EXTRACTION
# ต้องเหมือนกับระบบ Prediction
# ==========================================

def extract_wound_features(image):

    h, w, _ = image.shape

    # ======================================
    # Convert BGR -> Gray
    # ======================================

    gray = cv2.cvtColor(
        image,
        cv2.COLOR_BGR2GRAY
    )

    # ======================================
    # Area
    # ======================================

    _, mask = cv2.threshold(
        gray,
        120,
        255,
        cv2.THRESH_BINARY_INV
    )

    area_ratio = (
        np.sum(mask > 0)
        / (h * w)
    )

    # ======================================
    # Length
    # ======================================

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

    # ======================================
    # Edge
    # ======================================

    edges = cv2.Canny(
        gray,
        100,
        200
    )

    edge_density = (
        np.sum(edges > 0)
        / (h * w)
    )

    # ======================================
    # Red Intensity
    # ======================================

    red_intensity = (
        np.mean(image[:, :, 2])
        / 255.0
    )

    depth_score = (
        red_intensity
        + edge_density
    )

    # ======================================
    # Return Features
    # ======================================

    return np.array(
        [
            area_ratio,
            length_ratio,
            depth_score
        ],
        dtype=np.float32
    )


# ==========================================
# LOAD DATASET
# ==========================================

def load_dataset(dataset_dir):

    X_img = []
    X_feat = []
    y = []

    print()
    print("==========================================")
    print("Loading Dataset")
    print("==========================================")
    print(
        "Dataset:",
        dataset_dir
    )
    print()

    # ======================================
    # Loop Classes
    # ======================================

    for label, class_name in enumerate(CLASS_NAMES):

        class_path = os.path.join(
            dataset_dir,
            class_name
        )

        if not os.path.exists(class_path):

            print(
                f"[WARNING] Missing folder: "
                f"{class_name}"
            )

            continue

        class_count = 0

        # ==================================
        # Loop Images
        # ==================================

        for file_name in os.listdir(class_path):

            file_path = os.path.join(
                class_path,
                file_name
            )

            # Skip directories
            if not os.path.isfile(file_path):
                continue

            image = read_image_unicode(
                file_path
            )

            if image is None:

                print(
                    f"[WARNING] Cannot read: "
                    f"{file_name}"
                )

                continue

            # ==================================
            # Resize
            # ==================================

            image = cv2.resize(
                image,
                (IMG_SIZE, IMG_SIZE)
            )

            # ==================================
            # IMPORTANT
            # EfficientNetB0 ต้องใช้ 3 channels
            # ==================================

            if (
                image.ndim != 3
                or image.shape[2] != 3
            ):

                print(
                    f"[WARNING] Invalid image shape: "
                    f"{file_path} -> "
                    f"{image.shape}"
                )

                continue

            # ==================================
            # Convert BGR -> RGB
            #
            # OpenCV อ่านเป็น BGR
            # EfficientNet ใช้ RGB
            # ==================================

            image = cv2.cvtColor(
                image,
                cv2.COLOR_BGR2RGB
            )

            # ==================================
            # Keep pixel values 0-255
            #
            # ไม่ /255 ตรงนี้
            # เพราะ EfficientNet Keras
            # มี preprocessing ภายใน model
            # ==================================

            image_float = image.astype(
                np.float32
            )

            # ==================================
            # Feature Extraction
            #
            # Feature function เดิมใช้ BGR
            # ดังนั้นต้องใช้ image BGR
            # แยกก่อน RGB conversion
            #
            # เพื่อให้ feature ยังเหมือน
            # ระบบ Prediction เดิม
            # ==================================

            image_for_features = cv2.cvtColor(
                image,
                cv2.COLOR_RGB2BGR
            )

            features = extract_wound_features(
                image_for_features
            )

            # ==================================
            # Append
            # ==================================

            X_img.append(
                image_float
            )

            X_feat.append(
                features
            )

            y.append(
                label
            )

            class_count += 1

        print(
            f"{class_name}: "
            f"{class_count} images"
        )

    # ======================================
    # Check Dataset
    # ======================================

    if len(X_img) == 0:

        raise ValueError(
            "Dataset is empty"
        )

    # ======================================
    # Convert numpy
    # ======================================

    X_img = np.array(
        X_img,
        dtype=np.float32
    )

    X_feat = np.array(
        X_feat,
        dtype=np.float32
    )

    y = np.array(
        y,
        dtype=np.int32
    )

    # ======================================
    # Dataset Debug
    # ======================================

    print()
    print("==========================================")
    print("DATASET SHAPE CHECK")
    print("==========================================")

    print(
        "X_img shape:",
        X_img.shape
    )

    print(
        "X_feat shape:",
        X_feat.shape
    )

    print(
        "y shape:",
        y.shape
    )

    print(
        "Image channels:",
        X_img.shape[-1]
    )

    print(
        "Image min:",
        X_img.min()
    )

    print(
        "Image max:",
        X_img.max()
    )

    # ======================================
    # Verify 3 Channels
    # ======================================

    if X_img.ndim != 4:

        raise ValueError(
            "Image dataset must be "
            "4-dimensional: "
            "(N, 224, 224, 3)"
        )

    if X_img.shape[1:] != (
        IMG_SIZE,
        IMG_SIZE,
        3
    ):

        raise ValueError(
            f"Invalid image shape: "
            f"{X_img.shape[1:]}. "
            f"Expected: "
            f"({IMG_SIZE}, {IMG_SIZE}, 3)"
        )

    # ======================================
    # Verify Features
    # ======================================

    if X_feat.ndim != 2:

        raise ValueError(
            "Feature dataset must be "
            "2-dimensional"
        )

    if X_feat.shape[1] != 3:

        raise ValueError(
            f"Invalid feature shape: "
            f"{X_feat.shape}. "
            f"Expected: (N, 3)"
        )

    print()
    print(
        "✓ Image shape is correct"
    )

    print(
        "✓ Image has 3 channels"
    )

    print(
        "✓ Feature shape is correct"
    )

    print()

    print(
        "Total images:",
        len(X_img)
    )

    return X_img, X_feat, y


# ==========================================
# BUILD MODEL
# ==========================================

def build_model():

    # ======================================
    # Clear previous Keras session
    # ======================================

    tf.keras.backend.clear_session()

    # ======================================
    # Image Input
    # ======================================

    image_input = layers.Input(
        shape=(
            IMG_SIZE,
            IMG_SIZE,
            3
        ),
        name="image_input"
    )

    print()
    print("==========================================")
    print("MODEL INPUT CHECK")
    print("==========================================")

    print(
        "Image input shape:",
        image_input.shape
    )

    # ======================================
    # Data Augmentation
    # ======================================

    augmentation = tf.keras.Sequential(
        [

            layers.RandomFlip(
                "horizontal"
            ),

            layers.RandomRotation(
                0.08
            ),

            layers.RandomZoom(
                0.10
            ),

            layers.RandomContrast(
                0.10
            )

        ],
        name="data_augmentation"
    )

    x = augmentation(
        image_input
    )

    print(
        "Augmented image shape:",
        x.shape
    )

    # ======================================
    # EfficientNetB0
    # ======================================

    print()
    print(
        "Creating EfficientNetB0..."
    )

    print(
        "Expected input:",
        (
            IMG_SIZE,
            IMG_SIZE,
            3
        )
    )

    # ======================================
    # IMPORTANT
    #
    # Explicitly use 3 channels
    # ======================================

    # Use the project venv's Keras/TensorFlow stack.
    # This is the compatible configuration for EfficientNetB0 Imagenet.
    base_model = EfficientNetB0(
        include_top=False,
        weights="imagenet",
        input_shape=(
            IMG_SIZE,
            IMG_SIZE,
            3
        )
    )

    print(
        "EfficientNet input shape:",
        base_model.input_shape
    )

    print(
        "EfficientNet output shape:",
        base_model.output_shape
    )

    # ======================================
    # Verify EfficientNet Input
    # ======================================

    if base_model.input_shape[-1] != 3:

        raise ValueError(
            "EfficientNetB0 is not using "
            "3-channel input!"
        )

    print(
        "✓ EfficientNetB0 uses 3 channels"
    )

    # ======================================
    # Freeze EfficientNet
    # ======================================

    base_model.trainable = False

    x = base_model(
        x,
        training=False
    )

    # ======================================
    # Global Pooling
    # ======================================

    x = layers.GlobalAveragePooling2D()(x)

    x = layers.Dropout(
        0.4
    )(x)

    # ======================================
    # Feature Input
    # ======================================

    feature_input = layers.Input(
        shape=(3,),
        name="feature_input"
    )

    # ======================================
    # Feature Dense
    # ======================================

    f = layers.Dense(
        32,
        activation="relu"
    )(feature_input)

    f = layers.Dropout(
        0.2
    )(f)

    # ======================================
    # Combine Image + Features
    # ======================================

    combined = layers.concatenate(
        [
            x,
            f
        ]
    )

    combined = layers.Dense(
        128,
        activation="relu"
    )(combined)

    combined = layers.Dropout(
        0.4
    )(combined)

    # ======================================
    # Output
    # ======================================

    output = layers.Dense(
        NUM_CLASSES,
        activation="softmax",
        name="prediction"
    )(combined)

    # ======================================
    # Final Model
    # ======================================

    model = models.Model(
        inputs=[
            image_input,
            feature_input
        ],
        outputs=output
    )

    # ======================================
    # Compile
    # ======================================

    model.compile(
        optimizer=tf.keras.optimizers.Adam(
            learning_rate=1e-4
        ),

        loss=(
            "sparse_categorical_crossentropy"
        ),

        metrics=[
            "accuracy"
        ]
    )

    print()
    print(
        "✓ Model created successfully"
    )

    return model, base_model


# ==========================================
# TRAIN
# ==========================================

def train_and_save(
    dataset_dir=DATASET_DIR,
    model_path=MODEL_PATH,
    batch_size=BATCH_SIZE
):

    # ======================================
    # Load Dataset
    # ======================================

    X_img, X_feat, y = load_dataset(
        dataset_dir
    )

    # ======================================
    # Train / Validation Split
    #
    # stratify=y สำคัญมาก
    # ======================================

    (
        X_img_train,
        X_img_val,
        X_feat_train,
        X_feat_val,
        y_train,
        y_val

    ) = train_test_split(

        X_img,
        X_feat,
        y,

        test_size=TEST_SIZE,

        random_state=RANDOM_STATE,

        stratify=y
    )

    # ======================================
    # Print Split
    # ======================================

    print()
    print(
        "=========================================="
    )

    print(
        "TRAIN / VALIDATION SPLIT"
    )

    print(
        "=========================================="
    )

    print(
        "Training images:",
        len(X_img_train)
    )

    print(
        "Validation images:",
        len(X_img_val)
    )

    # ======================================
    # Class Weight
    # ======================================

    classes = np.unique(
        y_train
    )

    class_weights_array = (
        compute_class_weight(
            class_weight="balanced",
            classes=classes,
            y=y_train
        )
    )

    class_weights = {

        int(cls): float(weight)

        for cls, weight

        in zip(
            classes,
            class_weights_array
        )
    }

    print()
    print(
        "Class Weights:"
    )

    for cls, weight in class_weights.items():

        print(
            f"{CLASS_NAMES[cls]}: "
            f"{weight:.4f}"
        )

    # ======================================
    # Build Model
    # ======================================

    model, base_model = build_model()

    print()
    print(
        "=========================================="
    )

    print(
        "MODEL SUMMARY"
    )

    print(
        "=========================================="
    )

    model.summary()

    # ======================================
    # Callbacks
    # ======================================

    checkpoint = ModelCheckpoint(

        model_path,

        monitor="val_accuracy",

        save_best_only=True,

        mode="max",

        verbose=1
    )

    early_stopping = EarlyStopping(

        monitor="val_accuracy",

        patience=8,

        mode="max",

        restore_best_weights=True,

        verbose=1
    )

    reduce_lr = ReduceLROnPlateau(

        monitor="val_loss",

        factor=0.3,

        patience=3,

        min_lr=1e-7,

        verbose=1
    )

    callbacks = [

        checkpoint,

        early_stopping,

        reduce_lr

    ]

    # ======================================
    # STAGE 1
    # Transfer Learning
    # ======================================

    print()
    print(
        "=========================================="
    )

    print(
        "STAGE 1: Transfer Learning"
    )

    print(
        "=========================================="
    )

    history_stage1 = model.fit(

        [
            X_img_train,
            X_feat_train
        ],

        y_train,

        validation_data=(

            [
                X_img_val,
                X_feat_val
            ],

            y_val
        ),

        epochs=STAGE1_EPOCHS,

        batch_size=batch_size,

        class_weight=class_weights,

        callbacks=callbacks,

        verbose=1
    )

    # ======================================
    # STAGE 2
    # Fine Tuning
    # ======================================

    print()
    print(
        "=========================================="
    )

    print(
        "STAGE 2: Fine Tuning"
    )

    print(
        "=========================================="
    )

    # ======================================
    # Unfreeze EfficientNet
    # ======================================

    base_model.trainable = True

    # ======================================
    # Freeze all except last 30 layers
    # ======================================

    for layer in base_model.layers[:-30]:

        layer.trainable = False

    # ======================================
    # Keep BatchNormalization frozen
    # ======================================

    for layer in base_model.layers[-30:]:

        if isinstance(
            layer,
            layers.BatchNormalization
        ):

            layer.trainable = False

    # ======================================
    # Print Trainable Layers
    # ======================================

    trainable_count = sum(

        1

        for layer in base_model.layers

        if layer.trainable
    )

    print()
    print(
        "EfficientNet trainable layers:",
        trainable_count
    )

    # ======================================
    # Recompile
    # ======================================

    model.compile(

        optimizer=tf.keras.optimizers.Adam(

            learning_rate=1e-5
        ),

        loss=(
            "sparse_categorical_crossentropy"
        ),

        metrics=[
            "accuracy"
        ]
    )

    # ======================================
    # Fine Tune
    # ======================================

    model.fit(

        [
            X_img_train,
            X_feat_train
        ],

        y_train,

        validation_data=(

            [
                X_img_val,
                X_feat_val
            ],

            y_val
        ),

        initial_epoch=STAGE1_EPOCHS,

        epochs=TOTAL_EPOCHS,

        batch_size=batch_size,

        class_weight=class_weights,

        callbacks=callbacks,

        verbose=1
    )

    # ======================================
    # Load Best Model
    # ======================================

    print()
    print(
        "=========================================="
    )

    print(
        "Loading Best Model"
    )

    print(
        "=========================================="
    )

    if not os.path.exists(model_path):

        raise FileNotFoundError(
            f"Best model was not created: "
            f"{model_path}"
        )

    best_model = tf.keras.models.load_model(
        model_path
    )

    # ======================================
    # Validate Best Model Input
    # ======================================

    print()
    print(
        "Best model input shapes:"
    )

    for model_input in best_model.inputs:

        print(
            model_input.name,
            model_input.shape
        )

    # ======================================
    # Validation Evaluation
    # ======================================

    loss, accuracy = best_model.evaluate(

        [
            X_img_val,
            X_feat_val
        ],

        y_val,

        verbose=0
    )

    # ======================================
    # Result
    # ======================================

    print()
    print(
        "=========================================="
    )

    print(
        "FINAL RESULT"
    )

    print(
        "=========================================="
    )

    print(
        f"Validation Loss: "
        f"{loss:.4f}"
    )

    print(
        f"Validation Accuracy: "
        f"{accuracy:.4f}"
    )

    print(
        f"Validation Accuracy: "
        f"{accuracy * 100:.2f}%"
    )

    print()

    print(
        "Model saved:"
    )

    print(
        model_path
    )

    return {

        "accuracy": float(
            accuracy
        ),

        "model_path": model_path
    }


# ==========================================
# MAIN
# ==========================================

if __name__ == "__main__":

    print()
    print(
        "=========================================="
    )

    print(
        "WOUND CLASSIFICATION TRAINING"
    )

    print(
        "=========================================="
    )

    print(
        "TensorFlow:",
        tf.__version__
    )

    print(
        "Keras:",
        tf.keras.__version__
        if hasattr(
            tf.keras,
            "__version__"
        )
        else "Unknown"
    )

    print(
        "Image Size:",
        IMG_SIZE
    )

    print(
        "Batch Size:",
        BATCH_SIZE
    )

    print(
        "Stage 1 Epochs:",
        STAGE1_EPOCHS
    )

    print(
        "Stage 2 Epochs:",
        STAGE2_EPOCHS
    )

    print(
        "Total Epochs:",
        TOTAL_EPOCHS
    )

    print(
        "Classes:",
        NUM_CLASSES
    )

    print()

    result = train_and_save()

    print()
    print(
        "=========================================="
    )

    print(
        "TRAINING COMPLETE"
    )

    print(
        "=========================================="
    )

    print(
        "Final Accuracy:",
        result["accuracy"]
    )

    print(
        "Model:",
        result["model_path"]
    )