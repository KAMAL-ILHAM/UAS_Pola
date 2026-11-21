"""Integrasi modul cv (ekstraksi fitur) dan ml (pencocokan wajah) ke backend."""
import sys
from pathlib import Path

import numpy as np

from errors import AppError

# Tambahkan root repo ke sys.path agar folder /cv dan /ml dapat diimpor
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from cv.encoder import extract_encoding
from ml.matching import match_face

CV_IS_STUB = False
ML_IS_STUB = False


def get_encoding(image: np.ndarray) -> list:
    """Ambil vektor encoding wajah 128-D menggunakan OpenCV & face_recognition."""
    try:
        encoding = extract_encoding(image)
    except ValueError as e:
        err_msg = str(e).lower()
        if "multiple" in err_msg:
            raise AppError(
                422,
                "MULTIPLE_FACES",
                "Terdeteksi lebih dari satu wajah. Pastikan hanya satu wajah di depan kamera.",
            )
        if "invalid_image" in err_msg:
            raise AppError(
                400,
                "INVALID_IMAGE",
                "Format gambar tidak valid atau rusak.",
            )
        raise

    if encoding is None:
        raise AppError(
            422,
            "NO_FACE_DETECTED",
            "Wajah tidak terdeteksi. Gunakan cahaya yang cukup dan hadapkan wajah lurus ke kamera.",
        )

    return list(encoding)