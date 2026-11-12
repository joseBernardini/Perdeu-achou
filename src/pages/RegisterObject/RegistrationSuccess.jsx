import { useEffect, useRef } from 'react';
import { ArrowLeft, CircleCheck, PackagePlus } from 'lucide-react';
import Button from '../../components/Button/Button';
import categories from '../../data/categories';
import StatusBadge from '../../components/StatusBadge/StatusBadge';
import { ROUTES } from '../../utils/constants';
import { formatDateTime, formatISODate } from '../../utils/date';
import './RegistrationSuccess.css';

function RegistrationSuccess({ record, onRegisterAnother }) {
  const headingRef = useRef(null);
  const categoryTitle = categories.find((category) => category.id === record.category)?.title ?? record.category;

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <section className="registration-success" aria-labelledby="registro-concluido-titulo">
      <div className="registration-success__header">
        <span className="registration-success__icon" aria-hidden="true">
          <CircleCheck size={24} strokeWidth={1.75} />
        </span>
        <div>
          <h2 id="registro-concluido-titulo" ref={headingRef} tabIndex={-1} className="registration-success__title">
            Objeto registrado com sucesso
          </h2>
          <p className="registration-success__subtitle">Registro criado em {formatDateTime(record.createdAt)}.</p>
        </div>
      </div>

      <div className="registration-success__code-block">
        <span className="registration-success__code-label">Código do objeto</span>
        <strong className="registration-success__code">{record.id}</strong>
        <StatusBadge status={record.status} className="registration-success__status" />
      </div>

      <dl className="registration-success__details">
        <div>
          <dt>Objeto</dt>
          <dd>{record.name}</dd>
        </div>
        <div>
          <dt>Categoria</dt>
          <dd>{categoryTitle}</dd>
        </div>
        <div>
          <dt>Local</dt>
          <dd>{record.location}</dd>
        </div>
        <div>
          <dt>Encontrado em</dt>
          <dd>{formatISODate(record.foundDate)}</dd>
        </div>
      </dl>

      <div className="registration-success__next">
        <h3 className="registration-success__next-title">Próxima etapa</h3>
        <p>
          Entregue o objeto a um funcionário responsável e informe o código <strong>{record.id}</strong>. O registro
          será analisado e, após a aprovação, ficará disponível na consulta geral para que o proprietário possa
          localizá-lo.
        </p>
      </div>

      <div className="registration-success__actions">
        <Button variant="primary" icon={PackagePlus} iconPosition="start" onClick={onRegisterAnother}>
          Registrar outro objeto
        </Button>
        <Button to={ROUTES.home} variant="secondary" icon={ArrowLeft} iconPosition="start">
          Voltar ao início
        </Button>
      </div>
    </section>
  );
}

export default RegistrationSuccess;
