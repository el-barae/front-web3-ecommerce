import React, { useState, useEffect, useRef } from 'react';
import { 
  User, Package, Plus, ArrowLeft, Eye, Edit3, TrendingUp, 
  DollarSign, Users, BarChart3, Building, Tag, Hash, Coins,
  Mail, Calendar, UserCheck, Wallet, Settings, Shield,
  CheckCircle, ShoppingCart, Clock, Truck, CheckCircle2,
  Filter, Search, RefreshCw, Upload, Image as ImageIcon, X, Camera
} from 'lucide-react';
import { Navigate, useNavigate } from 'react-router-dom';

const SellerDashboard = ({ account, contract }) => {
  const navigate = useNavigate();
  const IPFS_GATEWAY = "cyan-advisory-toucan-305.mypinata.cloud";
  const PINATA_API_KEY = "853795a4faf98463df3e";
  const PINATA_SECRET_KEY = "9d47a960af4553eec28765486a5d41c8098f6dc11973594e175f35d5669909de";
  
  const [commodities, setCommodities] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showUserInfo, setShowUserInfo] = useState(false);
  const [showOrders, setShowOrders] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [orderFilter, setOrderFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // États pour les images
  const [imagePreview, setImagePreview] = useState(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [productImagePreview, setProductImagePreview] = useState(null);
  const [productImageUploading, setProductImageUploading] = useState(false);
  const fileInputRef = useRef(null);
  const productFileInputRef = useRef(null);
  
  const [form, setForm] = useState({
    name: "", category: "", value: "", quantity: "", company: "", image: ""
  });
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    age: '',
    gender: '',
    email: '',
    image: ''
  });
  const [userInfo, setUserInfo] = useState({
    firstName: '',
    lastName: '',
    age: 0,
    gender: '',
    isSeller: false,
    email: '',
    balance: '0',
    image: ''
  });
  const [stats, setStats] = useState({
    totalSales: 156,
    totalRevenue: '12.5',
    averageRating: '4.9'
  });

  // Fonction pour uploader vers IPFS via Pinata
  const uploadToIPFS = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const metadata = JSON.stringify({
      name: file.name,
      keyvalues: {
        type: 'image'
      }
    });
    formData.append('pinataMetadata', metadata);

    try {
      const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
        method: 'POST',
        headers: {
          'pinata_api_key': PINATA_API_KEY,
          'pinata_secret_api_key': PINATA_SECRET_KEY,
        },
        body: formData
      });
      
      const result = await response.json();      
      if (result.IpfsHash) {
        return result.IpfsHash;
      } else {
        throw new Error("Pas de hash IPFS retourné");
      }
    } catch (error) {
      console.error('Erreur upload IPFS:', error);
      throw error;
    }
  };

  // Composant pour l'affichage d'image avec fallback
  const ImageDisplay = ({ src, alt, className, fallback = true }) => {
    const [imageError, setImageError] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const handleImageError = () => {
      setImageError(true);
      setIsLoading(false);
    };

    const handleImageLoad = () => {
      setIsLoading(false);
    };

    if (imageError || !src) {
      if (!fallback) return null;
      return (
        <div className={`${className} flex items-center justify-center bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border-2 border-dashed border-white/30 rounded-xl`}>
          <ImageIcon className="w-8 h-8 text-white/50" />
        </div>
      );
    }

    // Construction de l'URL de l'image
    const getImageUrl = (src) => {
      if (!src) return '';
      
      // Si c'est déjà une URL complète
      if (src.startsWith('http')) return src;
      
      // Si c'est un hash IPFS (commence par Qm)
      if (src.startsWith('Qm')) {
        return `https://${IPFS_GATEWAY}/ipfs/${src}`;
      }
      
      // Sinon, essayer de construire l'URL IPFS
      return `https://${IPFS_GATEWAY}/ipfs/${src}`;
    };

    const imageUrl = getImageUrl(src);
    return (
      <div className="relative">
        {isLoading && (
          <div className={`${className} flex items-center justify-center bg-white/10 rounded-xl absolute inset-0`}>
            <div className="w-6 h-6 border-2 border-white/30 border-t-cyan-400 rounded-full animate-spin"></div>
          </div>
        )}
        <img
          src={imageUrl}
          alt={alt}
          className={className}
          onError={handleImageError}
          onLoad={handleImageLoad}
          style={{ display: isLoading ? 'none' : 'block' }}
        />
      </div>
    );
  };

  // Fonction pour gérer l'upload d'image de profil
  const handleImageUpload = async (file) => {
    if (!file) return;

    // Validation du fichier
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert('Format non supporté. Utilisez: JPG, PNG, WEBP');
      return;
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      alert('L\'image ne doit pas dépasser 5MB');
      return;
    }

    setImageUploading(true);
    
    try {
      // Créer preview local
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);

      // Upload vers IPFS
      const ipfsHash = await uploadToIPFS(file);
      
      // Mettre à jour le formulaire avec le hash IPFS
      handleProfileFormChange('image', ipfsHash);
      
      // Mettre à jour le preview avec l'URL IPFS
      const ipfsUrl = `https://${IPFS_GATEWAY}/ipfs/${ipfsHash}`;
      setImagePreview(ipfsUrl);
      
      alert('Image de profil uploadée avec succès !');
    } catch (error) {
      console.error('Erreur upload image:', error);
      alert('Erreur lors de l\'upload de l\'image');
      setImagePreview(null);
    } finally {
      setImageUploading(false);
    }
  };

  // Fonction pour gérer l'upload d'image de produit
  const handleProductImageUpload = async (file) => {
    if (!file) return;

    // Validation du fichier
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert('Format non supporté. Utilisez: JPG, PNG, WEBP');
      return;
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      alert('L\'image ne doit pas dépasser 5MB');
      return;
    }

    setProductImageUploading(true);
    
    try {
      // Créer preview local
      const reader = new FileReader();
      reader.onloadend = () => {
        setProductImagePreview(reader.result);
      };
      reader.readAsDataURL(file);

      // Upload vers IPFS
      const ipfsHash = await uploadToIPFS(file);
      
      // Mettre à jour le formulaire avec le hash IPFS
      setForm(prev => ({ ...prev, image: ipfsHash }));
      
      // Mettre à jour le preview avec l'URL IPFS
      const ipfsUrl = `https://${IPFS_GATEWAY}/ipfs/${ipfsHash}`;
      setProductImagePreview(ipfsUrl);      
      alert('Image du produit uploadée avec succès !');
    } catch (error) {
      console.error('Erreur upload image produit:', error);
      alert('Erreur lors de l\'upload de l\'image du produit');
      setProductImagePreview(null);
    } finally {
      setProductImageUploading(false);
    }
  };

  // Fonction pour supprimer l'image de profil
  const handleImageRemove = () => {
    setImagePreview(null);
    handleProfileFormChange('image', '');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Fonction pour supprimer l'image de produit
  const handleProductImageRemove = () => {
    setProductImagePreview(null);
    setForm(prev => ({ ...prev, image: '' }));
    if (productFileInputRef.current) {
      productFileInputRef.current.value = '';
    }
  };

  const fetchUserInfo = async () => {
    try {
      if (contract && account) {
        const userDetails = await contract.getUserById(account);
        const balance = await contract.getEthBalance(account);
        
        const userData = {
          firstName: userDetails[0] || '',
          lastName: userDetails[1] || '',
          age: userDetails[2] ? userDetails[2].toString() : '0',
          gender: userDetails[3] || '',
          isSeller: userDetails[4] || false,
          email: userDetails[5] || '',
          balance: (parseInt(balance) / 1e18).toFixed(4),
          // Vérifiez si l'image existe à l'index 6 ou 7
          image: userDetails[6] || userDetails[7] || '' // Essayez les deux index
        };

        setUserInfo(userData);

        setProfileForm({
          firstName: userData.firstName,
          lastName: userData.lastName,
          age: userData.age,
          gender: userData.gender,
          email: userData.email,
          image: userData.image
        });

        // Définir l'image preview si elle existe
        if (userData.image) {
          // Vérifiez si l'image commence par 'Qm' (hash IPFS) ou est déjà une URL complète
          const imageUrl = userData.image.startsWith('Qm') 
            ? `https://${IPFS_GATEWAY}/ipfs/${userData.image}`
            : userData.image;
          setImagePreview(imageUrl);
        } else {
          setImagePreview(null);
        }
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
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      setOrdersLoading(true);
      const allOrders = await contract.getOrders();
      
      // Filtrer les commandes pour ne garder que celles des produits du vendeur
      const sellerOrders = allOrders.filter(order => {
        const commodity = commodities[parseInt(order.commodityId)];
        return commodity && commodity.seller.toLowerCase() === account.toLowerCase();
      });

      setOrders(sellerOrders);
    } catch (err) {
      console.error("Error fetching orders:", err);
    } finally {
      setOrdersLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const tx = await contract.updateOrderStatus(orderId, newStatus);
      await tx.wait();
      alert("Statut de la commande mis à jour !");
      fetchOrders(); // Rafraîchir les commandes
    } catch (err) {
      console.error("Error updating order status:", err);
      alert("Erreur lors de la mise à jour: " + (err.reason || err.message));
    }
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'text-yellow-400 bg-yellow-400/20 border-yellow-400/30';
      case 'shipped': return 'text-blue-400 bg-blue-400/20 border-blue-400/30';
      case 'delivered': return 'text-green-400 bg-green-400/20 border-green-400/30';
      default: return 'text-gray-400 bg-gray-400/20 border-gray-400/30';
    }
  };

  const getStatusIcon = (status) => {
    switch (status.toLowerCase()) {
      case 'pending': return <Clock size={16} />;
      case 'shipped': return <Truck size={16} />;
      case 'delivered': return <CheckCircle2 size={16} />;
      default: return <Package size={16} />;
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesFilter = orderFilter === 'all' || order.status.toLowerCase() === orderFilter;
    const commodity = commodities[parseInt(order.commodityId)];
    const matchesSearch = !searchTerm || 
      (commodity && commodity.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      order.buyer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id.toString().includes(searchTerm);
    
    return matchesFilter && matchesSearch;
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // CORRECTION: Fonction handleSubmit avec validations améliorées
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validations étendues
    if (!form.name.trim()) {
      alert("❌ Le nom du produit est obligatoire");
      return;
    }
    
    if (!form.category.trim()) {
      alert("❌ La catégorie est obligatoire");
      return;
    }
    
    if (!form.company.trim()) {
      alert("❌ Le nom de l'entreprise est obligatoire");
      return;
    }
    
    // Validation du prix
    const price = parseInt(form.value);
    if (isNaN(price) || price <= 0) {
      alert("❌ Le prix doit être un nombre positif");
      return;
    }
    
    // Validation de la quantité
    const quantity = parseInt(form.quantity);
    if (isNaN(quantity) || quantity <= 0) {
      alert("❌ La quantité doit être un nombre positif");
      return;
    }
    
    // Validation de l'image (optionnelle mais si présente, doit être valide)
    const imageHash = form.image || "";
    if (imageHash && !imageHash.startsWith('Qm')) {
      console.warn("Hash IPFS potentiellement invalide:", imageHash);
    }
    
    try {
      // Vérification du contrat et de l'account
      if (!contract) {
        alert("❌ Contrat non disponible");
        return;
      }
      
      if (!account) {
        alert("❌ Compte non connecté");
        return;
      }
      
      // Vérification que l'utilisateur est un vendeur
      if (!userInfo.isSeller) {
        alert("❌ Seuls les vendeurs peuvent ajouter des produits");
        return;
      }
            
      // CORRECTION: Appel du contrat avec gestion d'erreur améliorée
      const tx = await contract.addCommodity(
        form.name.trim(),
        form.category.trim(),
        price,
        quantity,
        form.company.trim(),
        imageHash
      );

      
      await tx.wait();
      
      alert("✅ Produit ajouté avec succès !");
      
      // Reset du formulaire
      setForm({ 
        name: "", 
        category: "", 
        value: "", 
        quantity: "", 
        company: "", 
        image: "" 
      });
      setProductImagePreview(null);
      setShowAddForm(false);
      
      // Actualiser la liste des produits
      await fetchCommodities();
      
    } catch (err) {
      console.error("❌ Erreur lors de l'ajout du produit:", err);
      
      // Gestion d'erreurs améliorée
      if (err.code === 4001) {
        alert("❌ Transaction annulée par l'utilisateur");
      } else if (err.code === "CALL_EXCEPTION") {
        console.error("Données de transaction:", err.transaction);
        alert("❌ Erreur du contrat. Vérifiez que:\n- Vous êtes bien un vendeur\n- Tous les champs sont valides\n- Vous avez assez de gas");
      } else if (err.reason) {
        alert(`❌ Erreur: ${err.reason}`);
      } else if (err.message) {
        alert(`❌ Erreur: ${err.message}`);
      } else {
        alert("❌ Erreur inconnue lors de l'ajout du produit");
      }
    }
  };

  const handleProfileUpdate = async () => {
    try {
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
        profileForm.email,
        profileForm.image || '' // Image IPFS hash
      );
      await tx.wait();
      
      alert("Profil mis à jour avec succès !");
      setIsEditingProfile(false);
      fetchUserInfo();
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
      email: userInfo.email,
      image: userInfo.image || ''
    });
    setImagePreview(userInfo.image ? `https://${IPFS_GATEWAY}/ipfs/${userInfo.image}` : null);
    setIsEditingProfile(false);
  };

  useEffect(() => {
    if (contract && account) {
      fetchCommodities();
      fetchUserInfo();
    }
  }, [contract, account]);

  useEffect(() => {
    if (commodities.length > 0 && showOrders) {
      fetchOrders();
    }
  }, [commodities, showOrders, account]);

  const sellerStats = [
    { icon: Package, number: commodities.length.toString(), label: 'Produits actifs' },
    { icon: ShoppingCart, number: orders.length.toString(), label: 'Commandes reçues' },
    // { icon: DollarSign, number: `${stats.totalRevenue} ETH`, label: 'Revenus générés' },
  ];

  const handleLogout = () => {
    sessionStorage.setItem('userRole','')
    sessionStorage.setItem('userProfile','')
    navigate('/');
  };

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
          <div className="w-10 h-10 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full flex items-center justify-center overflow-hidden">
            {userInfo.image ? (
              <ImageDisplay
                src={userInfo.image}
                alt="Photo de profil"
                className="w-full h-full object-cover"
              />
            ) : (
              <User size={20} />
            )}
          </div>
        </div>
      </header>

      <main className="p-8 max-w-7xl mx-auto">
        {/* Welcome Section */}
        <div className="bg-white/10 backdrop-blur rounded-2xl p-8 mb-8 border border-white/20">
          <div className="flex justify-between items-center flex-wrap gap-5">
            <div>
              <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                <BarChart3 size={32} />
                Dashboard Vendeur
                {userInfo.firstName && (
                  <span className="text-cyan-400 text-xl">
                    - {userInfo.firstName} {userInfo.lastName}
                  </span>
                )}
              </h1>
              <p className="text-gray-300">
                {userInfo.email ? `${userInfo.email} - ` : ''}
                Gérez vos produits et suivez vos performances de vente sur la blockchain.
              </p>
              <div className="flex gap-4 mt-4">
                <button 
                  onClick={() => setShowUserInfo(!showUserInfo)}
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 px-4 py-2 rounded-lg hover:scale-105 transition-all flex items-center gap-2"
                >
                  <User size={16} />
                  {showUserInfo ? 'Masquer Infos' : 'Mes Infos'}
                </button>
                <button 
                  onClick={() => setShowOrders(!showOrders)}
                  className="bg-gradient-to-r from-orange-500 to-red-600 px-4 py-2 rounded-lg hover:scale-105 transition-all flex items-center gap-2"
                >
                  <ShoppingCart size={16} />
                  {showOrders ? 'Masquer Commandes' : 'Mes Commandes'}
                </button>
              </div>
            </div>
            <button 
              className="flex items-center gap-2 bg-gradient-to-r from-cyan-400 to-purple-600 px-6 py-3 rounded-xl font-semibold hover:scale-105 transition-all shadow-lg shadow-cyan-400/30"
              onClick={() => setShowAddForm(!showAddForm)}
            >
              <Plus size={20} />
              Ajouter un produit
            </button>
          </div>
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
                onClick={() => setIsEditingProfile(!isEditingProfile)}
                className="bg-gradient-to-r from-cyan-500 to-purple-600 px-4 py-2 rounded-lg hover:scale-105 transition-all flex items-center gap-2 text-sm"
              >
                <Edit3 size={14} />
                {isEditingProfile ? 'Annuler' : 'Modifier'}
              </button>
            </div>
            
            {!isEditingProfile ? (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Photo de profil */}
                <div className="flex flex-col items-center space-y-3">
                  <h4 className="font-semibold text-cyan-400">Photo</h4>
                  <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-cyan-400/50">
                    <ImageDisplay
                      src={userInfo.image}
                      alt="Photo de profil"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

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
                  <h4 className="font-semibold text-cyan-400 mb-3">Compte Vendeur</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-300 text-sm">Solde:</span>
                      <span className="font-bold text-green-400">{userInfo.balance} ETH</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300 text-sm">Produits:</span>
                      <span className="font-medium text-purple-400">{commodities.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300 text-sm">Commandes:</span>
                      <span className="font-medium text-orange-400">{orders.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300 text-sm">Revenus:</span>
                      <span className="font-medium text-cyan-300">{stats.totalRevenue} ETH</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Profile Edit Mode avec upload d'image */
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-cyan-400">Modifier mes informations</h3>
                
                {/* Section photo de profil */}
                <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                  <h4 className="text-md font-semibold text-cyan-300 mb-4">Photo de profil</h4>
                  
                  <div className="flex items-center gap-6">
                    {/* Preview de l'image */}
                    <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-cyan-400/50 flex-shrink-0">
                      {imagePreview || userInfo.image ? (
                        <img
                          src={imagePreview || (userInfo.image ? `https://${IPFS_GATEWAY}/ipfs/${userInfo.image}` : '')}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-cyan-500/20 to-purple-500/20">
                          <Camera className="w-8 h-8 text-white/50" />
                        </div>
                      )}
                    </div>

                    {/* Contrôles upload */}
                    <div className="flex-1">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => e.target.files[0] && handleImageUpload(e.target.files[0])}
                        className="hidden"
                      />
                      
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={imageUploading}
                          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {imageUploading ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                              Upload...
                            </>
                          ) : (
                            <>
                              <Upload size={16} />
                              Choisir une photo
                            </>
                          )}
                        </button>
                        
                        {(imagePreview || userInfo.image) && (
                          <button
                            type="button"
                            onClick={handleImageRemove}
                            className="flex items-center gap-2 px-4 py-2 border border-red-500/50 text-red-400 rounded-lg hover:bg-red-500/10 transition-all"
                          >
                            <X size={16} />
                            Supprimer
                          </button>
                        )}
                      </div>
                      
                      <p className="text-xs text-gray-400 mt-2">
                        Formats supportés: JPG, PNG, WEBP (max 5MB)
                      </p>
                    </div>
                  </div>
                </div>
                
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
                        <strong>Note:</strong> L'adresse wallet et le statut vendeur ne peuvent pas être modifiés.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-6 border-t border-white/20">
                  <button
                    onClick={handleProfileUpdate}
                    disabled={imageUploading}
                    className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-3 rounded-lg hover:scale-105 transition-all flex items-center gap-2 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
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

            {userInfo.isSeller && !isEditingProfile && (
              <div className="mt-6 pt-4 border-t border-white/20">
                <div className="inline-flex items-center px-4 py-3 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  <Shield size={18} className="mr-3" />
                  <div>
                    <div className="font-semibold">Compte Vendeur Vérifié</div>
                    <div className="text-sm opacity-80">Vous pouvez vendre des produits sur la plateforme</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Orders Management Section */}
        {showOrders && (
          <div className="bg-white/10 backdrop-blur rounded-2xl p-8 mb-8 border border-white/20">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <ShoppingCart size={28} />
                Gestion des Commandes
              </h2>
              <button
                onClick={fetchOrders}
                className="bg-gradient-to-r from-blue-500 to-indigo-600 px-4 py-2 rounded-lg hover:scale-105 transition-all flex items-center gap-2"
              >
                <RefreshCw size={16} />
                Actualiser
              </button>
            </div>

            {/* Filters and Search */}
            <div className="flex flex-wrap gap-4 mb-6">
              <div className="flex items-center gap-2">
                <Filter size={16} />
                <select
                  value={orderFilter}
                  onChange={(e) => setOrderFilter(e.target.value)}
                  className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
                >
                  <option value="all">Toutes les commandes</option>
                  <option value="pending">En attente</option>
                  <option value="shipped">Expédiées</option>
                  <option value="delivered">Livrées</option>
                </select>
              </div>
              
              <div className="flex items-center gap-2 flex-1 max-w-md">
                <Search size={16} />
                <input
                  type="text"
                  placeholder="Rechercher par produit, acheteur ou ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            {ordersLoading ? (
              <div className="flex justify-center items-center h-48">
                <div className="w-10 h-10 border-3 border-white/30 border-t-cyan-400 rounded-full animate-spin"></div>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <ShoppingCart size={64} className="mx-auto mb-4 opacity-50" />
                <p>Aucune commande trouvée</p>
                <p className="text-sm mt-2">
                  {orders.length === 0 ? 
                    "Vous n'avez pas encore reçu de commandes" : 
                    "Aucune commande ne correspond aux critères de recherche"
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredOrders.map((order, index) => {
                  const commodity = commodities[parseInt(order.commodityId)];
                  const orderDate = new Date(parseInt(order.timestamp) * 1000);
                  
                  return (
                    <div key={index} className="bg-white/5 rounded-xl p-6 border border-white/10 hover:bg-white/10 transition-all">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                        <div>
                          <div className="font-semibold text-lg mb-1">
                            Commande #{order.id.toString()}
                          </div>
                          <div className="text-sm text-gray-300">
                            {orderDate.toLocaleDateString('fr-FR')} à {orderDate.toLocaleTimeString('fr-FR')}
                          </div>
                          <div className="text-sm text-purple-400 mt-1">
                            {commodity ? commodity.name : 'Produit inconnu'}
                          </div>
                        </div>

                        <div>
                          <div className="text-sm text-gray-300 mb-1">Acheteur</div>
                          <div className="font-mono text-sm bg-white/10 px-2 py-1 rounded">
                            {order.buyer.slice(0, 6)}...{order.buyer.slice(-4)}
                          </div>
                          <div className="text-sm text-cyan-400 mt-1">
                            Quantité: {order.quantity.toString()}
                          </div>
                        </div>

                        <div>
                          <div className="text-sm text-gray-300 mb-1">Montant</div>
                          <div className="font-bold text-green-400">
                            {parseInt(order.totalPrice)} gwei
                          </div>
                          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-medium border mt-2 ${getStatusColor(order.status)}`}>
                            {getStatusIcon(order.status)}
                            {order.status}
                          </div>
                        </div>

                        <div className="flex flex-col gap-2">
                          {order.status.toLowerCase() === 'pending' && (
                            <button
                              onClick={() => updateOrderStatus(order.id, 'Shipped')}
                              className="bg-gradient-to-r from-blue-500 to-blue-600 px-3 py-2 rounded-lg text-sm hover:scale-105 transition-all flex items-center gap-2"
                            >
                              <Truck size={14} />
                              Marquer Expédié
                            </button>
                          )}
                          
                          {order.status.toLowerCase() === 'shipped' && (
                            <button
                              onClick={() => updateOrderStatus(order.id, 'Delivered')}
                              className="bg-gradient-to-r from-green-500 to-green-600 px-3 py-2 rounded-lg text-sm hover:scale-105 transition-all flex items-center gap-2"
                            >
                              <CheckCircle2 size={14} />
                              Marquer Livré
                            </button>
                          )}
                          
                          <button className="border border-white/30 px-3 py-2 rounded-lg text-sm hover:bg-white/10 transition-all flex items-center gap-2">
                            <Eye size={14} />
                            Détails
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
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

        {/* Add Product Form */}
        {showAddForm && (
          <div className="bg-white/10 backdrop-blur rounded-2xl p-8 mb-8 border border-white/20">
            <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <Package size={24} />
              Ajouter un nouveau produit
            </h3>
            
            {/* Section image du produit */}
            <div className="bg-white/5 rounded-lg p-6 border border-white/10 mb-6">
              <h4 className="text-md font-semibold text-cyan-300 mb-4">Image du produit</h4>
              
              <div className="flex items-center gap-6">
                {/* Preview de l'image */}
                <div className="w-32 h-32 rounded-lg overflow-hidden border-2 border-cyan-400/50 flex-shrink-0">
                  {productImagePreview ? (
                    <img
                      src={productImagePreview}
                      alt="Preview du produit"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-cyan-500/20 to-purple-500/20">
                      <ImageIcon className="w-12 h-12 text-white/50" />
                    </div>
                  )}
                </div>

                {/* Contrôles upload */}
                <div className="flex-1">
                  <input
                    ref={productFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => e.target.files[0] && handleProductImageUpload(e.target.files[0])}
                    className="hidden"
                  />
                  
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => productFileInputRef.current?.click()}
                      disabled={productImageUploading}
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {productImageUploading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          Upload...
                        </>
                      ) : (
                        <>
                          <Upload size={16} />
                          Choisir une image
                        </>
                      )}
                    </button>
                    
                    {productImagePreview && (
                      <button
                        type="button"
                        onClick={handleProductImageRemove}
                        className="flex items-center gap-2 px-4 py-2 border border-red-500/50 text-red-400 rounded-lg hover:bg-red-500/10 transition-all"
                      >
                        <X size={16} />
                        Supprimer
                      </button>
                    )}
                  </div>
                  
                  <p className="text-xs text-gray-400 mt-2">
                    Formats supportés: JPG, PNG, WEBP (max 5MB) - Optionnel
                  </p>
                </div>
              </div>
            </div>
            
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
                  Prix (en gwei)
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
                  className="w-full bg-white/10 border border-white/30 rounded-lg p-3 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 transition-all"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
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
                onClick={() => {
                  setShowAddForm(false);
                  setProductImagePreview(null);
                  setForm({ name: "", category: "", value: "", quantity: "", company: "", image: "" });
                }}
              >
                Annuler
              </button>
              <button 
                type="submit"
                className="px-8 py-3 bg-gradient-to-r from-cyan-400 to-purple-600 rounded-lg font-semibold hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleSubmit}
                disabled={productImageUploading}
              >
                {productImageUploading ? 'Upload en cours...' : 'Ajouter le produit'}
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
                  {/* Image du produit */}
                  <div className="w-full h-48 rounded-xl mb-4 overflow-hidden">
                    <ImageDisplay
                      src={product.image}
                      alt={product.name || `Produit ${index + 1}`}
                      className="w-full h-full object-cover"
                      fallback={true}
                    />
                  </div>
                  
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
                        {product.value ? `${parseInt(product.value)} gwei` : 'N/A'}
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