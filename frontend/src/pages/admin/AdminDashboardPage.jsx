import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Alert from "../../components/Alert.jsx";
import AttendanceTable from "../../components/AttendanceTable.jsx";
import BarChart from "../../components/BarChart.jsx";
import Segmented from "../../components/Segmented.jsx";
import Spinner from "../../components/Spinner.jsx";
import Gauge from "../../components/Gauge.jsx";
import { getAttendance, getStudents, getSummary } from "../../api.js";
import { addDays, describeError, formatDate, todayISO } from "../../utils.js";
import Icon from "../../components/Icon.jsx";

const REFRESH_MS = 30000;
const DAY_OPTIONS = [
  { key: "today", label: "Hari ini" },
  { key: "yesterday", label: "Kemarin" },
  { key: "custom", label: "Tanggal lain" },
];

export default function AdminDashboardPage() {
  const [mode, setMode] = useState("today");
  const [custom, setCustom] = useState(addDays(todayISO(), -2));
  const [hari, setHari] = useState(7);
  const [tab, setTab] = useState("hadir");
  const [query, setQuery] = useState("");

  const [summary, setSummary] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const tanggal = mode === "today" ? todayISO() : mode === "yesterday" ? addDays(todayISO(), -1) : custom;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [sum, att, stu] = await Promise.all([getSummary({ tanggal, hari }), getAttendance({ tanggal }), getStudents()]);
      setSummary(sum.data);
      setAttendance(att.data);
      setStudents(stu.data);
      setError(null);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [tanggal, hari]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (mode !== "today") return;
    const id = setInterval(load, REFRESH_MS);
    return () => clearInterval(id);
  }, [mode, load]);

  const q = query.trim().toLowerCase();
  const match = (nama, nim) => !q || nama.toLowerCase().includes(q) || nim.includes(q);

  const hadirRows = useMemo(() => attendance.filter((a) => match(a.nama, a.nim)), [attendance, q]); // eslint-disable-line react-hooks/exhaustive-deps
  const belumRows = useMemo(() => {
    const hadirNim = new Set(attendance.map((a) => a.nim));
    return students.filter((s) => !hadirNim.has(s.nim) && match(s.nama, s.nim));
  }, [students, attendance, q]); // eslint-disable-line react-hooks/exhaustive-deps

  const info = error && describeError(error);

  return (
    <>
      <style>{`
        .dash-spin {
          width: 14px;
          height: 14px;
          border: 2px solid currentColor;
          border-top-color: transparent;
          border-radius: 50%;
          animation: dashSpin 0.7s linear infinite;
          display: inline-block;
          flex-shrink: 0;
        }
        @keyframes dashSpin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 640px) {
          /* Header halaman */
          .dash-head {
            display: flex !important;
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 0.75rem !important;
            margin-bottom: 1rem !important;
          }
          .dash-head h1 {
            font-size: 1.35rem !important;
            margin-bottom: 0.15rem !important;
          }
          .dash-head .lead {
            font-size: 0.85rem !important;
          }
          .dash-head .btn {
            width: 100% !important;
            justify-content: center !important;
            min-height: 40px;
          }

          /* Container filter utama: susun rapi ke bawah tanpa meluber ke samping */
          .dash-filter-box {
            display: flex !important;
            flex-direction: column !important;
            gap: 0.65rem !important;
            width: 100% !important;
            max-width: 100% !important;
            box-sizing: border-box !important;
            margin-bottom: 1rem !important;
          }

          /* Baris 1: 3 tombol periode (Hari ini | Kemarin | Tanggal lain) dibagi 3 kolom presisi */
          .dash-seg-wrap {
            width: 100% !important;
            max-width: 100% !important;
            overflow: hidden;
          }
          .dash-seg-wrap .segmented,
          .dash-seg-wrap [role="group"],
          .dash-seg-wrap > div {
            display: grid !important;
            grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
            width: 100% !important;
            max-width: 100% !important;
            box-sizing: border-box !important;
          }
          .dash-seg-wrap button {
            width: 100% !important;
            min-width: 0 !important;
            padding: 0.5rem 0.25rem !important;
            font-size: 0.78rem !important;
            white-space: nowrap !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
            justify-content: center !important;
            text-align: center !important;
          }

          /* Baris 2 (opsional): Input kalender saat pilih "Tanggal lain" */
          .dash-date-row {
            display: flex !important;
            align-items: center !important;
            justify-content: space-between !important;
            gap: 0.65rem !important;
            width: 100% !important;
            box-sizing: border-box !important;
          }
          .dash-date-row span {
            font-size: 0.82rem !important;
            font-weight: 500;
            white-space: nowrap;
          }
          .dash-date-row input[type="date"] {
            flex: 1 !important;
            min-width: 0 !important;
            width: 100% !important;
            min-height: 38px !important;
            font-size: 0.85rem !important;
            box-sizing: border-box !important;
          }

          /* Baris 3: Dropdown Grafik & tombol Muat ulang berjejer 2 kolom */
          .dash-action-row {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 0.6rem !important;
            width: 100% !important;
            box-sizing: border-box !important;
          }
          .dash-action-row .field-inline {
            display: flex !important;
            align-items: center !important;
            gap: 0.4rem !important;
            width: 100% !important;
            min-width: 0 !important;
            margin: 0 !important;
          }
          .dash-action-row .field-inline span {
            font-size: 0.8rem !important;
            white-space: nowrap;
          }
          .dash-action-row select {
            flex: 1 !important;
            min-width: 0 !important;
            width: 100% !important;
            min-height: 38px !important;
            font-size: 0.82rem !important;
            padding: 0 0.4rem !important;
          }
          .dash-action-row .btn {
            width: 100% !important;
            min-width: 0 !important;
            min-height: 38px !important;
            font-size: 0.82rem !important;
            padding: 0.45rem 0.5rem !important;
            justify-content: center !important;
          }

          /* Panel ringkasan lebih lega dan tidak penuh */
          .dash-summary {
            padding: 1rem !important;
            gap: 1rem !important;
            overflow: hidden !important;
          }
          .dash-summary .panel-chart {
            width: 100%;
            overflow-x: auto;
            padding-bottom: 0.25rem;
          }
          .dash-summary .panel-title {
            font-size: 0.92rem !important;
            margin-bottom: 0.5rem !important;
          }
          .dash-summary .panel-gauge {
            display: flex;
            justify-content: center;
            padding: 0.25rem 0;
          }

          /* 3 statistik angka sejajar 3 kolom dalam 1 baris */
          .dash-summary .panel-numbers {
            display: grid !important;
            grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
            gap: 0.4rem !important;
            text-align: center;
            border-top: 1px solid rgba(0, 0, 0, 0.08);
            padding-top: 0.85rem;
          }
          .dash-summary .big-stat {
            padding: 0.25rem 0.15rem;
          }
          .dash-summary .big-label {
            font-size: 0.7rem !important;
            line-height: 1.25;
          }
          .dash-summary .big-number {
            font-size: 1.3rem !important;
            margin-top: 0.2rem;
          }

          /* Kartu daftar hadir/belum hadir */
          .dash-list-card {
            padding: 1rem !important;
          }
          .dash-card-head {
            display: flex !important;
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 0.65rem !important;
          }
          .dash-tab-wrap .segmented,
          .dash-tab-wrap [role="group"],
          .dash-tab-wrap > div {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            width: 100% !important;
          }
          .dash-tab-wrap button {
            width: 100% !important;
            min-width: 0 !important;
            font-size: 0.78rem !important;
            padding: 0.5rem 0.3rem !important;
            justify-content: center !important;
          }
          .dash-card-head .field-inline,
          .dash-card-head input {
            width: 100% !important;
            min-height: 38px !important;
            font-size: 0.85rem !important;
            box-sizing: border-box !important;
          }
        }
      `}</style>

      <div className="page-head dash-head">
        <div>
          <h1>Dashboard</h1>
          <p className="lead">Kehadiran pada {formatDate(tanggal)}.</p>
        </div>
        <Link to="/admin/rekap" className="btn btn-primary">
          <Icon name="calendar-check" />
          Rekap &amp; ekspor CSV
        </Link>
      </div>

      <div className="toolbar dash-filter-box">
        <div className="dash-seg-wrap">
          <Segmented label="Pilih hari" options={DAY_OPTIONS} value={mode} onChange={setMode} />
        </div>

        {mode === "custom" && (
          <label className="field-inline dash-date-row">
            <span>Pilih tanggal</span>
            <input type="date" value={custom} max={todayISO()} onChange={(e) => e.target.value && setCustom(e.target.value)} />
          </label>
        )}

        <div className="dash-action-row">
          <label className="field-inline">
            <span>Grafik</span>
            <select value={hari} onChange={(e) => setHari(Number(e.target.value))}>
              <option value={7}>7 hari</option>
              <option value={14}>14 hari</option>
              <option value={30}>30 hari</option>
            </select>
          </label>
          <button type="button" className="btn btn-secondary" onClick={load} disabled={loading} style={{ gap: "0.4rem" }}>
            {loading ? <span className="dash-spin" aria-hidden="true" /> : <Icon name="refresh" />}
            <span>{loading ? "Memuat..." : "Muat ulang"}</span>
          </button>
        </div>
      </div>

      {error && (
        <Alert tone={info.tone} title={info.title}>
          {info.hint}
        </Alert>
      )}

      {!summary && loading && <Spinner label="Memuat ringkasan..." />}
      {summary && (
        <section className="panel-cream dash-summary" aria-label="Ringkasan kehadiran">
          <div className="panel-chart">
            <h2 className="panel-title">Kehadiran {hari} hari terakhir</h2>
            <BarChart data={summary.harian} total={summary.total_mahasiswa} highlight={summary.tanggal} />
          </div>
          <div className="panel-gauge">
            <Gauge value={summary.persentase_hadir} label="Hadir" />
          </div>
          <dl className="panel-numbers">
            <div className="big-stat">
              <dt className="big-label">Mahasiswa hadir</dt>
              <dd className="big-number">{summary.hadir}</dd>
            </div>
            <div className="big-stat">
              <dt className="big-label">Belum hadir</dt>
              <dd className="big-number">{summary.belum_hadir}</dd>
            </div>
            <div className="big-stat">
              <dt className="big-label">Total terdaftar</dt>
              <dd className="big-number">{summary.total_mahasiswa}</dd>
            </div>
          </dl>
        </section>
      )}

      <section className="card dash-list-card">
        <div className="card-head dash-card-head">
          <div className="dash-tab-wrap">
            <Segmented
              label="Daftar"
              value={tab}
              onChange={setTab}
              options={[
                { key: "hadir", label: `Sudah hadir (${hadirRows.length})` },
                { key: "belum", label: `Belum hadir (${belumRows.length})` },
              ]}
            />
          </div>
          <label className="field-inline">
            <span className="sr-only">Cari nama atau NIM</span>
            <input type="search" placeholder="Cari nama atau NIM..." value={query} onChange={(e) => setQuery(e.target.value)} />
          </label>
        </div>

        {tab === "hadir" ? (
          <AttendanceTable rows={hadirRows} loading={loading && attendance.length === 0} emptyText="Belum ada yang hadir pada tanggal ini." />
        ) : belumRows.length === 0 ? (
          <p className="empty">Semua mahasiswa sudah hadir.</p>
        ) : (
          <div className="table-wrap">
            <table className="table table-stack">
              <thead>
                <tr>
                  <th scope="col">No</th>
                  <th scope="col">Nama</th>
                  <th scope="col">NIM</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {belumRows.map((s, i) => (
                  <tr key={s.id}>
                    <td data-label="No">{i + 1}</td>
                    <td data-label="Nama">{s.nama}</td>
                    <td data-label="NIM">{s.nim}</td>
                    <td data-label="Status">
                      <span className="badge badge-warning">Belum hadir</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
