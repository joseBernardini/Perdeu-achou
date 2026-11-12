import { Check, Minus } from 'lucide-react';
import { USER_ROLES, USER_ROLE_LABELS } from '../../utils/constants';
import { AdminPageHeader, useAdminSession } from './AdminShared';

const CAPABILITIES = [
  { id: 'consultar', label: 'Consultar objetos disponíveis', roles: [USER_ROLES.member, USER_ROLES.staff, USER_ROLES.admin] },
  { id: 'registrar', label: 'Registrar objetos encontrados', roles: [USER_ROLES.member, USER_ROLES.staff, USER_ROLES.admin] },
  { id: 'solicitar', label: 'Solicitar a recuperação de objetos', roles: [USER_ROLES.member, USER_ROLES.staff, USER_ROLES.admin] },
  { id: 'painel', label: 'Acessar o painel administrativo', roles: [USER_ROLES.staff, USER_ROLES.admin] },
  { id: 'aprovar-objetos', label: 'Aprovar ou rejeitar registros de objetos', roles: [USER_ROLES.staff, USER_ROLES.admin] },
  { id: 'analisar', label: 'Aprovar ou rejeitar solicitações de outras pessoas', roles: [USER_ROLES.staff, USER_ROLES.admin] },
  { id: 'devolver', label: 'Concluir devoluções', roles: [USER_ROLES.staff, USER_ROLES.admin] },
  { id: 'reabrir', label: 'Reabrir registros devolvidos ou reprovados, com justificativa', roles: [USER_ROLES.admin] },
];

const ROLE_DESCRIPTIONS = {
  [USER_ROLES.member]: 'Alunos, professores e demais pessoas que consultam objetos e acompanham as próprias solicitações.',
  [USER_ROLES.staff]: 'Funcionários responsáveis pela guarda dos objetos, pela análise dos registros e pelas devoluções.',
  [USER_ROLES.admin]: 'Responsáveis pela gestão do sistema, com as permissões dos funcionários e a correção de encerramentos.',
};

function AdminRolesPage() {
  const { session } = useAdminSession();

  return (
    <>
      <AdminPageHeader
        title="Perfis e permissões"
        lead="Referência dos perfis previstos para o sistema. Nesta demonstração, as permissões são apenas indicadas na interface; a autorização real será aplicada no servidor em uma etapa posterior."
      />

      <div className="admin-roles">
        {Object.values(USER_ROLES).map((role) => (
          <section key={role} className="admin-panel" aria-labelledby={`perfil-${role}`}>
            <div className="admin-panel__header">
              <h2 id={`perfil-${role}`} className="admin-role__title">
                {USER_ROLE_LABELS[role]}
              </h2>
              {session.role === role && <span className="admin-tag">Perfil desta demonstração</span>}
            </div>
            <div className="admin-panel__body">
              <p className="admin-actions__note">{ROLE_DESCRIPTIONS[role]}</p>
              <ul className="admin-role__list">
                {CAPABILITIES.map((capability) => {
                  const allowed = capability.roles.includes(role);
                  return (
                    <li key={capability.id} className={allowed ? 'admin-role__allowed' : 'admin-role__denied'}>
                      {allowed ? (
                        <Check size={16} strokeWidth={2} aria-hidden="true" />
                      ) : (
                        <Minus size={16} strokeWidth={2} aria-hidden="true" />
                      )}
                      <span>
                        <span className="visually-hidden">{allowed ? 'Permitido: ' : 'Não permitido: '}</span>
                        {capability.label}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </section>
        ))}
      </div>
    </>
  );
}

export default AdminRolesPage;
