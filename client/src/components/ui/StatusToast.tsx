import { Toast } from '../../types/index';
import { useStore } from '../../store/useStore';

interface Props {
  toast: Toast;
}

export default function StatusToast({ toast }: Props) {
  const { dismissToast } = useStore();

  const bgColor = {
    success: 'bg-cyber-green',
    error: 'bg-cyber-red',
    info: 'bg-cyber-accent',
  }[toast.type];

  const textColor = toast.type === 'info' ? 'text-cyber-bg' : 'text-white';

  return (
    <div className={`${bgColor} ${textColor} px-4 py-3 rounded shadow-lg flex items-center justify-between gap-4 font-mono text-sm`}>
      <span>{toast.message}</span>
      <button onClick={() => dismissToast(toast.id)} className="text-xl leading-none opacity-70 hover:opacity-100">
        ×
      </button>
    </div>
  );
}
