import { useToast } from '../context/ToastContext';

const colors = { success: 'bg-green-600', error: 'bg-red-600', info: 'bg-indigo-600' };

export default function Toast() {
  const { toasts } = useToast();
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`${colors[t.type] || colors.info} text-white px-4 py-2 rounded-lg shadow-lg animate-fade-in`}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
