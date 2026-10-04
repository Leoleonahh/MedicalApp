import cv2
import numpy as np

def extract_wound_features(image):
    h, w, _ = image.shape
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    _, mask = cv2.threshold(gray, 120, 255, cv2.THRESH_BINARY_INV)

    wound_pixels = np.sum(mask > 0)
    area_ratio = wound_pixels / (h * w)

    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if contours:
        c = max(contours, key=cv2.contourArea)
        x, y, bw, bh = cv2.boundingRect(c)
        length_ratio = max(bw, bh) / max(h, w)
    else:
        length_ratio = 0.0

    edges = cv2.Canny(gray, 100, 200)
    edge_density = np.sum(edges > 0) / (h * w)
    red_intensity = np.mean(image[:, :, 2]) / 255.0

    depth_score = red_intensity + edge_density

    return np.array([area_ratio, length_ratio, depth_score], dtype=np.float32)