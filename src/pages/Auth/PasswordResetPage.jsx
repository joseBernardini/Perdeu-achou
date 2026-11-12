import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, KeyRound } from 'lucide-react';
import Button from '../../components/Button/Button';
import FormAlert from '../../components/FormAlert/FormAlert';
import TextField from '../../components/TextField/TextField';
import { useAuth } from '../../contexts/AuthContext';
import useFormSubmission from '../../hooks/useFormSubmission';
import { validatePasswordResetForm } from '../../utils/authValidation';
import { AUTH_FIELD_LIMITS, ROUTES } from '../../utils/constants';
import AuthLayout from './AuthLayout';

function PasswordResetPage() {
  const { requestPasswordReset } = useAuth();
  const [sentTo, setSentTo] = useState('');

  const onSubmit = useCallback(
    async (values) => {
      const result = await requestPasswordReset(values);
      setSentTo(result.email);
    },
    [requestPasswordReset]
  );

  const { values, errors, isSubmitting, submitError, formRef, handleChange, handleSubmit } = useFormSubmission({
    initialValues: { email: '' },
    validate: validatePasswordResetForm,
    onSubmit,
  });

  return (
    <AuthLayout
      title="Recuperar senha"
      description="Informe o e-mail da sua conta para receber as instruções de redefinição de senha."
      footer={
        <>
          Lembrou a senha? <Link to={ROUTES.login}>Entrar</Link>
        </>
      }
    >
      {sentTo ? (
        <div className="auth-signed-in">
          <FormAlert tone="success" title="Solicitação registrada" autoFocus>
            Se houver uma conta associada a {sentTo}, as instruções serão enviadas para esse endereço. Nesta
            demonstração nenhum e-mail é enviado de fato.
          </FormAlert>
          <div className="auth-signed-in__actions">
            <Button to={ROUTES.login} variant="secondary" icon={ArrowLeft} iconPosition="start">
              Voltar para entrar
            </Button>
          </div>
        </div>
      ) : (
        <form ref={formRef} className="auth-form" onSubmit={handleSubmit} noValidate>
          {submitError && (
            <FormAlert tone="error" title="Não foi possível concluir a solicitação" autoFocus>
              {submitError}
            </FormAlert>
          )}

          <TextField
            id="recuperar-email"
            name="email"
            type="email"
            label="E-mail"
            autoComplete="email"
            maxLength={AUTH_FIELD_LIMITS.email.max}
            value={values.email}
            onChange={handleChange}
            error={errors.email}
          />

          <Button
            type="submit"
            size="lg"
            icon={KeyRound}
            iconPosition="start"
            className="auth-form__submit"
            loading={isSubmitting}
            loadingText="Enviando"
          >
            Enviar instruções
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}

export default PasswordResetPage;
