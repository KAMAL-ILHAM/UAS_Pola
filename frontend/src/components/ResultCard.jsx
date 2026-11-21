import { Link } from "react-router-dom";
import Spinner from "./Spinner.jsx";
import { describeError, formatDate, formatHourMinute, formatTime } from "../utils.js";

/**
 * Kartu hasil pengenalan wajah.
 * result: { status: "idle" | "loading" | "success" | "already" | "error", data?, error? }
 */
/** idle: (opsional) { title, text } untuk mengganti teks awal, mis. pada halaman login wajah. */
export default function ResultCard({ result, idle }) {
  const { status, data, error } = result;

  if (status === "idle") {
    return (
      <div className="result result-idle" aria-live="polite">
        <h2>{idle?.title ?? "Siap presensi"}</h2>
        <p>{idle?.text ?? "Posisikan wajah di dalam bingkai, lalu tekan tombol Presensi Sekarang."}</p>
      </div>
    );
  }

  if (status === "loading") {
    return (
      <div className="result result-loading" aria-live="polite" aria-busy="true">
        <h2>Mengenali wajah</h2>
        <Spinner label="Mohon tunggu sebentar..." />
      </div>
    );
  }

  // Wajah tidak cocok dengan data mana pun: tampilkan "Tidak terdaftar" + ajakan registrasi
  if (status === "error" && error?.errorCode === "FACE_NOT_RECOGNIZED") {
    return (
      <div className="result result-danger" role="alert">
        <h2>Pola wajah tidak dikenali</h2>
        <p>
          Jarak vektor terdekat melebihi ambang batas (threshold) atau wajah belum terdaftar. Pastikan pencahayaan cukup
          dan wajah menghadap lurus ke kamera.
        </p>
        <Link to="/mahasiswa/daftar" className="btn btn-primary">
          Daftarkan wajah sekarang
        </Link>
      </div>
    );
  }

  if (status === "error") {
    const info = describeError(error);
    return (
      <div className={`result result-${info.tone}`} role="alert">
        <h2>{info.title}</h2>
        <p>{info.hint}</p>
      </div>
    );
  }

  // success atau already
  const already = status === "already";
  const dist = Number(data.distance ?? 0);
  const threshold = Number(data.threshold ?? 0.5);
  const similarity = Math.max(0, Math.min(100, Math.round((1 - dist) * 100)));
  const barPercent = Math.max(12, Math.min(100, Math.round(((0.8 - Math.min(dist, 0.8)) / 0.8) * 100)));

  return (
    <div className={`result ${already ? "result-info" : "result-success"}`} role="status">
      <style>{`
        .pr-detail-grid {
          display: grid !important;
          grid-template-columns: 1fr 1fr !important;
          gap: 0.55rem 0.75rem !important;
          margin: 0.75rem 0 !important;
        }
        .pr-metrics-box {
          margin-top: 0.85rem;
          padding: 0.75rem 0.85rem;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.65);
          border: 1px solid rgba(0, 0, 0, 0.08);
          text-align: left;
        }
        .pr-metrics-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.74rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.03em;
          opacity: 0.75;
          margin-bottom: 0.45rem;
        }
        .pr-metrics-row {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          gap: 0.5rem;
          margin-bottom: 0.4rem;
        }
        .pr-metric-val {
          font-size: 0.9rem;
          font-weight: 700;
          font-variant-numeric: tabular-nums;
        }
        .pr-metric-sub {
          font-size: 0.75rem;
          opacity: 0.75;
        }
        .pr-bar-track {
          width: 100%;
          height: 6px;
          border-radius: 999px;
          background: rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }
        .pr-bar-fill {
          height: 100%;
          border-radius: 999px;
          background: #16a34a;
          transition: width 0.4s ease;
        }
        .pr-formula-note {
          margin: 0.45rem 0 0 !important;
          font-size: 0.74rem !important;
          opacity: 0.78;
          line-height: 1.35;
        }
      `}</style>

      <h2>{already ? "Sudah melakukan presensi" : "Wajah dikenali & presensi berhasil"}</h2>
      <p className="result-name">{data.nama}</p>
      <p className="result-message">
        {already ? "Tercatat hadir hari ini pukul " : "Berhasil tercatat pukul "}
        <strong>{formatHourMinute(data.timestamp)}</strong>
      </p>

      <dl className="result-detail pr-detail-grid">
        <div>
          <dt>NIM</dt>
          <dd>{data.nim}</dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd className="result-status">{data.status}</dd>
        </div>
        <div>
          <dt>Tanggal</dt>
          <dd>{formatDate(data.timestamp)}</dd>
        </div>
        <div>
          <dt>Waktu</dt>
          <dd>{formatTime(data.timestamp)}</dd>
        </div>
      </dl>

      {/* Panel Metrik Pengenalan Pola */}
      <div className="pr-metrics-box">
        <div className="pr-metrics-head">
          <span>1-NN Euclidean</span>
          <span>128-D Embedding</span>
        </div>

        <div className="pr-metrics-row">
          <div>
            <span className="pr-metric-sub">Jarak (d): </span>
            <span className="pr-metric-val">{dist.toFixed(3)}</span>
          </div>
          <div>
            <span className="pr-metric-sub">Kemiripan: </span>
            <span className="pr-metric-val">{similarity}%</span>
          </div>
        </div>

        <div className="pr-bar-track" aria-hidden="true">
          <div className="pr-bar-fill" style={{ width: `${barPercent}%` }} />
        </div>

        <p className="pr-formula-note">
          Keputusan: <strong>{dist.toFixed(3)} &le; {threshold.toFixed(2)}</strong> (d &le; Threshold &rarr; Kelas Cocok)
        </p>
      </div>
    </div>
  );
}