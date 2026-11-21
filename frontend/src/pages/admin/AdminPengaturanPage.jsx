import { useEffect, useState } from "react";
import Alert from "../../components/Alert.jsx";
import { changePassword, getSettings, updateSettings } from "../../api.js";
import { describeError } from "../../utils.js";

const MIN_T = 0.3;
const MAX_T = 0.8;

export default function AdminPengaturanPage() {
  return (
    <>
      <style>{`
        .set-spin {
          width: 15px;
          height: 15px;
          border: 2px solid rgba(255, 255, 255, 0.35);
          border-top-color: #ffffff;
          border-radius: 50%;
          animation: setSpin 0.7s linear infinite;
          display: inline-block;
          flex-shrink: 0;
        }
        @keyframes setSpin {
          to { transform: rotate(360deg); }
        }

        .set-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 1.25rem;
          align-items: start;
        }
        .set-card {
          margin: 0 !important;
          border-radius: 14px;
        }
        .set-card h2 {
          font-size: 1.12rem;
          margin: 0 0 0.4rem;
        }
        .set-desc {
          font-size: 0.88rem;
          line-height: 1.5;
          margin: 0 0 1.1rem;
        }

        /* Kontrol threshold (slider + input angka) */
        .threshold-control {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-top: 0.35rem;
        }
        .threshold-slider {
          flex: 1;
          accent-color: currentColor;
          cursor: pointer;
          height: 6px;
        }
        .threshold-number {
          width: 82px !important;
          text-align: center;
          font-weight: 600;
          flex-shrink: 0;
        }
        .threshold-hints {
          display: flex;
          justify-content: space-between;
          font-size: 0.75rem;
          opacity: 0.65;
          margin-top: 0.35rem;
        }

        /* Toggle lihat/tutup password */
        .set-pass-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }
        .set-pass-wrap input {
          width: 100%;
          padding-right: 3.4rem;
        }
        .set-pass-toggle {
          position: absolute;
          right: 0.65rem;
          background: transparent;
          border: none;
          font-size: 0.76rem;
          font-weight: 600;
          color: inherit;
          opacity: 0.65;
          cursor: pointer;
          padding: 0.25rem 0.3rem;
        }
        .set-pass-toggle:hover {
          opacity: 1;
        }

        .set-submit-btn {
          justify-content: center;
          align-items: center;
          gap: 0.5rem;
          min-height: 40px;
          margin-top: 0.35rem;
        }

        @media (max-width: 768px) {
          .set-grid {
            grid-template-columns: 1fr;
            gap: 1rem;
          }
        }

        @media (max-width: 640px) {
          .set-page-head h1 {
            font-size: 1.4rem;
          }
          .set-page-head .lead {
            font-size: 0.88rem;
          }
          .set-card {
            padding: 1.15rem 1.05rem !important;
          }
          .set-card h2 {
            font-size: 1.02rem;
          }
          .set-desc {
            font-size: 0.83rem;
            margin-bottom: 0.95rem;
          }
          .set-card .field {
            margin-bottom: 0.85rem;
          }
          .set-card input[type="password"],
          .set-card input[type="text"],
          .set-card input[type="number"] {
            min-height: 40px;
            font-size: 0.92rem;
          }
          .set-submit-btn {
            width: 100%;
            min-height: 42px;
          }
        }
      `}</style>

      <div className="page-head set-page-head">
        <div>
          <h1>Pengaturan</h1>
          <p className="lead">Atur ambang kecocokan wajah dan keamanan akun admin.</p>
        </div>
      </div>

      <div className="set-grid">
        <ThresholdCard />
        <PasswordCard />
      </div>
    </>
  );
}

function ThresholdCard() {
  const [threshold, setThreshold] = useState(0.5);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getSettings()
      .then((res) => setThreshold(res.data.threshold))
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  const unavailable = error?.errorCode === "NOT_IMPLEMENTED";
  const numVal = Number(threshold);
  const invalid = Number.isNaN(numVal) || numVal < MIN_T || numVal > MAX_T;

  async function submit(e) {
    e.preventDefault();
    if (invalid) return;
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      await updateSettings({ threshold: numVal });
      setSaved(true);
    } catch (err) {
      setError(err);
    } finally {
      setSaving(false);
    }
  }

  const info = error && describeError(error);
  return (
    <section className="card set-card">
      <h2>Ambang kecocokan wajah</h2>
      <p className="muted set-desc">
        Wajah dianggap cocok jika jarak Euclidean di bawah nilai ini. Nilai kecil lebih ketat, nilai besar lebih longgar (bawaan: 0.50).
      </p>
      {saved && <Alert tone="success">Pengaturan threshold berhasil disimpan.</Alert>}
      {error && (
        <Alert tone={info.tone} title={info.title}>
          {info.hint}
        </Alert>
      )}
      <form onSubmit={submit}>
        <div className="field">
          <label htmlFor="threshold">
            {loading ? "Memuat nilai threshold..." : `Nilai Threshold (${MIN_T} – ${MAX_T})`}
          </label>
          <div className="threshold-control">
            <input
              type="range"
              className="threshold-slider"
              min={MIN_T}
              max={MAX_T}
              step="0.01"
              value={invalid ? 0.5 : numVal}
              onChange={(e) => {
                setSaved(false);
                setThreshold(e.target.value);
              }}
              disabled={loading || saving || unavailable}
              aria-label="Geser nilai threshold"
            />
            <input
              id="threshold"
              type="number"
              className="threshold-number"
              step="0.01"
              min={MIN_T}
              max={MAX_T}
              value={threshold}
              onChange={(e) => {
                setSaved(false);
                setThreshold(e.target.value);
              }}
              disabled={loading || saving || unavailable}
            />
          </div>
          <div className="threshold-hints">
            <span>0.30 (Ketat)</span>
            <span>0.50 (Standar)</span>
            <span>0.80 (Longgar)</span>
          </div>
          {invalid && <p className="field-error">Isi angka antara {MIN_T} dan {MAX_T}.</p>}
        </div>
        <button
          type="submit"
          className="btn btn-primary set-submit-btn"
          disabled={loading || saving || unavailable || invalid}
        >
          {saving && <span className="set-spin" aria-hidden="true" />}
          <span>{saving ? "Menyimpan..." : "Simpan pengaturan"}</span>
        </button>
      </form>
    </section>
  );
}

function PasswordCard() {
  const [lama, setLama] = useState("");
  const [baru, setBaru] = useState("");
  const [ulang, setUlang] = useState("");
  const [showLama, setShowLama] = useState(false);
  const [showBaru, setShowBaru] = useState(false);
  const [showUlang, setShowUlang] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);

  const tooShort = baru.length > 0 && baru.length < 8;
  const mismatch = ulang.length > 0 && baru !== ulang;
  const canSubmit = lama && baru.length >= 8 && baru === ulang;

  async function submit(e) {
    e.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    setDone(false);
    setError(null);
    try {
      await changePassword({ passwordLama: lama, passwordBaru: baru });
      setDone(true);
      setLama("");
      setBaru("");
      setUlang("");
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  const info = error && describeError(error);
  return (
    <section className="card set-card">
      <h2>Ganti password admin</h2>
      <p className="muted set-desc">
        Gunakan kombinasi minimal 8 karakter untuk menjaga keamanan akses halaman admin.
      </p>
      {done && <Alert tone="success">Password berhasil diganti.</Alert>}
      {error && (
        <Alert tone={info.tone} title={info.title}>
          {info.hint}
        </Alert>
      )}
      <form onSubmit={submit}>
        <div className="field">
          <label htmlFor="pw-lama">Password lama</label>
          <div className="set-pass-wrap">
            <input
              id="pw-lama"
              type={showLama ? "text" : "password"}
              value={lama}
              onChange={(e) => setLama(e.target.value)}
              placeholder="Masukkan password saat ini"
              autoComplete="current-password"
              disabled={busy}
            />
            <button
              type="button"
              className="set-pass-toggle"
              onClick={() => setShowLama((v) => !v)}
              tabIndex={-1}
              disabled={busy}
            >
              {showLama ? "Tutup" : "Lihat"}
            </button>
          </div>
        </div>
        <div className="field">
          <label htmlFor="pw-baru">Password baru (minimal 8 karakter)</label>
          <div className="set-pass-wrap">
            <input
              id="pw-baru"
              type={showBaru ? "text" : "password"}
              value={baru}
              onChange={(e) => setBaru(e.target.value)}
              placeholder="Minimal 8 karakter"
              autoComplete="new-password"
              disabled={busy}
            />
            <button
              type="button"
              className="set-pass-toggle"
              onClick={() => setShowBaru((v) => !v)}
              tabIndex={-1}
              disabled={busy}
            >
              {showBaru ? "Tutup" : "Lihat"}
            </button>
          </div>
          {tooShort && <p className="field-error">Minimal 8 karakter.</p>}
        </div>
        <div className="field">
          <label htmlFor="pw-ulang">Ulangi password baru</label>
          <div className="set-pass-wrap">
            <input
              id="pw-ulang"
              type={showUlang ? "text" : "password"}
              value={ulang}
              onChange={(e) => setUlang(e.target.value)}
              placeholder="Ketik ulang password baru"
              autoComplete="new-password"
              disabled={busy}
            />
            <button
              type="button"
              className="set-pass-toggle"
              onClick={() => setShowUlang((v) => !v)}
              tabIndex={-1}
              disabled={busy}
            >
              {showUlang ? "Tutup" : "Lihat"}
            </button>
          </div>
          {mismatch && <p className="field-error">Password tidak sama.</p>}
        </div>
        <button type="submit" className="btn btn-primary set-submit-btn" disabled={busy || !canSubmit}>
          {busy && <span className="set-spin" aria-hidden="true" />}
          <span>{busy ? "Menyimpan..." : "Ganti password"}</span>
        </button>
      </form>
    </section>
  );
}
