import { Toaster } from 'sonner';
import { useSelector } from 'react-redux';

export default function ThemedToaster() {
  const mode = useSelector((s) => s.theme.mode);
  return <Toaster theme={mode} position="top-center" richColors closeButton />;
}
