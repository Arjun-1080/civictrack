import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

const STYLES = {
  success: 'bg-emerald-50 border-emerald-200 text-emerald-900',
  error:   'bg-red-50 border-red-200 text-red-900',
  info:    'bg-blue-50 border-blue-200 text-blue-900',
};

const ICONS = {
  success: <CheckCircle2 size={17} className="text-emerald-600 shrink-0 mt-0.5" />,
  error:   <XCircle      size={17} className="text-red-500 shrink-0 mt-0.5" />,
  info:    <Info         size={17} className="text-blue-500 shrink-0 mt-0.5" />,
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const toast = useCallback(({ type = 'info', message, duration = 4000 }) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
  }, []);

  const dismiss = useCallback(id => setToasts(prev => prev.filter(t => t.id !== id)), []);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed bottom-5 right-5 z-[200] flex flex-col gap-2 w-80 pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            data-testid="toast"
            className={`flex items-start gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium pointer-events-auto animate-slide-up ${STYLES[t.type] ?? STYLES.info}`}
          >
            {ICONS[t.type]}
            <span className="flex-1 leading-snug">{t.message}</span>
            <button
              onClick={() => dismiss(t.id)}
              className="shrink-0 opacity-40 hover:opacity-80 transition-opacity ml-1"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
