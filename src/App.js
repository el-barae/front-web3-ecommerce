import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "./components/Acceuil/HomePage";
import AuthPage from "./components/Auth/AuthPage";
import SellerDashboard from "./components/Seller/SellerDashboard";
import ClientDashboard from "./components/Client/ClientDashboard";

import { ethers } from "ethers";
import EcommerceABI from "./abis/Ecommerce.json";

const contractAddress = "0x75739c9Fcc8772cB13dC3E764CC609F5b0f3CeCF";

function App() {
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);


    const connectWallet = async () => {
  if (typeof window.ethereum === "undefined") {
    alert("Veuillez installer Metamask !");
    return;
  }

  try {
    // Vérifier/forcer Sepolia
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: "0xaa36a7" }], // 11155111 en hex
    }).catch(async (switchError) => {
      if (switchError.code === 4902) {
        // Si Sepolia n'est pas ajouté, on l'ajoute
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [{
            chainId: "0xaa36a7",
            chainName: "Sepolia Test Network",
            nativeCurrency: {
              name: "SepoliaETH",
              symbol: "ETH",
              decimals: 18,
            },
            rpcUrls: ["https://sepolia.infura.io/v3/d1b840e1289f481ea53dea801e827197"],
            blockExplorerUrls: ["https://sepolia.etherscan.io/"],
          }],
        });
      }
    });

    // Connexion classique
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


  // const connectWallet = async () => {
  //   if (typeof window.ethereum === "undefined") {
  //     alert("Veuillez installer Metamask !");
  //     return;
  //   }

  //   try {
  //     const provider = new ethers.BrowserProvider(window.ethereum);
  //     const signer = await provider.getSigner();
  //     const ecommerce = new ethers.Contract(contractAddress, EcommerceABI.abi, signer);
  //     const address = await signer.getAddress();

  //     setAccount(address);
  //     setContract(ecommerce);
  //   } catch (error) {
  //     console.error("Erreur de connexion au wallet :", error);
  //   }
  // };

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
