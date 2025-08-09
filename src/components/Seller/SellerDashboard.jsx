import React, { useState, useEffect } from 'react';
import { 
  User, Package, Plus, ArrowLeft, Eye, Edit3, TrendingUp, 
  DollarSign, Users, BarChart3, Building, Tag, Hash, Coins,
  Mail, Calendar, UserCheck, Wallet, Settings, Shield
} from 'lucide-react';

const SellerDashboard = ({ account, contract }) => {
  const [commodities, setCommodities] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [form, setForm] = useState({
    name: "", category: "", value: "", quantity: "", company: ""
  });

  const fetchCommodities = async () => {
    try {
      setLoading(true);
      const list = await contract.getCommodities();
      setCommodities(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProfile = async () => {
    try {
      // First try to get from sessionStorage
      const storedProfile = sessionStorage.getItem('userProfile');
      if (storedProfile) {
        setUserProfile(JSON.parse(storedProfile));
      }
      
      // Then fetch fresh data from contract if available
      if (contract && account) {
        const user = await contract.getUserById(account);
        if (user.firstName && user.firstName.trim() !== '') {
          const profileData = {
            firstName: user.firstName,
            lastName: user.lastName,
            age: user.age.toString(),
            gender: user.gender,
            isSeller: user.isSeller,
            email: user.email,
            balance: user.balance.toString(),
            walletAddress: account
          };
          setUserProfile(profileData);
          // Update sessionStorage
          sessionStorage.setItem('userProfile', JSON.stringify(profileData));
        }
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const tx = await contract.addCommodity(
        form.name, form.category, parseInt(form.value), 
        parseInt(form.quantity), form.company
      );
      await tx.wait();
      alert("Produit ajouté !");
      setForm({ name: "", category: "", value: "", quantity: "", company: "" });
      setShowAddForm(false);
      fetchCommodities();
    } catch (err) {
      if (err.code === 4001) {
        alert("❌ Transaction annulée par l'utilisateur.");
      } else {
        console.error(err);
        alert("Erreur lors de l'ajout.");
      }
    }
  };

  useEffect(() => {
    if (contract) {
      fetchCommodities();
      fetchUserProfile();
    }
  }, [contract, account]);

  const sellerStats = [
    { icon: Package, number: commodities.length.toString(), label: 'Produits actifs' },
    { icon: TrendingUp, number: '156', label: 'Ventes totales' },
    { icon: DollarSign, number: '12.5 ETH', label: 'Revenus générés' },
    { icon: Users, number: '89', label: 'Clients satisfaits' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* Header */}
      <header className="bg-white/5 backdrop-blur border-b border-white/10 p-6 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <a href="/" className="flex items-center gap-2 bg-transparent border border-white/30 px-4 py-2 rounded-lg hover:bg-white/10 transition-all">
            <ArrowLeft size={16} />
            Retour
          </a>
          <div className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
            BlockchainStore
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowProfile(!showProfile)}
            className="flex items-center gap-2 bg-white/10 border border-white/20 px-4 py-2 rounded-lg hover:bg-white/20 transition-all"
          >
            <Settings size={16} />
          </button>
          <div className="text-right">
            <div className="text-sm text-gray-300 font-mono">
              {account ? `${account.slice(0, 6)}...${account.slice(-4)}` : 'Non connecté'}
            </div>
            <div className="text-cyan-400 font-semibold bg-cyan-400/10 px-3 py-1 rounded-full border border-cyan-400/30">
              Vendeur
            </div>
          </div>
          <div className="w-10 h-10 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full flex items-center justify-center">
            <User size={20} />
          </div>
        </div>
      </header>

      <main className="p-8 max-w-7xl mx-auto">
        {/* User Profile Section */}
        {showProfile && userProfile && (
          <div className="bg-white/10 backdrop-blur rounded-2xl p-8 mb-8 border border-white/20">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <User size={28} />
                Informations Personnelles
              </h2>
              <button
                onClick={() => setShowProfile(false)}
                className="text-gray-400 hover:text-white transition-all"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Personal Info */}
              <div className="space-y-6">
                <div className="bg-white/5 p-6 rounded-xl border border-white/10">
                  <h3 className="text-lg font-semibold text-cyan-400 mb-4 flex items-center gap-2">
                    <UserCheck size={20} />
                    Identité
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Prénom :</span>
                      <span className="font-medium">{userProfile.firstName}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Nom :</span>
                      <span className="font-medium">{userProfile.lastName}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Âge :</span>
                      <span className="font-medium">{userProfile.age} ans</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Genre :</span>
                      <span className="font-medium">{userProfile.gender}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white/5 p-6 rounded-xl border border-white/10">
                  <h3 className="text-lg font-semibold text-purple-400 mb-4 flex items-center gap-2">
                    <Mail size={20} />
                    Contact
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Email :</span>
                      <span className="font-medium text-sm break-all">{userProfile.email}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Type de compte :</span>
                      <span className="font-medium flex items-center gap-2">
                        <Shield size={16} className="text-cyan-400" />
                        {userProfile.isSeller ? 'Vendeur' : 'Acheteur'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Blockchain Info */}
              <div className="space-y-6">
                <div className="bg-white/5 p-6 rounded-xl border border-white/10">
                  <h3 className="text-lg font-semibold text-yellow-400 mb-4 flex items-center gap-2">
                    <Wallet size={20} />
                    Blockchain
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <span className="text-gray-400 block mb-1">Adresse du wallet :</span>
                      <div className="bg-white/5 p-3 rounded-lg border border-white/10 font-mono text-sm break-all">
                        {userProfile.walletAddress}
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Solde :</span>
                      <span className="font-medium text-green-400">
                        {userProfile.balance ? `${(parseInt(userProfile.balance) / 1e18).toFixed(4)} ETH` : '0 ETH'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Statut :</span>
                      <span className="text-green-400 flex items-center gap-1">
                        ✅ Vérifié
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white/5 p-6 rounded-xl border border-white/10">
                  <h3 className="text-lg font-semibold text-green-400 mb-4 flex items-center gap-2">
                    <BarChart3 size={20} />
                    Statistiques
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Produits en vente :</span>
                      <span className="font-medium text-cyan-400">{commodities.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Membre depuis :</span>
                      <span className="font-medium">
                        {new Date().toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Dernière connexion :</span>
                      <span className="font-medium text-green-400">
                        Maintenant
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 justify-center mt-8">
              <button className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-3 rounded-xl font-semibold hover:scale-105 transition-all">
                <Edit3 size={18} />
                Modifier le profil
              </button>
              <button className="flex items-center gap-2 bg-white/10 border border-white/20 px-6 py-3 rounded-xl font-semibold hover:bg-white/20 transition-all">
                <Wallet size={18} />
                Gérer le wallet
              </button>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {sellerStats.map((stat, index) => (
            <div key={index} className="bg-white/10 backdrop-blur rounded-2xl p-6 border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold mb-1">{stat.number}</div>
                  <div className="text-gray-300 text-sm">{stat.label}</div>
                </div>
                <div className="bg-gradient-to-r from-cyan-400 to-purple-600 p-3 rounded-xl">
                  <stat.icon size={24} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Welcome Section */}
        <div className="bg-white/10 backdrop-blur rounded-2xl p-8 mb-8 border border-white/20 flex justify-between items-center flex-wrap gap-5">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
              <BarChart3 size={32} />
              Dashboard Vendeur
              {userProfile && (
                <span className="text-cyan-400 text-xl">
                  - {userProfile.firstName} {userProfile.lastName}
                </span>
              )}
            </h1>
            <p className="text-gray-300">
              Gérez vos produits et suivez vos performances de vente sur la blockchain.
            </p>
          </div>
          <button 
            className="flex items-center gap-2 bg-gradient-to-r from-cyan-400 to-purple-600 px-6 py-3 rounded-xl font-semibold hover:scale-105 transition-all shadow-lg shadow-cyan-400/30"
            onClick={() => setShowAddForm(!showAddForm)}
          >
            <Plus size={20} />
            Ajouter un produit
          </button>
        </div>

        {/* Add Product Form */}
        {showAddForm && (
          <div className="bg-white/10 backdrop-blur rounded-2xl p-8 mb-8 border border-white/20">
            <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <Package size={24} />
              Ajouter un nouveau produit
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                  <Tag size={16} />
                  Nom du produit
                </label>
                <input 
                  name="name" 
                  placeholder="Ex: iPhone 15 Pro"
                  onChange={handleChange}
                  value={form.name}
                  required 
                  className="w-full bg-white/10 border border-white/30 rounded-lg p-3 text-white placeholder-gray-400 focus:border-cyan-400 focus:outline-none transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                  <Package size={16} />
                  Catégorie
                </label>
                <input 
                  name="category" 
                  placeholder="Ex: Électronique"
                  onChange={handleChange}
                  value={form.category}
                  required 
                  className="w-full bg-white/10 border border-white/30 rounded-lg p-3 text-white placeholder-gray-400 focus:border-cyan-400 focus:outline-none transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                  <Coins size={16} />
                  Prix (en wei)
                </label>
                <input 
                  name="value" 
                  type="number" 
                  placeholder="Ex: 1000000000000000000"
                  onChange={handleChange}
                  value={form.value}
                  required 
                  className="w-full bg-white/10 border border-white/30 rounded-lg p-3 text-white placeholder-gray-400 focus:border-cyan-400 focus:outline-none transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                  <Hash size={16} />
                  Quantité
                </label>
                <input 
                  name="quantity" 
                  type="number" 
                  placeholder="Ex: 10"
                  onChange={handleChange}
                  value={form.quantity}
                  required 
                  className="w-full bg-white/10 border border-white/30 rounded-lg p-3 text-white placeholder-gray-400 focus:border-cyan-400 focus:outline-none transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                  <Building size={16} />
                  Entreprise
                </label>
                <input 
                  name="company" 
                  placeholder="Ex: Apple Inc."
                  onChange={handleChange}
                  value={form.company}
                  required 
                  className="w-full bg-white/10 border border-white/30 rounded-lg p-3 text-white placeholder-gray-400 focus:border-cyan-400 focus:outline-none transition-all"
                />
              </div>
            </div>

            <div className="flex gap-4 justify-end mt-6">
              <button 
                type="button"
                className="px-8 py-3 border border-white/30 rounded-lg hover:bg-white/10 transition-all"
                onClick={() => setShowAddForm(false)}
              >
                Annuler
              </button>
              <button 
                type="submit"
                className="px-8 py-3 bg-gradient-to-r from-cyan-400 to-purple-600 rounded-lg font-semibold hover:scale-105 transition-all"
                onClick={handleSubmit}
              >
                Ajouter le produit
              </button>
            </div>
          </div>
        )}

        {/* Products Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <Package size={28} />
            Mes Produits
          </h2>
          
          {loading ? (
            <div className="flex justify-center items-center h-48">
              <div className="w-10 h-10 border-3 border-white/30 border-t-cyan-400 rounded-full animate-spin"></div>
            </div>
          ) : commodities.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <Package size={64} className="mx-auto mb-4 opacity-50" />
              <p>Aucun produit ajouté pour le moment</p>
              <p className="text-sm mt-2">Cliquez sur "Ajouter un produit" pour commencer</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {commodities.map((product, index) => (
                <div 
                  key={index} 
                  className="bg-white/10 backdrop-blur rounded-2xl p-6 border border-white/20 hover:-translate-y-1 hover:shadow-lg hover:shadow-cyan-400/30 transition-all"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-2">
                        {product.name || `Produit ${index + 1}`}
                      </h3>
                      <div className="text-purple-400 text-sm mb-1">
                        {product.category || "Non catégorisé"}
                      </div>
                      <div className="text-cyan-400 text-sm">
                        {product.company || "Entreprise non spécifiée"}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="bg-white/10 border border-white/30 p-2 rounded-lg hover:bg-white/20 transition-all">
                        <Eye size={16} />
                      </button>
                      <button className="bg-white/10 border border-white/30 p-2 rounded-lg hover:bg-white/20 transition-all">
                        <Edit3 size={16} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-gray-300 uppercase font-semibold mb-1">Prix</div>
                      <div className="font-semibold">
                        {product.value ? `${(parseInt(product.value) / 1e18).toFixed(4)} ETH` : 'N/A'}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-300 uppercase font-semibold mb-1">Quantité</div>
                      <div className="font-semibold">
                        {product.quantity || 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default SellerDashboard;