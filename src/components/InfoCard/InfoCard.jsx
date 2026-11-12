import './InfoCard.css';

function InfoCard({ title, description, icon: Icon, headingLevel = 3 }) {
  const Heading = `h${headingLevel}`;

  return (
    <article className="info-card">
      {Icon && (
        <span className="info-card__icon" aria-hidden="true">
          <Icon size={22} strokeWidth={1.6} />
        </span>
      )}
      <Heading className="info-card__title">{title}</Heading>
      <p className="info-card__description">{description}</p>
    </article>
  );
}

export default InfoCard;
