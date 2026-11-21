import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import Alert from "../../components/Alert.jsx";
import { useAuth } from "../../auth.jsx";
import { describeError } from "../../utils.js";

export default function AdminLoginPage() {
  const { admin, loginAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  if (admin) return <Navigate to="/admin" replace />;

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await loginAdmin({ username: username.trim(), password });
      navigate(location.state?.from || "/admin", { replace: true });
    } catch (err) {
      setError(err);
      setBusy(false);
    }
  }

  const info = error && describeError(error);

  return (
    <div className="admin-login-wrap">
      <style>{`
        .admin-login-wrap {
          width: 100%;
          min-height: 85dvh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.25rem;
          box-sizing: border-box;
        }
        .admin-login-card {
          width: 100%;
          max-width: 380px;
          margin: 0 auto;
          padding: 1.75rem;
          border-radius: 16px;
          animation: loginCardIn 0.28s ease-out;
        }
        .admin-login-title {
          font-size: 1.4rem;
          margin: 0 0 0.3rem;
        }
        .admin-login-lead {
          font-size: 0.88rem;
          line-height: 1.45;
          margin: 0 0 1.25rem;
        }
        .pass-input-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }
        .pass-input-wrap input {
          padding-right: 3.5rem;
          width: 100%;
        }
        .pass-toggle-btn {
          position: absolute;
          right: 0.65rem;
          background: transparent;
          border: none;
          font-size: 0.78rem;
          font-weight: 600;
          color: inherit;
          opacity: 0.65;
          cursor: pointer;
          padding: 0.25rem 0.35rem;
        }
        .pass-toggle-btn:hover {
          opacity: 1;
        }
        .btn-login-submit {
          width: 100%;
          justify-content: center;
          align-items: center;
          gap: 0.55rem;
          min-height: 44px;
          margin-top: 0.65rem;
          font-weight: 600;
        }
        .login-spinner {
          width: 16px;
          height: 16px;
          border: 2.2px solid rgba(255, 255, 255, 0.35);
          border-top-color: #ffffff;
          border-radius: 50%;
          animation: loginSpin 0.7s linear infinite;
          flex-shrink: 0;
        }
        @keyframes loginSpin {
          to { transform: rotate(360deg); }
        }
        @keyframes loginCardIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 480px) {
          .admin-login-wrap {
            padding: 1rem 1.15rem;
            min-height: 82dvh;
          }
          .admin-login-card {
            padding: 1.4rem 1.25rem;
          }
          .admin-login-title {
            font-size: 1.28rem;
          }
          .admin-login-lead {
            font-size: 0.84rem;
            margin-bottom: 1.1rem;
          }
          .admin-login-card .field {
            margin-bottom: 0.9rem;
          }
          .admin-login-card input {
            min-height: 42px;
            font-size: 0.95rem;
          }
        }
      `}</style>

      <section className="card admin-login-card">
        <h1 className="admin-login-title">Masuk Admin</h1>
        <p className="lead admin-login-lead">
          Masuk untuk mengelola data mahasiswa dan kehadiran.
        </p>

        {error && (
          <Alert tone={info.tone} title={info.title}>
            {info.hint}
          </Alert>
        )}

        <form onSubmit={submit}>
          <div className="field">
            <label htmlFor="login-user">Username</label>
            <input
              id="login-user"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Masukkan username"
              autoComplete="username"
              disabled={busy}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="login-pass">Password</label>
            <div className="pass-input-wrap">
              <input
                id="login-pass"
                type={showPass ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password"
                autoComplete="current-password"
                disabled={busy}
                required
              />
              <button
                type="button"
                className="pass-toggle-btn"
                onClick={() => setShowPass((prev) => !prev)}
                tabIndex={-1}
                disabled={busy}
              >
                {showPass ? "Tutup" : "Lihat"}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-login-submit"
            disabled={busy}
          >
            {busy && <span className="login-spinner" aria-hidden="true" />}
            <span>{busy ? "Memeriksa akun..." : "Masuk"}</span>
          </button>
        </form>
      </section>
    </div>
  );
}
