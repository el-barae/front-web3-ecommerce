import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Shield, Zap, Globe, ShoppingBag, Users, TrendingUp } from 'lucide-react';

const HomePage = () => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);

  const Navigate = (to) =>{
    const role = sessionStorage.getItem('userRole');
    if(to == 'seller' && role == 'seller'){
      navigate('/seller')
    }
    else if(to == 'client' && role == 'client'){
      navigate('/client')
    }
    else{
      navigate('/auth')
    }
  }

  useEffect(() => {
    setIsVisible(true);
    const interval = setInterval(() => {
      setActiveFeature(prev => (prev + 1) % 3);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const features = [
    { icon: Shield, title: "Sécurité Blockchain", description: "Transactions sécurisées et transparentes" },
    { icon: Zap, title: "Paiements Instantanés", description: "Règlements ultra-rapides en cryptomonnaie" },
    { icon: Globe, title: "Commerce Global", description: "Vendez et achetez partout dans le monde" }
  ];

  const stats = [
    { icon: Users, number: "10K+", label: "Utilisateurs actifs" },
    { icon: ShoppingBag, number: "50K+", label: "Transactions" },
    { icon: TrendingUp, number: "99.9%", label: "Uptime" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-800 to-slate-900 text-white relative overflow-hidden font-sans">
      {/* Animated background elements */}
      <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full blur-3xl opacity-20 animate-pulse"></div>
      <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full blur-3xl opacity-20 animate-pulse"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500 rounded-full blur-3xl opacity-10 animate-pulse"></div>

      {/* Navigation */}
      <nav className="relative z-10 flex justify-between items-center p-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-lg"></div>
          <span className="text-xl font-bold">BlockchainStore</span>
        </div>
        <div className="hidden md:flex gap-8">
          <a href="#features" className="hover:text-cyan-300 transition-colors">Fonctionnalités</a>
          <a href="#about" className="hover:text-cyan-300 transition-colors">À propos</a>
          <a href="#contact" className="hover:text-cyan-300 transition-colors">Contact</a>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 text-center">
        <div className={`transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          <h1 className="text-6xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
            🌐 Blockchain Store
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl leading-relaxed">
            Révolutionnez votre commerce avec la puissance de la blockchain. 
            Gérez vos ventes et achats en toute transparence et sécurité.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <button className="flex items-center px-8 py-4 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-full font-semibold text-lg hover:scale-105 transition-transform shadow-lg shadow-cyan-500/30"
            onClick={()=>Navigate('')}>
              Se connecter <ChevronRight className="ml-2" size={20} />
            </button>
            <button className="flex items-center px-8 py-4 border-2 border-purple-500 rounded-full font-semibold text-lg hover:scale-105 hover:bg-purple-500 hover:text-slate-900 transition-all"
            onClick={()=>Navigate('seller')}>
              Espace Vendeur <ChevronRight className="ml-2" size={20} />
            </button>
            <button className="flex items-center px-8 py-4 border-2 border-cyan-500 rounded-full font-semibold text-lg hover:scale-105 hover:bg-cyan-500 hover:text-slate-900 transition-all"
            onClick={()=>Navigate('client')}>
              Espace Client <ChevronRight className="ml-2" size={20} />
            </button>
          </div>
        </div>

        {/* Features Grid */}
        <div id="features" className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mb-16">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            const isActive = activeFeature === index;
            return (
              <div
                key={index}
                className={`p-6 bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 transition-all duration-500 hover:scale-105 cursor-pointer ${
                  isActive ? 'scale-105 bg-white/20' : ''
                }`}
              >
                <Icon className="w-12 h-12 text-cyan-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-300">{feature.description}</p>
              </div>
            );
          })}
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mb-16">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="text-center">
                <Icon className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                <div className="text-3xl font-bold text-cyan-400 mb-1">{stat.number}</div>
                <div className="text-gray-300">{stat.label}</div>
              </div>
            );
          })}
        </div>

        {/* Call to Action */}
        <div className="text-center max-w-lg">
          <h2 className="text-3xl font-bold mb-4">Prêt à commencer ?</h2>
          <p className="text-gray-300 mb-8">
            Rejoignez des milliers d'utilisateurs qui font confiance à notre plateforme blockchain.
          </p>
          <button className="px-10 py-4 mb-10 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full font-semibold text-lg hover:scale-105 transition-transform shadow-lg shadow-pink-500/30"
          onClick={()=>Navigate('')}>
            Commencer maintenant
          </button>
        </div>
      </main>

      {/* Floating particles */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full opacity-20 animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${3 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default HomePage;