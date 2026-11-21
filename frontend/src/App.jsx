import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./auth.jsx";
import Shell from "./components/Shell.jsx";
import AdminLayout from "./layouts/AdminLayout.jsx";
import PresensiPage from "./pages/PresensiPage.jsx";
import DaftarPage from "./pages/DaftarPage.jsx";
import AdminLoginPage from "./pages/admin/AdminLoginPage.jsx";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage.jsx";
import AdminRekapPage from "./pages/admin/AdminRekapPage.jsx";
import AdminMahasiswaPage from "./pages/admin/AdminMahasiswaPage.jsx";
import AdminPengaturanPage from "./pages/admin/AdminPengaturanPage.jsx";

function NotFound() {
  return (
    <>
      <h1>Halaman tidak ditemukan</h1>
      <p className="lead">Alamat yang Anda buka tidak ada.</p>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Halaman Utama Publik: Kiosk Presensi Wajah (tanpa menu sidebar) */}
        <Route element={<Shell nav={[]} />}>
          <Route index element={<PresensiPage />} />
          <Route path="*" element={<NotFound />} />
        </Route>

        {/* Area Admin: Login, Dashboard, Rekap, Manajemen & Registrasi Mahasiswa, Pengaturan Threshold */}
        <Route element={<Shell nav={[]} badge="Admin" />}>
          <Route path="admin/login" element={<AdminLoginPage />} />
        </Route>
        <Route path="admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboardPage />} />
          <Route path="rekap" element={<AdminRekapPage />} />
          <Route path="mahasiswa" element={<AdminMahasiswaPage />} />
          <Route path="mahasiswa/tambah" element={<DaftarPage mode="admin" />} />
          <Route path="pengaturan" element={<AdminPengaturanPage />} />
        </Route>

        {/* Redirect rute lama ke alur baru */}
        <Route path="presensi" element={<Navigate to="/" replace />} />
        <Route path="mahasiswa/*" element={<Navigate to="/" replace />} />
        <Route path="daftar" element={<Navigate to="/admin/mahasiswa/tambah" replace />} />
        <Route path="dashboard" element={<Navigate to="/admin" replace />} />
        <Route path="rekap" element={<Navigate to="/admin/rekap" replace />} />
      </Routes>
    </AuthProvider>
  );
}