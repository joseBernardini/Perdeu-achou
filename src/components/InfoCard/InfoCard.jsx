import './InfoCard.css';

function InfoCard({ title, description }) {
  return (
    <article className="info-card">
      <h3 className="info-card__title">{title}</h3>
      <p className="info-card__description">{description}</p>
    </article>
  );
}

export default InfoCard;
