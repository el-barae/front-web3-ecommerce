import React, { useState } from "react";

const AddCommodity = ({ contract }) => {
  const [form, setForm] = useState({
    name: "",
    category: "",
    value: "",
    quantity: "",
    company: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const tx = await contract.addCommodity(
        form.name,
        form.category,
        parseInt(form.value),
        parseInt(form.quantity),
        form.company
      );
      await tx.wait();
      alert("Produit ajouté !");
    } catch (err) {
      if (err.code === 4001) {
        alert("❌ Transaction annulée par l'utilisateur.");
      } else {
        console.error(err);
        alert("Erreur lors de l'ajout.");
      }
    }

  };

  return (
    <form onSubmit={handleSubmit}>
      <h3>📦 Ajouter un produit</h3>
      <input name="name" placeholder="Nom" onChange={handleChange} required />
      <input name="category" placeholder="Catégorie" onChange={handleChange} required />
      <input name="value" type="number" placeholder="Prix en wei" onChange={handleChange} required />
      <input name="quantity" type="number" placeholder="Quantité" onChange={handleChange} required />
      <input name="company" placeholder="Entreprise" onChange={handleChange} required />
      <button type="submit">Ajouter</button>
    </form>
  );
};

export default AddCommodity;
