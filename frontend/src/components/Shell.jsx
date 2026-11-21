import { useEffect, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import Icon from "./Icon.jsx";

function NavItems({ nav }) {
  return (
    <ul className="nav-list">
      {nav.map((item) => (
        <li key={item.to}>
          <NavLink to={item.to} end={item.end} className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}>
            {item.icon && <Icon name={item.icon} />}
            <span>{item.label}</span>
          </NavLink>
        </li>
      ))}
    </ul>
  );
}

function Brand({ badge, className = "brand" }) {
  return (
    <p className={className} style={{ margin: 0 }}>
      <span className="brand-mark">
        <Icon name="scan-face" />
      </span>
      <span className="brand-name">ABSENG</span>
      {badge && <span className="nav-badge">{badge}</span>}
    </p>
  );
}

function KioskClock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedDate = now.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const formattedTime = now.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <div className="kiosk-clock">
      <span className="kiosk-date">{formattedDate}</span>
      <span className="kiosk-sep">|</span>
      <span className="kiosk-time">{formattedTime}</span>
    </div>
  );
}

export default function Shell({ badge, nav, actions }) {
  const hasNav = nav.length > 0;
  return (
    <div className={`app ${hasNav ? "app-with-nav" : "app-plain kiosk-shell"}`}>
      {!hasNav && (
        <style>{`
          .kiosk-clock {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 10px;
            padding: 0.4rem 0.85rem;
          }
          .kiosk-date { font-size: 0.85rem; color: #64748b; }
          .kiosk-sep { color: #cbd5e1; }
          .kiosk-time { font-size: 1.1rem; font-weight: 700; font-variant-numeric: tabular-nums; }

          .kiosk-topbar {
            width: 100%;
            max-width: 1360px;
            margin: 0 auto;
            padding: 0.75rem 1rem;
            display: flex;
            flex-wrap: wrap;
            justify-content: space-between;
            align-items: center;
            gap: 0.5rem;
            border-bottom: 1px solid var(--border, #e5e7eb);
          }
          .kiosk-main {
            width: 100%;
            max-width: 1360px;
            margin: 0 auto;
            padding: 0.85rem 1rem 1.25rem 1rem;
          }

          @media (min-width: 901px) {
            .kiosk-shell { height: 100vh; overflow: hidden; }
            .kiosk-shell .content { height: 100%; display: flex; flex-direction: column; overflow: hidden; }
            .kiosk-topbar { flex-shrink: 0; padding: 0.85rem 1.5rem 0.65rem 1.5rem; }
            .kiosk-main { flex: 1; min-height: 0; padding: 0.85rem 1.5rem 1rem 1.5rem; overflow: hidden; }
          }

          @media (max-width: 600px) {
            .kiosk-date, .kiosk-sep { display: none; }
            .kiosk-clock { padding: 0.3rem 0.65rem; }
            .kiosk-time { font-size: 0.95rem; }
          }
        `}</style>
      )}

      <a className="skip-link" href="#main">
        Lewati ke konten utama
      </a>

      {hasNav && (
        <aside className="sidebar">
          <Brand badge={badge} />
          <nav aria-label="Menu utama">
            <p className="nav-heading">Menu</p>
            <NavItems nav={nav} />
          </nav>
        </aside>
      )}

      <div className="content">
        <header className={`topbar ${!hasNav ? "kiosk-topbar" : ""}`}>
          <Brand badge={badge} className="brand brand-top" />
          <div className="topbar-actions">{actions || (!hasNav && !badge && <KioskClock />)}</div>
        </header>
        <main id="main" className={`main ${!hasNav ? "kiosk-main" : ""}`}>
          <Outlet />
        </main>
      </div>

      {hasNav && (
        <nav className="bottom-nav" aria-label="Menu utama (ponsel)">
          <NavItems nav={nav} />
        </nav>
      )}
    </div>
  );
}