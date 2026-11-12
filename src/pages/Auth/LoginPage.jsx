import { useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import Button from '../../components/Button/Button';
import FormAlert from '../../components/FormAlert/FormAlert';
import TextField from '../../components/TextField/TextField';
import { useAuth } from '../../contexts/AuthContext';
import useFormSubmission from '../../hooks/useFormSubmission';
import { validateSignInForm } from '../../utils/authValidation';
import { AUTH_FIELD_LIMITS, ROUTES } from '../../utils/constants';
import AuthLayout from './AuthLayout';
import SignedInNotice from './SignedInNotice';

function LoginPage() {
  const { signIn, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from ?? ROUTES.userArea;

  const onSubmit = useCallback(
    async (values) => {
      await signIn(values);
      navigate(redirectTo, { replace: true });
    },
    [navigate, redirectTo, signIn]
  );

  const { values, errors, isSubmitting, submitError, formRef, handleChange, handleSubmit } = useFormSubmission({
    initialValues: { email: '', password: '' },
    validate: validateSignInForm,
    onSubmit,
  });

  return (
    <AuthLayout
      title="Entrar"
      description="Acesse sua conta para solicitar a recuperação de objetos e acompanhar suas solicitações."
      footer={
        <>
          Ainda não tem conta?{' '}
          <Link to={ROUTES.signUp} state={location.state}>
            Criar conta
          </Link>
        </>
      }
    >
      {user && !isSubmitting ? (
        <SignedInNotice user={user} />
      ) : (
        <form ref={formRef} className="auth-form" onSubmit={handleSubmit} noValidate>
          {location.state?.reason === 'auth-required' && (
            <FormAlert tone="info" title="Entre para continuar">
              É necessário entrar na sua conta para solicitar a recuperação de um objeto.
            </FormAlert>
          )}

          {submitError && (
            <FormAlert tone="error" title="Não foi possível entrar" autoFocus>
              {submitError}
            </FormAlert>
          )}

          <TextField
            id="entrar-email"
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
            id="entrar-senha"
            name="password"
            type="password"
            label="Senha"
            autoComplete="current-password"
            maxLength={AUTH_FIELD_LIMITS.password.max}
            value={values.password}
            onChange={handleChange}
            error={errors.password}
          />

          <Link to={ROUTES.passwordReset} className="auth-form__inline-link">
            Esqueci minha senha
          </Link>

          <Button
            type="submit"
            size="lg"
            icon={LogIn}
            iconPosition="start"
            className="auth-form__submit"
            loading={isSubmitting}
            loadingText="Entrando"
          >
            Entrar
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}

export default LoginPage;
