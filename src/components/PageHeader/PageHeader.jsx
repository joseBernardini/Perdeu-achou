import { Fragment } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import './PageHeader.css';

function PageHeader({ breadcrumbs = [], title, lead, children }) {
  return (
    <header className="page-header">
      <div className="container">
        {breadcrumbs.length > 0 && (
          <nav aria-label="Trilha de navegação">
            <ol className="breadcrumb">
              {breadcrumbs.map((item, index) => {
                const isLast = index === breadcrumbs.length - 1;

                return (
                  <Fragment key={item.label}>
                    <li aria-current={isLast ? 'page' : undefined}>
                      {isLast || !item.to ? item.label : <Link to={item.to}>{item.label}</Link>}
                    </li>
                    {!isLast && (
                      <li aria-hidden="true">
                        <ChevronRight size={14} strokeWidth={2} />
                      </li>
                    )}
                  </Fragment>
                );
              })}
            </ol>
          </nav>
        )}

        <div className="page-header__content">
          <div>
            <h1 className="page-header__title">{title}</h1>
            {lead && <p className="page-header__lead">{lead}</p>}
          </div>
          {children && <div className="page-header__actions">{children}</div>}
        </div>
      </div>
    </header>
  );
}

export default PageHeader;
