import React, { useState } from "react";

const BuyCommodity = ({ contract }) => {
  const [index, setIndex] = useState("");
  const [price, setPrice] = useState("");

  const handleBuy = async () => {
    try {
      const tx = await contract.buyCommodity(parseInt(index), {
        value: price,
      });
      await tx.wait();
      alert("Achat réussi !");
    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'achat.");
    }
  };

  return (
    <div>
      <h3>🛒 Acheter un produit</h3>
      <input
        type="number"
        placeholder="Index du produit"
        value={index}
        onChange={(e) => setIndex(e.target.value)}
      />
      <input
        type="number"
        placeholder="Prix (en wei)"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
      />
      <button onClick={handleBuy}>Acheter</button>
    </div>
  );
};

export default BuyCommodity;
