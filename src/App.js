import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "./components/Acceuil/HomePage";
import AuthPage from "./components/Auth/AuthPage";
import SellerDashboard from "./components/Seller/SellerDashboard";
import ClientDashboard from "./components/Client/ClientDashboard";

import { ethers } from "ethers";
import EcommerceABI from "./abis/Ecommerce.json";

// import RegisterUser from "./components/RegisterUser";
// import AddCommodity from "./components/AddCommodity";
// import ListCommodities from "./components/ListCommodities";
// import BuyCommodity from "./components/BuyCommodity";


const contractAddress = "0x01A443cebe832512e37C3FC0F02DC48C44bd187c";

function App() {
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);

  const connectWallet = async () => {
    if (typeof window.ethereum === "undefined") {
      alert("Veuillez installer Metamask !");
      return;
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const ecommerce = new ethers.Contract(contractAddress, EcommerceABI.abi, signer);
      const address = await signer.getAddress();

      setAccount(address);
      setContract(ecommerce);
    } catch (error) {
      console.error("Erreur de connexion au wallet :", error);
    }
  };

  useEffect(() => {
    connectWallet();
  }, []);

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={<HomePage account={account} connectWallet={connectWallet} />}
        />
        <Route
          path="/auth"
          element={<AuthPage account={account} contract={contract} />}
        />
        <Route
          path="/client"
          element={<ClientDashboard account={account} contract={contract} />}
        />
        <Route
          path="/seller"
          element={<SellerDashboard account={account} contract={contract} />}
        />
      </Routes>
    </Router>
  );
}

export default App;
