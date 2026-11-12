import { ArrowRight, Search } from 'lucide-react';
import Button from '../../components/Button/Button';
import FormAlert from '../../components/FormAlert/FormAlert';
import { ROUTES } from '../../utils/constants';

function SignedInNotice({ user }) {
  return (
    <div className="auth-signed-in">
      <FormAlert tone="success" title={`Você já está conectado como ${user.name}`}>
        Acesse sua área para acompanhar as solicitações ou continue consultando os objetos encontrados.
      </FormAlert>
      <div className="auth-signed-in__actions">
        <Button to={ROUTES.userArea} icon={ArrowRight}>
          Ir para minha área
        </Button>
        <Button to={ROUTES.objects} variant="secondary" icon={Search} iconPosition="start">
          Consultar objetos
        </Button>
      </div>
    </div>
  );
}

export default SignedInNotice;
