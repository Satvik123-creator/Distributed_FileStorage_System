import React from "react";

const StatsCard = React.memo(({ label, value, detail, tone = "default" }) => {
  return (
    <article className={`stats-card stats-card-${tone}`}>
      <p>{label}</p>
      <h3>{value}</h3>
      {detail ? <span>{detail}</span> : null}
    </article>
  );
});

export default StatsCard;
