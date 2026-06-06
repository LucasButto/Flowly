"use client";
import { ReactNode, useEffect } from "react";
import { createPortal } from "react-dom";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import "./Modal.scss";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
}

export default function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  size = "md",
}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fl-modal" role="dialog" aria-modal="true">
      <div className="fl-modal__overlay" onClick={onClose} />
      <div className={`fl-modal__card fl-modal__card--${size}`}>
        {title && (
          <header className="fl-modal__header">
            <h2 className="fl-modal__title">{title}</h2>
            <button
              className="fl-modal__close"
              onClick={onClose}
              aria-label="Cerrar"
            >
              <CloseRoundedIcon />
            </button>
          </header>
        )}
        <div className="fl-modal__body">{children}</div>
        {footer && <footer className="fl-modal__footer">{footer}</footer>}
      </div>
    </div>,
    document.body,
  );
}
