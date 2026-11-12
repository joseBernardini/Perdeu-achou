import { FlaskConical } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import './Auth.css';

function AuthLayout({ title, description, children, footer }) {
  const { isDemo } = useAuth();
  useDocumentTitle(title);

  return (
    <div className="auth-page">
      <div className="container auth-page__inner">
        <section className="auth-card" aria-labelledby="auth-titulo">
          <header className="auth-card__header">
            <h1 id="auth-titulo" className="auth-card__title">
              {title}
            </h1>
            {description && <p className="auth-card__description">{description}</p>}
          </header>

          {isDemo && (
            <div className="auth-demo-notice">
              <FlaskConical size={18} strokeWidth={1.75} aria-hidden="true" />
              <p>
                <strong>Acesso demonstrativo.</strong> As contas ficam salvas apenas neste navegador, a senha não é
                armazenada nem verificada e nenhum e-mail é enviado. Não utilize senhas reais.
              </p>
            </div>
          )}

          <div className="auth-card__body">{children}</div>

          {footer && <footer className="auth-card__footer">{footer}</footer>}
        </section>
      </div>
    </div>
  );
}

export default AuthLayout;
