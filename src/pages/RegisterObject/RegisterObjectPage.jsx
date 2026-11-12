import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { APP_NAME, ROUTES } from '../../utils/constants';
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

  useEffect(() => {
    const previousTitle = document.title;
    document.title = `Registrar objeto encontrado | ${APP_NAME}`;
    return () => {
      document.title = previousTitle;
    };
  }, []);

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
      <header className="register-page__header">
        <div className="container">
          <nav aria-label="Trilha de navegação">
            <ol className="breadcrumb">
              <li>
                <Link to={ROUTES.home}>Início</Link>
              </li>
              <li aria-hidden="true">
                <ChevronRight size={14} strokeWidth={2} />
              </li>
              <li aria-current="page">Registrar objeto</li>
            </ol>
          </nav>

          <h1 className="register-page__title">Registrar objeto encontrado</h1>
          <p className="register-page__lead">
            Preencha as informações do objeto encontrado na instituição. O registro será analisado por um
            funcionário responsável antes de ficar disponível para consulta.
          </p>
        </div>
      </header>

      <div className="container register-page__body">
        <div className="register-page__main">
          {createdRecord ? (
            <RegistrationSuccess record={createdRecord} onRegisterAnother={handleRegisterAnother} />
          ) : (
            <RegisterObjectForm key={formKey} onSuccess={handleSuccess} />
          )}
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
