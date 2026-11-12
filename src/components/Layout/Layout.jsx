import { Outlet } from 'react-router-dom';
import Header from '../Header/Header';
import Footer from '../Footer/Footer';
import useScrollToHash from '../../hooks/useScrollToHash';
import './Layout.css';

function Layout({ children }) {
  useScrollToHash();

  return (
    <div className="layout">
      <a href="#conteudo" className="skip-link">
        Pular para o conteúdo
      </a>
      <Header />
      <main id="conteudo" className="layout__main" tabIndex={-1}>
        {children ?? <Outlet />}
      </main>
      <Footer />
    </div>
  );
}

export default Layout;
