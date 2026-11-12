import { useEffect, useRef, useState } from 'react';
import { CircleAlert, Clock, PackagePlus } from 'lucide-react';
import Button from '../../components/Button/Button';
import FormField, { getFieldDescriptionIds } from '../../components/FormField/FormField';
import { useAuth } from '../../contexts/AuthContext';
import objectService from '../../services/objectService';
import { ObjectValidationError } from '../../services/serviceErrors';
import { OBJECT_FIELD_LIMITS, OBJECT_STATUS, OBJECT_STATUS_LABELS, ROUTES } from '../../utils/constants';
import { getTodayISODate } from '../../utils/date';
import { EMPTY_OBJECT_FORM, OBJECT_FORM_FIELDS, validateObjectField, validateObjectForm } from '../../utils/objectValidation';
import CategoryPicker from './CategoryPicker';
import './RegisterObjectForm.css';

const FIELD_IDS = {
  name: 'objeto-nome',
  category: 'objeto-categoria',
  description: 'objeto-descricao',
  location: 'objeto-local',
  foundDate: 'objeto-data',
  notes: 'objeto-observacoes',
};

const FIELD_LABELS = {
  name: 'Nome do objeto',
  category: 'Categoria',
  description: 'Descrição detalhada',
  location: 'Local onde foi encontrado',
  foundDate: 'Data em que foi encontrado',
  notes: 'Observações adicionais',
};

const FIELD_HINTS = {
  name: 'Use um nome curto e genérico, como "Garrafa térmica" ou "Carregador de celular".',
  description:
    'Informe cor, marca, material e marcas de uso que ajudem o proprietário a reconhecer o objeto. Não registre números de documentos, senhas ou dados pessoais.',
  location: 'Seja específico: prédio, sala, andar ou ponto de referência.',
  foundDate: 'Não é possível informar datas futuras.',
  notes: 'Use este campo para informações que não se encaixam nos anteriores, como o horário aproximado.',
};

function RegisterObjectForm({ onSuccess }) {
  const { user } = useAuth();
  const [values, setValues] = useState(EMPTY_OBJECT_FORM);
  const [errors, setErrors] = useState({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const summaryRef = useRef(null);
  const submitErrorRef = useRef(null);
  const fieldRefs = useRef({});
  const isMountedRef = useRef(true);
  const today = getTodayISODate();

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const errorEntries = OBJECT_FORM_FIELDS.filter((field) => errors[field]);

  const registerRef = (field) => (element) => {
    fieldRefs.current[field] = element;
  };

  const focusField = (field) => {
    const element = fieldRefs.current[field];
    if (!element) return;
    element.focus();
    element.scrollIntoView({ block: 'center' });
  };

  const updateFieldError = (field, nextValues) => {
    const message = validateObjectField(field, nextValues, today);
    setErrors((current) => {
      if ((current[field] ?? '') === message) return current;
      const next = { ...current };
      if (message) next[field] = message;
      else delete next[field];
      return next;
    });
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    const nextValues = { ...values, [name]: value };
    setValues(nextValues);
    setSubmitError('');

    if (submitAttempted || errors[name]) updateFieldError(name, nextValues);
  };

  const handleBlur = (event) => {
    const { name } = event.target;
    if (submitAttempted || values[name]) updateFieldError(name, values);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitting) return;

    setSubmitAttempted(true);
    setSubmitError('');

    const validationErrors = validateObjectForm(values, today);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      requestAnimationFrame(() => summaryRef.current?.focus());
      return;
    }

    setIsSubmitting(true);

    try {
      const record = await objectService.createObject(values, { registeredBy: user?.id ?? null });
      if (!isMountedRef.current) return;
      onSuccess(record);
    } catch (error) {
      if (!isMountedRef.current) return;

      if (error instanceof ObjectValidationError) {
        setErrors(error.fieldErrors);
        requestAnimationFrame(() => summaryRef.current?.focus());
      } else {
        setSubmitError(
          error?.message
            ? `${error.message} Seus dados foram mantidos no formulário para uma nova tentativa.`
            : 'Não foi possível concluir o registro. Seus dados foram mantidos no formulário para uma nova tentativa.'
        );
        requestAnimationFrame(() => submitErrorRef.current?.focus());
      }
    } finally {
      if (isMountedRef.current) setIsSubmitting(false);
    }
  };

  const describedBy = (field) => getFieldDescriptionIds(FIELD_IDS[field], { hint: FIELD_HINTS[field], error: errors[field] });

  const textFieldProps = (field) => ({
    id: FIELD_IDS[field],
    name: field,
    value: values[field],
    onChange: handleChange,
    onBlur: handleBlur,
    ref: registerRef(field),
    'aria-invalid': errors[field] ? true : undefined,
    'aria-describedby': describedBy(field),
    className: 'form-control',
  });

  return (
    <form className="register-form" onSubmit={handleSubmit} noValidate aria-describedby="register-form-requisitos">
      <p id="register-form-requisitos" className="register-form__required-note">
        Todos os campos são obrigatórios, exceto quando indicado como opcional.
      </p>

      {errorEntries.length > 0 && (
        <div ref={summaryRef} className="form-alert form-alert--error" role="alert" tabIndex={-1} aria-labelledby="register-form-resumo-erros">
          <CircleAlert className="form-alert__icon" size={20} strokeWidth={1.75} aria-hidden="true" />
          <div>
            <h2 id="register-form-resumo-erros" className="form-alert__title">
              {errorEntries.length === 1 ? 'Corrija 1 campo para continuar' : `Corrija ${errorEntries.length} campos para continuar`}
            </h2>
            <ul className="form-alert__list">
              {errorEntries.map((field) => (
                <li key={field}>
                  <button type="button" className="form-alert__link" onClick={() => focusField(field)}>
                    {FIELD_LABELS[field]}: {errors[field]}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {submitError && (
        <div ref={submitErrorRef} className="form-alert form-alert--error" role="alert" tabIndex={-1}>
          <CircleAlert className="form-alert__icon" size={20} strokeWidth={1.75} aria-hidden="true" />
          <div>
            <h2 className="form-alert__title">O objeto não foi registrado</h2>
            <p className="form-alert__text">{submitError}</p>
          </div>
        </div>
      )}

      <fieldset className="register-form__section">
        <legend className="register-form__legend">
          <span className="register-form__legend-index" aria-hidden="true">01</span>
          Identificação do objeto
        </legend>

        <div className="register-form__fields">
          <FormField id={FIELD_IDS.name} label={FIELD_LABELS.name} hint={FIELD_HINTS.name} error={errors.name}>
            <input
              type="text"
              autoComplete="off"
              maxLength={OBJECT_FIELD_LIMITS.name.max}
              aria-required="true"
              {...textFieldProps('name')}
            />
          </FormField>

          <FormField id={FIELD_IDS.category} label={FIELD_LABELS.category} error={errors.category} as="fieldset">
            <CategoryPicker
              name="category"
              value={values.category}
              onChange={handleChange}
              onBlur={handleBlur}
              invalid={Boolean(errors.category)}
              describedBy={describedBy('category')}
              firstOptionRef={registerRef('category')}
            />
          </FormField>

          <FormField
            id={FIELD_IDS.description}
            label={FIELD_LABELS.description}
            hint={FIELD_HINTS.description}
            error={errors.description}
            length={values.description.length}
            maxLength={OBJECT_FIELD_LIMITS.description.max}
          >
            <textarea rows={5} maxLength={OBJECT_FIELD_LIMITS.description.max} aria-required="true" {...textFieldProps('description')} />
          </FormField>
        </div>
      </fieldset>

      <fieldset className="register-form__section">
        <legend className="register-form__legend">
          <span className="register-form__legend-index" aria-hidden="true">02</span>
          Informações sobre o encontro
        </legend>

        <div className="register-form__fields">
          <div className="register-form__row">
            <FormField id={FIELD_IDS.location} label={FIELD_LABELS.location} hint={FIELD_HINTS.location} error={errors.location}>
              <input
                type="text"
                autoComplete="off"
                maxLength={OBJECT_FIELD_LIMITS.location.max}
                aria-required="true"
                {...textFieldProps('location')}
              />
            </FormField>

            <FormField id={FIELD_IDS.foundDate} label={FIELD_LABELS.foundDate} hint={FIELD_HINTS.foundDate} error={errors.foundDate}>
              <input type="date" max={today} aria-required="true" {...textFieldProps('foundDate')} />
            </FormField>
          </div>

          <FormField
            id={FIELD_IDS.notes}
            label={FIELD_LABELS.notes}
            hint={FIELD_HINTS.notes}
            error={errors.notes}
            optional
            length={values.notes.length}
            maxLength={OBJECT_FIELD_LIMITS.notes.max}
          >
            <textarea rows={3} maxLength={OBJECT_FIELD_LIMITS.notes.max} {...textFieldProps('notes')} />
          </FormField>
        </div>
      </fieldset>

      <div className="register-form__status">
        <Clock size={18} strokeWidth={1.75} aria-hidden="true" />
        <p>
          O registro será criado com o status <strong>{OBJECT_STATUS_LABELS[OBJECT_STATUS.pendingApproval]}</strong> e só
          aparecerá na consulta geral após a análise de um funcionário responsável.
        </p>
      </div>

      <div className="register-form__actions">
        <Button type="submit" variant="primary" size="lg" icon={PackagePlus} iconPosition="start" loading={isSubmitting} loadingText="Registrando objeto">
          Registrar objeto
        </Button>
        <Button to={ROUTES.home} variant="ghost" size="lg">
          Cancelar
        </Button>
      </div>

      <p className="visually-hidden" aria-live="polite">
        {isSubmitting ? 'Registrando objeto, aguarde.' : ''}
      </p>
    </form>
  );
}

export default RegisterObjectForm;
