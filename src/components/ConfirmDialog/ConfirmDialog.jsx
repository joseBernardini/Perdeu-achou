import { useEffect, useId, useRef, useState } from 'react';
import Button from '../Button/Button';
import FormAlert from '../FormAlert/FormAlert';
import TextField from '../TextField/TextField';
import { FormValidationError } from '../../services/serviceErrors';
import { ADMIN_REASON_LIMITS } from '../../utils/constants';
import './ConfirmDialog.css';

function ConfirmDialog({
  title,
  description,
  confirmLabel,
  loadingLabel = 'Processando',
  tone = 'primary',
  requireReason = false,
  reasonLabel = 'Motivo',
  reasonHint,
  validateReason,
  onConfirm,
  onCancel,
}) {
  const dialogRef = useRef(null);
  const titleId = useId();
  const descriptionId = useId();
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const previouslyFocused = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const firstField = dialogRef.current?.querySelector('textarea, button');
    firstField?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      if (previouslyFocused && typeof previouslyFocused.focus === 'function') previouslyFocused.focus();
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !isSubmitting) {
        event.preventDefault();
        onCancel();
        return;
      }

      if (event.key !== 'Tab' || !dialogRef.current) return;

      const focusable = dialogRef.current.querySelectorAll('button:not([disabled]), textarea:not([disabled])');
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isSubmitting, onCancel]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitting) return;

    if (requireReason) {
      const message = validateReason?.(reason) ?? '';
      setReasonError(message);
      if (message) {
        dialogRef.current?.querySelector('textarea')?.focus();
        return;
      }
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      await onConfirm(reason);
    } catch (error) {
      if (error instanceof FormValidationError && error.fieldErrors.reason) {
        setReasonError(error.fieldErrors.reason);
      } else {
        setSubmitError(error?.message ?? 'Não foi possível concluir a ação.');
      }
      setIsSubmitting(false);
    }
  };

  return (
    <div className="confirm-dialog__backdrop">
      <form
        ref={dialogRef}
        className="confirm-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        onSubmit={handleSubmit}
        noValidate
      >
        <h2 id={titleId} className="confirm-dialog__title">
          {title}
        </h2>
        <div id={descriptionId} className="confirm-dialog__description">
          {description}
        </div>

        {submitError && (
          <FormAlert tone="error" title="A ação não foi concluída">
            {submitError}
          </FormAlert>
        )}

        {requireReason && (
          <TextField
            id="confirmacao-motivo"
            name="reason"
            label={reasonLabel}
            hint={reasonHint ?? `Entre ${ADMIN_REASON_LIMITS.min} e ${ADMIN_REASON_LIMITS.max} caracteres. O motivo fica registrado no histórico.`}
            multiline
            rows={3}
            maxLength={ADMIN_REASON_LIMITS.max}
            showCounter
            value={reason}
            onChange={(event) => {
              setReason(event.target.value);
              if (reasonError) setReasonError(validateReason?.(event.target.value) ?? '');
            }}
            error={reasonError}
          />
        )}

        <div className="confirm-dialog__actions">
          <Button variant="ghost" onClick={onCancel} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            className={tone === 'danger' ? 'confirm-dialog__danger' : ''}
            loading={isSubmitting}
            loadingText={loadingLabel}
          >
            {confirmLabel}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default ConfirmDialog;
