import './App.css';
import {useEffect} from "react";

const App = () => {

  // function to check if the phantom wallet is connected to our
  // website

  // phantom injects an object solana into the webpage. so we check for that first

  const checkIfWalletIsConnected = async() => {
    try {
      const {solana} = window;
      if(solana) {
        if (solana.isPhantom) {
          console.log("Phantom wallet was found!");
        } else {
          alert("Solana object and phantom wallet not found. Install Phantom wallet");
        }
      }

    } catch(error) {
        console.log("Solana object not found. Get a Phantom wallet");
    }
  }

  // when window is loaded the useEffect will run the function and check
  // if wallet is connected
  useEffect(() => {
    const onLoad = async () => {
      await checkIfWalletIsConnected();
    };

    window.addEventListener("load", onLoad);
    return () => window.removeEventListener("load", onLoad);
  }, []);


};

export default App;
