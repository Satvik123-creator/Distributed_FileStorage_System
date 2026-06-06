import React from "react";

const StorageOverview = ({ summary }) => {
  const cards = [
    { label: "Total Nodes", value: summary.totalNodes },
    { label: "Healthy Nodes", value: summary.healthyNodes },
    { label: "Offline Nodes", value: summary.offlineNodes },
    { label: "System Availability", value: `${summary.availability}%` },
  ];

  return (
    <section className="storage-overview-grid">
      {cards.map((card) => (
        <article key={card.label} className="storage-overview-card">
          <p>{card.label}</p>
          <h3>{card.value}</h3>
        </article>
      ))}
    </section>
  );
};

export default StorageOverview;
