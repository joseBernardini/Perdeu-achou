import { useState } from 'react';
import AuthGate from '../../components/AuthGate/AuthGate';
import PageHeader from '../../components/PageHeader/PageHeader';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { ROUTES } from '../../utils/constants';
import RegisterObjectForm from './RegisterObjectForm';
import RegistrationSuccess from './RegistrationSuccess';
import './RegisterObjectPage.css';

const guidance = [
  {
    title: 'Descreva sem fotografias',
    text: 'A identificação é feita apenas pelas informações escritas e pela categoria. Quanto mais precisa a descrição, mais fácil o reconhecimento.',
  },
  {
    title: 'Preserve dados sensíveis',
    text: 'Em documentos e cartões, registre apenas o tipo do item. Números, nomes completos e dados pessoais serão conferidos pela equipe na devolução.',
  },
  {
    title: 'Entregue o objeto',
    text: 'Após o registro, leve o objeto a um funcionário responsável informando o código gerado.',
  },
];

function RegisterObjectPage() {
  const [createdRecord, setCreatedRecord] = useState(null);
  const [formKey, setFormKey] = useState(0);

  useDocumentTitle('Registrar objeto encontrado');

  const handleSuccess = (record) => {
    setCreatedRecord(record);
    window.scrollTo({ top: 0 });
  };

  const handleRegisterAnother = () => {
    setCreatedRecord(null);
    setFormKey((key) => key + 1);
    window.scrollTo({ top: 0 });
  };

  return (
    <div className="register-page">
      <PageHeader
        breadcrumbs={[{ label: 'Início', to: ROUTES.home }, { label: 'Registrar objeto' }]}
        title="Registrar objeto encontrado"
        lead="Preencha as informações do objeto encontrado na instituição. O registro será analisado por um funcionário responsável antes de ficar disponível para consulta."
      />

      <div className="container register-page__body">
        <div className="register-page__main">
          <AuthGate
            title="Entre na sua conta para registrar um objeto"
            description="O registro fica vinculado à sua conta para que a equipe responsável possa analisá-lo com segurança."
          >
            {createdRecord ? (
              <RegistrationSuccess record={createdRecord} onRegisterAnother={handleRegisterAnother} />
            ) : (
              <RegisterObjectForm key={formKey} onSuccess={handleSuccess} />
            )}
          </AuthGate>
        </div>

        <aside className="register-page__aside" aria-labelledby="orientacoes-titulo">
          <h2 id="orientacoes-titulo" className="register-page__aside-title">
            Orientações para o registro
          </h2>
          <ol className="register-page__guidance">
            {guidance.map((item, index) => (
              <li key={item.title} className="register-page__guidance-item">
                <span className="register-page__guidance-index" aria-hidden="true">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div>
                  <h3 className="register-page__guidance-title">{item.title}</h3>
                  <p className="register-page__guidance-text">{item.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </aside>
      </div>
    </div>
  );
}

export default RegisterObjectPage;
