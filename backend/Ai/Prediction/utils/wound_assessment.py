def assess_wound(features, predicted_class):
    if predicted_class == "ไม่มีบาดแผล":
        return {"wound_size": None}

    area_ratio, length_ratio, depth_score = features

    if area_ratio > 0.15:
        size = "ใหญ่"
    elif area_ratio > 0.05:
        size = "ปานกลาง"
    else:
        size = "เล็ก"

    result = {
        "wound_size": size,
        "area_ratio": round(float(area_ratio), 3)
    }

    if "แผลฉีกขาด" in predicted_class:
        result["length"] = "ยาว" if length_ratio >= 0.2 else "สั้น"
        result["length_ratio"] = round(float(length_ratio), 3)

        result["depth"] = "ลึก" if depth_score >= 0.35 else "ตื้น"
        result["depth_score"] = round(float(depth_score), 3)

    return result