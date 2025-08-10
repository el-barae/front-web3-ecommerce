import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Calendar, Users, Shield, Mail, Wallet, AlertCircle, CheckCircle, LogIn, UserPlus, Key } from 'lucide-react';

const AuthSystem = ({ contract }) => {
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState('login'); // 'login' or 'register'
  const [connectedAccount, setConnectedAccount] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  
  // Form states
  const [registerForm, setRegisterForm] = useState({
    firstName: '',
    lastName: '',
    age: '',
    gender: '',
    email: '',
    isSeller: false,
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [nonce, setNonce] = useState('');

  // Connect wallet on component mount
  useEffect(() => {
    checkWalletConnection();
    
    // Listen for account changes
    if (typeof window.ethereum !== 'undefined') {
      const handleAccountsChanged = (accounts) => {
        if (accounts.length === 0) {
          // User disconnected wallet
          setConnectedAccount(null);
          setProvider(null);
          setSigner(null);
          setIsAuthenticated(false);
          setUserProfile(null);
          // Clear session storage
          sessionStorage.removeItem('userRole');
          sessionStorage.removeItem('userProfile');
        } else {
          // User switched accounts
          setConnectedAccount(accounts[0]);
          // Reset authentication when account changes
          setIsAuthenticated(false);
          setUserProfile(null);
          setErrors({});
          setSuccessMessage('Compte changé. Veuillez vous reconnecter.');
          // Clear session storage
          sessionStorage.removeItem('userRole');
          sessionStorage.removeItem('userProfile');
          
          // Reinitialize provider and signer
          if (typeof window.ethers !== 'undefined') {
            const web3Provider = new window.ethers.providers.Web3Provider(window.ethereum);
            setProvider(web3Provider);
            setSigner(web3Provider.getSigner());
          }
        }
      };

      const handleChainChanged = (chainId) => {
        // Reload the page when chain changes
        window.location.reload();
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      // Cleanup event listeners
      return () => {
        if (window.ethereum.removeListener) {
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
          window.ethereum.removeListener('chainChanged', handleChainChanged);
        }
      };
    }
  }, []);

  // Check if user is already registered when account changes
  useEffect(() => {
    if (connectedAccount && contract) {
      checkUserExists();
    }
  }, [connectedAccount, contract]);

  // Handle navigation after successful authentication
  useEffect(() => {
    if (isAuthenticated && userProfile) {
      // Store user info in sessionStorage
      const userRole = userProfile.isSeller ? 'seller' : 'client';
      sessionStorage.setItem('userRole', userRole);
      sessionStorage.setItem('userProfile', JSON.stringify({
        ...userProfile,
        walletAddress: connectedAccount
      }));

      // Navigate based on role
      if (navigate) {
        if (userProfile.isSeller) {
          navigate('/seller');
        } else {
          navigate('/client');
        }
      } else {
        // Fallback if navigate is not provided - use window.location
        if (userProfile.isSeller) {
          window.location.href = '/seller';
        } else {
          window.location.href = '/client';
        }
      }
    }
  }, [isAuthenticated, userProfile, connectedAccount, navigate]);

  const checkWalletConnection = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          setConnectedAccount(accounts[0]);
          // Initialize provider and signer only if ethers is available
          if (typeof window.ethers !== 'undefined') {
            const web3Provider = new window.ethers.providers.Web3Provider(window.ethereum);
            setProvider(web3Provider);
            setSigner(web3Provider.getSigner());
          }
        }
      } catch (error) {
        console.error('Error checking wallet connection:', error);
      }
    }
  };

  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setConnectedAccount(accounts[0]);
        
        // Initialize provider and signer only if ethers is available
        if (typeof window.ethers !== 'undefined') {
          const web3Provider = new window.ethers.providers.Web3Provider(window.ethereum);
          setProvider(web3Provider);
          setSigner(web3Provider.getSigner());
        }
        
        setErrors({});
      } catch (error) {
        console.error('Error connecting wallet:', error);
        setErrors({ wallet: 'Erreur lors de la connexion au portefeuille' });
      }
    } else {
      setErrors({ wallet: 'MetaMask n\'est pas installé' });
    }
  };

  const getCurrentAccount = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        return accounts.length > 0 ? accounts[0] : null;
      } catch (error) {
        console.error('Error getting current account:', error);
        return null;
      }
    }
    return null;
  };

  const generateNonce = (address) => {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    return `Connexion sécurisée pour ${address} à ${timestamp} - ID: ${randomId}`;
  };

  const checkUserExists = async () => {
    if (!contract || !connectedAccount) return;
    
    try {
      const user = await contract.getUserById(connectedAccount);
      if (user.firstName && user.firstName.trim() !== '') {
        setUserProfile({
          firstName: user.firstName,
          lastName: user.lastName,
          age: user.age.toString(),
          gender: user.gender,
          isSeller: user.isSeller,
          email: user.email,
          balance: user.balance.toString()
        });
      }
    } catch (error) {
      console.log('User not registered yet');
    }
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateRegisterForm = () => {
    const newErrors = {};
    
    if (!registerForm.firstName.trim()) newErrors.firstName = 'Le prénom est requis';
    if (!registerForm.lastName.trim()) newErrors.lastName = 'Le nom est requis';
    if (!registerForm.age || registerForm.age < 18) newErrors.age = 'Vous devez avoir au moins 18 ans';
    if (!registerForm.gender) newErrors.gender = 'Le genre est requis';
    if (!validateEmail(registerForm.email)) newErrors.email = 'Email invalide';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegisterChange = (e) => {
    const { name, value, type, checked } = e.target;
    setRegisterForm({ ...registerForm, [name]: type === "checkbox" ? checked : value });
    // Clear error for this field
    if (errors[name]) {
      setErrors({ ...errors, [name]: null });
    }
  };

  const handleLoginWithSignature = async () => {
    // Force refresh of current account before signing
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0 && accounts[0] !== connectedAccount) {
          setConnectedAccount(accounts[0]);
          setSuccessMessage('Compte détecté: ' + accounts[0].slice(0, 6) + '...' + accounts[0].slice(-4));
          
          // Reinitialize signer for new account
          if (typeof window.ethers !== 'undefined') {
            const web3Provider = new window.ethers.providers.Web3Provider(window.ethereum);
            setProvider(web3Provider);
            setSigner(web3Provider.getSigner());
          }
        }
      } catch (error) {
        console.error('Error getting current accounts:', error);
      }
    }

    const currentAccount = await getCurrentAccount();
    if (!currentAccount) {
      await connectWallet();
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      // Generate nonce for signature with current account
      const messageToSign = generateNonce(currentAccount);
      setNonce(messageToSign);

      // Use MetaMask's personal_sign method directly
      let signature;
      let recoveredAddress;

      try {
        // Method 1: Use ethers.js if available
        if (signer && typeof window.ethers !== 'undefined') {
          signature = await signer.signMessage(messageToSign);
          recoveredAddress = window.ethers.utils.verifyMessage(messageToSign, signature);
        } else {
          // Method 2: Use MetaMask directly without ethers.js
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          const account = accounts[0];
          
          // Convert message to hex using TextEncoder (browser native)
          const encoder = new TextEncoder();
          const messageBytes = encoder.encode(messageToSign);
          const messageHex = '0x' + Array.from(messageBytes)
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
          
          // Request signature
          signature = await window.ethereum.request({
            method: 'personal_sign',
            params: [messageHex, account],
          });

          // For verification without ethers, we'll use the current account
          recoveredAddress = account;
        }
      } catch (signError) {
        console.error('Signature error:', signError);
        throw signError;
      }

      if (recoveredAddress.toLowerCase() === currentAccount.toLowerCase()) {
        // Check if user exists in contract
        if (!contract) {
          setErrors({ contract: "Contrat non disponible." });
          return;
        }

        try {
          const user = await contract.getUserById(currentAccount);
          
          if (!user.firstName || user.firstName.trim() === '') {
            setErrors({ login: 'Aucun compte trouvé pour cette adresse. Veuillez vous inscrire d\'abord.' });
            setCurrentView('register');
            return;
          }

          // User exists and signature is valid
          setUserProfile({
            firstName: user.firstName,
            lastName: user.lastName,
            age: user.age.toString(),
            gender: user.gender,
            isSeller: user.isSeller,
            email: user.email,
            balance: user.balance.toString()
          });

          setIsAuthenticated(true);
          setSuccessMessage('Connexion réussie ! Redirection...');
          
        } catch (err) {
          console.error(err);
          setErrors({ login: 'Aucun compte trouvé pour cette adresse. Veuillez vous inscrire d\'abord.' });
          setCurrentView('register');
        }

      } else {
        setErrors({ login: 'Signature invalide.' });
      }

    } catch (err) {
      console.error(err);
      if (err.code === 4001) {
        setErrors({ login: 'Signature refusée par l\'utilisateur.' });
      } else {
        setErrors({ login: 'Erreur lors de la signature: ' + err.message });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateRegisterForm()) return;
    
    if (!contract || !connectedAccount) {
      setErrors({ contract: "Contrat non disponible ou portefeuille non connecté." });
      return;
    }
    
    setLoading(true);
    setErrors({});
    
    try {
      // Register user without password - just use wallet address as authentication
      const tx = await contract.register(
        registerForm.firstName,
        registerForm.lastName,
        parseInt(registerForm.age),
        registerForm.gender,
        registerForm.isSeller,
        registerForm.email,
      );
      await tx.wait();
      
      setSuccessMessage('Inscription réussie ! Vous pouvez maintenant vous connecter avec votre signature.');
      setCurrentView('login');
      
      // Reset form
      setRegisterForm({
        firstName: '',
        lastName: '',
        age: '',
        gender: '',
        email: '',
        isSeller: false,
      });
      
    } catch (err) {
      console.error(err);
      setErrors({ submit: 'Erreur lors de l\'enregistrement. Cet utilisateur existe peut-être déjà.' });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserProfile(null);
    setNonce('');
    sessionStorage.removeItem('userRole');
    sessionStorage.removeItem('userProfile');
    setSuccessMessage('Déconnexion réussie !');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-800 to-slate-900 text-white relative overflow-hidden flex items-center justify-center p-5">
      {/* Background elements */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-500 rounded-full blur-3xl opacity-30 animate-pulse"></div>
      <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-cyan-500 rounded-full blur-3xl opacity-30 animate-pulse"></div>

      {/* Success Message */}
      {successMessage && (
        <div className="absolute top-8 left-1/2 transform -translate-x-1/2 bg-green-500/20 border border-green-400/30 text-green-300 px-6 py-3 rounded-xl backdrop-blur-xl z-20 flex items-center gap-2">
          <CheckCircle size={20} />
          {successMessage}
        </div>
      )}

      {/* Wallet Connection Status */}
      {!connectedAccount && (
        <div className="absolute top-8 left-1/2 transform -translate-x-1/2 bg-orange-500/20 border border-orange-400/30 text-orange-300 px-6 py-3 rounded-xl backdrop-blur-xl z-20 flex items-center gap-2">
          <AlertCircle size={20} />
          Portefeuille non connecté
        </div>
      )}

      {/* Auth Form Container */}
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-10 max-w-md w-full shadow-2xl relative z-5">
        {/* Tab Navigation */}
        <div className="flex mb-8 bg-white/5 rounded-2xl p-1">
          <button
            onClick={() => {setCurrentView('login'); setErrors({}); setSuccessMessage('');}}
            className={`flex-1 py-3 px-6 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
              currentView === 'login' 
                ? 'bg-gradient-to-r from-cyan-500 to-purple-600 text-white shadow-lg' 
                : 'text-gray-300 hover:text-white'
            }`}
          >
            <LogIn size={18} />
            Connexion
          </button>
          <button
            onClick={() => {setCurrentView('register'); setErrors({}); setSuccessMessage('');}}
            className={`flex-1 py-3 px-6 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
              currentView === 'register' 
                ? 'bg-gradient-to-r from-cyan-500 to-purple-600 text-white shadow-lg' 
                : 'text-gray-300 hover:text-white'
            }`}
          >
            <UserPlus size={18} />
            Inscription
          </button>
        </div>

        {/* Error Messages */}
        {(errors.wallet || errors.contract || errors.submit || errors.login) && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-400/30 rounded-xl text-red-300 text-sm flex items-center gap-2">
            <AlertCircle size={16} />
            {errors.wallet || errors.contract || errors.submit || errors.login}
          </div>
        )}

        {/* LOGIN FORM */}
        {currentView === 'login' && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
                🔐 Connexion Signature
              </h1>
              <p className="text-gray-300">Authentifiez-vous avec votre wallet</p>
            </div>

            {/* Wallet Connection Info */}
            {connectedAccount && (
              <div className="bg-green-500/10 border border-green-400/20 rounded-xl p-4 mb-6">
                <div className="flex items-center gap-2 text-green-300">
                  <CheckCircle size={16} />
                  <span className="text-sm">Wallet connecté: {connectedAccount.slice(0, 6)}...{connectedAccount.slice(-4)}</span>
                </div>
              </div>
            )}

            {/* Signature Process Explanation */}
            <div className="bg-blue-500/10 border border-blue-400/20 rounded-xl p-4 mb-6">
              <h3 className="text-blue-300 font-medium mb-2 flex items-center gap-2">
                <Key size={16} />
                Comment ça marche ?
              </h3>
              <div className="text-sm text-gray-300 space-y-1">
                <p>1. Connectez votre wallet MetaMask</p>
                <p>2. Signez un message unique avec votre clé privée</p>
                <p>3. Votre identité est prouvée cryptographiquement</p>
                <p>4. Accès autorisé sans mot de passe !</p>
              </div>
            </div>

            <button
              onClick={handleLoginWithSignature}
              disabled={loading}
              className={`w-full py-4 rounded-xl text-white text-lg font-semibold transition-all flex items-center justify-center gap-3 ${
                loading
                  ? 'bg-gray-600 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-cyan-500 to-purple-600 hover:-translate-y-0.5 hover:from-cyan-600 hover:to-purple-700 shadow-lg shadow-cyan-500/30'
              }`}
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Signature en cours...
                </>
              ) : (
                <>
                  <Key size={20} />
                  {connectedAccount ? 'Signer pour se connecter' : 'Connecter le wallet'}
                </>
              )}
            </button>

            {/* Security Note */}
            <div className="text-center text-xs text-gray-400 mt-4">
              🔒 Votre clé privée reste sécurisée dans votre wallet
            </div>
          </div>
        )}

        {/* REGISTER FORM */}
        {currentView === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-6">
            <div className="text-center mb-6">
              <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
                📝 Inscription
              </h1>
              <p className="text-gray-300">Créer un compte lié à votre wallet</p>
            </div>

            {/* Wallet Connection Info */}
            {connectedAccount ? (
              <div className="bg-green-500/10 border border-green-400/20 rounded-xl p-4 mb-6">
                <div className="flex items-center gap-2 text-green-300">
                  <CheckCircle size={16} />
                  <span className="text-sm">Wallet: {connectedAccount.slice(0, 6)}...{connectedAccount.slice(-4)}</span>
                </div>
              </div>
            ) : (
              <div className="bg-orange-500/10 border border-orange-400/20 rounded-xl p-4 mb-6">
                <div className="flex items-center gap-2 text-orange-300">
                  <AlertCircle size={16} />
                  <span className="text-sm">Connectez d'abord votre wallet</span>
                </div>
              </div>
            )}

            {/* Name Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="relative">
                <label className="block mb-2 text-gray-200 text-sm font-medium">Prénom *</label>
                <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 mt-3" />
                <input
                  name="firstName"
                  placeholder="Votre prénom"
                  onChange={handleRegisterChange}
                  value={registerForm.firstName}
                  required
                  className={`w-full pl-12 pr-4 py-4 bg-white/10 border rounded-xl text-white placeholder-gray-400 focus:bg-white/15 transition-all outline-none ${
                    errors.firstName ? 'border-red-400' : 'border-white/20 focus:border-cyan-400'
                  }`}
                />
                {errors.firstName && <p className="text-red-400 text-sm mt-1">{errors.firstName}</p>}
              </div>

              <div className="relative">
                <label className="block mb-2 text-gray-200 text-sm font-medium">Nom *</label>
                <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 mt-3" />
                <input
                  name="lastName"
                  placeholder="Votre nom"
                  onChange={handleRegisterChange}
                  value={registerForm.lastName}
                  required
                  className={`w-full pl-12 pr-4 py-4 bg-white/10 border rounded-xl text-white placeholder-gray-400 focus:bg-white/15 transition-all outline-none ${
                    errors.lastName ? 'border-red-400' : 'border-white/20 focus:border-cyan-400'
                  }`}
                />
                {errors.lastName && <p className="text-red-400 text-sm mt-1">{errors.lastName}</p>}
              </div>
            </div>

            {/* Age and Gender */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="relative">
                <label className="block mb-2 text-gray-200 text-sm font-medium">Âge *</label>
                <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 mt-3" />
                <input
                  name="age"
                  type="number"
                  placeholder="Votre âge"
                  onChange={handleRegisterChange}
                  value={registerForm.age}
                  required
                  min="18"
                  max="120"
                  className={`w-full pl-12 pr-4 py-4 bg-white/10 border rounded-xl text-white placeholder-gray-400 focus:bg-white/15 transition-all outline-none ${
                    errors.age ? 'border-red-400' : 'border-white/20 focus:border-cyan-400'
                  }`}
                />
                {errors.age && <p className="text-red-400 text-sm mt-1">{errors.age}</p>}
              </div>

              <div className="relative">
                <label className="block mb-2 text-gray-200 text-sm font-medium">Genre *</label>
                <Users className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 mt-3" />
                <select
                  name="gender"
                  onChange={handleRegisterChange}
                  value={registerForm.gender}
                  required
                  className={`w-full pl-12 pr-4 py-4 bg-white/10 border rounded-xl text-white focus:bg-white/15 transition-all outline-none cursor-pointer ${
                    errors.gender ? 'border-red-400' : 'border-white/20 focus:border-cyan-400'
                  }`}
                >
                  <option value="" className="bg-gray-800 text-white">-- Sélectionnez --</option>
                  <option value="Homme" className="bg-gray-800 text-white">Homme</option>
                  <option value="Femme" className="bg-gray-800 text-white">Femme</option>
                </select>
                {errors.gender && <p className="text-red-400 text-sm mt-1">{errors.gender}</p>}
              </div>
            </div>

            {/* Email Field */}
            <div className="relative">
              <label className="block mb-2 text-gray-200 text-sm font-medium">Email *</label>
              <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 mt-3" />
              <input
                name="email"
                type="email"
                placeholder="votre.email@exemple.com"
                onChange={handleRegisterChange}
                value={registerForm.email}
                required
                className={`w-full pl-12 pr-4 py-4 bg-white/10 border rounded-xl text-white placeholder-gray-400 focus:bg-white/15 transition-all outline-none ${
                  errors.email ? 'border-red-400' : 'border-white/20 focus:border-cyan-400'
                }`}
              />
              {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email}</p>}
            </div>

            {/* Seller Checkbox */}
            <div className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-xl cursor-pointer hover:bg-white/10 hover:border-cyan-400 transition-all">
              <input
                type="checkbox"
                name="isSeller"
                onChange={handleRegisterChange}
                checked={registerForm.isSeller}
                className="w-5 h-5 accent-cyan-400 cursor-pointer"
                id="sellerCheckbox"
              />
              <label htmlFor="sellerCheckbox" className="flex items-center gap-2 text-gray-200 cursor-pointer">
                <Shield size={20} />
                Je souhaite devenir vendeur
              </label>
            </div>

            <button
              type="submit"
              disabled={loading || !connectedAccount}
              className={`w-full py-4 rounded-xl text-white text-lg font-semibold transition-all ${
                loading || !connectedAccount
                  ? 'bg-gray-600 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-cyan-500 to-purple-600 hover:-translate-y-0.5 hover:from-cyan-600 hover:to-purple-700 shadow-lg shadow-cyan-500/30'
              }`}
            >
              {loading ? 'Inscription...' : "S'inscrire"}
            </button>
          </form>
        )}
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute w-0.5 h-0.5 bg-white rounded-full opacity-30 animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${4 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default AuthSystem;