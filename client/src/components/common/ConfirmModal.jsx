import Modal from '../ui/Modal';
import Button from '../ui/Button';

export default function ConfirmModal({ open, title, children, confirmLabel = 'নিশ্চিত করুন', danger = false, busy = false, onConfirm, onClose }) {
  return (
    <Modal
      open={open} onClose={onClose} title={title}
      footer={<>
        <Button variant="secondary" onClick={onClose} disabled={busy}>বাতিল</Button>
        <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} loading={busy}>{confirmLabel}</Button>
      </>}
    >
      <div className="text-sm leading-7">{children}</div>
    </Modal>
  );
}
