import "./App.css";
import {Connection, clusterApiUrl, PublicKey} from "@solana/web3.js";

import {useEffect, useState} from "react";
import { 
    AnchorProvider, 
    Program, 
    utils,
    web3,
    BN
} from "@project-serum/anchor";
import idl from "./idl.json";
import {Buffer} from "buffer";

window.Buffer = Buffer;
const network = clusterApiUrl("devnet");
// wait till transaction is processed by the validator netowrk
const opts = {
    preflightCommitment: "processed"
};
const programID = new PublicKey(idl.metadata.address);
const {SystemProgram} = web3;

const AppLearn = () => {
    const [walletAddress, setWalletAddress] = useState(null);
    const [campaigns, setCampaigns] = useState([]);

    const checkIfWalletIsConnected = async () => {
        try {
            const {solana} = window;
            if(solana) {
                if(solana.isPhantom) {
                    console.log("Phantom wallet found");
                    const phantomConnection = await solana.connect({
                        onlyIfTrusted: true,
                    });
                    console.log(
                        "Connected to Phantom wallet pubkey ",
                        phantomConnection.publicKey.toString()
                    );
                }
            } else {
                alert("Solana object not found. Install Phantom wallet");
            }
        } catch(error) {
            console.error(error);
        }
    };

    const getProvider = () => {
        const connection = new Connection(network, opts.preflightCommitment);
        const provider = new AnchorProvider(
            connection,
            window.solana,
            opts.preflightCommitment
        );
        return provider;
    }

    const connectWallet = async () => {
        const {solana} = window;
        if(solana) {
            const phantomConnection = await solana.connect();
            console.log(
                "Connected to Phantom wallet pubkey ",
                phantomConnection.publicKey.toString()
            );
            setWalletAddress(phantomConnection.publicKey.toString());
        }
    };

    const createCampaign = async () => {
        try {
            const provider = getProvider();
            const program = new Program(idl, programID, provider);
            const [campaign] = await PublicKey.findProgramAddress(
                [
                    utils.bytes.utf8.encode("CAMPAIGN_DEMO"),
                    provider.wallet.publicKey.toBuffer(),
                ],
                program.programId
            );

            await program.rpc.create("First campaign", "Test crowdfunding", {
                accounts: {
                    campaign,
                    user: provider.wallet.publicKey,
                    systemProgram: SystemProgram.programId,
                }
            });

            console.log(
                "Created new campaign with address: ", 
                campaign.toString()
            );

        } catch(error) {
            console.error("Error creating a campaign ", error);
        }
    }

    const getCampaigns = async () => {
        const connection = new Connection(network, opts.preflightCommitment);
        const provider = getProvider();
        const program = new Program(idl, programID, provider);

        Promise.all(
            (await connection.getProgramAccounts(programID)).map(
                async (campaign) => ({
                    ...(await program.account.campaign.fetch(campaign.pubkey)),
                    pubkey: campaign.pubkey
                })
            )
        ).then((campaigns) => setCampaigns(campaigns));
    }

    const renderNotConnectedContainer = () => (
        <button onClick={connectWallet}>Connect to Wallet</button>
    );

    const donate = async (campaignAcct) => {
        try {
            const provider = getProvider();
            const program = new Program(idl, programID, provider);

            await program.rpc.donate(new BN(0.2 * web3.LAMPORTS_PER_SOL), {
                accounts: {
                    campaign: campaignAcct,
                    sponsor: provider.wallet.publicKey,
                    systemProgram: SystemProgram.programId,
                },
            });

            console.log("Donated some money to ", campaignAcct.toString());
            // update the state to track the changes to the account data due to 
            // donate function call above
            getCampaigns();

        } catch(error) {
            console.error("Error donating: ", error);
        }
    };

    const withdraw = async (campaignAcct) => {
        try {
            const provider = getProvider();
            const program = new Program(idl, programID, provider);
            await program.rpc.withdraw(new BN(0.2 * web3.LAMPORTS_PER_SOL), {
                accounts: {
                    campaign: campaignAcct,
                    user: provider.wallet.publicKey
                }
            });
            console.log("Withdraw some money from: ", campaignAcct.toString());
        } catch (error) {
            console.error("Error withdrawing: ", error);
        }
    };

    const renderConnectedContainer = () => (
        <>
            <button onClick={createCampaign}>Create a campaign</button>
            <button onClick={getCampaigns}>Get a list of campaigns</button>
            <br />
            {campaigns.map((campaign) => (
                <>
                    <p>Campaign ID: {campaign.pubkey.toString()}</p>
                    <p>
                        Balance: {" "}
                        {(campaign.amountDonated/web3.LAMPORTS_PER_SOL).toString()}
                    </p>
                    <p>{campaign.name}</p>
                    <p>{campaign.description}</p>
                    <p>Campaign admin account is</p>
                    <p>{campaign.admin.toString()}</p>
                    <button onClick={() => donate(campaign.pubkey)}>Click to Donate</button>
                    <button onClick={() => withdraw(campaign.pubkey)}> Click to Withdraw</button>    
                    <br />
                </>
            ))}
        </>
    );

    useEffect(() => {
        const onLoad = async () => {
            await checkIfWalletIsConnected();
        };
        window.addEventListener("load", onLoad);
        return () => window.removeEventListener("load", onLoad);
    },[]);

    return (
        <div className="App">
            {!walletAddress && renderNotConnectedContainer()}
            {walletAddress && renderConnectedContainer()}
        </div>
    );

};

export default AppLearn;