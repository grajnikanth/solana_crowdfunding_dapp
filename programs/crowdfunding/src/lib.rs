use anchor_lang::prelude::*;
use anchor_lang::solana_program::entrypoint::ProgramResult;

declare_id!("9a8Q4589kbV4yRPyMQVg4x47KqdgSkkzBkQfgidNWjcW");

/**
 *  This program will create a PDA account based on campaign struct to store the 
 *  funds sent to a crowdfunding campaign. Once the campaign is finished, the 
 *  assigned admin can withdraw the funds from the campaign to their wallet.
 * 
 *  The admin user publicKey is defined during creation of the account
 */

// When we create a new campaign account, the admin field needs the public key 
// Below we used an account to transfer the information about the admin 
// public key. Instead we could have sent the admin pubkey info as an argument
// to the create function. We don't need this to be an account at least in create
// function

// **withdraw function notes**

// check of the campaign.admin != *user.key can also be done using has_one in the 
// validation struct. Refactor later

// Rent::get()? will return the Rent struct unwrapped using the "?"
// Then apply the minimum_balance function on this struct to get rent
// exempt lamports needed for the size of data stored.
// to_account_info() function converts the account to AccountInfo struct - inside anchor_lang
// The AccountInfo struct as a data field in it which is a buffer the data_len() returns the 
// length of this buffer

// lamports field on AccountInfo is a Rc<RefCell<>> containing the
// value of lamports in this account which you can then borrow
// the value. because these are Rc and RefCell we need this borrow functions
// instead we can use the lamports() function on the AccountInfo for the
// getting a Result<> wrapped u64.

// lastly the lamports are deducted from the campaign account and added to the 
// user account which was set as the admin in the campaign account data

// In the withdraw function, make sure the campaign.acmount field is updated
// after lamports are transferred

// donate function notes
//  see detailed notes on the donate function in my google docs


#[program]
pub mod crowdfunding {
    use super::*;

    pub fn create(ctx: Context<Create>, name: String, description: String) -> ProgramResult {
        let campaign = &mut ctx.accounts.campaign;
        campaign.name = name;
        campaign.description = description;
        // amount_donated tracks the amount of money sent to the PDA account
        campaign.amount_donated = 0;
        // I think the ctx.accounts.user is referencing the "user" account sent by the client
        // and because this is a Solana account it is of type AccountInfo and will have "key" field
        // which is a reference to a publicKey of that account.
        // Since it is a reference the "*" is dereferencing it here. 
        // Essentially we are pulling out the publicKey of the "user" account in the code below
        campaign.admin = *ctx.accounts.user.key;
        // campaign.admin = ctx.accounts.user.key();
        Ok(())
    }

    pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> ProgramResult {
        let campaign = &mut ctx.accounts.campaign;
        let user = &mut ctx.accounts.user;

        if campaign.admin != *user.key {
            return Err(ProgramError::IncorrectProgramId);
        }

        let rent_balance = Rent::get()?.minimum_balance(campaign.to_account_info().data_len());

        if **campaign.to_account_info().lamports.borrow() - rent_balance < amount {
            return Err(ProgramError::InsufficientFunds);
        }

        **campaign.to_account_info().try_borrow_mut_lamports()? -= amount;
        **user.to_account_info().try_borrow_mut_lamports()? += amount; 
        Ok(())
    }

    pub fn donate(ctx: Context<Donate>, amount: u64) -> ProgramResult {
        let transfer_ix = anchor_lang::solana_program::system_instruction
            ::transfer(
                &ctx.accounts.sponsor.key(),
                &ctx.accounts.campaign.key(), 
                amount
            );
        
        anchor_lang::solana_program::program::invoke(
            &transfer_ix,
            &[
                ctx.accounts.sponsor.to_account_info(),
                ctx.accounts.campaign.to_account_info()
            ]
        )
    }


}

#[derive(Accounts)]
pub struct Create<'info> {
   #[account(init, payer=user, space=9000, seeds=[b"CAMPAIGN_DEMO".as_ref(), user.key().as_ref()],bump)]
   pub campaign: Account<'info, Campaign>,
   #[account(mut)]
   pub user: Signer<'info>,
   pub system_program: Program<'info, System>
}

#[account]
pub struct Campaign {
    pub admin: Pubkey,
    pub name: String,
    pub description: String,
    pub amount_donated: u64
}

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(mut)]
    pub campaign: Account<'info, Campaign>,
    #[account(mut)]
    pub user: Signer<'info>
}

#[derive(Accounts)]
pub struct Donate<'info> {
    #[account(mut)]
    pub campaign: Account<'info, Campaign>,
    #[account(mut)]
    pub sponsor: Signer<'info>
}