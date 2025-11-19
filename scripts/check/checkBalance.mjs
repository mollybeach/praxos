//path: scripts/check/checkBalance.mjs
import hre from "hardhat";
const {
    ethers
} = hre;
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

/**
 * Check USDgas (USDr) Balance on Rayls Network
 * 
 * This script checks the native USDgas balance for a wallet address
 * specified in the WALLET_ADDRESS environment variable.
 */

async function main() {
    // Get wallet address from environment variable
    const walletAddress = process.env.WALLET_ADDRESS;

    if (!walletAddress) {
        console.error("❌ Error: WALLET_ADDRESS environment variable is not set");
        console.error("   Please set WALLET_ADDRESS in your .env file or export it:");
        console.error("   export WALLET_ADDRESS=0xYourWalletAddress");
        process.exit(1);
    }

    // Validate address format
    if (!ethers.isAddress(walletAddress)) {
        console.error(`❌ Error: Invalid wallet address format: ${walletAddress}`);
        process.exit(1);
    }

    // Get network info
    const networkName = hre.network.name;
    const chainId = (await ethers.provider.getNetwork()).chainId;

    console.log("\n=== Checking USDgas (USDr) Balance ===");
    console.log(`📡 Network: ${networkName} (Chain ID: ${chainId})`);
    console.log(`👤 Wallet: ${walletAddress}`);

    // Get balance
    try {
        const balance = await ethers.provider.getBalance(walletAddress);
        const balanceFormatted = ethers.formatEther(balance);

        console.log(`\n💰 Balance: ${balanceFormatted} USDr`);

        // Also show in wei for precision
        console.log(`   (${balance.toString()} wei)`);

        // Show explorer link if on Rayls devnet
        if (chainId === 123123n || networkName === "rayls_devnet") {
            const explorerUrl = "https://devnet-explorer.rayls.com";
            console.log(`\n🔗 Explorer: ${explorerUrl}/address/${walletAddress}`);
        }

        console.log("\n✅ Balance check complete!\n");

    } catch (error) {
        console.error("❌ Error fetching balance:", error.message);
        process.exit(1);
    }
}

// Execute balance check
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("💥 Balance check failed:", error);
        process.exit(1);
    });

export default main;