import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";

interface MenuOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

const menuLinks = [
  { to: "/about", label: "About" },
  { to: "/", label: "ALIIA Method" },
  { to: "/courses", label: "Courses" },
  { to: "/pricing", label: "Pricing" },
  { to: "/testimonials", label: "Testimonials" },
];

export default function MenuOverlay({ isOpen, onClose }: MenuOverlayProps) {
  const location = useLocation();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <div
      className={`menu-overlay fixed inset-0 z-[99] flex flex-col items-center justify-center gap-2 transition-opacity duration-500 ${
        isOpen ? "open pointer-events-auto" : "pointer-events-none"
      }`}
      style={{
        background: "rgba(240, 236, 228, 0.94)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        opacity: isOpen ? 1 : 0,
      }}
    >
      {/* Close button (X) */}
      <button
        onClick={onClose}
        className="absolute top-7 right-12 cursor-pointer bg-none border-none p-2"
        style={{ opacity: 0.5 }}
        aria-label="Close menu"
        onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.5")}
      >
        <span
          className="block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[17px] h-[1.5px] bg-[#1a1a1a] rounded-sm"
          style={{ transform: "translate(-50%, -50%) rotate(45deg)" }}
        />
        <span
          className="block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[17px] h-[1.5px] bg-[#1a1a1a] rounded-sm"
          style={{ transform: "translate(-50%, -50%) rotate(-45deg)" }}
        />
      </button>

      {menuLinks.map((link, i) => {
        const isCurrent = location.pathname === link.to;
        return (
          <Link
            key={link.to}
            to={link.to}
            onClick={onClose}
            className={`menu-link font-display no-underline block py-1.5 ${
              isCurrent ? "!opacity-100 italic" : ""
            }`}
            style={{
              fontSize: "clamp(28px, 5vw, 52px)",
              fontWeight: 400,
              letterSpacing: "1px",
              color: "#1a1a1a",
              transitionDelay: isOpen ? `${0.08 * (i + 1)}s` : "0s",
            }}
          >
            {link.label}
          </Link>
        );
      })}
    </div>
  );
}
