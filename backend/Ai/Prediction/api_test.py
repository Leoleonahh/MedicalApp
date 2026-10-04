from flask import Flask, request, jsonify
import os
import tempfile

from predict_service import predict_wound

app = Flask(__name__)


@app.route("/predict", methods=["POST"])
def predict():

    if "image" not in request.files:
        return jsonify({
            "success": False,
            "error": "Image is required"
        }), 400

    file = request.files["image"]

    if file.filename == "":
        return jsonify({
            "success": False,
            "error": "No image selected"
        }), 400

    image_path = None

    try:

        suffix = os.path.splitext(file.filename)[1]

        with tempfile.NamedTemporaryFile(
            delete=False,
            suffix=suffix
        ) as temp:

            file.save(temp.name)
            image_path = temp.name

        # ==============================
        # เรียก Model
        # ==============================

        result = predict_wound(image_path)

        # ==============================
        # ลบไฟล์ชั่วคราว
        # ==============================

        if os.path.exists(image_path):
            os.remove(image_path)

        # ==============================
        # ตรวจสอบผลลัพธ์จาก model
        # ==============================

        if not result.get("success", True):
            return jsonify(result), 400

        # ==============================
        # ส่งผลกลับ Postman
        # ==============================

        return jsonify(result), 200

    except Exception as e:

        if image_path and os.path.exists(image_path):
            os.remove(image_path)

        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=5001,
        debug=True
    )