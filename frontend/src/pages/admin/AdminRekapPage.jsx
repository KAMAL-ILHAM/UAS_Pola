import { useCallback, useEffect, useMemo, useState } from "react";
import Alert from "../../components/Alert.jsx";
import AttendanceTable from "../../components/AttendanceTable.jsx";
import Modal from "../../components/Modal.jsx";
import Segmented from "../../components/Segmented.jsx";
import { deleteAttendance, getAttendance } from "../../api.js";
import { addDays, describeError, downloadAttendanceCSV, formatDate, todayISO, useDebounce } from "../../utils.js";
import Icon from "../../components/Icon.jsx";

const PRESETS = [
  { key: "today", label: "Hari ini" },
  { key: "yesterday", label: "Kemarin" },
  { key: "7", label: "7 hari" },
  { key: "30", label: "30 hari" },
  { key: "all", label: "Semua" },
  { key: "custom", label: "Rentang" },
];

function rangeFor(preset, dari, sampai) {
  const today = todayISO();
  switch (preset) {
    case "today":
      return [today, today];
    case "yesterday": {
      const y = addDays(today, -1);
      return [y, y];
    }
    case "7":
      return [addDays(today, -6), today];
    case "30":
      return [addDays(today, -29), today];
    case "all":
      return ["", ""];
    default:
      return [dari, sampai];
  }
}

export default function AdminRekapPage() {
  const [preset, setPreset] = useState("7");
  const [dari, setDari] = useState(addDays(todayISO(), -6));
  const [sampai, setSampai] = useState(todayISO());
  const [nama, setNama] = useState("");
  const namaQuery = useDebounce(nama);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const [from, to] = rangeFor(preset, dari, sampai);
  const invalidRange = preset === "custom" && (!dari || !sampai || dari > sampai);

  const load = useCallback(async () => {
    if (invalidRange) {
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await getAttendance({ tanggal: from && from === to ? from : "", nama: namaQuery });
      setRows(
        res.data.filter((r) => {
          const day = String(r.timestamp).slice(0, 10);
          return (!from || day >= from) && (!to || day <= to);
        })
      );
      setError(null);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [invalidRange, from, to, namaQuery]);

  useEffect(() => {
    load();
  }, [load]);

  const uniqueStudents = useMemo(() => new Set(rows.map((r) => r.nim)).size, [rows]);
  const info = error && describeError(error);

  function exportCSV() {
    downloadAttendanceCSV(rows, `rekap_kehadiran_${from || "awal"}_sampai_${to || "akhir"}.csv`);
  }

  return (
    <>
      <style>{`
        .rekap-spin {
          width: 14px;
          height: 14px;
          border: 2px solid currentColor;
          border-top-color: transparent;
          border-radius: 50%;
          animation: rekapSpin 0.7s linear infinite;
          display: inline-block;
          flex-shrink: 0;
        }
        .rekap-spin-light {
          border-color: rgba(255, 255, 255, 0.35);
          border-top-color: #ffffff;
        }
        @keyframes rekapSpin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 640px) {
          .rekap-head h1 {
            font-size: 1.4rem;
          }
          .rekap-head .lead {
            font-size: 0.88rem;
          }

          /* Susun 6 pilihan periode jadi grid 3x2 agar pas di layar HP */
          .rekap-segmented {
            width: 100%;
            margin-bottom: 0.5rem !important;
          }
          .rekap-segmented .segmented {
            display: grid !important;
            grid-template-columns: repeat(3, 1fr);
            gap: 0.3rem;
            width: 100%;
          }
          .rekap-segmented .segmented button {
            width: 100%;
            padding: 0.45rem 0.35rem;
            font-size: 0.8rem;
            justify-content: center;
          }

          /* Toolbar filter & tombol aksi dibuat grid 2 kolom agar ringkas */
          .rekap-toolbar {
            display: grid !important;
            grid-template-columns: 1fr 1fr;
            gap: 0.6rem !important;
            align-items: end !important;
          }
          .rekap-toolbar .rekap-date-item {
            display: flex;
            flex-direction: column;
            align-items: stretch;
            gap: 0.25rem;
            width: 100%;
          }
          .rekap-toolbar .rekap-date-item span {
            font-size: 0.78rem;
            opacity: 0.8;
          }
          .rekap-toolbar .rekap-search-item {
            grid-column: 1 / -1;
            width: 100%;
          }
          .rekap-toolbar .rekap-search-item span {
            display: none;
          }
          .rekap-toolbar input {
            width: 100%;
            min-height: 38px;
            font-size: 0.86rem;
          }
          .rekap-toolbar .btn {
            width: 100%;
            min-height: 38px;
            font-size: 0.83rem;
            justify-content: center;
            padding: 0.45rem 0.6rem;
          }

          /* Kartu tabel rekap */
          .rekap-card {
            padding: 1rem !important;
          }
          .rekap-card-head {
            flex-direction: column;
            align-items: flex-start !important;
            gap: 0.25rem;
            margin-bottom: 0.85rem;
          }
          .rekap-card-head h2 {
            font-size: 1.02rem;
            margin: 0;
          }
          .rekap-card-head .muted {
            font-size: 0.8rem;
          }

          /* Modal hapus di mobile */
          .rekap-modal-actions {
            display: grid !important;
            grid-template-columns: 1fr 1fr;
            gap: 0.5rem;
          }
          .rekap-modal-actions .btn {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>

      <div className="page-head rekap-head">
        <div>
          <h1>Rekap Kehadiran</h1>
          <p className="lead">Lihat kehadiran per hari atau rentang tanggal, lalu unduh sebagai CSV.</p>
        </div>
      </div>

      <div className="toolbar rekap-segmented">
        <Segmented label="Pilih periode" options={PRESETS} value={preset} onChange={setPreset} />
      </div>
      <div className="toolbar rekap-toolbar">
        {preset === "custom" && (
          <>
            <label className="field-inline rekap-date-item">
              <span>Dari</span>
              <input type="date" value={dari} max={todayISO()} onChange={(e) => setDari(e.target.value)} />
            </label>
            <label className="field-inline rekap-date-item">
              <span>Sampai</span>
              <input type="date" value={sampai} max={todayISO()} onChange={(e) => setSampai(e.target.value)} />
            </label>
          </>
        )}
        <label className="field-inline rekap-search-item">
          <span>Nama</span>
          <input type="search" placeholder="Cari nama mahasiswa..." value={nama} onChange={(e) => setNama(e.target.value)} />
        </label>
        <button type="button" className="btn btn-secondary" onClick={load} disabled={loading} style={{ gap: "0.4rem" }}>
          {loading ? <span className="rekap-spin" aria-hidden="true" /> : <Icon name="refresh" />}
          <span>{loading ? "Memuat..." : "Muat ulang"}</span>
        </button>
        <button type="button" className="btn btn-primary" onClick={exportCSV} disabled={rows.length === 0} style={{ gap: "0.4rem" }}>
          <Icon name="download" />
          <span>Ekspor CSV</span>
        </button>
      </div>

      {invalidRange && (
        <Alert tone="warning" title="Rentang tanggal belum benar">
          Isi kedua tanggal, dan pastikan tanggal &quot;Dari&quot; tidak melewati &quot;Sampai&quot;.
        </Alert>
      )}
      {notice && <Alert tone="success">{notice}</Alert>}
      {error && (
        <Alert tone={info.tone} title={info.title}>
          {info.hint}
        </Alert>
      )}

      <section className="card rekap-card">
        <div className="card-head rekap-card-head">
          <h2>
            {rows.length} catatan dari {uniqueStudents} mahasiswa
          </h2>
          <span className="muted">{from || to ? `${formatDate(from || to)}${from !== to ? ` - ${formatDate(to)}` : ""}` : "Semua tanggal"}</span>
        </div>
        <AttendanceTable
          rows={rows}
          loading={loading && rows.length === 0}
          showDate
          emptyText={namaQuery ? "Tidak ada hasil untuk pencarian ini." : "Belum ada data kehadiran untuk periode ini."}
          onDelete={setDeleting}
        />
      </section>

      {deleting && (
        <DeleteRecordDialog
          row={deleting}
          onClose={() => setDeleting(null)}
          onDeleted={() => {
            setNotice(`Catatan kehadiran ${deleting.nama} dihapus.`);
            setDeleting(null);
            load();
          }}
        />
      )}
    </>
  );
}

function DeleteRecordDialog({ row, onClose, onDeleted }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function confirm() {
    setBusy(true);
    setError(null);
    try {
      await deleteAttendance(row.id);
      onDeleted();
    } catch (err) {
      setError(err);
      setBusy(false);
    }
  }

  const info = error && describeError(error);
  return (
    <Modal title="Hapus catatan kehadiran?" onClose={onClose}>
      {error && (
        <Alert tone={info.tone} title={info.title}>
          {info.hint}
        </Alert>
      )}
      <p style={{ fontSize: "0.92rem", lineHeight: 1.5 }}>
        Catatan kehadiran <strong>{row.nama}</strong> pada {formatDate(row.timestamp)} akan dihapus. Gunakan hanya untuk
        memperbaiki kesalahan pencatatan.
      </p>
      <div className="modal-actions rekap-modal-actions">
        <button type="button" className="btn btn-secondary" onClick={onClose} disabled={busy}>
          Batal
        </button>
        <button type="button" className="btn btn-danger" onClick={confirm} disabled={busy} style={{ gap: "0.45rem" }}>
          {busy && <span className="rekap-spin rekap-spin-light" aria-hidden="true" />}
          <span>{busy ? "Menghapus..." : "Ya, hapus"}</span>
        </button>
      </div>
    </Modal>
  );
}
