import React, { useState, useEffect } from 'react';
import { 
  User, ShoppingBag, Wallet, Star, Package, CreditCard, ArrowLeft,
  Eye, Heart, ShoppingCart, Shield
} from 'lucide-react';
import { BrowserProvider, parseEther } from "ethers";

const ClientDashboard = ({ account, contract }) => {
  const [commodities, setCommodities] = useState([]);
  const [loading, setLoading] = useState(true);
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
        const balance = await contract.getBalance(account);
        
        setUserInfo({
          firstName: userDetails[0],
          lastName: userDetails[1],
          age: userDetails[2].toString(),
          gender: userDetails[3],
          isSeller: userDetails[4],
          email: userDetails[5],
          balance: (parseInt(balance) / 1e18).toFixed(4)
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

  const handleBuy = async (index, price) => {
    try {
      // Check if user has sufficient balance
      const provider = new BrowserProvider(window.ethereum);
      const balance = await provider.getBalance(account);
      // console.log(parseEther(balance)); 
      console.log("price"+price); 


 

if (balance < price) {
  alert("Solde insuffisant !");
  return;
}

await contract.deposit({ value: price });


const tx = await contract.buyCommodity(index);
await tx.wait();
alert("Achat réussi !");

      
      // Refresh data
      fetchCommodities();
      fetchUserInfo();
      updateStats();
    } catch (err) {
      console.error("Error buying commodity:", err);
      alert("Erreur lors de l'achat: " + (err.reason || err.message));
    }
  };

  const updateStats = () => {
    // Calculate stats based on user activity (mock implementation)
    setStats(prev => ({
      ...prev,
      totalPurchases: prev.totalPurchases + 1,
      totalSpent: (parseFloat(prev.totalSpent) + 0.1).toFixed(4)
    }));
  };

  useEffect(() => {
    if (contract && account) {
      fetchCommodities();
      fetchUserInfo();
    }
  }, [contract, account]);

  const mockStats = [
    { icon: ShoppingBag, number: stats.totalPurchases.toString(), label: 'Achats totaux' },
    { icon: Star, number: stats.averageRating, label: 'Note moyenne' },
    { icon: Package, number: commodities.filter(c => c.quantity > 0).length.toString(), label: 'Disponibles' },
    { icon: CreditCard, number: `${stats.totalSpent} ETH`, label: 'Dépensé' }
  ];

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
            Découvrez nos produits et effectuez vos achats en toute sécurité sur la blockchain.
          </p>
          {userInfo.isSeller && (
            <div className="mt-4 inline-flex items-center px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-sm">
              <Shield size={16} className="mr-2" />
              Compte Vendeur Vérifié
            </div>
          )}
        </div>

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

        {/* Products Section */}
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
                      {product.description || "Description du produit non disponible"}
                    </p>
                    <div className="text-xl font-bold text-cyan-400 mb-4">
                      {product.value ? `${(parseInt(product.value) / 1e18).toFixed(4)} ETH` : 'Prix non disponible'}
                    </div>
                    <div className="text-sm text-gray-400 mb-4">
                      Stock: {product.quantity ? product.quantity.toString() : '0'} | 
                      Catégorie: {product.category || 'Non spécifiée'}
                    </div>
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
                      {product.quantity > 0 ? 'Acheter' : 'Rupture'}
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
      </main>
    </div>
  );
};

export default ClientDashboard;