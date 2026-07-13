import { useState, useEffect, useRef, useCallback } from "react";
import { useBooking } from "../App";

export default function BookingModal() {
  const { isOpen, isDark, closeBooking } = useBooking();
  const [showSuccess, setShowSuccess] = useState(false);
  const [invalidFields, setInvalidFields] = useState<string[]>([]);
  const modalRef = useRef<HTMLDivElement>(null);
  const lastFocusedRef = useRef<HTMLElement | null>(null);

  const handleClose = useCallback(() => {
    setShowSuccess(false);
    setInvalidFields([]);
    closeBooking();
    if (lastFocusedRef.current?.focus) {
      lastFocusedRef.current.focus();
    }
  }, [closeBooking]);

  useEffect(() => {
    if (isOpen) {
      lastFocusedRef.current = document.activeElement as HTMLElement;
      setTimeout(() => {
        modalRef.current?.querySelector<HTMLInputElement>("#bk-name")?.focus();
      }, 320);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleClose]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const name = form.querySelector<HTMLInputElement>("#bk-name");
    const email = form.querySelector<HTMLInputElement>("#bk-email");
    const interest = form.querySelector<HTMLSelectElement>("#bk-interest");

    const invalid: string[] = [];

    if (!name?.value.trim()) invalid.push("bk-name");
    if (!email?.value.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim()))
      invalid.push("bk-email");
    if (!interest?.value) invalid.push("bk-interest");

    setInvalidFields(invalid);

    if (invalid.length > 0) {
      const firstInvalid = form.querySelector<HTMLElement>(".bk-invalid");
      firstInvalid?.focus();
      return;
    }

    setShowSuccess(true);
    modalRef.current?.scrollTo(0, 0);
  };

  const getInputClass = (id: string) => {
    const base =
      "w-full box-border font-body text-sm rounded px-3.5 py-3 transition-colors duration-300";
    const border = invalidFields.includes(id)
      ? "border-[#b5512f] bg-[#fbeeea]"
      : "border-[rgba(26,26,26,0.15)] bg-[#fbf8f2] focus:border-[rgba(26,26,26,0.55)] focus:bg-white";
    return `${base} ${border}`;
  };

  if (!isOpen) return null;

  return (
    <div
      className={`booking-backdrop fixed inset-0 z-[200] flex items-center justify-center p-6 transition-opacity duration-[450ms] ${
        isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      } ${isDark ? "bk-dark" : ""}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div
        ref={modalRef}
        className="booking-modal relative w-full max-w-[520px] max-h-[calc(100vh-48px)] overflow-y-auto rounded-lg"
        style={{
          background: "#f4f0e8",
          border: "1px solid rgba(26,26,26,0.1)",
          padding: "48px 44px 40px",
          color: "#1a1a1a",
          transform: isOpen ? "translateY(0) scale(1)" : "translateY(24px) scale(0.98)",
          opacity: isOpen ? 1 : 0,
          transition: "transform 0.5s cubic-bezier(0.16,1,0.3,1), opacity 0.5s ease",
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="bk-title"
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          className="bk-close absolute top-[18px] right-[18px] w-[34px] h-[34px] border-none bg-none cursor-pointer flex items-center justify-center"
          style={{ opacity: 0.5 }}
          aria-label="Close"
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.5")}
        >
          <span className="absolute w-[17px] h-[1.5px] bg-[#1a1a1a] rounded-sm rotate-45" />
          <span className="absolute w-[17px] h-[1.5px] bg-[#1a1a1a] rounded-sm -rotate-45" />
        </button>

        {!showSuccess ? (
          <div className="bk-form-view">
            <div
              className="bk-eyebrow"
              style={{
                fontSize: "11px",
                fontWeight: 500,
                letterSpacing: "4px",
                textTransform: "uppercase",
                opacity: 0.5,
                marginBottom: "14px",
              }}
            >
              Book Now
            </div>
            <h2
              id="bk-title"
              className="font-display"
              style={{
                fontSize: "30px",
                fontWeight: 400,
                lineHeight: 1.2,
                margin: "0 0 12px",
              }}
            >
              Begin a conversation.
            </h2>
            <p
              className="bk-sub"
              style={{
                fontSize: "14px",
                fontWeight: 300,
                lineHeight: 1.7,
                opacity: 0.6,
                marginBottom: "30px",
              }}
            >
              Tell us a little about where you are. We'll reach out to find a time
              for a complimentary discovery conversation — no commitment, just a
              beginning.
            </p>

            <form id="bk-form" noValidate onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-3.5 max-[560px]:grid-cols-1">
                <div className="mb-[18px]">
                  <label
                    htmlFor="bk-name"
                    className="block font-body"
                    style={{
                      fontSize: "11px",
                      letterSpacing: "1.5px",
                      textTransform: "uppercase",
                      opacity: 0.55,
                      marginBottom: "8px",
                    }}
                  >
                    Name
                  </label>
                  <input
                    type="text"
                    id="bk-name"
                    name="name"
                    autoComplete="name"
                    className={getInputClass("bk-name")}
                    style={{ outline: "none" }}
                  />
                </div>
                <div className="mb-[18px]">
                  <label
                    htmlFor="bk-email"
                    className="block font-body"
                    style={{
                      fontSize: "11px",
                      letterSpacing: "1.5px",
                      textTransform: "uppercase",
                      opacity: 0.55,
                      marginBottom: "8px",
                    }}
                  >
                    Email
                  </label>
                  <input
                    type="email"
                    id="bk-email"
                    name="email"
                    autoComplete="email"
                    className={getInputClass("bk-email")}
                    style={{ outline: "none" }}
                  />
                </div>
              </div>

              <div className="mb-[18px]">
                <label
                  htmlFor="bk-interest"
                  className="block font-body"
                  style={{
                    fontSize: "11px",
                    letterSpacing: "1.5px",
                    textTransform: "uppercase",
                    opacity: 0.55,
                    marginBottom: "8px",
                  }}
                >
                  I'm interested in
                </label>
                <select
                  id="bk-interest"
                  name="interest"
                  required
                  className={getInputClass("bk-interest")}
                  style={{ outline: "none" }}
                  defaultValue=""
                >
                  <option value="" disabled>
                    Select a path…
                  </option>
                  <option>A discovery conversation</option>
                  <option>Foundation — The Inward Audit</option>
                  <option>Core Journey — Liberate & Integrate</option>
                  <option>Deep Accompaniment</option>
                  <option>Not sure yet</option>
                </select>
              </div>

              <div className="mb-[18px]">
                <label
                  htmlFor="bk-message"
                  className="block font-body"
                  style={{
                    fontSize: "11px",
                    letterSpacing: "1.5px",
                    textTransform: "uppercase",
                    opacity: 0.55,
                    marginBottom: "8px",
                  }}
                >
                  What's bringing you here? (optional)
                </label>
                <textarea
                  id="bk-message"
                  name="message"
                  placeholder="Share as much or as little as you'd like…"
                  className={getInputClass("bk-message")}
                  style={{
                    outline: "none",
                    resize: "vertical",
                    minHeight: "84px",
                  }}
                />
              </div>

              <button
                type="submit"
                className="bk-submit w-full font-body cursor-pointer transition-opacity duration-300 hover:opacity-85"
                style={{
                  marginTop: "10px",
                  fontSize: "12px",
                  fontWeight: 600,
                  letterSpacing: "1.5px",
                  textTransform: "uppercase",
                  color: "#f0ece4",
                  background: "#1a1a1a",
                  border: "1px solid #1a1a1a",
                  borderRadius: "2px",
                  padding: "15px",
                }}
              >
                Request my conversation
              </button>
              <div
                className="bk-note text-center font-body"
                style={{
                  fontSize: "12px",
                  opacity: 0.45,
                  marginTop: "16px",
                  lineHeight: 1.6,
                }}
              >
                We hold what you share in confidence. You'll hear back within two
                days.
              </div>
            </form>
          </div>
        ) : (
          <div
            className="bk-success text-center"
            style={{ padding: "16px 4px 8px" }}
          >
            <div
              className="bk-check mx-auto mb-[26px] flex items-center justify-center rounded-full"
              style={{
                width: "60px",
                height: "60px",
                border: "1.5px solid #1a1a1a",
                opacity: 0.85,
              }}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ width: "26px", height: "26px" }}
              >
                <path d="M5 12.5l4 4 10-10" />
              </svg>
            </div>
            <h2
              className="font-display"
              style={{
                fontSize: "30px",
                fontWeight: 400,
                lineHeight: 1.2,
                marginBottom: "14px",
              }}
            >
              Thank you — this is a beginning.
            </h2>
            <p
              className="font-body mx-auto"
              style={{
                fontSize: "14px",
                fontWeight: 300,
                lineHeight: 1.8,
                opacity: 0.65,
                maxWidth: "36ch",
                marginBottom: "28px",
              }}
            >
              Your request has arrived. We'll reach out personally within two days
              to find a time that feels right.
            </p>
            <button
              onClick={handleClose}
              className="bk-done font-body cursor-pointer transition-colors duration-300"
              style={{
                fontSize: "12px",
                fontWeight: 600,
                letterSpacing: "1.5px",
                textTransform: "uppercase",
                color: "#1a1a1a",
                background: "none",
                border: "1px solid currentColor",
                borderRadius: "2px",
                padding: "13px 30px",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#1a1a1a";
                e.currentTarget.style.color = "#f0ece4";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "none";
                e.currentTarget.style.color = "#1a1a1a";
              }}
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
