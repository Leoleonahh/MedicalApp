import multer from "multer";
import path from "path";

const storage = multer.diskStorage({

  destination(req, file, cb) {

    cb(null, "assets/uploads/slips");

  },

  filename(req, file, cb) {

    const filename =
      Date.now() +
      path.extname(file.originalname);

    cb(null, filename);

  },

});

export const uploadSlip = multer({

  storage,

  fileFilter(req, file, cb) {

    if (
      file.mimetype.startsWith("image/")
    ) {

      cb(null, true);

    } else {

      cb(
        new Error("Only image allowed")
      );

    }

  },

});