import { useState } from "react";

const AuthPage = ({ account, contract }) => {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    age: "",
    gender: "Homme",
    isSeller: false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!contract) return alert("Contrat non connecté.");

    try {
      const tx = await contract.register(
        form.firstName,
        form.lastName,
        parseInt(form.age),
        form.gender,
        form.isSeller
      );
      await tx.wait();
      alert("Utilisateur enregistré avec succès !");
    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'enregistrement.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
      <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-6">Inscription</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            name="firstName"
            placeholder="Prénom"
            value={form.firstName}
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded-md"
            required
          />
          <input
            type="text"
            name="lastName"
            placeholder="Nom"
            value={form.lastName}
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded-md"
            required
          />
          <input
            type="number"
            name="age"
            placeholder="Âge"
            value={form.age}
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded-md"
            required
          />
          <select
            name="gender"
            value={form.gender}
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded-md"
          >
            <option value="Homme">Homme</option>
            <option value="Femme">Femme</option>
          </select>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="isSeller"
              checked={form.isSeller}
              onChange={handleChange}
              className="form-checkbox"
            />
            <span>Je suis vendeur</span>
          </label>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
          >
            S’inscrire
          </button>
        </form>

        {account && (
          <p className="mt-4 text-sm text-gray-500 break-words">
            Connecté en tant que : <span className="font-medium">{account}</span>
          </p>
        )}
      </div>
    </div>
  );
};

export default AuthPage;
