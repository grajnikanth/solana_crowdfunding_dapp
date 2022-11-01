import './App.css';
import {useEffect} from "react";

const App = () => {

  // function to check if the phantom wallet is connected to our
  // website

  // phantom injects an object solana into the webpage. so we check for that first
  // connect to phantom wallet using solana.connect function
  // onlyIfTrusted: true setting will ensure connect to wallet automatically
  // if user gave permission before. So they do not have to type password everytime?

  const checkIfWalletIsConnected = async() => {
    try {
      const {solana} = window;
      if(solana) {
        if (solana.isPhantom) {
          console.log("Phantom wallet was found!");
          const phantomConnection = await solana.connect({
            onlyIfTrusted: true,
          });
          console.log("Connected to phantom wallet pubkey ", 
            phantomConnection.publicKey.toString());

        } else {
          alert("Solana object and phantom wallet not found. Install Phantom wallet");
        }
      }

    } catch(error) {
        console.log("Solana object not found. Get a Phantom wallet");
    }
  }



  // Create a button called connect wallet 
  // using this button user can ask their phantom wallet to connect to our dapp
  // renderNotConnectedContainer is the html to display when wallet is not connected
  // to our dapp
  // Once user click connect wallet, we execute the connectWallet function

  const connectWallet = async () => {};

  const renderNotConnectedContainer = () => {
    <button onClick={connectWallet}>Connect Phantom Wallet</button>
  };


  // when window is loaded the useEffect will run the function and check
  // if wallet is connected
  // useEffect(() => {
  //   const onLoad = async () => {
  //     await checkIfWalletIsConnected();
  //   };

  //   window.addEventListener("load", onLoad);
  //   return () => window.removeEventListener("load", onLoad);
  // }, []);

  return (<div className="App">{renderNotConnectedContainer()}</div>);

};

export default App;
