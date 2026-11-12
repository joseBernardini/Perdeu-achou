import { useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import Button from '../../components/Button/Button';
import FormAlert from '../../components/FormAlert/FormAlert';
import TextField from '../../components/TextField/TextField';
import { useAuth } from '../../contexts/AuthContext';
import useFormSubmission from '../../hooks/useFormSubmission';
import { validateSignUpForm } from '../../utils/authValidation';
import { AUTH_FIELD_LIMITS, ROUTES } from '../../utils/constants';
import AuthLayout from './AuthLayout';
import SignedInNotice from './SignedInNotice';

function SignUpPage() {
  const { signUp, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from ?? ROUTES.userArea;

  const onSubmit = useCallback(
    async (values) => {
      await signUp(values);
      navigate(redirectTo, { replace: true });
    },
    [navigate, redirectTo, signUp]
  );

  const { values, errors, isSubmitting, submitError, formRef, handleChange, handleSubmit } = useFormSubmission({
    initialValues: { name: '', email: '', password: '', passwordConfirmation: '' },
    validate: validateSignUpForm,
    onSubmit,
  });

  return (
    <AuthLayout
      title="Criar conta"
      description="Com uma conta você pode solicitar a recuperação de objetos e acompanhar o andamento das solicitações."
      footer={
        <>
          Já tem conta?{' '}
          <Link to={ROUTES.login} state={location.state}>
            Entrar
          </Link>
        </>
      }
    >
      {user && !isSubmitting ? (
        <SignedInNotice user={user} />
      ) : (
        <form ref={formRef} className="auth-form" onSubmit={handleSubmit} noValidate>
          {submitError && (
            <FormAlert tone="error" title="Não foi possível criar a conta" autoFocus>
              {submitError}
            </FormAlert>
          )}

          <TextField
            id="cadastro-nome"
            name="name"
            label="Nome"
            autoComplete="name"
            maxLength={AUTH_FIELD_LIMITS.name.max}
            value={values.name}
            onChange={handleChange}
            error={errors.name}
          />

          <TextField
            id="cadastro-email"
            name="email"
            type="email"
            label="E-mail"
            autoComplete="email"
            maxLength={AUTH_FIELD_LIMITS.email.max}
            value={values.email}
            onChange={handleChange}
            error={errors.email}
          />

          <TextField
            id="cadastro-senha"
            name="password"
            type="password"
            label="Senha"
            hint={`Use pelo menos ${AUTH_FIELD_LIMITS.password.min} caracteres. Nesta demonstração a senha não é armazenada.`}
            autoComplete="new-password"
            maxLength={AUTH_FIELD_LIMITS.password.max}
            value={values.password}
            onChange={handleChange}
            error={errors.password}
          />

          <TextField
            id="cadastro-confirmacao"
            name="passwordConfirmation"
            type="password"
            label="Confirme a senha"
            autoComplete="new-password"
            maxLength={AUTH_FIELD_LIMITS.password.max}
            value={values.passwordConfirmation}
            onChange={handleChange}
            error={errors.passwordConfirmation}
          />

          <Button
            type="submit"
            size="lg"
            icon={UserPlus}
            iconPosition="start"
            className="auth-form__submit"
            loading={isSubmitting}
            loadingText="Criando conta"
          >
            Criar conta
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}

export default SignUpPage;
