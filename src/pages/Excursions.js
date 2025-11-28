import React, { useEffect, useState } from "react";

export default function Excursions() {
  const [excursions, setExcursions] = useState([]);

  useEffect(() => {
    fetch("/globalgid/backend/api.php?method=getExcursions")
      .then(res => res.json())
      .then(data => setExcursions(data));
  }, []);

  return (
    <main className="excursions">
      <h1>Все экскурсии</h1>
      <div className="excursion-list">
        {excursions.map(exc => (
          <div key={exc.excursion_id} className="excursion-card">
            <h2>{exc.title}</h2>
            <p>{exc.description}</p>
            <p>Цена: {exc.price} ₽</p>
            <p>Длительность: {exc.duration} ч.</p>
          </div>
        ))}
      </div>
    </main>
  );
}
