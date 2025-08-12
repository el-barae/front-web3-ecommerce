import React, { useState, useEffect, useRef } from 'react';
import { 
  User, ShoppingBag, Wallet, Star, Package, CreditCard, ArrowLeft,
  Eye, Heart, ShoppingCart, Shield, Clock, CheckCircle, Truck, Edit3,
  Calendar, Hash, DollarSign, Filter, Upload, Image as ImageIcon, X, Camera
} from 'lucide-react';
import { Navigate, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ethers } from 'ethers';

const ClientDashboard = ({ account, contract }) => {
  const navigate = useNavigate();
  const IPFS_GATEWAY = "cyan-advisory-toucan-305.mypinata.cloud";
  const PINATA_API_KEY = "853795a4faf98463df3e";
  const PINATA_SECRET_KEY = "9d47a960af4553eec28765486a5d41c8098f6dc11973594e175f35d5669909de";
  
  const [commodities, setCommodities] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('products'); // 'products', 'orders', or 'profile'
  const [orderFilter, setOrderFilter] = useState('all'); // 'all', 'Pending', 'Shipped', 'Delivered'
  const [quantities, setQuantities] = useState({}); // Store quantities for each product
  const [showUserInfo, setShowUserInfo] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  
  // États pour les images
  const [imagePreview, setImagePreview] = useState(null);
  const [imageUploading, setImageUploading] = useState(false);
  const fileInputRef = useRef(null);
  
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
    totalPurchases: 0,
    totalSpent: '0',
    averageRating: '4.8'
  });

  // Fonction pour uploader vers IPFS via Pinata
  const uploadToIPFS = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const metadata = JSON.stringify({
      name: file.name,
      keyvalues: {
        type: 'profile_image'
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

  // Fonction pour gérer l'upload d'image
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
      
      alert('Image uploadée avec succès !');
    } catch (error) {
      console.error('Erreur upload image:', error);
      alert('Erreur lors de l\'upload de l\'image');
      setImagePreview(null);
    } finally {
      setImageUploading(false);
    }
  };

  // Fonction pour supprimer l'image
  const handleImageRemove = () => {
    setImagePreview(null);
    handleProfileFormChange('image', '');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

// Fonction utilitaire pour vérifier si une chaîne est un hash IPFS valide
const isValidIPFSHash = (str) => {
  if (!str || typeof str !== 'string') return false;
  
  // Hash IPFS v0 commencent généralement par 'Qm' et font 46 caractères
  const ipfsV0Regex = /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/;
  
  // Hash IPFS v1 commencent par 'bafy' ou d'autres préfixes CID v1
  const ipfsV1Regex = /^ba[a-z0-9]{56,}$/;
  
  return ipfsV0Regex.test(str) || ipfsV1Regex.test(str);
};

// Fonction pour vérifier si c'est une adresse Ethereum
const isEthereumAddress = (str) => {
  if (!str || typeof str !== 'string') return false;
  return /^0x[a-fA-F0-9]{40}$/.test(str);
};

// Composant pour l'affichage d'image avec fallback amélioré
const ImageDisplay = ({ src, alt, className, fallback = true }) => {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleImageError = (e) => {
    console.error('Erreur de chargement d\'image:', {
      src: e.target.src,
      originalSrc: src,
      error: e
    });
    setImageError(true);
    setIsLoading(false);
  };

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  // Construction de l'URL de l'image - VERSION AMÉLIORÉE
  const getImageUrl = (src) => {
    // Vérifier que src existe et est une chaîne de caractères
    if (!src || typeof src !== 'string' || src.trim() === '') {
      console.debug('Src d\'image vide ou invalide:', src);
      return null;
    }
    
    const cleanSrc = src.trim();
    
    // Si c'est une adresse Ethereum, ce n'est pas une image valide
    if (isEthereumAddress(cleanSrc)) {
      console.warn('Adresse Ethereum détectée comme src d\'image:', cleanSrc);
      return null;
    }
    
    // Si c'est déjà une URL complète
    if (cleanSrc.startsWith('http://') || cleanSrc.startsWith('https://')) {
      return cleanSrc;
    }
    
    // Si c'est un hash IPFS valide
    if (isValidIPFSHash(cleanSrc)) {
      const ipfsUrl = `https://${IPFS_GATEWAY}/ipfs/${cleanSrc}`;
      console.debug('URL IPFS construite:', ipfsUrl);
      return ipfsUrl;
    }
    
    // Si ce n'est ni une URL, ni un hash IPFS valide, ni une adresse ETH
    console.warn('Format d\'image non reconnu:', cleanSrc);
    return null;
  };

  const imageUrl = getImageUrl(src);

  // Si pas d'URL valide ou erreur, afficher le fallback
  if (imageError || !imageUrl) {
    if (!fallback) return null;
    return (
      <div className={`${className} flex items-center justify-center bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border-2 border-dashed border-white/30 rounded-xl`}>
        <ImageIcon className="w-8 h-8 text-white/50" />
      </div>
    );
  }

  return (
    <div className="relative">
      {isLoading && (
        <div className={`${className} flex items-center justify-center bg-white/10 rounded-xl absolute inset-0 z-10`}>
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

// Fonction pour valider et nettoyer l'image - VERSION AMÉLIORÉE
const validateAndCleanImageData = (imageData) => {
  console.debug('Validation des données d\'image:', imageData, typeof imageData);
  
  // Si c'est null, undefined, ou une chaîne vide
  if (!imageData) {
    console.debug('Image data vide');
    return '';
  }
  
  // Si ce n'est pas une chaîne, le convertir ou retourner vide
  if (typeof imageData !== 'string') {
    console.warn('Image data n\'est pas une chaîne:', typeof imageData, imageData);
    return '';
  }
  
  const cleanData = imageData.trim();
  
  // Si c'est une adresse Ethereum, ce n'est pas une image valide
  if (isEthereumAddress(cleanData)) {
    console.warn('Adresse Ethereum détectée comme image, ignorée:', cleanData);
    return '';
  }
  
  // Vérifier si c'est un hash IPFS valide
  if (!cleanData.startsWith('http') && !isValidIPFSHash(cleanData)) {
    console.warn('Hash IPFS potentiellement invalide:', cleanData);
    // On retourne quand même la valeur, elle sera validée dans getImageUrl
  }
  
  return cleanData;
};

const fetchUserInfo = async () => {
  try {
    if (contract && account) {
      const userDetails = await contract.getUserById(account);
      const balance = await contract.getEthBalance(account);
      
      console.debug('Détails utilisateur récupérés:', userDetails);
      console.debug('Index 6:', userDetails[6], typeof userDetails[6]);
      console.debug('Index 7:', userDetails[7], typeof userDetails[7]);
      
      // Récupérer l'image en testant différents index - AMÉLIORÉ
      let rawImageData = '';
      
      // Tester plusieurs index possibles pour l'image
      const possibleImageIndexes = [6, 7, 8]; // Ajout de l'index 8 au cas où
      
      for (const index of possibleImageIndexes) {
        if (userDetails[index] && typeof userDetails[index] === 'string') {
          const testData = userDetails[index].trim();
          // Ne prendre que si ce n'est pas une adresse Ethereum
          if (testData && !isEthereumAddress(testData)) {
            rawImageData = testData;
            console.debug(`Image trouvée à l'index ${index}:`, rawImageData);
            break;
          }
        }
      }
      
      const cleanImageData = validateAndCleanImageData(rawImageData);
      
      const userData = {
        firstName: userDetails[0] || '',
        lastName: userDetails[1] || '',
        age: userDetails[2] ? userDetails[2].toString() : '0',
        gender: userDetails[3] || '',
        isSeller: userDetails[4] || false,
        email: userDetails[5] || '',
        balance: (parseInt(balance) / 1e18).toFixed(4),
        image: cleanImageData
      };

      console.debug('Données utilisateur finales:', userData);

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
      if (userData.image && userData.image.length > 0) {
        let imageUrl = '';
        
        if (userData.image.startsWith('http')) {
          imageUrl = userData.image;
        } else if (isValidIPFSHash(userData.image)) {
          imageUrl = `https://${IPFS_GATEWAY}/ipfs/${userData.image}`;
        }
        
        if (imageUrl) {
          console.debug('Image preview définie:', imageUrl);
          setImagePreview(imageUrl);
        } else {
          console.debug('Aucune image valide trouvée');
          setImagePreview(null);
        }
      } else {
        console.debug('Aucune image dans les données utilisateur');
        setImagePreview(null);
      }
    }
  } catch (err) {
    console.error("Erreur lors de la récupération des infos utilisateur:", err);
    // En cas d'erreur, s'assurer que les states sont propres
    setImagePreview(null);
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

// Alternative sans utiliser BigInt explicitement
// Utilise les fonctions intégrées d'ethers.js

const convertBigIntToNumber = (value) => {
  if (typeof value === 'bigint') {
    return Number(value);
  }
  if (typeof value === 'string') {
    if (value.startsWith('0x')) {
      return parseInt(value, 16);
    }
    return parseFloat(value) || 0;
  }
  if (typeof value === 'number') {
    return value;
  }
  return 0;
};

// Utiliser les utilitaires d'ethers.js pour les conversions
const parseEther = (value) => {
  // Si ethers est disponible, utiliser ethers.parseEther
  if (window.ethers && window.ethers.parseEther) {
    return window.ethers.parseEther(value.toString());
  }
  // Sinon, conversion manuelle
  return (parseFloat(value) * Math.pow(10, 18)).toString();
};

const formatEther = (value) => {
  // Si ethers est disponible
  if (window.ethers && window.ethers.formatEther) {
    return window.ethers.formatEther(value);
  }
  // Sinon, conversion manuelle
  return (parseInt(value) / Math.pow(10, 18)).toString();
};

const getQuantity = (commodity, index = 3) => {
  const qty = convertBigIntToNumber(commodity.quantity || commodity[index]);
  return Math.max(0, qty);
};

const handleBuy = async (index, price, quantity) => {
  try {
    console.log("=== STARTING DIRECT PAYMENT BUY PROCESS ===");
    
    const numPrice = convertBigIntToNumber(price);
    const numQuantity = convertBigIntToNumber(quantity) || quantities[index] || 1;
    
    console.log("Prix converti:", numPrice, typeof numPrice);
    console.log("Quantité convertie:", numQuantity, typeof numQuantity);
    
    if (!contract || !account) {
      alert("Veuillez connecter votre wallet");
      return;
    }
    
    if (index < 0 || index >= commodities.length) {
      alert(`Index invalide. Index: ${index}, Total commodities: ${commodities.length}`);
      return;
    }
    
    const product = commodities[index];
    const availableStock = getQuantity(product);
    
    if (availableStock < numQuantity) {
      alert(`Stock insuffisant ! Stock disponible: ${availableStock}, Demandé: ${numQuantity}`);
      return;
    }
    
    // Calcul du coût total en utilisant les strings pour éviter BigInt
    const priceInGwei = numPrice * 1000000000; // Prix * 1e9 (gwei)
    const totalCostGwei = priceInGwei * numQuantity;
    const totalCostWei = Math.floor(totalCostGwei).toString();
    
    console.log("Prix en Gwei:", priceInGwei);
    console.log("Coût total en Wei (string):", totalCostWei);
    console.log("Coût total (ETH):", totalCostGwei / 1e9);
    
    // Vérifier le solde du wallet
    const walletBalanceHex = await window.ethereum.request({
      method: 'eth_getBalance',
      params: [account, 'latest']
    });
    
    const walletBalanceNumber = parseInt(walletBalanceHex, 16);
    const totalCostNumber = parseInt(totalCostWei);
    
    if (walletBalanceNumber < totalCostNumber) {
      const walletBalanceEth = walletBalanceNumber / 1e18;
      const totalCostEth = totalCostNumber / 1e18;
      alert(`Solde ETH insuffisant !
        Solde actuel: ${walletBalanceEth.toFixed(8)} ETH
        Coût requis: ${totalCostEth.toFixed(8)} ETH`);
      return;
    }
    
    // Exécuter la transaction
    const tx = await contract.buyCommodity(index, numQuantity, {
      value: totalCostWei
    });
    
    console.log("Transaction envoyée:", tx.hash);
    alert(`Transaction envoyée ! Hash: ${tx.hash}`);
    
    const receipt = await tx.wait();
    console.log("Transaction confirmée:", receipt);
    
    alert(`Commande passée avec succès ! 
      Quantité: ${numQuantity}
      Montant payé: ${(totalCostNumber / 1e18).toFixed(8)} ETH
      Transaction: ${tx.hash}`);
    
    setQuantities(prev => ({ ...prev, [index]: 1 }));
    fetchCommodities();
    fetchUserInfo();
    
  } catch (err) {
    console.error("Erreur lors de l'achat:", err);
    
    let errorMessage = "Erreur lors de l'achat";
    if (err.message) {
      if (err.message.includes("user rejected")) {
        errorMessage = "Transaction annulée par l'utilisateur";
      } else if (err.message.includes("insufficient funds")) {
        errorMessage = "Fonds insuffisants";
      } else if (err.message.includes("BigInt") || err.message.includes("Cannot mix")) {
        errorMessage = "Erreur de conversion de valeur";
      }
    }
    
    alert(errorMessage + "\nDétails: " + (err.reason || err.message));
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
        profileForm.email,
        profileForm.image || '' // Image IPFS hash
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
      email: userInfo.email,
      image: userInfo.image || ''
    });
    setImagePreview(userInfo.image ? `https://${IPFS_GATEWAY}/ipfs/${userInfo.image}` : null);
    setIsEditingProfile(false);
  };

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
    { icon: Package, number: commodities.filter(c => c.quantity > 0).length.toString(), label: 'Disponibles' },
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
          <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full flex items-center justify-center overflow-hidden">
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
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 mb-8 border border-white/20">
          <div className="flex justify-between items-center flex-wrap gap-5">
            <div>
              <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                <Wallet size={32} />
                Dashboard Client
                {userInfo.firstName && (
                  <span className="text-cyan-400 text-xl">
                    - {userInfo.firstName} {userInfo.lastName}
                  </span>
                )}
              </h1>
              <p className="text-gray-300">
                {userInfo.email ? `${userInfo.email} - ` : ''}
                Découvrez nos produits et gérez vos commandes en toute sécurité sur la blockchain.
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
                  onClick={() => setActiveTab(activeTab === 'orders' ? 'products' : 'orders')}
                  className="bg-gradient-to-r from-orange-500 to-red-600 px-4 py-2 rounded-lg hover:scale-105 transition-all flex items-center gap-2"
                >
                  <ShoppingCart size={16} />
                  {activeTab === 'orders' ? 'Voir Produits' : 'Mes Commandes'}
                </button>
              </div>
            </div>
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
                        src={userInfo?.image || ''}
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
            ) : (
              /* Profile Edit Mode avec upload d'image */
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-cyan-400">Modifier mes informations</h3>
                
                {/* Section photo de profil */}
                <div className="bg-white/5 rounded-lg p-6 border border-white/10">
  <h4 className="text-md font-semibold text-cyan-300 mb-4">Photo de profil</h4>
  
  <div className="flex items-center gap-6">
    {/* Preview de l'image - Version corrigée */}
    <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-cyan-400/50 flex-shrink-0">
      {imagePreview ? (
        <img
          src={imagePreview}
          alt="Preview"
          className="w-full h-full object-cover"
          onError={(e) => {
            console.error('Erreur de chargement de l\'image preview:', e);
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'flex';
          }}
        />
      ) : userInfo?.image ? (
        <ImageDisplay
          src={userInfo.image}
          alt="Photo actuelle"
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-cyan-500/20 to-purple-500/20">
          <Camera className="w-8 h-8 text-white/50" />
        </div>
      )}
      
      {/* Fallback caché par défaut */}
      <div 
        className="w-full h-full flex items-center justify-center bg-gradient-to-br from-cyan-500/20 to-purple-500/20"
        style={{ display: 'none' }}
      >
        <Camera className="w-8 h-8 text-white/50" />
      </div>
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
        
        {(imagePreview || (userInfo?.image && userInfo.image.length > 0)) && (
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
                        <strong>Note:</strong> L'adresse wallet et le type de compte ne peuvent pas être modifiés.
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

            {!userInfo.isSeller && !isEditingProfile && (
              <div className="mt-6 pt-4 border-t border-white/20">
                <div className="inline-flex items-center px-4 py-3 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  <User size={18} className="mr-3" />
                  <div>
                    <div className="font-semibold">Compte Client</div>
                    <div className="text-sm opacity-80">Vous pouvez acheter des produits sur la plateforme</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mb-8">
          {mockStats.map((stat, index) => (
            <div key={index} className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:border-white/30 transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-300 text-sm">{stat.label}</p>
                  <p className="text-2xl font-bold text-white">{stat.number}</p>
                </div>
                <div className="p-3 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-lg">
                  <stat.icon size={24} className="text-cyan-400" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Main Content Tabs */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 overflow-hidden">
          {/* Tab Navigation */}
          <div className="flex border-b border-white/10">
            <button
              onClick={() => setActiveTab('products')}
              className={`flex-1 px-6 py-4 text-center font-medium transition-all ${
                activeTab === 'products'
                  ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-400 border-b-2 border-cyan-400'
                  : 'text-gray-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Package size={20} className="inline mr-2" />
              Produits Disponibles
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`flex-1 px-6 py-4 text-center font-medium transition-all ${
                activeTab === 'orders'
                  ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-400 border-b-2 border-cyan-400'
                  : 'text-gray-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <ShoppingBag size={20} className="inline mr-2" />
              Mes Commandes ({orders.length})
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'products' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold">Produits Disponibles</h2>
                  <div className="text-sm text-gray-400">
                    {commodities.filter(c => c.quantity > 0).length} produits en stock
                  </div>
                </div>

                {loading ? (
                  <div className="text-center py-12">
                    <div className="inline-block w-8 h-8 border-4 border-gray-300 border-t-cyan-400 rounded-full animate-spin"></div>
                    <p className="mt-4 text-gray-400">Chargement des produits...</p>
                  </div>
                ) : commodities.length === 0 ? (
                  <div className="text-center py-12">
                    <Package size={48} className="mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-400">Aucun produit disponible</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
{commodities.map((commodity, index) => (
  <div key={index} className="bg-white/5 rounded-xl p-6 border border-white/10 hover:border-white/20 transition-all">
    <div className="w-full h-48 rounded-lg overflow-hidden mb-4 bg-gray-800/50">
      <ImageDisplay
        src={commodity.image || commodity[5]}
        alt={commodity.name || commodity[0]}
        className="w-full h-full object-cover"
      />
    </div>

    <div className="space-y-3">
      <div>
        <h3 className="font-semibold text-lg">{commodity.name || commodity[0]}</h3>
        <p className="text-sm text-gray-400">{commodity.category || commodity[1]}</p>
        <p className="text-sm text-purple-300">{commodity.company || commodity[4]}</p>
      </div>
      
      <div className="flex justify-between items-center">
        <span className="text-2xl font-bold text-cyan-400">
          {convertBigIntToNumber(commodity.value || commodity[2])} Gwei
        </span>
        <span className="text-sm text-gray-400">
          Stock: {getQuantity(commodity)}
        </span>
      </div>

      {getQuantity(commodity) > 0 ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-300">Quantité:</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleQuantityChange(index, Math.max(1, (quantities[index] || 1) - 1))}
                className="w-8 h-8 bg-white/10 rounded border border-white/20 hover:bg-white/20 transition-all flex items-center justify-center"
              >
                -
              </button>
              <span className="w-12 text-center font-mono">
                {quantities[index] || 1}
              </span>
              <button
                onClick={() => handleQuantityChange(index, Math.min(getQuantity(commodity), (quantities[index] || 1) + 1))}
                className="w-8 h-8 bg-white/10 rounded border border-white/20 hover:bg-white/20 transition-all flex items-center justify-center"
              >
                +
              </button>
            </div>
          </div>
          
          <button
            onClick={() => handleBuy(index, commodity.value || commodity[2], quantities[index] || 1)}
            className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 py-3 rounded-lg font-semibold hover:scale-105 transition-all flex items-center justify-center gap-2"
          >
            <ShoppingCart size={16} />
            Acheter - {(convertBigIntToNumber(commodity.value || commodity[2]) * (quantities[index] || 1)).toFixed(4)} Gwei
          </button>
        </div>
      ) : (
        <button
          disabled
          className="w-full bg-gray-600 py-3 rounded-lg font-semibold opacity-50 cursor-not-allowed"
        >
          Rupture de stock
        </button>
      )}
    </div>
  </div>
))}

                   
                  </div>
                )}
              </div>
            )}

            {activeTab === 'orders' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold">Mes Commandes</h2>
                  <div className="flex gap-2">
                    <select
                      value={orderFilter}
                      onChange={(e) => setOrderFilter(e.target.value)}
                      className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-400"
                    >
                      <option value="all">Toutes</option>
                      <option value="Pending">En attente</option>
                      <option value="Shipped">Expédiées</option>
                      <option value="Delivered">Livrées</option>
                    </select>
                  </div>
                </div>

                {ordersLoading ? (
                  <div className="text-center py-12">
                    <div className="inline-block w-8 h-8 border-4 border-gray-300 border-t-cyan-400 rounded-full animate-spin"></div>
                    <p className="mt-4 text-gray-400">Chargement des commandes...</p>
                  </div>
                ) : filteredOrders.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingBag size={48} className="mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-400">
                      {orderFilter === 'all' ? 'Aucune commande trouvée' : `Aucune commande ${orderFilter.toLowerCase()}`}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredOrders.map((order, index) => {
                      const commodity = commodities[parseInt(order.commodityId)];
                      return (
                        <div key={index} className="bg-white/5 rounded-lg p-6 border border-white/10">
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                            <div>
                              <h3 className="font-semibold">{commodity?.name || commodity?.[0] || 'Produit supprimé'}</h3>
                              <p className="text-sm text-gray-400">#{order.id.toString()}</p>
                              <p className="text-sm text-purple-300">{commodity?.company || commodity?.[4] || 'N/A'}</p>
                            </div>
                            
                            <div className="text-center">
                              <p className="text-sm text-gray-400">Quantité</p>
                              <p className="font-semibold">{order.quantity.toString()}</p>
                            </div>
                            
                            <div className="text-center">
                              <p className="text-sm text-gray-400">Total</p>
                              <p className="font-semibold text-cyan-400">
                                {(parseInt(order.totalPrice) / 1e18).toFixed(4)} ETH
                              </p>
                            </div>
                            
                            <div className="flex justify-center">
                              <span className={`inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium border ${getStatusColor(order.status)}`}>
                                {getStatusIcon(order.status)}
                                {order.status}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ClientDashboard;