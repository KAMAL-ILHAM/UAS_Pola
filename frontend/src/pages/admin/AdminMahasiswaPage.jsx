import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Alert from "../../components/Alert.jsx";
import Modal from "../../components/Modal.jsx";
import Spinner from "../../components/Spinner.jsx";
import { deleteStudent, getAttendance, getStudents, updateStudent } from "../../api.js";
import { describeError, todayISO } from "../../utils.js";
import Icon from "../../components/Icon.jsx";

export default function AdminMahasiswaPage() {
  const [students, setStudents] = useState([]);
  const [presentIds, setPresentIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [res, today] = await Promise.all([
        getStudents(),
        getAttendance({ tanggal: todayISO() }).catch(() => ({ data: [] })),
      ]);
      setStudents(res.data);
      setPresentIds(new Set(today.data.map((a) => a.nim)));
      setError(null);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? students.filter((s) => s.nama.toLowerCase().includes(q) || s.nim.includes(q)) : students;
  }, [students, query]);

  return (
    <>
      <style>{`
        .btn-spin {
          width: 14px;
          height: 14px;
          border: 2px solid rgba(255, 255, 255, 0.35);
          border-top-color: #ffffff;
          border-radius: 50%;
          animation: mhsSpin 0.7s linear infinite;
          display: inline-block;
          flex-shrink: 0;
        }
        @keyframes mhsSpin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 640px) {
          .mhs-page-head {
            flex-direction: column;
            align-items: stretch !important;
            gap: 0.75rem;
          }
          .mhs-page-head h1 {
            font-size: 1.4rem;
          }
          .mhs-page-head .btn {
            width: 100%;
            justify-content: center;
          }

          .mhs-card {
            padding: 1rem !important;
          }
          .mhs-card-head {
            flex-direction: column;
            align-items: stretch !important;
            gap: 0.65rem;
            margin-bottom: 0.85rem;
          }
          .mhs-card-head h2 {
            font-size: 1.05rem;
            margin: 0;
          }
          .mhs-card-head .field-inline,
          .mhs-card-head input {
            width: 100%;
            font-size: 0.88rem;
          }

          /* Tata ulang baris tabel di mobile agar ringkas & tidak penuh */
          .mhs-table,
          .mhs-table tbody {
            display: block;
            width: 100%;
          }
          .mhs-table thead {
            display: none;
          }
          .mhs-table tr {
            display: grid;
            grid-template-columns: 1fr auto;
            gap: 0.35rem 0.75rem;
            align-items: center;
            padding: 0.85rem 0.9rem;
            margin-bottom: 0.65rem;
            border: 1px solid rgba(0, 0, 0, 0.08);
            border-radius: 12px;
            background: rgba(255, 255, 255, 0.6);
          }
          .mhs-table tr:last-child {
            margin-bottom: 0;
          }
          .mhs-table td {
            display: block;
            padding: 0 !important;
            border: none !important;
            text-align: left !important;
          }
          .mhs-table td::before {
            display: none !important;
          }

          /* Baris 1 kiri: Nama mahasiswa */
          .mhs-col-nama {
            grid-column: 1 / 2;
            grid-row: 1;
            font-weight: 700;
            font-size: 0.96rem;
            line-height: 1.3;
          }
          /* Baris 1 kanan: Badge status hadir */
          .mhs-col-status {
            grid-column: 2 / 3;
            grid-row: 1;
            justify-self: end;
          }
          /* Baris 2 kiri: NIM */
          .mhs-col-nim {
            grid-column: 1 / 2;
            grid-row: 2;
            font-size: 0.82rem;
            opacity: 0.75;
          }
          /* Baris 2 kanan: Jumlah foto */
          .mhs-col-foto {
            grid-column: 2 / 3;
            grid-row: 2;
            justify-self: end;
            font-size: 0.8rem;
            opacity: 0.75;
          }
          .mhs-col-foto::after {
            content: " foto";
          }

          /* Baris 3: Tombol Ubah & Hapus sejajar 2 kolom */
          .mhs-table td.actions {
            grid-column: 1 / -1;
            grid-row: 3;
            display: grid !important;
            grid-template-columns: 1fr 1fr;
            gap: 0.5rem;
            margin-top: 0.5rem;
            padding-top: 0.55rem !important;
            border-top: 1px solid rgba(0, 0, 0, 0.06) !important;
          }
          .mhs-table td.actions .btn {
            width: 100%;
            justify-content: center;
            min-height: 36px;
            font-size: 0.82rem;
          }

          /* Modal dialog di mobile */
          .mhs-modal-actions {
            display: grid !important;
            grid-template-columns: 1fr 1fr;
            gap: 0.5rem;
          }
          .mhs-modal-actions .btn {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>

      <div className="page-head mhs-page-head">
        <div>
          <h1>Mahasiswa</h1>
          <p className="lead">Kelola data mahasiswa yang wajahnya sudah terdaftar.</p>
        </div>
        <Link to="/admin/mahasiswa/tambah" className="btn btn-primary">
          <Icon name="plus" />
          Tambah mahasiswa
        </Link>
      </div>

      {notice && <Alert tone="success">{notice}</Alert>}
      {error && (
        <Alert tone={describeError(error).tone} title={describeError(error).title}>
          {describeError(error).hint}
        </Alert>
      )}

      <section className="card mhs-card">
        <div className="card-head mhs-card-head">
          <h2>{students.length} mahasiswa terdaftar</h2>
          <label className="field-inline">
            <span className="sr-only">Cari nama atau NIM</span>
            <input
              type="search"
              placeholder="Cari nama atau NIM..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
        </div>

        {loading && students.length === 0 ? (
          <Spinner label="Memuat data mahasiswa..." />
        ) : shown.length === 0 ? (
          <p className="empty">{query ? "Tidak ada hasil untuk pencarian ini." : "Belum ada mahasiswa terdaftar."}</p>
        ) : (
          <div className="table-wrap">
            <table className="table table-stack mhs-table">
              <caption className="sr-only">Daftar mahasiswa terdaftar</caption>
              <thead>
                <tr>
                  <th scope="col">Nama</th>
                  <th scope="col">NIM</th>
                  <th scope="col">Jumlah foto</th>
                  <th scope="col">Hari ini</th>
                  <th scope="col">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((s) => (
                  <tr key={s.id}>
                    <td className="mhs-col-nama" data-label="Nama">{s.nama}</td>
                    <td className="mhs-col-nim" data-label="NIM">{s.nim}</td>
                    <td className="mhs-col-foto" data-label="Jumlah foto">{s.jumlah_foto}</td>
                    <td className="mhs-col-status" data-label="Hari ini">
                      {presentIds.has(s.nim) ? (
                        <span className="badge badge-success">Hadir</span>
                      ) : (
                        <span className="badge badge-warning">Belum hadir</span>
                      )}
                    </td>
                    <td className="actions">
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => setEditing(s)}
                        aria-label={`Ubah data ${s.nama}`}
                      >
                        <Icon name="edit" />
                        Ubah
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        onClick={() => setDeleting(s)}
                        aria-label={`Hapus ${s.nama}`}
                      >
                        <Icon name="trash" />
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {editing && (
        <EditDialog
          student={editing}
          onClose={() => setEditing(null)}
          onSaved={(name) => {
            setEditing(null);
            setNotice(`Data ${name} berhasil diperbarui.`);
            load();
          }}
        />
      )}
      {deleting && (
        <DeleteDialog
          student={deleting}
          onClose={() => setDeleting(null)}
          onDeleted={(name) => {
            setDeleting(null);
            setNotice(`${name} berhasil dihapus.`);
            load();
          }}
        />
      )}
    </>
  );
}

function EditDialog({ student, onClose, onSaved }) {
  const [nama, setNama] = useState(student.nama);
  const [nim, setNim] = useState(student.nim);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await updateStudent(student.id, { nama: nama.trim(), nim: nim.trim() });
      onSaved(res.data.nama);
    } catch (err) {
      setError(err);
      setSaving(false);
    }
  }

  return (
    <Modal title="Ubah data mahasiswa" onClose={onClose}>
      <form onSubmit={submit}>
        {error && (
          <Alert tone={describeError(error).tone} title={describeError(error).title}>
            {describeError(error).hint}
          </Alert>
        )}
        <div className="field">
          <label htmlFor="edit-nama">Nama</label>
          <input id="edit-nama" value={nama} onChange={(e) => setNama(e.target.value)} disabled={saving} required maxLength={100} />
        </div>
        <div className="field">
          <label htmlFor="edit-nim">NIM</label>
          <input
            id="edit-nim"
            value={nim}
            onChange={(e) => setNim(e.target.value)}
            disabled={saving}
            required
            inputMode="numeric"
            pattern="\d{5,20}"
            title="NIM berupa angka, 5 sampai 20 digit"
          />
        </div>
        <div className="modal-actions mhs-modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>
            Batal
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving} style={{ gap: "0.45rem" }}>
            {saving && <span className="btn-spin" aria-hidden="true" />}
            <span>{saving ? "Menyimpan..." : "Simpan"}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}

function DeleteDialog({ student, onClose, onDeleted }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function confirm() {
    setBusy(true);
    setError(null);
    try {
      await deleteStudent(student.id);
      onDeleted(student.nama);
    } catch (err) {
      setError(err);
      setBusy(false);
    }
  }

  return (
    <Modal title="Hapus mahasiswa?" onClose={onClose}>
      {error && (
        <Alert tone={describeError(error).tone} title={describeError(error).title}>
          {describeError(error).hint}
        </Alert>
      )}
      <p style={{ fontSize: "0.92rem", lineHeight: 1.5 }}>
        Data wajah dan seluruh riwayat kehadiran <strong>{student.nama}</strong> ({student.nim}) akan dihapus permanen.
        Tindakan ini tidak dapat dibatalkan.
      </p>
      <div className="modal-actions mhs-modal-actions">
        <button type="button" className="btn btn-secondary" onClick={onClose} disabled={busy}>
          Batal
        </button>
        <button type="button" className="btn btn-danger" onClick={confirm} disabled={busy} style={{ gap: "0.45rem" }}>
          {busy && <span className="btn-spin" aria-hidden="true" />}
          <span>{busy ? "Menghapus..." : "Ya, hapus"}</span>
        </button>
      </div>
    </Modal>
  );
}
