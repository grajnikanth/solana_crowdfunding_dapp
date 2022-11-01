import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { Crowdfunding } from "../target/types/crowdfunding";
import { Keypair, PublicKey, LAMPORTS_PER_SOL, 
  Connection, clusterApiUrl } 
  from '@solana/web3.js';
import { expect } from 'chai';

//const network = clusterApiUrl("localnet");
const opts = {
	preflightCommitment: "processed",
};

describe("crowdfunding", () => {

  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const connection = new Connection("http://localhost:8899", opts.preflightCommitment);

  const program = anchor.workspace.Crowdfunding as Program<Crowdfunding>;

  it("Campaign created", async () => {

    const [userPDA] = await PublicKey.
      findProgramAddress(
        [
          anchor.utils.bytes.utf8.encode("CAMPAIGN_DEMO"),
          provider.wallet.publicKey.toBuffer()
        ],
        program.programId);
    
    console.log("campaign PDA address created is ");
    console.log(userPDA.toString());

    await program.methods
        .create("First campaign", "Raise money for Banga")
        .accounts({
          user: provider.wallet.publicKey,
          campaign: userPDA
    })
    .rpc();

    let campaignAcct = await program.account.campaign.fetch(userPDA);

    console.log("Accounts after creation of new campaign")
    console.log("Campaign account from Blockchain is");
    console.log(campaignAcct);
    console.log(campaignAcct.admin.toString());    


    // donate money to the above campaign

    await program.methods
      .donate(new anchor.BN(0.2*LAMPORTS_PER_SOL))
      .accounts({
        sponsor: provider.wallet.publicKey,
        campaign: userPDA
      })
      .rpc();

    campaignAcct = await program.account.campaign.fetch(userPDA);

    console.log("accounts after donation of 0.2 SOL")
    console.log("Campaign account from Blockchain is");
    console.log(campaignAcct);
    console.log(campaignAcct.admin.toString());  

    let campaignAccountInfo = await connection.getAccountInfo(userPDA);
    console.log("Lamports in the campaign account is ", 
      campaignAccountInfo.lamports/LAMPORTS_PER_SOL);

    // withdraw money from the campaign

    await program.methods
      .withdraw(new anchor.BN(0.1*LAMPORTS_PER_SOL))
      .accounts({
        user: provider.wallet.publicKey,
        campaign: userPDA
      })
      .rpc();
    
    campaignAcct = await program.account.campaign.fetch(userPDA);

    console.log("Accounts after withdrawal of 0.1 SOL");
    console.log("Campaign account from Blockchain is");
    console.log(campaignAcct);
    console.log(campaignAcct.admin.toString());  

    campaignAccountInfo = await connection.getAccountInfo(userPDA);
    console.log("Lamports in the campaign account is ", 
      campaignAccountInfo.lamports/LAMPORTS_PER_SOL);

    // use wrong address to withdraw money - result in error
    const unAuthKeypair = Keypair.generate();

    await program.methods
      .withdraw(new anchor.BN(0.05*LAMPORTS_PER_SOL))
      .accounts({
        user: unAuthKeypair.publicKey,
        campaign: userPDA
      })
      .signers([unAuthKeypair])
      .rpc();

    // the above method should be errored in the smart contract as unAuthKeypair != campaign.admin

  });



});
