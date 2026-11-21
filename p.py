import matplotlib.pyplot as plt
import seaborn as sns
import numpy as np
from sklearn.metrics import classification_report, accuracy_score

# Nama kelas (4 mahasiswa terdaftar + 1 kategori tidak terdaftar = 5x5 kotak)
classes = [
    'Mahasiswa 1',
    'Mahasiswa 2',
    'Mahasiswa 3',
    'Mahasiswa 4',
    'Tidak Terdaftar'
]

# Matriks 5x5 (Baris = Kondisi Aktual, Kolom = Prediksi Sistem)
# Masing-masing kelas diuji 10 kali (Total = 50 percobaan)
cm = np.array([
    [10,  0,  0,  0,  0],  # Aktual: Mahasiswa 1 (10 benar)
    [ 0,  9,  0,  0,  1],  # Aktual: Mahasiswa 2 (9 benar, 1 ditolak karena redup)
    [ 0,  0, 10,  0,  0],  # Aktual: Mahasiswa 3 (10 benar)
    [ 0,  0,  1,  9,  0],  # Aktual: Mahasiswa 4 (9 benar, 1 tertukar ke Mahasiswa 3)
    [ 0,  0,  0,  0, 10],  # Aktual: Tidak Terdaftar (10 benar ditolak)
])

# Rekonstruksi y_true dan y_pred untuk laporan terminal
y_true = []
y_pred = []
for i in range(len(classes)):
    for j in range(len(classes)):
        count = cm[i, j]
        y_true.extend([i] * count)
        y_pred.extend([j] * count)

print("=== HASIL EVALUASI MULTI-KELAS (5 KELAS, n = 50) ===")
print(f"Akurasi Keseluruhan : {accuracy_score(y_true, y_pred)*100:.2f}%\n")
print(classification_report(y_true, y_pred, target_names=classes))

# Generate Gambar Confusion Matrix 5x5
plt.figure(figsize=(8, 6.5))
sns.heatmap(
    cm,
    annot=True,
    fmt='d',
    cmap='Blues',
    cbar=True,
    xticklabels=classes,
    yticklabels=classes,
    annot_kws={"size": 13, "weight": "bold"}
)

plt.title('Confusion Matrix Pengujian Identifikasi Wajah (n = 50)', fontsize=12, fontweight='bold', pad=14)
plt.xlabel('Prediksi Sistem', fontsize=10, fontweight='bold', labelpad=10)
plt.ylabel('Kondisi Aktual', fontsize=10, fontweight='bold', labelpad=10)
plt.xticks(rotation=20, ha='right')
plt.yticks(rotation=0)
plt.tight_layout()
plt.savefig('confusion_matrix_multikelas.png', dpi=300)
plt.show()