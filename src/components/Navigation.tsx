import { Link, useLocation } from "react-router-dom";
import { useBooking } from "../App";

interface NavigationProps {
  onMenuOpen: () => void;
  isDark?: boolean;
}

export default function Navigation({ onMenuOpen, isDark = false }: NavigationProps) {
  const location = useLocation();
  const { openBooking } = useBooking();

  const isHome = location.pathname === "/";

  return (
    <nav
      className="fixed top-0 left-0 w-full z-[100] flex items-center justify-center transition-colors duration-800"
      style={{
        padding: "28px 48px",
        color: isDark ? "#e0e0f0" : "#1a1a1a",
      }}
    >
      <Link
        to="/"
        className="font-display absolute left-12 text-sm font-semibold tracking-[3px] uppercase no-underline"
        style={{ color: "inherit" }}
      >
        Integrative Advising
      </Link>

      <div className="absolute right-12 flex items-center gap-7">
        <button
          onClick={() => openBooking(isDark)}
          className="font-body text-xs font-semibold tracking-[1.5px] uppercase no-underline border rounded-sm cursor-pointer"
          style={{
            color: "inherit",
            borderColor: "currentColor",
            padding: "8px 20px",
            opacity: 0.85,
            background: "none",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.85")}
        >
          Book Now
        </button>
        <button
          className="hamburger relative cursor-pointer bg-none border-none p-0 flex flex-col justify-between"
          style={{
            width: "28px",
            height: "18px",
            opacity: 0.85,
          }}
          onClick={onMenuOpen}
          aria-label="Open menu"
          aria-expanded="false"
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.85")}
        >
          <span
            className="block w-full rounded-sm"
            style={{
              height: "1.5px",
              background: "currentColor",
            }}
          />
          <span
            className="block w-full rounded-sm"
            style={{
              height: "1.5px",
              background: "currentColor",
            }}
          />
          <span
            className="block w-full rounded-sm"
            style={{
              height: "1.5px",
              background: "currentColor",
            }}
          />
        </button>
      </div>

      <style>{`
        @media (max-width: 768px) {
          nav {
            padding: 20px 24px !important;
          }
          nav a[href="/"] {
            left: 24px !important;
          }
          nav .absolute.right-12 {
            right: 24px !important;
          }
        }
      `}</style>
    </nav>
  );
}
