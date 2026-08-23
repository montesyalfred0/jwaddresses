import { useState, useEffect } from 'react';
import { Share, X, Download } from 'lucide-react';

const DISMISS_KEY = 'pwa-ios-hint-dismissed';

/** Detecta si la PWA ya corre instalada (standalone) */
const isStandaloneMode = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  window.navigator.standalone === true;

/** Botón "Instalar app" para navegadores que disparan beforeinstallprompt (Chrome/Edge Android y escritorio) */
export function InstallButton() {
  const [installEvent, setInstallEvent] = useState(null);
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    if (isStandaloneMode()) return;

    const handler = (e) => {
      e.preventDefault();
      setInstallEvent(e);
      setHidden(false);
    };
    const onInstalled = () => setHidden(true);

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  if (hidden || !installEvent) return null;

  const handleInstall = async () => {
    installEvent.prompt();
    await installEvent.userChoice;
    setInstallEvent(null);
  };

  return (
    <button
      onClick={handleInstall}
      className="flex items-center gap-1.5 bg-jw-800 hover:bg-jw-900 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
      title="Instalar como aplicación"
    >
      <Download className="w-4 h-4" />
      <span>Instalar app</span>
    </button>
  );
}

/** Banner guía para iPhone: Safari no muestra aviso automático de instalación */
export function IosInstallBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const dismissed = localStorage.getItem(DISMISS_KEY) === '1';
    if (!isStandaloneMode() && isIos && !dismissed) {
      setShow(true);
    }
  }, []);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, '1');
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="bg-jw-50 border-b border-jw-200 animate-fade-in">
      <div className="container mx-auto px-4 py-2.5 flex items-start gap-2.5">
        <Share className="w-4 h-4 mt-0.5 flex-shrink-0 text-jw-700" />
        <p className="flex-1 text-jwtext text-xs sm:text-sm leading-relaxed">
          Para instalar la app en tu iPhone: toca <strong>Compartir</strong> en Safari y luego{' '}
          <strong>"Añadir a pantalla de inicio"</strong>.
        </p>
        <button
          onClick={dismiss}
          aria-label="Cerrar aviso"
          className="text-jwtextm hover:text-jwtext p-0.5 flex-shrink-0 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
