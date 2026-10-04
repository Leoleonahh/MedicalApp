import cv2
import numpy as np

IMG_SIZE = 224


def load_image(image_bytes):
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if img is None:
        raise ValueError("Invalid image")

    img = cv2.resize(img, (IMG_SIZE, IMG_SIZE))

    # Match training pipeline exactly:
    # - OpenCV reads BGR
    # - EfficientNet model expects RGB
    # - Keep pixel values in 0..255, do not divide by 255 here
    img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    img_float = img_rgb.astype(np.float32)

    return img, img_float