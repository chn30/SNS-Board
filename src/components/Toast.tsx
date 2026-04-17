'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from 'react';

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface ToastContextValue {
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const ToastContext = createContext<ToastContextValue>({
  showToast: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextIdRef = useRef(0);

  const showToast = useCallback(
    (message: string, type: 'success' | 'error' | 'info' = 'success') => {
      const id = nextIdRef.current++;
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3000);
    },
    [],
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            data-testid="toast"
            className={`animate-slide-up rounded-xl px-5 py-3 text-sm font-medium shadow-lg backdrop-blur-md transition-all ${
              toast.type === 'error'
                ? 'bg-[rgba(248,113,113,0.15)] text-red-400 border border-[rgba(248,113,113,0.3)]'
                : toast.type === 'info'
                  ? 'bg-[rgba(139,92,246,0.15)] text-accent border border-[rgba(139,92,246,0.3)]'
                  : 'bg-[rgba(52,211,153,0.15)] text-green-400 border border-[rgba(52,211,153,0.3)]'
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
