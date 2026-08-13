import "./Modal.css";
import { useCallback, useEffect, useId, useRef } from "react";

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Dialogo accesible: anuncia su rol y su titulo, mueve el foco a su interior,
 * lo mantiene dentro mientras esta abierto, cierra con Escape y bloquea el
 * desplazamiento del fondo. Devuelve el foco al elemento que lo abrio.
 */
function Modal({
  open,
  title,
  onClose,
  children,
  footer,
  closeOnBackdrop = true,
  closeLabel = "Cerrar",
}) {
  const dialogRef = useRef(null);
  const previousFocusRef = useRef(null);
  const titleId = useId();

  const requestClose = useCallback(() => {
    if (typeof onClose === "function") {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    previousFocusRef.current = document.activeElement;

    const dialog = dialogRef.current;
    const primero = dialog?.querySelector(FOCUSABLE);
    (primero || dialog)?.focus();

    const bloqueoPrevio = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        requestClose();
        return;
      }

      if (event.key !== "Tab" || !dialogRef.current) {
        return;
      }

      const enfocables = [...dialogRef.current.querySelectorAll(FOCUSABLE)].filter(
        (element) => element.offsetParent !== null
      );

      if (enfocables.length === 0) {
        return;
      }

      const primerElemento = enfocables[0];
      const ultimoElemento = enfocables[enfocables.length - 1];

      if (event.shiftKey && document.activeElement === primerElemento) {
        event.preventDefault();
        ultimoElemento.focus();
      } else if (!event.shiftKey && document.activeElement === ultimoElemento) {
        event.preventDefault();
        primerElemento.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown, true);

    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
      document.body.style.overflow = bloqueoPrevio;

      if (previousFocusRef.current instanceof HTMLElement) {
        previousFocusRef.current.focus();
      }
    };
  }, [open, requestClose]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="app-modal-backdrop"
      onMouseDown={(event) => {
        if (closeOnBackdrop && event.target === event.currentTarget) {
          requestClose();
        }
      }}
    >
      <div
        className="app-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        ref={dialogRef}
      >
        <div className="app-modal-header">
          <h2 id={titleId}>{title}</h2>
          <button
            type="button"
            className="app-modal-close"
            onClick={requestClose}
            aria-label={closeLabel}
          >
            <span aria-hidden="true">×</span>
          </button>
        </div>

        <div className="app-modal-body">{children}</div>

        {footer && <div className="app-modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

export default Modal;
