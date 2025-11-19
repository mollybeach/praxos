import hre from "hardhat";
import {
    ethers
} from "ethers";

/**
 * Mint Mock USDC to a specified address
 * Usage: npx hardhat run scripts/faucet/mintUSDC.mjs --network <network> --address <address> --amount <amount>
 */
async function main() {
    const network = hre.network.name;
    console.log(`\n🚰 Minting Mock USDC on ${network}...\n`);

    // Get deployer
    const [deployer] = await hre.ethers.getSigners();
    console.log(`👤 Deployer: ${deployer.address}`);

    // Get USDC address from environment or use default
    const usdcAddress = process.env.MOCK_USDC_ADDRESS;
    if (!usdcAddress) {
        throw new Error("MOCK_USDC_ADDRESS not set in .env file");
    }

    // Get recipient address from command line args or use deployer
    let recipientAddress = deployer.address;
    const addressArg = process.argv.find(arg => arg.startsWith("--address="));
    if (addressArg) {
        const addressValue = addressArg.split("=")[1];
        if (addressValue) {
            recipientAddress = addressValue;
        }
    }

    // Get amount from command line args or default to 1000 USDC
    let amount = 1000; // Default 1000 USDC
    const amountArg = process.argv.find(arg => arg.startsWith("--amount="));
    if (amountArg) {
        const amountValue = amountArg.split("=")[1];
        if (amountValue) {
            amount = parseFloat(amountValue);
        }
    }

    // USDC has 6 decimals
    const amountWei = ethers.parseUnits(amount.toString(), 6);

    console.log(`📝 Minting ${amount} USDC to: ${recipientAddress}`);
    console.log(`💰 Amount (wei): ${amountWei.toString()}\n`);

    // Get MockUSDC contract
    const MockUSDC = await hre.ethers.getContractAt("MockUSDC", usdcAddress, deployer);

    // Check current balance
    const balanceBefore = await MockUSDC.balanceOf(recipientAddress);
    console.log(`📊 Balance before: ${ethers.formatUnits(balanceBefore, 6)} USDC`);

    // Mint tokens
    console.log(`\n⏳ Minting...`);
    const tx = await MockUSDC.mint(recipientAddress, amountWei);
    console.log(`📝 Transaction hash: ${tx.hash}`);

    await tx.wait();
    console.log(`✅ Mint successful!\n`);

    // Check new balance
    const balanceAfter = await MockUSDC.balanceOf(recipientAddress);
    console.log(`📊 Balance after: ${ethers.formatUnits(balanceAfter, 6)} USDC`);
    console.log(`✨ Minted: ${ethers.formatUnits(balanceAfter - balanceBefore, 6)} USDC\n`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });