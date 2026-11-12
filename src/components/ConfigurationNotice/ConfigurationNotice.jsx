import { Settings } from 'lucide-react';
import { APP_NAME } from '../../utils/constants';
import './ConfigurationNotice.css';

function ConfigurationNotice({ message }) {
  return (
    <main className="configuration-notice">
      <section className="configuration-notice__card" aria-labelledby="configuracao-titulo">
        <Settings className="configuration-notice__icon" size={28} strokeWidth={1.6} aria-hidden="true" />
        <p className="configuration-notice__app">{APP_NAME}</p>
        <h1 id="configuracao-titulo" className="configuration-notice__title">
          Configuração do Firebase pendente
        </h1>
        <p className="configuration-notice__text">{message}</p>
        <ol className="configuration-notice__steps">
          <li>Copie o arquivo .env.example para .env na raiz do projeto.</li>
          <li>Preencha os valores com a configuração Web do projeto no Firebase Console.</li>
          <li>Reinicie o servidor de desenvolvimento com npm start.</li>
        </ol>
      </section>
    </main>
  );
}

export default ConfigurationNotice;
