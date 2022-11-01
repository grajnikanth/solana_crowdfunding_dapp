# solana_crowdfunding_dapp

Solana Blockchain based dapp with fully working frontend to create crowdfunding campaigns
and donate money(SOL) to them and withdraw money(SOL). Dapp frontend will interact with Phantom
wallet extension to send transactions to the smart contract. The code was created following the 
Udemy tutorial on Solana Blockchain development.

# commands
In the main folder run

anchor build

get the program address using the command

solana address -k ./target/deploy/crowdfunding-keypair.json

update the program address in anchor.toml and in lib.rs file, do 

anchor build

anchor deploy

run tests using, change anchor.toml cluster to "localnet" for tests. Change back the 
cluster to "devnet" when using the dapp frontend

anchor test

move to frontend folder and run 

npm start 

to start the react frontend to use dapp with phantom wallet.

My deployed devnet smartcontract address is 

9a8Q4589kbV4yRPyMQVg4x47KqdgSkkzBkQfgidNWjcW
