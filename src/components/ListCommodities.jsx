import React, { useEffect, useState } from "react";

const ListCommodities = ({ contract }) => {
  const [commodities, setCommodities] = useState([]);

  const fetchCommodities = async () => {
    try {
      const list = await contract.getCommodities();
      setCommodities(list);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (contract) {
      fetchCommodities();
    }
  }, [contract]);

  return (
    <div>
      <h3>🛍️ Produits disponibles</h3>
      {commodities.length === 0 ? (
        <p>Aucun produit trouvé.</p>
      ) : (
        <ul>
          {commodities.map((item, index) => (
            <li key={index}>
              <strong>{item.name}</strong> — {item.category} — {item.value.toString()} wei — {item.quantity.toString()} unités — {item.company}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ListCommodities;
