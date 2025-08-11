import React, { useState, useEffect } from 'react';
import { 
  User, ShoppingBag, Wallet, Star, Package, CreditCard, ArrowLeft,
  Eye, Heart, ShoppingCart, Shield, Clock, CheckCircle, Truck,
  Calendar, Hash, DollarSign, Filter
} from 'lucide-react';
import { Navigate, useNavigate } from 'react-router-dom';

const ClientDashboard = ({ account, contract }) => {
  const navigate = useNavigate();
  const [commodities, setCommodities] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('products'); // 'products', 'orders', or 'profile'
  const [orderFilter, setOrderFilter] = useState('all'); // 'all', 'Pending', 'Shipped', 'Delivered'
  const [quantities, setQuantities] = useState({}); // Store quantities for each product
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [showUserInfo, setShowUserInfo] = useState(false);
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    age: '',
    gender: '',
    email: ''
  });
  const [userInfo, setUserInfo] = useState({
    firstName: '',
    lastName: '',
    age: 0,
    gender: '',
    isSeller: false,
    email: '',
    balance: '0'
  });
  const [stats, setStats] = useState({
    totalPurchases: 0,
    totalSpent: '0',
    averageRating: '4.8'
  });

  const fetchUserInfo = async () => {
    try {
      if (contract && account) {
        const userDetails = await contract.getUserById(account);
        const balance = await contract.getEthBalance(account);
        
        setUserInfo({
          firstName: userDetails[0],
          lastName: userDetails[1],
          age: userDetails[2].toString(),
          gender: userDetails[3],
          isSeller: userDetails[4],
          email: userDetails[5],
          balance: (parseInt(balance) / 1e18).toFixed(4)
        });

        // Update profile form with current data
        setProfileForm({
          firstName: userDetails[0],
          lastName: userDetails[1],
          age: userDetails[2].toString(),
          gender: userDetails[3],
          email: userDetails[5]
        });
      }
    } catch (err) {
      console.error("Error fetching user info:", err);
    }
  };

  const fetchCommodities = async () => {
    try {
      setLoading(true);
      const list = await contract.getCommodities();
      setCommodities(list);
    } catch (err) {
      console.error("Error fetching commodities:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      setOrdersLoading(true);
      const userOrders = await contract.getOrdersByUser(account);
      setOrders(userOrders);
      
      // Update stats based on actual orders
      const totalSpent = userOrders.reduce((sum, order) => 
        sum + (parseInt(order.totalPrice) / 1e18), 0
      );
      setStats(prev => ({
        ...prev,
        totalPurchases: userOrders.length,
        totalSpent: totalSpent.toFixed(4)
      }));
    } catch (err) {
      console.error("Error fetching orders:", err);
    } finally {
      setOrdersLoading(false);
    }
  };

  const handleBuy = async (index, price, quantity) => {
    try {
      // Use the quantity from state or default to 1
      const orderQuantity = quantity || quantities[index] || 1;
      
      // Check if user has sufficient balance in the contract
      const userBalance = parseFloat(userInfo.balance);
      const priceInEth = parseInt(price) / 1e18;
      const totalCost = priceInEth * orderQuantity;

      if (userBalance < totalCost) {
        alert("Solde insuffisant dans votre compte contrat ! Veuillez d'abord déposer des fonds.");
        return;
      }

      // Check if there's enough stock
      const product = commodities[index];
      if (product.quantity < orderQuantity) {
        alert(`Stock insuffisant ! Stock disponible: ${product.quantity}`);
        return;
      }

      const tx = await contract.buyCommodity(index, orderQuantity);
      await tx.wait();
      alert(`Commande passée avec succès ! Quantité: ${orderQuantity}`);
      
      // Reset quantity for this product
      setQuantities(prev => ({ ...prev, [index]: 1 }));
      
      // Refresh data
      fetchCommodities();
      fetchUserInfo();
      fetchOrders();
    } catch (err) {
      console.error("Error buying commodity:", err);
      alert("Erreur lors de l'achat: " + (err.reason || err.message));
    }
  };

  const handleQuantityChange = (index, newQuantity) => {
    const product = commodities[index];
    const maxQuantity = parseInt(product.quantity);
    const quantity = Math.max(1, Math.min(newQuantity, maxQuantity));
    
    setQuantities(prev => ({
      ...prev,
      [index]: quantity
    }));
  };

  const handleProfileUpdate = async () => {
    try {
      // Validate form
      if (!profileForm.firstName.trim() || !profileForm.lastName.trim() || !profileForm.email.trim()) {
        alert("Veuillez remplir tous les champs obligatoires (Prénom, Nom, Email)");
        return;
      }

      const age = parseInt(profileForm.age) || 0;
      if (age < 0 || age > 120) {
        alert("Veuillez entrer un âge valide");
        return;
      }

      const tx = await contract.updateProfile(
        profileForm.firstName,
        profileForm.lastName,
        age,
        profileForm.gender,
        profileForm.email
      );
      await tx.wait();
      
      alert("Profil mis à jour avec succès !");
      setIsEditingProfile(false);
      fetchUserInfo(); // Refresh user info
    } catch (err) {
      console.error("Error updating profile:", err);
      alert("Erreur lors de la mise à jour: " + (err.reason || err.message));
    }
  };

  const handleProfileFormChange = (field, value) => {
    setProfileForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const resetProfileForm = () => {
    setProfileForm({
      firstName: userInfo.firstName,
      lastName: userInfo.lastName,
      age: userInfo.age,
      gender: userInfo.gender,
      email: userInfo.email
    });
    setIsEditingProfile(false);
  };

  // const handleDeposit = async () => {
  //   const amount = prompt("Montant à déposer (en ETH):");
  //   if (amount && !isNaN(amount) && parseFloat(amount) > 0) {
  //     try {
  //       // Convert amount to wei (1 ETH = 10^18 wei)
  //       const amountInWei = (parseFloat(amount) * Math.pow(10, 18)).toString();
  //       const tx = await contract.deposit({ value: amountInWei });
  //       await tx.wait();
  //       alert("Dépôt effectué avec succès !");
  //       fetchUserInfo();
  //     } catch (err) {
  //       console.error("Error depositing:", err);
  //       alert("Erreur lors du dépôt: " + (err.reason || err.message));
  //     }
  //   }
  // };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Pending':
        return <Clock className="w-4 h-4 text-yellow-400" />;
      case 'Shipped':
        return <Truck className="w-4 h-4 text-blue-400" />;
      case 'Delivered':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'Shipped':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'Delivered':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const filteredOrders = orders.filter(order => 
    orderFilter === 'all' || order.status === orderFilter
  );

  useEffect(() => {
    if (contract && account) {
      fetchCommodities();
      fetchUserInfo();
      fetchOrders();
    }
  }, [contract, account]);

  const mockStats = [
    { icon: ShoppingBag, number: stats.totalPurchases.toString(), label: 'Commandes totales' },
    // { icon: Star, number: stats.averageRating, label: 'Note moyenne' },
    { icon: Package, number: commodities.filter(c => c.quantity > 0).length.toString(), label: 'Disponibles' },
    // { icon: CreditCard, number: `${stats.totalSpent} ETH`, label: 'Dépensé' }
  ];

  const handleLogout = () => {
    sessionStorage.setItem('userRole','')
    sessionStorage.setItem('userProfile','')
    navigate('/');
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-800 to-slate-900 text-white">
      {/* Header */}
      <header className="bg-white/5 backdrop-blur-lg border-b border-white/10 px-8 py-6 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <a href="/" className="flex items-center gap-2 bg-transparent border border-white/30 px-4 py-2 rounded-lg hover:bg-white/10 transition-all">
            <ArrowLeft size={16} />
            Retour
          </a>
          <div className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
            BlockchainStore
          </div>
        </div>
        
        <div className="flex items-center gap-4">

          {/* <button 
            onClick={handleDeposit}
            className="bg-gradient-to-r from-green-500 to-emerald-600 px-4 py-2 rounded-lg hover:scale-105 transition-all flex items-center gap-2"
          >
            <Wallet size={16} />
            Déposer
          </button> */}
  
          <div className="flex gap-4 justify-center">
              <button
                onClick={handleLogout}
                className="px-6 py-3 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 rounded-xl text-white font-medium transition-all hover:-translate-y-0.5 shadow-lg shadow-red-500/30"
              >
                Se déconnecter
              </button>
            </div>

          <div className="text-right">
            <div className="text-sm text-gray-300 font-mono">
              {account ? `${account.slice(0, 6)}...${account.slice(-4)}` : 'Non connecté'}
            </div>
            <div className="text-cyan-400 font-semibold">{userInfo.balance} ETH</div>
          </div>
          <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full flex items-center justify-center">
            <User size={20} />
          </div>
        </div>
      </header>

      <main className="p-8 max-w-7xl mx-auto">

        {/* Welcome Section */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 mb-8 border border-white/20">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <Wallet size={32} />
            Bienvenue {userInfo.firstName ? `${userInfo.firstName} ${userInfo.lastName}` : 'sur votre Dashboard Client'}
          </h1>
          <p className="text-gray-300">
            {userInfo.email ? `${userInfo.email} - ` : ''}
            Découvrez nos produits et gérez vos commandes en toute sécurité sur la blockchain.
          </p>
          <button 
            onClick={() => setShowUserInfo(!showUserInfo)}
            className="mt-6 bg-gradient-to-r from-blue-500 to-indigo-600 px-4 py-2 rounded-lg hover:scale-105 transition-all flex items-center gap-2"
          >
            <User size={16} />
            {showUserInfo ? 'Masquer Infos' : 'Mes Infos'}
          </button>
        </div>

        {/* User Info Card - Conditionally displayed */}
        {showUserInfo && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-8 border border-white/20">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold flex items-center gap-3">
                <User size={24} />
                Informations Personnelles
              </h2>
              <button
                onClick={() => setActiveTab('profile')}
                className="bg-gradient-to-r from-cyan-500 to-purple-600 px-4 py-2 rounded-lg hover:scale-105 transition-all flex items-center gap-2 text-sm"
              >
                <Eye size={14} />
                Modifier
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <h4 className="font-semibold text-cyan-400 mb-3">Identité</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-300 text-sm">Prénom:</span>
                    <span className="font-medium">{userInfo.firstName || 'Non renseigné'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300 text-sm">Nom:</span>
                    <span className="font-medium">{userInfo.lastName || 'Non renseigné'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300 text-sm">Âge:</span>
                    <span className="font-medium">{userInfo.age || 'Non renseigné'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300 text-sm">Genre:</span>
                    <span className="font-medium">{userInfo.gender || 'Non renseigné'}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-cyan-400 mb-3">Contact</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-300 text-sm">Email:</span>
                    <span className="font-medium text-right max-w-[150px] truncate" title={userInfo.email}>
                      {userInfo.email || 'Non renseigné'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300 text-sm">Wallet:</span>
                    <span className="font-mono text-cyan-400 text-sm">
                      {account ? `${account.slice(0, 6)}...${account.slice(-4)}` : 'Non connecté'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-cyan-400 mb-3">Compte</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-300 text-sm">Solde:</span>
                    <span className="font-bold text-green-400">{userInfo.balance} ETH</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300 text-sm">Type:</span>
                    <span className={`font-medium ${userInfo.isSeller ? 'text-purple-400' : 'text-blue-400'}`}>
                      {userInfo.isSeller ? 'Vendeur' : 'Client'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300 text-sm">Commandes:</span>
                    <span className="font-medium text-cyan-300">{stats.totalPurchases}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300 text-sm">Dépensé:</span>
                    <span className="font-medium text-orange-400">{stats.totalSpent} ETH</span>
                  </div>
                </div>
              </div>
            </div>

            {userInfo.isSeller && (
              <div className="mt-4 pt-4 border-t border-white/20">
                <div className="inline-flex items-center px-3 py-2 rounded-lg bg-purple-500/20 text-purple-300 text-sm border border-purple-500/30">
                  <Shield size={16} className="mr-2" />
                  Compte Vendeur Vérifié - Vous pouvez vendre des produits
                </div>
              </div>
            )}
          </div>
        )}
        

        {activeTab === 'profile' && (
          <div className="mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <User size={28} />
                Mon Profil
              </h2>
              
              {!isEditingProfile && (
                <button
                  onClick={() => setIsEditingProfile(true)}
                  className="bg-gradient-to-r from-cyan-500 to-purple-600 px-4 py-2 rounded-lg hover:scale-105 transition-all flex items-center gap-2"
                >
                  <Eye size={16} />
                  Modifier
                </button>
              )}
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              {!isEditingProfile ? (
                /* Profile Display Mode */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-4 text-cyan-400">Informations Personnelles</h3>
                      <div className="space-y-4">
                        <div className="flex justify-between">
                          <span className="text-gray-300">Prénom:</span>
                          <span className="font-semibold">{userInfo.firstName || 'Non renseigné'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-300">Nom:</span>
                          <span className="font-semibold">{userInfo.lastName || 'Non renseigné'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-300">Âge:</span>
                          <span className="font-semibold">{userInfo.age || 'Non renseigné'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-300">Genre:</span>
                          <span className="font-semibold">{userInfo.gender || 'Non renseigné'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-4 text-cyan-400">Contact & Compte</h3>
                      <div className="space-y-4">
                        <div className="flex justify-between">
                          <span className="text-gray-300">Email:</span>
                          <span className="font-semibold">{userInfo.email || 'Non renseigné'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-300">Adresse Wallet:</span>
                          <span className="font-mono text-sm text-cyan-400">
                            {account ? `${account.slice(0, 6)}...${account.slice(-4)}` : 'Non connecté'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-300">Solde:</span>
                          <span className="font-semibold text-green-400">{userInfo.balance} ETH</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-300">Type de compte:</span>
                          <span className={`font-semibold ${userInfo.isSeller ? 'text-purple-400' : 'text-blue-400'}`}>
                            {userInfo.isSeller ? 'Vendeur' : 'Client'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Profile Edit Mode */
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-cyan-400">Modifier mes informations</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm text-gray-300 mb-2">Prénom *</label>
                        <input
                          type="text"
                          value={profileForm.firstName}
                          onChange={(e) => handleProfileFormChange('firstName', e.target.value)}
                          className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 transition-all"
                          placeholder="Votre prénom"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm text-gray-300 mb-2">Nom *</label>
                        <input
                          type="text"
                          value={profileForm.lastName}
                          onChange={(e) => handleProfileFormChange('lastName', e.target.value)}
                          className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 transition-all"
                          placeholder="Votre nom"
                        />
                      </div>

                      <div>
                        <label className="block text-sm text-gray-300 mb-2">Âge</label>
                        <input
                          type="number"
                          min="0"
                          max="120"
                          value={profileForm.age}
                          onChange={(e) => handleProfileFormChange('age', e.target.value)}
                          className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 transition-all"
                          placeholder="Votre âge"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm text-gray-300 mb-2">Genre</label>
                        <select
                          value={profileForm.gender}
                          onChange={(e) => handleProfileFormChange('gender', e.target.value)}
                          className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-400 transition-all"
                        >
                          <option value="">Sélectionner</option>
                          <option value="Homme">Homme</option>
                          <option value="Femme">Femme</option>
                          <option value="Autre">Autre</option>
                          <option value="Ne souhaite pas préciser">Ne souhaite pas préciser</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm text-gray-300 mb-2">Email *</label>
                        <input
                          type="email"
                          value={profileForm.email}
                          onChange={(e) => handleProfileFormChange('email', e.target.value)}
                          className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 transition-all"
                          placeholder="votre.email@exemple.com"
                        />
                      </div>

                      <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                        <p className="text-sm text-gray-400">
                          <strong>Note:</strong> L'adresse wallet et le type de compte ne peuvent pas être modifiés.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4 pt-6 border-t border-white/20">
                    <button
                      onClick={handleProfileUpdate}
                      className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-3 rounded-lg hover:scale-105 transition-all flex items-center gap-2 font-semibold"
                    >
                      <CheckCircle size={16} />
                      Sauvegarder
                    </button>
                    
                    <button
                      onClick={resetProfileForm}
                      className="border border-white/30 px-6 py-3 rounded-lg hover:bg-white/10 transition-all flex items-center gap-2 font-semibold"
                    >
                      <ArrowLeft size={16} />
                      Annuler
                    </button>
                  </div>

                  <div className="text-sm text-gray-400">
                    <p>* Champs obligatoires</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {mockStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 text-center">
                <Icon className="w-8 h-8 mx-auto mb-3 text-purple-400" />
                <div className="text-2xl font-bold text-cyan-400 mb-1">{stat.number}</div>
                <div className="text-gray-300 text-sm">{stat.label}</div>
              </div>
            );
          })}
        </div>

        {/* Tabs Navigation */}
        <div className="flex bg-white/10 backdrop-blur-lg rounded-xl p-1 mb-8 border border-white/20">
          <button
            onClick={() => setActiveTab('products')}
            className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'products' 
                ? 'bg-gradient-to-r from-cyan-500 to-purple-600 text-white' 
                : 'text-gray-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Package size={20} />
            Produits ({commodities.length})
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'orders' 
                ? 'bg-gradient-to-r from-cyan-500 to-purple-600 text-white' 
                : 'text-gray-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <ShoppingBag size={20} />
            Mes Commandes ({orders.length})
          </button>
        </div>

        {/* Products Tab */}
        {activeTab === 'products' && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <Package size={28} />
              Produits Disponibles
            </h2>
            
            {loading ? (
              <div className="flex justify-center items-center h-48">
                <div className="w-10 h-10 border-3 border-white/30 border-t-cyan-400 rounded-full animate-spin"></div>
              </div>
            ) : commodities.length === 0 ? (
              <div className="text-center py-16 text-gray-300">
                <Package size={64} className="mx-auto mb-4 opacity-50" />
                <p>Aucun produit disponible pour le moment</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {commodities.map((product, index) => (
                  <div 
                    key={index} 
                    className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 transition-all duration-300 cursor-pointer hover:-translate-y-1 hover:shadow-xl hover:shadow-cyan-500/20"
                  >
                    <div className="w-full h-48 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl mb-4 flex items-center justify-center relative">
                      <Package className="w-12 h-12 text-white/80" />
                      <Heart className="absolute top-3 right-3 w-6 h-6 text-white/60 cursor-pointer hover:text-red-400 transition-colors" />
                    </div>
                    
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold mb-2">
                        {product.name || `Produit ${index + 1}`}
                      </h3>
                      <p className="text-gray-300 text-sm mb-3 leading-relaxed">
                        Société: {product.company || 'Non spécifiée'}
                      </p>
                      <div className="text-xl font-bold text-cyan-400 mb-2">
                        {product.value ? `${parseInt(product.value)} gwei` : 'Prix non disponible'}
                      </div>
                      <div className="text-sm text-gray-400 mb-4">
                        Stock: {product.quantity ? product.quantity.toString() : '0'} | 
                        Catégorie: {product.category || 'Non spécifiée'}
                      </div>
                      
                      {/* Quantity Selector */}
                      {product.quantity > 0 && (
                        <div className="mb-4">
                          <label className="block text-sm text-gray-300 mb-2">Quantité:</label>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => handleQuantityChange(index, (quantities[index] || 1) - 1)}
                              disabled={(quantities[index] || 1) <= 1}
                              className="w-8 h-8 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center text-white hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min="1"
                              max={product.quantity}
                              value={quantities[index] || 1}
                              onChange={(e) => handleQuantityChange(index, parseInt(e.target.value) || 1)}
                              className="w-16 h-8 text-center bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-cyan-400"
                            />
                            <button
                              onClick={() => handleQuantityChange(index, (quantities[index] || 1) + 1)}
                              disabled={(quantities[index] || 1) >= product.quantity}
                              className="w-8 h-8 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center text-white hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                              +
                            </button>
                          </div>
                          {/* Total Price */}
                          {quantities[index] && quantities[index] > 1 && (
                            <div className="mt-2 text-sm">
                              <span className="text-gray-400">Total: </span>
                              <span className="text-cyan-300 font-semibold">
                                {((parseInt(product.value)) * (quantities[index] || 1)).toFixed(2)} gwei
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-3">
                      <button 
                        className={`flex-1 rounded-lg py-3 px-5 font-semibold transition-all flex items-center justify-center gap-2 ${
                          product.quantity > 0 
                            ? 'bg-gradient-to-r from-cyan-500 to-purple-600 hover:scale-105 hover:from-cyan-600 hover:to-purple-700' 
                            : 'bg-gray-600 cursor-not-allowed'
                        }`}
                        onClick={() => handleBuy(index, product.value)}
                        disabled={product.quantity <= 0}
                      >
                        <ShoppingCart size={16} />
                        {product.quantity > 0 
                          ? `Commander${quantities[index] > 1 ? ` (${quantities[index]})` : ''}` 
                          : 'Rupture'
                        }
                      </button>
                      
                      <button className="border border-white/30 rounded-lg p-3 hover:bg-white/10 transition-all">
                        <Eye size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}        

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <ShoppingBag size={28} />
                Mes Commandes
              </h2>
              
              {/* Filter */}
              <div className="flex items-center gap-2">
                <Filter size={20} className="text-gray-400" />
                <select
                  value={orderFilter}
                  onChange={(e) => setOrderFilter(e.target.value)}
                  className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
                >
                  <option value="all">Toutes</option>
                  <option value="Pending">En attente</option>
                  <option value="Shipped">Expédiée</option>
                  <option value="Delivered">Livrée</option>
                </select>
              </div>
            </div>
            
            {ordersLoading ? (
              <div className="flex justify-center items-center h-48">
                <div className="w-10 h-10 border-3 border-white/30 border-t-cyan-400 rounded-full animate-spin"></div>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-16 text-gray-300">
                <ShoppingBag size={64} className="mx-auto mb-4 opacity-50" />
                <p>{orderFilter === 'all' ? 'Aucune commande pour le moment' : `Aucune commande ${orderFilter.toLowerCase()}`}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredOrders.map((order, index) => {
                  const product = commodities[parseInt(order.commodityId)] || {};
                  const orderDate = new Date(parseInt(order.timestamp) * 1000);
                  
                  return (
                    <div key={index} className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold flex items-center gap-2">
                            <Hash size={16} />
                            Commande #{order.id ? order.id.toString() : index + 1}
                          </h3>
                          <p className="text-gray-300 text-sm flex items-center gap-2 mt-1">
                            <Calendar size={14} />
                            {orderDate.toLocaleDateString('fr-FR')} à {orderDate.toLocaleTimeString('fr-FR')}
                          </p>
                        </div>
                        <div className={`px-3 py-1 rounded-full border text-sm flex items-center gap-2 ${getStatusColor(order.status)}`}>
                          {getStatusIcon(order.status)}
                          {order.status}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-semibold mb-2">Détails du produit</h4>
                          <div className="space-y-2 text-sm text-gray-300">
                            <p><span className="text-white">Nom:</span> {product.name || 'Produit supprimé'}</p>
                            <p><span className="text-white">Catégorie:</span> {product.category || 'N/A'}</p>
                            <p><span className="text-white">Société:</span> {product.company || 'N/A'}</p>
                            <p><span className="text-white">Quantité:</span> {order.quantity ? order.quantity.toString() : '1'}</p>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-semibold mb-2">Détails de la commande</h4>
                          <div className="space-y-2 text-sm text-gray-300">
                            <p className="flex items-center gap-2">
                              <DollarSign size={14} />
                              <span className="text-white">Total:</span> 
                              <span className="text-cyan-400 font-semibold">
                                {order.totalPrice ? `${(parseInt(order.totalPrice))} gwei` : 'N/A'}
                              </span>
                            </p>
                            <p><span className="text-white">Prix unitaire:</span> 
                              {product.value ? ` ${(parseInt(product.value))} gwei` : ' N/A'}
                            </p>
                            <p><span className="text-white">Vendeur:</span> 
                              {product.seller ? ` ${product.seller.slice(0, 6)}...${product.seller.slice(-4)}` : ' N/A'}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {order.status === 'Delivered' && (
                        <div className="mt-4 pt-4 border-t border-white/20">
                          <button className="bg-gradient-to-r from-yellow-500 to-orange-500 px-4 py-2 rounded-lg hover:scale-105 transition-all flex items-center gap-2">
                            <Star size={16} />
                            Évaluer le produit
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default ClientDashboard;