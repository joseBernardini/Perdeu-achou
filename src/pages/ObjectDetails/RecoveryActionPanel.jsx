import { useEffect, useState } from 'react';
import { ClipboardList, HandHelping } from 'lucide-react';
import Button from '../../components/Button/Button';
import { useAuth } from '../../contexts/AuthContext';
import recoveryRequestService from '../../services/recoveryRequestService';
import { ROUTES, getRecoveryRequestPath } from '../../utils/constants';
import { formatDateTime } from '../../utils/date';

function RecoveryActionPanel({ object }) {
  const { user } = useAuth();
  const [pending, setPending] = useState({ status: 'idle', request: null });

  useEffect(() => {
    if (!user) {
      setPending({ status: 'idle', request: null });
      return undefined;
    }

    let isActive = true;
    setPending({ status: 'loading', request: null });

    recoveryRequestService
      .findPendingRequest(object.id, user.id)
      .then((request) => {
        if (isActive) setPending({ status: 'ready', request });
      })
      .catch(() => {
        if (isActive) setPending({ status: 'ready', request: null });
      });

    return () => {
      isActive = false;
    };
  }, [object.id, user]);

  return (
    <aside className="object-details__aside" aria-labelledby="reconheceu-titulo">
      <h2 id="reconheceu-titulo" className="object-details__aside-title">
        Reconheceu este objeto?
      </h2>

      {pending.request ? (
        <>
          <p>
            Você já enviou a solicitação{' '}
            <strong className="object-details-page__inline-code">{pending.request.id}</strong> em{' '}
            {formatDateTime(pending.request.createdAt)}. Ela está pendente de análise por um funcionário responsável.
          </p>
          <Button to={ROUTES.userArea} variant="secondary" icon={ClipboardList} iconPosition="start">
            Acompanhar solicitação
          </Button>
        </>
      ) : (
        <>
          <p>
            Solicite a recuperação explicando por que você acredita ser o proprietário. Informe o código{' '}
            <strong className="object-details-page__inline-code">{object.id}</strong> se precisar falar com a equipe.
          </p>
          <p>
            A devolução acontece somente depois da conferência de informações que comprovem que o objeto é seu, como
            detalhes que não aparecem nesta descrição.
          </p>
          <Button
            to={getRecoveryRequestPath(object.id)}
            icon={HandHelping}
            iconPosition="start"
            loading={pending.status === 'loading'}
            loadingText="Verificando"
          >
            Solicitar recuperação
          </Button>
          {!user && <p className="object-details__aside-hint">Será necessário entrar na sua conta.</p>}
        </>
      )}
    </aside>
  );
}

export default RecoveryActionPanel;
