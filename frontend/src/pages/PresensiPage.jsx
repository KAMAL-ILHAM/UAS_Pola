import { useCallback, useEffect, useRef, useState } from "react";
import CameraView from "../components/CameraView.jsx";
import ResultCard from "../components/ResultCard.jsx";
import Icon from "../components/Icon.jsx";
import { recognizeFace } from "../api.js";

const AUTO_INTERVAL_MS = 3000;
const COOLDOWN_MS = 5000;

const IDLE_TEXT = {
  title: "Status",
  text: "Siap melakukan presensi.",
};

export default function PresensiPage() {
  const cameraRef = useRef(null);
  const busyRef = useRef(false);
  const cooldownUntil = useRef(0);

  const [cameraStatus, setCameraStatus] = useState("loading");
  const [result, setResult] = useState({ status: "idle" });
  const [auto, setAuto] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  const scan = useCallback(async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    setResult({ status: "loading" });
    try {
      const photo = await cameraRef.current.capture();
      const res = await recognizeFace(photo);
      setResult({ status: res.data.already_recorded ? "already" : "success", data: res.data });
      cooldownUntil.current = Date.now() + COOLDOWN_MS;
    } catch (error) {
      setResult({ status: "error", error });
    } finally {
      busyRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (!auto || cameraStatus !== "ready") return;
    const id = setInterval(() => {
      if (Date.now() >= cooldownUntil.current) scan();
    }, AUTO_INTERVAL_MS);
    return () => clearInterval(id);
  }, [auto, cameraStatus, scan]);

  const scanning = result.status === "loading";

  return (
    <div className="kiosk-grid">
      <style>{`
        .kiosk-grid {
          width: 100%;
          display: grid;
          grid-template-columns: 1fr;
          gap: 0.85rem;
          box-sizing: border-box;
        }
        .kiosk-cam-card {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 1rem;
          margin: 0 !important;
          min-height: 0;
          border-radius: 16px;
        }
        .kiosk-cam-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.65rem;
          flex-shrink: 0;
        }
        .kiosk-status-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.74rem;
          font-weight: 600;
          padding: 0.22rem 0.65rem;
          border-radius: 999px;
        }
        .kiosk-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: currentColor;
        }
        .kiosk-dot.pulse {
          animation: kioskPulse 1.6s ease-in-out infinite;
        }
        @keyframes kioskPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.85); }
        }

        .kiosk-cam-stage {
          flex: 1;
          min-height: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          border-radius: 12px;
        }
        .kiosk-cam-frame {
          position: relative;
          width: 100%;
          max-width: 460px;
          border-radius: 12px;
          overflow: hidden;
        }

        .kiosk-controls {
          margin-top: 0.85rem;
          display: grid;
          grid-template-columns: 1fr;
          gap: 0.6rem;
          align-items: center;
          flex-shrink: 0;
        }
        .kiosk-scan-btn {
          width: 100%;
          justify-content: center;
          align-items: center;
          gap: 0.5rem;
          min-height: 44px;
          font-weight: 600;
          border-radius: 10px;
        }
        .kiosk-btn-spin {
          width: 16px;
          height: 16px;
          border: 2.2px solid rgba(255, 255, 255, 0.35);
          border-top-color: #ffffff;
          border-radius: 50%;
          animation: kioskSpin 0.7s linear infinite;
          flex-shrink: 0;
        }
        @keyframes kioskSpin {
          to { transform: rotate(360deg); }
        }

        .kiosk-auto-toggle {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.55rem 0.75rem;
          background: #f8fafc;
          border-radius: 10px;
          border: 1px solid #e2e8f0;
          font-size: 0.82rem;
          margin: 0 !important;
          cursor: pointer;
          user-select: none;
          transition: background 0.15s ease, border-color 0.15s ease;
        }
        .kiosk-auto-toggle.is-on {
          background: #eff6ff;
          border-color: #bfdbfe;
          color: #1d4ed8;
          font-weight: 500;
        }

        .kiosk-side-col {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 0.85rem;
          min-height: 0;
        }
        .kiosk-guide-card {
          margin: 0 !important;
          padding: 1rem 1.15rem;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          flex-shrink: 0;
        }
        .kiosk-guide-toggle {
          display: none;
        }
        .kiosk-guide-list {
          margin: 0;
          padding-left: 1.15rem;
          font-size: 0.84rem;
          color: #475569;
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
        }

        @media (min-width: 901px) {
          .kiosk-grid {
            height: 100%;
            max-height: 740px;
            grid-template-columns: 1.15fr 0.85fr;
            gap: 1.25rem;
            min-height: 0;
          }
          .kiosk-controls {
            grid-template-columns: 1fr 1fr;
            gap: 0.75rem;
          }
        }

        @media (max-width: 640px) {
          .kiosk-grid {
            gap: 0.75rem;
          }
          .kiosk-cam-card {
            padding: 0.85rem !important;
          }
          /* Batasi tinggi kamera di HP agar tombol & kartu status langsung terlihat tanpa scroll jauh */
          .kiosk-cam-frame {
            max-width: 340px;
            max-height: 44dvh;
          }
          .kiosk-cam-frame video,
          .kiosk-cam-frame canvas {
            max-height: 44dvh;
            object-fit: cover;
          }
          .kiosk-controls {
            margin-top: 0.75rem;
            gap: 0.5rem;
          }
          .kiosk-scan-btn {
            min-height: 42px;
            font-size: 0.92rem;
          }
          .kiosk-auto-toggle {
            padding: 0.5rem 0.65rem;
            font-size: 0.8rem;
          }

          /* Buat petunjuk penggunaan bisa dilipat di HP supaya layar tidak penuh */
          .kiosk-guide-card {
            padding: 0.75rem 0.95rem !important;
          }
          .kiosk-guide-desktop-title {
            display: none;
          }
          .kiosk-guide-toggle {
            display: flex;
            align-items: center;
            justify-content: space-between;
            width: 100%;
            background: transparent;
            border: none;
            padding: 0;
            font-size: 0.86rem;
            font-weight: 600;
            color: #334155;
            cursor: pointer;
          }
          .kiosk-guide-list {
            margin-top: 0.6rem;
            font-size: 0.8rem;
          }
          .kiosk-guide-list.collapsed {
            display: none;
          }
        }

        @keyframes cleanScanSweep {
          0% { top: 12%; opacity: 0; }
          15% { opacity: 0.9; }
          85% { opacity: 0.9; }
          100% { top: 88%; opacity: 0; }
        }
        .clean-overlay {
          position: absolute;
          inset: 0;
          pointer-events: none;
          border-radius: 12px;
          overflow: hidden;
          z-index: 10;
        }
        .clean-scan-bar {
          position: absolute;
          left: 12%;
          right: 12%;
          height: 2px;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.95), transparent);
          box-shadow: 0 2px 12px rgba(255, 255, 255, 0.65);
          animation: cleanScanSweep 1.6s ease-in-out infinite;
        }
        .clean-bracket {
          position: absolute;
          width: 22px;
          height: 22px;
          border-color: rgba(255, 255, 255, 0.75);
          border-style: solid;
          transition: border-color 0.25s ease;
        }
        .clean-overlay.active .clean-bracket {
          border-color: #2563eb;
        }
        .clean-bracket.tl { top: 14px; left: 14px; border-width: 2.5px 0 0 2.5px; border-top-left-radius: 6px; }
        .clean-bracket.tr { top: 14px; right: 14px; border-width: 2.5px 2.5px 0 0; border-top-right-radius: 6px; }
        .clean-bracket.bl { bottom: 14px; left: 14px; border-width: 0 0 2.5px 2.5px; border-bottom-left-radius: 6px; }
        .clean-bracket.br { bottom: 14px; right: 14px; border-width: 0 2.5px 2.5px 0; border-bottom-right-radius: 6px; }
      `}</style>

      {/* Kolom Kiri: Kamera & Kontrol */}
      <section className="card kiosk-cam-card" aria-label="Pratinjau Kamera">
        <div className="kiosk-cam-header">
          <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>Pratinjau Kamera</span>
          <span
            className="kiosk-status-pill"
            style={{
              background: cameraStatus === "ready" ? "#dcfce7" : "#fef3c7",
              color: cameraStatus === "ready" ? "#166534" : "#92400e",
            }}
          >
            <span className={`kiosk-dot ${cameraStatus === "ready" ? "pulse" : ""}`} aria-hidden="true" />
            <span>{cameraStatus === "ready" ? "Kamera Aktif" : "Memuat Kamera..."}</span>
          </span>
        </div>

        <div className="kiosk-cam-stage">
          <div className="kiosk-cam-frame">
            <CameraView ref={cameraRef} onStatusChange={setCameraStatus} />

            {cameraStatus === "ready" && (
              <div className={`clean-overlay ${scanning ? "active" : ""}`}>
                {(scanning || auto) && <div className="clean-scan-bar" />}
                <span className="clean-bracket tl" />
                <span className="clean-bracket tr" />
                <span className="clean-bracket bl" />
                <span className="clean-bracket br" />
              </div>
            )}
          </div>
        </div>

        <div className="kiosk-controls">
          <button
            type="button"
            className="btn btn-primary kiosk-scan-btn"
            onClick={scan}
            disabled={cameraStatus !== "ready" || scanning}
          >
            {scanning ? <span className="kiosk-btn-spin" aria-hidden="true" /> : <Icon name="scan-face" />}
            <span>{scanning ? "Memproses wajah..." : "Presensi Sekarang"}</span>
          </button>

          <label className={`check kiosk-auto-toggle ${auto ? "is-on" : ""}`}>
            <input
              type="checkbox"
              checked={auto}
              onChange={(e) => setAuto(e.target.checked)}
              disabled={cameraStatus !== "ready"}
            />
            <span>Pemindaian otomatis (3 detik)</span>
          </label>
        </div>
      </section>

      {/* Kolom Kanan: Status & Petunjuk Penggunaan */}
      <section className="kiosk-side-col" aria-label="Status Presensi">
        <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
          <ResultCard result={result} idle={IDLE_TEXT} />
        </div>

        <div className="card kiosk-guide-card">
          <h2 className="kiosk-guide-desktop-title" style={{ fontSize: "0.95rem", margin: "0 0 0.45rem 0" }}>
            Petunjuk Penggunaan
          </h2>

          <button
            type="button"
            className="kiosk-guide-toggle"
            onClick={() => setShowGuide((prev) => !prev)}
            aria-expanded={showGuide}
          >
            <span>Petunjuk Penggunaan</span>
            <span style={{ fontSize: "0.78rem", color: "#2563eb" }}>{showGuide ? "Sembunyikan" : "Lihat"}</span>
          </button>

          <ul className={`kiosk-guide-list ${!showGuide ? "collapsed" : ""}`}>
            <li>Pastikan pencahayaan cukup.</li>
            <li>Posisikan wajah di tengah bingkai kamera.</li>
            <li>Pastikan hanya satu wajah yang terlihat.</li>
            <li>Jika belum terdaftar, hubungi admin untuk pendaftaran.</li>
          </ul>
        </div>
      </section>
    </div>
  );
}
