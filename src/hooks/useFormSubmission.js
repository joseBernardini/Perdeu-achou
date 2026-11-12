import { useCallback, useEffect, useRef, useState } from 'react';
import { FormValidationError } from '../services/serviceErrors';

const DEFAULT_ERROR_MESSAGE = 'Não foi possível concluir a operação. Tente novamente em alguns instantes.';

function useFormSubmission({ initialValues, validate, onSubmit, resolveError }) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const formRef = useRef(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const focusFirstInvalidField = useCallback(() => {
    requestAnimationFrame(() => {
      formRef.current?.querySelector('[aria-invalid="true"]')?.focus();
    });
  }, []);

  const handleChange = useCallback(
    (event) => {
      const { name, value } = event.target;
      const next = { ...values, [name]: value };
      setSubmitError('');
      setValues(next);
      if (submitAttempted) setErrors(validate(next));
    },
    [submitAttempted, validate, values]
  );

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      if (isSubmitting) return;

      setSubmitAttempted(true);
      setSubmitError('');

      const validationErrors = validate(values);
      setErrors(validationErrors);

      if (Object.keys(validationErrors).length > 0) {
        focusFirstInvalidField();
        return;
      }

      setIsSubmitting(true);

      try {
        await onSubmit(values);
      } catch (error) {
        if (!isMountedRef.current) return;

        if (error instanceof FormValidationError) {
          setErrors(error.fieldErrors);
          focusFirstInvalidField();
        } else {
          setSubmitError(resolveError?.(error) ?? error?.message ?? DEFAULT_ERROR_MESSAGE);
        }
      } finally {
        if (isMountedRef.current) setIsSubmitting(false);
      }
    },
    [focusFirstInvalidField, isSubmitting, onSubmit, resolveError, validate, values]
  );

  return { values, errors, isSubmitting, submitError, formRef, handleChange, handleSubmit, setValues };
}

export default useFormSubmission;
