'use client';
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

// API global que inyecta el script de Cloudflare Turnstile.
declare global {
  interface Window {
    turnstile?: {
      render: (
        el: HTMLElement,
        opts: {
          sitekey: string;
          callback: (token: string) => void;
          'expired-callback'?: () => void;
          'error-callback'?: () => void;
          theme?: 'light' | 'dark' | 'auto';
        },
      ) => string;
      remove: (widgetId: string) => void;
      reset: (widgetId: string) => void;
    };
  }
}

const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js';

export interface TurnstileHandle {
  // Reinicia el widget para obtener un token nuevo. Los tokens de Turnstile son
  // de un solo uso; tras un envío (fallido o exitoso) hay que resetear.
  reset: () => void;
}

interface TurnstileProps {
  // Llamado con el token cuando el captcha se resuelve, y con '' al expirar.
  onToken: (token: string) => void;
}

/**
 * Widget de Cloudflare Turnstile. Si NEXT_PUBLIC_TURNSTILE_SITE_KEY no está
 * configurada, el componente no renderiza nada y no entrega token (la
 * verificación queda desactivada de extremo a extremo — ver TurnstileService
 * en el backend).
 *
 * Expone reset() vía ref para volver a pedir un token tras un envío.
 */
const Turnstile = forwardRef<TurnstileHandle, TurnstileProps>(function Turnstile(
  { onToken },
  ref,
) {
  const contenedorRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | undefined>(undefined);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  useImperativeHandle(ref, () => ({
    reset: () => {
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.reset(widgetIdRef.current);
          onToken('');
        } catch {
          // El widget pudo no estar montado; ignorar.
        }
      }
    },
  }));

  useEffect(() => {
    if (!siteKey || !contenedorRef.current) return;
    const contenedor = contenedorRef.current;
    let cancelado = false;

    function renderWidget() {
      if (cancelado || !window.turnstile || !contenedor) return;
      widgetIdRef.current = window.turnstile.render(contenedor, {
        sitekey: siteKey as string,
        callback: (token) => onToken(token),
        'expired-callback': () => onToken(''),
        'error-callback': () => onToken(''),
        theme: 'light',
      });
    }

    // Carga el script una sola vez; si ya está, renderiza directo.
    if (window.turnstile) {
      renderWidget();
    } else {
      let script = document.querySelector<HTMLScriptElement>(
        `script[src="${SCRIPT_SRC}"]`,
      );
      if (!script) {
        script = document.createElement('script');
        script.src = SCRIPT_SRC;
        script.async = true;
        document.head.appendChild(script);
      }
      script.addEventListener('load', renderWidget);
    }

    return () => {
      cancelado = true;
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          // El widget pudo no haberse montado; ignorar.
        }
      }
    };
  }, [siteKey, onToken]);

  if (!siteKey) return null;

  return (
    <div
      ref={contenedorRef}
      style={{ display: 'flex', justifyContent: 'center', minHeight: 65 }}
    />
  );
});

export default Turnstile;
