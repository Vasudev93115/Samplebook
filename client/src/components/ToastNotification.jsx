import { createContext, useContext, useState, useCallback, useRef } from 'react';
import { X, CheckCircle, AlertCircle } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const counterRef = useRef(0);

  const addToast = useCallback((message, type = 'success') => {
    const id = ++counterRef.current;
    setToasts(prev => [...prev, { id, message, type, exiting: false }]);

    setTimeout(() => {
      setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t));
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 300);
    }, 4000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t));
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 300);
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`pointer-events-auto bg-white dark:bg-slate-900 rounded-lg shadow-lg border border-gray-100 dark:border-slate-700 p-4 flex items-start gap-3 ${toast.exiting ? 'toast-exit' : 'toast-enter'}`}
            style={{ borderLeft: `4px solid ${toast.type === 'error' ? '#dc2626' : '#1a6b47'}` }}
          >
            <div className="flex-shrink-0 mt-0.5">
              {toast.type === 'error' ? (
                <AlertCircle size={18} className="text-red-500" />
              ) : (
                <CheckCircle size={18} className="text-emerald-600" />
              )}
            </div>
            <p className="text-sm text-gray-800 dark:text-slate-200 flex-1 leading-relaxed">{toast.message}</p>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors duration-150 flex-shrink-0 mt-0.5"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
}

export default ToastProvider;
