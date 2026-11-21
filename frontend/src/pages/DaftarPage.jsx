import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import CameraView from "../components/CameraView.jsx";
import Alert from "../components/Alert.jsx";
import { registerStudent } from "../api.js";

const MAX_PHOTOS = 10; // sesuai batas backend
const MIN_PHOTOS = 3; // depan, sedikit kiri, sedikit kanan

/** mode: "student" (publik, mahasiswa mendaftar sendiri) atau "admin" (admin menambah mahasiswa). */
export default function DaftarPage({ mode = "student" }) {
  const cameraRef = useRef(null);
  const nextId = useRef(1);

  const [cameraStatus, setCameraStatus] = useState("loading");
  const [nama, setNama] = useState("");
  const [nim, setNim] = useState("");
  const [photos, setPhotos] = useState([]); // { id, blob, url }
  const [consent, setConsent] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const photosRef = useRef(photos);
  photosRef.current = photos;
  useEffect(() => () => photosRef.current.forEach((p) => URL.revokeObjectURL(p.url)), []);

  function addPhoto(blob) {
    setPhotos((prev) => {
      if (prev.length >= MAX_PHOTOS) return prev;
      return [...prev, { id: nextId.current++, blob, url: URL.createObjectURL(blob) }];
    });
  }

  async function takePhoto() {
    try {
      addPhoto(await cameraRef.current.capture());
      setFieldErrors((f) => ({ ...f, photos: undefined }));
    } catch (err) {
      setError(err);
    }
  }

  function onUpload(e) {
    Array.from(e.target.files).forEach(addPhoto);
    e.target.value = "";
    setFieldErrors((f) => ({ ...f, photos: undefined }));
  }

  function removePhoto(id) {
    setPhotos((prev) => {
      const target = prev.find((p) => p.id === id);
      if (target) URL.revokeObjectURL(target.url);
      return prev.filter((p) => p.id !== id);
    });
  }

  function validate() {
    const errors = {};
    if (!nama.trim()) errors.nama = "Nama wajib diisi.";
    if (!/^\d{5,20}$/.test(nim.trim())) errors.nim = "NIM harus berupa angka, 5 sampai 20 digit.";
    if (photos.length < MIN_PHOTOS) errors.photos = `Ambil minimal ${MIN_PHOTOS} foto wajah (sekarang ${photos.length}).`;
    if (!consent) errors.consent = "Persetujuan pemilik wajah wajib dicentang.";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function submit(e) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!validate()) return;

    setSubmitting(true);
    try {
      const res = await registerStudent({ nama: nama.trim(), nim: nim.trim(), photos: photos.map((p) => p.blob) });
      setSuccess(res.data);
      photos.forEach((p) => URL.revokeObjectURL(p.url));
      setPhotos([]);
      setNama("");
      setNim("");
      setConsent(false);
    } catch (err) {
      setError(err);
    } finally {
      setSubmitting(false);
    }
  }

  const readyCount = photos.length >= MIN_PHOTOS;

  return (
    <div className="daftar-wrap">
      <style>{`
        .daftar-wrap,
        .daftar-wrap * {
          box-sizing: border-box;
        }
        .daftar-wrap {
          width: 100%;
          max-width: 100%;
          overflow-x: hidden;
        }

        .daftar-top {
          margin-bottom: 1rem;
        }
        .daftar-top h1 {
          margin: 0 0 0.25rem;
          font-size: 1.65rem;
        }
        .daftar-top .lead {
          margin: 0;
          font-size: 0.95rem;
          line-height: 1.45;
        }

        /* Grid Desktop */
        .daftar-layout {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1.15fr);
          grid-template-areas:
            "info cam"
            "submit cam";
          gap: 1.15rem;
          align-items: start;
        }
        .daftar-box {
          margin: 0 !important;
          width: 100%;
          min-width: 0;
          border-radius: 14px;
        }
        .daftar-area-info { grid-area: info; }
        .daftar-area-cam { grid-area: cam; }
        .daftar-area-submit { grid-area: submit; }

        .daftar-box-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.85rem;
        }
        .daftar-box-head h2 {
          margin: 0;
          font-size: 1.05rem;
        }
        .daftar-pill {
          font-size: 0.72rem;
          font-weight: 700;
          padding: 0.2rem 0.6rem;
          border-radius: 999px;
          background: #e2e8f0;
          color: #334155;
          white-space: nowrap;
        }
        .daftar-pill.ok {
          background: #dcfce7;
          color: #166534;
        }

        /* Input form */
        .daftar-box .field {
          width: 100%;
          margin-bottom: 0.85rem;
        }
        .daftar-box .field:last-child {
          margin-bottom: 0;
        }
        .daftar-box input[type="text"],
        .daftar-box input:not([type="checkbox"]):not([type="file"]) {
          width: 100% !important;
          max-width: 100% !important;
          display: block;
        }

        /* Kamera */
        .daftar-cam-container {
          width: 100%;
          max-width: 440px;
          margin: 0 auto;
        }

        /* Tombol Ambil Foto & Unggah Berkas */
        .daftar-btn-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.6rem;
          margin-top: 0.75rem;
          width: 100%;
        }
        .daftar-btn-row .btn,
        .daftar-upload-label {
          position: relative;
          overflow: hidden;
          display: inline-flex !important;
          align-items: center;
          justify-content: center;
          width: 100% !important;
          min-width: 0;
          min-height: 40px;
          margin: 0 !important;
          padding: 0.5rem 0.6rem !important;
          font-size: 0.84rem;
          text-align: center;
          line-height: 1.2;
          cursor: pointer;
        }
        .daftar-upload-label input[type="file"] {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          opacity: 0;
          cursor: pointer;
        }

        .daftar-guide-text {
          font-size: 0.82rem;
          line-height: 1.45;
          margin: 0.65rem 0 0;
        }

        /* Grid thumbnail foto */
        .daftar-photo-grid {
          list-style: none;
          padding: 0;
          margin: 0.85rem 0 0;
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 0.45rem;
        }
        .daftar-photo-grid li {
          position: relative;
          aspect-ratio: 1 / 1;
          border-radius: 8px;
          overflow: hidden;
          border: 1px solid rgba(0, 0, 0, 0.14);
          background: #f1f5f9;
        }
        .daftar-photo-grid img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .daftar-photo-idx {
          position: absolute;
          bottom: 3px;
          left: 3px;
          background: rgba(15, 23, 42, 0.75);
          color: #ffffff;
          font-size: 0.65rem;
          font-weight: 700;
          padding: 1px 4px;
          border-radius: 4px;
        }
        .daftar-photo-del {
          position: absolute;
          top: 3px;
          right: 3px;
          width: 20px;
          height: 20px;
          border-radius: 999px;
          border: none;
          background: rgba(220, 38, 38, 0.92);
          color: #ffffff;
          font-size: 0.85rem;
          line-height: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          padding: 0;
        }

        /* Kotak centang persetujuan yang rapi & kebal aturan input global */
        .daftar-agree {
          display: flex !important;
          flex-direction: row !important;
          align-items: flex-start !important;
          gap: 0.65rem !important;
          padding: 0.75rem 0.85rem !important;
          margin: 0 !important;
          border-radius: 10px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          font-size: 0.84rem;
          font-weight: 500;
          line-height: 1.45;
          cursor: pointer;
          user-select: none;
          transition: background 0.15s ease, border-color 0.15s ease;
        }
        .daftar-agree.checked {
          background: #eff6ff;
          border-color: #93c5fd;
        }
        .daftar-agree input[type="checkbox"] {
          appearance: auto !important;
          -webkit-appearance: checkbox !important;
          width: 18px !important;
          height: 18px !important;
          min-width: 18px !important;
          min-height: 18px !important;
          max-width: 18px !important;
          max-height: 18px !important;
          flex: 0 0 18px !important;
          margin: 2px 0 0 0 !important;
          padding: 0 !important;
          accent-color: #2563eb;
          cursor: pointer;
        }
        .daftar-agree span {
          flex: 1;
          min-width: 0;
        }

        .daftar-note {
          font-size: 0.78rem;
          line-height: 1.45;
          margin: 0.55rem 0 0.9rem;
        }
        .daftar-save-btn {
          width: 100%;
          min-height: 44px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          font-weight: 600;
          border-radius: 10px;
        }
        .daftar-loader {
          width: 16px;
          height: 16px;
          border: 2.2px solid rgba(255, 255, 255, 0.35);
          border-top-color: #ffffff;
          border-radius: 50%;
          animation: dSpin 0.7s linear infinite;
          flex-shrink: 0;
        }
        @keyframes dSpin {
          to { transform: rotate(360deg); }
        }

        /* Responsive Mobile */
        @media (max-width: 768px) {
          .daftar-top h1 {
            font-size: 1.35rem;
          }
          .daftar-top .lead {
            font-size: 0.85rem;
          }
          .daftar-layout {
            display: flex;
            flex-direction: column;
            gap: 0.85rem;
          }
          .daftar-box {
            padding: 1rem !important;
          }
          .daftar-box-head h2 {
            font-size: 0.98rem;
          }
          .daftar-box input[type="text"],
          .daftar-box input:not([type="checkbox"]):not([type="file"]) {
            min-height: 40px;
            font-size: 0.92rem;
          }
          .daftar-cam-container {
            max-width: 340px;
          }
          .daftar-btn-row {
            gap: 0.5rem;
          }
          .daftar-btn-row .btn,
          .daftar-upload-label {
            font-size: 0.8rem;
            min-height: 38px;
          }
          .daftar-photo-grid {
            grid-template-columns: repeat(4, minmax(0, 1fr));
          }
          .daftar-agree {
            padding: 0.7rem 0.75rem !important;
            font-size: 0.81rem;
          }
          .daftar-note {
            font-size: 0.76rem;
          }
          .daftar-save-btn {
            min-height: 42px;
            font-size: 0.92rem;
          }
        }
      `}</style>

      <div className="daftar-top">
        <h1>{mode === "admin" ? "Tambah Mahasiswa" : "Registrasi Wajah"}</h1>
        <p className="lead">Isi data mahasiswa lalu ambil beberapa foto wajah dari sudut berbeda agar pengenalan lebih akurat.</p>
      </div>

      {success && (
        <Alert tone="success" title="Pendaftaran berhasil">
          {success.nama} ({success.nim}) terdaftar dengan {success.jumlah_foto} foto.{" "}
          {mode === "admin" ? (
            <Link to="/admin/mahasiswa">Kembali ke daftar mahasiswa</Link>
          ) : (
            <Link to="/" className="btn btn-primary btn-sm" style={{ marginTop: "0.4rem", display: "inline-flex" }}>
              Lanjut ke halaman presensi
            </Link>
          )}
        </Alert>
      )}
      {error && (
        <Alert tone="danger" title="Pendaftaran gagal">
          {error.message}
        </Alert>
      )}

      <form className="daftar-layout" onSubmit={submit} noValidate>
        <section className="card daftar-box daftar-area-info">
          <div className="daftar-box-head">
            <h2>1. Data mahasiswa</h2>
            <span className="daftar-pill">Identitas</span>
          </div>

          <div className="field">
            <label htmlFor="nama">Nama lengkap</label>
            <input
              id="nama"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              placeholder="Masukkan nama lengkap"
              maxLength={100}
              autoComplete="off"
              disabled={submitting}
              aria-invalid={!!fieldErrors.nama}
              aria-describedby={fieldErrors.nama ? "nama-err" : undefined}
            />
            {fieldErrors.nama && (
              <p id="nama-err" className="field-error">
                {fieldErrors.nama}
              </p>
            )}
          </div>

          <div className="field">
            <label htmlFor="nim">NIM</label>
            <input
              id="nim"
              value={nim}
              onChange={(e) => setNim(e.target.value)}
              placeholder="5 sampai 20 digit angka"
              inputMode="numeric"
              autoComplete="off"
              disabled={submitting}
              aria-invalid={!!fieldErrors.nim}
              aria-describedby={fieldErrors.nim ? "nim-err" : undefined}
            />
            {fieldErrors.nim && (
              <p id="nim-err" className="field-error">
                {fieldErrors.nim}
              </p>
            )}
          </div>
        </section>

        <section className="card daftar-box daftar-area-cam" aria-label="Pengambilan foto">
          <div className="daftar-box-head">
            <h2>2. Foto wajah ({photos.length}/{MAX_PHOTOS})</h2>
            <span className={`daftar-pill ${readyCount ? "ok" : ""}`}>
              {readyCount ? `${photos.length} foto siap` : `Min. ${MIN_PHOTOS} foto`}
            </span>
          </div>

          <div className="daftar-cam-container">
            <CameraView ref={cameraRef} onStatusChange={setCameraStatus} />
          </div>

          <div className="daftar-btn-row">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={takePhoto}
              disabled={cameraStatus !== "ready" || photos.length >= MAX_PHOTOS || submitting}
            >
              Ambil foto
            </button>
            <label className="btn btn-secondary daftar-upload-label">
              <span>Unggah berkas</span>
              <input
                type="file"
                accept="image/jpeg,image/png"
                multiple
                onChange={onUpload}
                disabled={photos.length >= MAX_PHOTOS || submitting}
              />
            </label>
          </div>

          <p className="muted daftar-guide-text">
            Ambil minimal {MIN_PHOTOS} sudut (menghadap depan, sedikit kiri, dan sedikit kanan) dengan cahaya cukup dan hanya satu wajah per foto.
          </p>
          {fieldErrors.photos && <p className="field-error">{fieldErrors.photos}</p>}

          {photos.length > 0 && (
            <ul className="daftar-photo-grid">
              {photos.map((p, i) => (
                <li key={p.id}>
                  <img src={p.url} alt={`Foto ${i + 1}`} />
                  <span className="daftar-photo-idx">#{i + 1}</span>
                  <button
                    type="button"
                    className="daftar-photo-del"
                    onClick={() => removePhoto(p.id)}
                    disabled={submitting}
                    aria-label={`Hapus foto ${i + 1}`}
                  >
                    &times;
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card daftar-box daftar-area-submit">
          <div className="field">
            <label className={`daftar-agree ${consent ? "checked" : ""}`}>
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => {
                  setConsent(e.target.checked);
                  if (e.target.checked) setFieldErrors((f) => ({ ...f, consent: undefined }));
                }}
                disabled={submitting}
                aria-describedby={fieldErrors.consent ? "consent-err" : undefined}
              />
              <span>Pemilik wajah menyetujui foto wajahnya diproses untuk keperluan presensi.</span>
            </label>
            {fieldErrors.consent && (
              <p id="consent-err" className="field-error">
                {fieldErrors.consent}
              </p>
            )}
            <p className="muted daftar-note">
              Foto mentah tidak disimpan; sistem hanya mengekstrak vektor fitur numerik (128-D) dan dapat dihapus kapan saja oleh admin.
            </p>
          </div>

          <button type="submit" className="btn btn-primary daftar-save-btn" disabled={submitting}>
            {submitting && <span className="daftar-loader" aria-hidden="true" />}
            <span>{submitting ? "Mendaftarkan..." : "Daftarkan"}</span>
          </button>
        </section>
      </form>
    </div>
  );
}