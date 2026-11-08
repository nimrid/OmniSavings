use {
    anchor_lang::{
        prelude::Pubkey,
        solana_program::{instruction::Instruction, system_program},
        AccountDeserialize, InstructionData, ToAccountMetas,
    },
    litesvm::LiteSVM,
    solana_keypair::Keypair,
    solana_message::{Message, VersionedMessage},
    solana_signer::Signer,
    solana_transaction::versioned::VersionedTransaction,
};

#[test]
fn test_initialize_user_savings() {
    let program_id = onchain::id();
    let payer = Keypair::new();
    let mint = Pubkey::new_unique();
    let (user_savings, _) = Pubkey::find_program_address(
        &[
            onchain::constants::USER_SAVINGS_SEED,
            payer.pubkey().as_ref(),
            mint.as_ref(),
        ],
        &program_id,
    );
    let mut svm = LiteSVM::new();
    let bytes = include_bytes!(concat!(
        env!("CARGO_TARGET_TMPDIR"),
        "/../deploy/onchain.so"
    ));
    svm.add_program(program_id, bytes).unwrap();
    svm.airdrop(&payer.pubkey(), 1_000_000_000).unwrap();

    let target_goal: u64 = 5_000_000_000;
    let instruction = Instruction::new_with_bytes(
        program_id,
        &onchain::instruction::InitializeUserSavings {
            savings_goal: target_goal,
        }
        .data(),
        onchain::accounts::InitializeUser {
            signer: payer.pubkey(),
            mint,
            user_savings,
            system_program: system_program::ID,
        }
        .to_account_metas(None),
    );

    let blockhash = svm.latest_blockhash();
    let msg = Message::new_with_blockhash(&[instruction], Some(&payer.pubkey()), &blockhash);
    let tx = VersionedTransaction::try_new(VersionedMessage::Legacy(msg), &[&payer]).unwrap();

    let res = svm.send_transaction(tx);
    assert!(res.is_ok(), "Failed to send initialize transaction: {:?}", res);

    let savings_account = svm.get_account(&user_savings).unwrap();
    let mut data: &[u8] = &savings_account.data;
    let state = onchain::state::UserSavings::try_deserialize(&mut data).unwrap();
    assert_eq!(state.owner, payer.pubkey());
    assert_eq!(state.asset_mint, mint);
    assert_eq!(state.total_deposited, 0);
    assert_eq!(state.savings_goal, target_goal);
}
