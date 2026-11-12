import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, FlaskConical, LayoutDashboard } from 'lucide-react';
import Button from '../../components/Button/Button';
import { useAuth } from '../../contexts/AuthContext';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { APP_NAME, ROUTES, USER_ROLES, USER_ROLE_LABELS } from '../../utils/constants';

const PROFILE_OPTIONS = [
  {
    role: USER_ROLES.staff,
    description: 'Analisa registros de objetos, aprova ou rejeita solicitações e conclui devoluções.',
  },
  {
    role: USER_ROLES.admin,
    description: 'Tem as mesmas ações do funcionário e pode reabrir registros encerrados, com justificativa.',
  },
];

function AdminEntry({ onStart }) {
  const { user } = useAuth();
  const [role, setRole] = useState(USER_ROLES.staff);

  useDocumentTitle('Painel administrativo');

  return (
    <div className="admin-entry">
      <main className="admin-entry__card" aria-labelledby="painel-entrada-titulo">
        <p className="admin-entry__app">{APP_NAME}</p>
        <h1 id="painel-entrada-titulo" className="admin-entry__title">
          Painel administrativo
        </h1>
        <p className="admin-entry__lead">
          Área dos funcionários responsáveis pela análise dos objetos encontrados e das solicitações de recuperação.
        </p>

        <div className="admin-demo-banner" role="note">
          <FlaskConical size={18} strokeWidth={1.75} aria-hidden="true" />
          <p>
            <strong>Demonstração sem controle de acesso.</strong> Nesta etapa, qualquer pessoa pode abrir o painel com um
            perfil de demonstração, sem senha. O perfil escolhido vale apenas para o painel, não altera contas de usuário
            e não deve ser considerado um mecanismo de segurança. A autorização real será implementada posteriormente.
          </p>
        </div>

        <form
          className="admin-entry__form"
          onSubmit={(event) => {
            event.preventDefault();
            onStart({ role, linkedUser: user });
          }}
        >
          <fieldset className="admin-entry__profiles">
            <legend className="admin-entry__legend">Perfil da demonstração</legend>
            {PROFILE_OPTIONS.map((option) => (
              <label key={option.role} className="admin-entry__profile">
                <input
                  type="radio"
                  name="perfil"
                  value={option.role}
                  checked={role === option.role}
                  onChange={() => setRole(option.role)}
                />
                <span>
                  <span className="admin-entry__profile-name">{USER_ROLE_LABELS[option.role]}</span>
                  <span className="admin-entry__profile-text">{option.description}</span>
                </span>
              </label>
            ))}
          </fieldset>

          {user && (
            <p className="admin-entry__linked">
              As ações serão registradas com o seu identificador ({user.id}). Por isso, solicitações feitas pela sua conta
              não poderão ser analisadas por você.
            </p>
          )}

          <Button type="submit" size="lg" icon={LayoutDashboard} iconPosition="start">
            Entrar na demonstração do painel
          </Button>
        </form>

        <Link to={ROUTES.home} className="admin-entry__back">
          <ArrowLeft size={16} strokeWidth={1.75} aria-hidden="true" />
          Voltar ao site
        </Link>
      </main>
    </div>
  );
}

export default AdminEntry;
