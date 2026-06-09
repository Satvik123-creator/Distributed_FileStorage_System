import React from "react";

const StorageOverview = ({ summary }) => {
  const cards = [
    { label: "Total Nodes", value: summary.totalNodes },
    { label: "Healthy Nodes", value: summary.healthyNodes },
    { label: "Offline Nodes", value: summary.offlineNodes },
    { label: "System Availability", value: `${summary.availability}%` },
  ];

  return (
    <section className="grid grid-cols-4 gap-4">
      {cards.map((card) => (
        <article key={card.label} className="p-4 border border-gray-800 rounded-xl bg-gray-900 shadow-sm grid gap-2">
          <p className="text-xs text-gray-400">{card.label}</p>
          <h3 className="text-xl font-bold text-gray-100">{card.value}</h3>
        </article>
      ))}
    </section>
  );
};

export default StorageOverview;
