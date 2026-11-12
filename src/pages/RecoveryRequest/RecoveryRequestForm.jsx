import { Lock, Send } from 'lucide-react';
import Button from '../../components/Button/Button';
import FormAlert from '../../components/FormAlert/FormAlert';
import TextField from '../../components/TextField/TextField';
import useFormSubmission from '../../hooks/useFormSubmission';
import { REQUEST_FIELD_LIMITS } from '../../utils/constants';
import { validateRecoveryRequestForm } from '../../utils/recoveryRequestValidation';

const tips = [
  'Características que não aparecem na descrição pública, como marcas de uso, adesivos, arranhões ou objetos guardados dentro.',
  'Quando e onde você acredita ter perdido o objeto.',
  'Para eletrônicos, detalhes como a cor da capa, a tela de bloqueio ou acessórios conectados.',
];

function RecoveryRequestForm({ object, onSubmit, cancelTo }) {
  const { values, errors, isSubmitting, submitError, formRef, handleChange, handleSubmit } = useFormSubmission({
    initialValues: { message: '', additionalInfo: '' },
    validate: validateRecoveryRequestForm,
    onSubmit,
  });

  return (
    <form ref={formRef} className="recovery-form" onSubmit={handleSubmit} noValidate>
      {submitError && (
        <FormAlert tone="error" title="A solicitação não foi enviada" autoFocus>
          {submitError} Suas informações foram mantidas no formulário.
        </FormAlert>
      )}

      <section className="recovery-form__guidance" aria-labelledby="orientacoes-solicitacao">
        <h2 id="orientacoes-solicitacao" className="recovery-form__guidance-title">
          Como ajudar na validação
        </h2>
        <p>Inclua detalhes que somente o proprietário de "{object.name}" saberia informar, por exemplo:</p>
        <ul>
          {tips.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>
      </section>

      <TextField
        id="solicitacao-mensagem"
        name="message"
        label="Por que você acredita ser o proprietário?"
        hint={`Escreva pelo menos ${REQUEST_FIELD_LIMITS.message.min} caracteres.`}
        multiline
        rows={6}
        maxLength={REQUEST_FIELD_LIMITS.message.max}
        showCounter
        value={values.message}
        onChange={handleChange}
        error={errors.message}
      />

      <TextField
        id="solicitacao-informacoes"
        name="additionalInfo"
        label="Informações adicionais"
        hint="Use este campo para outras informações relevantes, como os horários em que você costuma estar na instituição."
        optional
        multiline
        rows={3}
        maxLength={REQUEST_FIELD_LIMITS.additionalInfo.max}
        showCounter
        value={values.additionalInfo}
        onChange={handleChange}
        error={errors.additionalInfo}
      />

      <div className="recovery-form__privacy">
        <Lock size={18} strokeWidth={1.75} aria-hidden="true" />
        <p>
          Não informe senhas, números completos de documentos ou cartões, nem dados bancários. Se for necessário
          confirmar algum dado pessoal, isso será feito presencialmente com um funcionário responsável.
        </p>
      </div>

      <div className="recovery-form__actions">
        <Button type="submit" size="lg" icon={Send} iconPosition="start" loading={isSubmitting} loadingText="Enviando solicitação">
          Enviar solicitação
        </Button>
        <Button to={cancelTo} variant="ghost" size="lg">
          Cancelar
        </Button>
      </div>
    </form>
  );
}

export default RecoveryRequestForm;
