//path: scripts/deploy.mjs
import hre from "hardhat";
const {
    network,
    ethers
} = hre;
import fs from "fs";
import path from "path";
import {
    fileURLToPath
} from "url";

// -------------------- ABI & Contract Utilities --------------------
import {
    saveAbi
} from './abi/saveAbi.mjs';
import {
    cleanAbis
} from './abi/cleanAbi.mjs';

// -------------------- Print Deployment Info To Console --------------------
import {
    printDeployingContract,
    printExplorerContractLink,
    printSectionHeader,
    printStepHeader,
    printAddress,
    printSuccess,
    printInfo
} from './logs/console_logger.mjs';

// -------------------- Deployment History Logging --------------------
import {
    logDeploymentsHistory,
    saveFrontendContractsData,
    savePraxosAppContractsData
}
from './logs/data/data_logger.mjs';

// -------------------- Environment Variable Updater --------------------
import {
    updateEnvAddresses
} from './environment/envUpdater.mjs';

/**
 * Deploy Praxos Smart Contracts
 * 
 * This script deploys the complete Praxos system:
 * 1. Deploy PraxosFactory contract
 * 2. Deploy MockUSDC base asset
 * 3. Deploy MockERC3643 RWA tokens (Bond, Real Estate, Startup Fund)
 * 4. Create a demo vault with diversified allocations
 * 5. Save ABIs and log deployment data
 */

const __filename = fileURLToPath(
    import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
    // Get ethers from hardhat runtime environment
    const {
        ethers
    } = hre;

    // Configuration
    const CONFIG = {
        // RWA Token Configuration
        bondYield: 500, // 5% yield in basis points
        bondRiskTier: 2,
        realEstateYield: 700, // 7% yield in basis points
        realEstateRiskTier: 3,
        startupYield: 1500, // 15% yield in basis points
        startupRiskTier: 5,

        // Vault Configuration
        vaultName: "Balanced Diversified Vault",
        vaultSymbol: "BAL-VAULT",
        vaultStrategy: "balanced-diversified",
        vaultRiskTier: 3,
        vaultTargetDuration: 1095 * 24 * 60 * 60, // 3 years in seconds
        vaultWeights: [4000, 4000, 2000], // 40%, 40%, 20%
    };

    printSectionHeader("Deploying Praxos System");
    printInfo("🚀 Deploying Complete Praxos Vault System");

    // Get deployer
    const [deployer] = await ethers.getSigners();

    // Get network info
    const networkName = network.name;
    const chainId = (await ethers.provider.getNetwork()).chainId;
    printInfo(`📡 Deploying to network: ${networkName} (chainId: ${chainId})`);

    // Get explorer URL - default for Rayls devnet
    const explorerUrl = 'https://devnet-explorer.rayls.com';

    printAddress("👤 Deployer", deployer.address);
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log(`💰 Balance: ${ethers.formatEther(balance)} ETH`);
    console.log(`🔗 Explorer: ${explorerUrl}\n`);

    printInfo("📋 Deployment Configuration:");
    console.log(`   Bond Yield: ${CONFIG.bondYield / 100}%`);
    console.log(`   Real Estate Yield: ${CONFIG.realEstateYield / 100}%`);
    console.log(`   Startup Yield: ${CONFIG.startupYield / 100}%`);
    console.log(`   Vault Strategy: ${CONFIG.vaultStrategy}`);
    console.log(`   Vault Risk Tier: ${CONFIG.vaultRiskTier}`);
    console.log("");

    // Clean old ABIs
    try {
        cleanAbis();
    } catch (error) {
        console.warn("⚠️ Failed to clean ABIs:", error.message);
    }

    const deploymentResults = {};

    // ==================== STEP 1: Deploy Mock Infrastructure ====================
    printStepHeader("1️⃣ Deploying Mock Infrastructure Contracts");

    // Deploy CompliantStrategyAdapter
    printDeployingContract("CompliantStrategyAdapter");
    const CompliantStrategyAdapter = await ethers.getContractFactory("CompliantStrategyAdapter", deployer);
    const strategyAdapter = await CompliantStrategyAdapter.deploy();
    await strategyAdapter.waitForDeployment();
    const strategyAdapterAddress = await strategyAdapter.getAddress();
    printExplorerContractLink("CompliantStrategyAdapter", strategyAdapterAddress, explorerUrl);
    deploymentResults.strategyAdapter = strategyAdapterAddress;

    // Save ABI
    try {
        saveAbi("CompliantStrategyAdapter", CompliantStrategyAdapter);
    } catch (error) {
        console.warn("⚠️ Failed to save CompliantStrategyAdapter ABI:", error.message);
    }
    console.log("");

    // Deploy SimplePriceOracle
    printDeployingContract("SimplePriceOracle");
    const SimplePriceOracle = await ethers.getContractFactory("SimplePriceOracle", deployer);
    const priceOracle = await SimplePriceOracle.deploy();
    await priceOracle.waitForDeployment();
    const priceOracleAddress = await priceOracle.getAddress();
    printExplorerContractLink("SimplePriceOracle", priceOracleAddress, explorerUrl);
    deploymentResults.priceOracle = priceOracleAddress;

    // Save ABI
    try {
        saveAbi("SimplePriceOracle", SimplePriceOracle);
    } catch (error) {
        console.warn("⚠️ Failed to save SimplePriceOracle ABI:", error.message);
    }
    console.log("");

    // ==================== STEP 2: Deploy Base Asset ====================
    printStepHeader("2️⃣ Deploying MockUSDC Base Asset");

    printDeployingContract("PraxosFactory");
    const PraxosFactory = await ethers.getContractFactory("PraxosFactory", deployer);
    const factory = await PraxosFactory.deploy();
    await factory.waitForDeployment();
    const factoryAddress = await factory.getAddress();
    printExplorerContractLink("PraxosFactory", factoryAddress, explorerUrl);

    // Save Factory ABI
    try {
        saveAbi("PraxosFactory", PraxosFactory);
    } catch (error) {
        console.warn("⚠️ Failed to save Factory ABI:", error.message);
    }

    deploymentResults.factory = factoryAddress;
    console.log("");

    // ==================== STEP 2: Deploy Base Asset ====================
    printStepHeader("2️⃣ Deploying MockUSDC Base Asset");

    printDeployingContract("MockUSDC");
    const MockUSDC = await ethers.getContractFactory("MockUSDC", deployer);
    const usdc = await MockUSDC.deploy();
    await usdc.waitForDeployment();
    const usdcAddress = await usdc.getAddress();
    printExplorerContractLink("MockUSDC", usdcAddress, explorerUrl);

    // Save MockUSDC ABI
    try {
        saveAbi("MockUSDC", MockUSDC);
    } catch (error) {
        console.warn("⚠️ Failed to save MockUSDC ABI:", error.message);
    }

    deploymentResults.baseAsset = usdcAddress;
    console.log("");

    // Deploy SimpleDividendDistributor (needs USDC address)
    printDeployingContract("SimpleDividendDistributor");
    const SimpleDividendDistributor = await ethers.getContractFactory("SimpleDividendDistributor", deployer);
    const dividendDistributor = await SimpleDividendDistributor.deploy(usdcAddress);
    await dividendDistributor.waitForDeployment();
    const dividendDistributorAddress = await dividendDistributor.getAddress();
    printExplorerContractLink("SimpleDividendDistributor", dividendDistributorAddress, explorerUrl);
    deploymentResults.dividendDistributor = dividendDistributorAddress;

    // Save ABI
    try {
        saveAbi("SimpleDividendDistributor", SimpleDividendDistributor);
    } catch (error) {
        console.warn("⚠️ Failed to save SimpleDividendDistributor ABI:", error.message);
    }
    console.log("");

    // ==================== STEP 4: Deploy RWA Tokens ====================
    printStepHeader("4️⃣ Deploying MockERC3643 RWA Tokens");

    const MockERC3643 = await ethers.getContractFactory("MockERC3643", deployer);
    const rwaTokens = {};

    // Deploy Bond RWA
    printDeployingContract("Corporate Bond Alpha");
    const oneYearFromNow = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60;
    const bond = await MockERC3643.deploy(
        "Corporate Bond Alpha",
        "BOND-ALPHA",
        "corporate-bond",
        oneYearFromNow,
        CONFIG.bondYield,
        CONFIG.bondRiskTier,
        ethers.parseEther("1000000")
    );
    await bond.waitForDeployment();
    const bondAddress = await bond.getAddress();
    printExplorerContractLink("Corporate Bond Alpha", bondAddress, explorerUrl);
    rwaTokens.bond = bondAddress;

    // Deploy Real Estate RWA
    printDeployingContract("Real Estate Fund Beta");
    const fiveYearsFromNow = Math.floor(Date.now() / 1000) + 1825 * 24 * 60 * 60;
    const realEstate = await MockERC3643.deploy(
        "Real Estate Fund Beta",
        "RE-BETA",
        "real-estate",
        fiveYearsFromNow,
        CONFIG.realEstateYield,
        CONFIG.realEstateRiskTier,
        ethers.parseEther("1000000")
    );
    await realEstate.waitForDeployment();
    const realEstateAddress = await realEstate.getAddress();
    printExplorerContractLink("Real Estate Fund Beta", realEstateAddress, explorerUrl);
    rwaTokens.realEstate = realEstateAddress;

    // Deploy Startup Fund RWA
    printDeployingContract("Startup Fund Gamma");
    const startup = await MockERC3643.deploy(
        "Startup Fund Gamma",
        "STARTUP-GAMMA",
        "startup-fund",
        0, // No maturity
        CONFIG.startupYield,
        CONFIG.startupRiskTier,
        ethers.parseEther("1000000")
    );
    await startup.waitForDeployment();
    const startupAddress = await startup.getAddress();
    printExplorerContractLink("Startup Fund Gamma", startupAddress, explorerUrl);
    rwaTokens.startup = startupAddress;

    // Save MockERC3643 ABI
    try {
        saveAbi("MockERC3643", MockERC3643);
    } catch (error) {
        console.warn("⚠️ Failed to save MockERC3643 ABI:", error.message);
    }

    deploymentResults.rwaTokens = rwaTokens;
    console.log("");

    // Set prices for RWA tokens in the oracle (1:1 for demo, in 18 decimals)
    printInfo("Setting RWA token prices in oracle...");
    const oneEther = ethers.parseEther("1"); // 1e18
    await priceOracle.updatePrice(bondAddress, oneEther);
    await priceOracle.updatePrice(realEstateAddress, oneEther);
    await priceOracle.updatePrice(startupAddress, oneEther);
    console.log("✅ Prices set to 1:1 (1 USDC = 1 RWA token unit)\n");

    // ==================== STEP 5: Deploy Compliant Factory ====================
    printStepHeader("5️⃣ Deploying PraxosFactoryCompliant");

    printDeployingContract("PraxosFactoryCompliant");
    const PraxosFactoryCompliant = await ethers.getContractFactory("PraxosFactoryCompliant", deployer);
    const factoryCompliant = await PraxosFactoryCompliant.deploy(strategyAdapterAddress, priceOracleAddress);
    await factoryCompliant.waitForDeployment();
    const factoryCompliantAddress = await factoryCompliant.getAddress();
    printExplorerContractLink("PraxosFactoryCompliant", factoryCompliantAddress, explorerUrl);
    deploymentResults.factoryCompliant = factoryCompliantAddress;

    // Save ABI
    try {
        saveAbi("PraxosFactoryCompliant", PraxosFactoryCompliant);
    } catch (error) {
        console.warn("⚠️ Failed to save PraxosFactoryCompliant ABI:", error.message);
    }
    console.log("");

    // Note: We'll whitelist vaults after creation using the deployer account
    // Ownership transfer to factory can be done later if needed for production
    // For now, we keep ownership with deployer to allow whitelisting
    console.log("✅ Adapter ready for vault whitelisting\n");

    // ==================== STEP 6: Create Demo Vault (Original) ====================
    printStepHeader("6️⃣ Creating Demo Vault (Original)");

    const assets = [bondAddress, realEstateAddress, startupAddress];
    const weights = CONFIG.vaultWeights;

    const vaultConfig = {
        baseAsset: usdcAddress,
        name: CONFIG.vaultName,
        symbol: CONFIG.vaultSymbol,
        strategy: CONFIG.vaultStrategy,
        riskTier: CONFIG.vaultRiskTier,
        targetDuration: CONFIG.vaultTargetDuration,
        assets: assets,
        weights: weights,
    };

    console.log("📋 Vault Configuration:");
    console.log(`   Name: ${CONFIG.vaultName}`);
    console.log(`   Strategy: ${CONFIG.vaultStrategy}`);
    console.log(`   Risk Tier: ${CONFIG.vaultRiskTier}`);
    console.log(`   Assets: ${assets.length}`);
    console.log(`   Weights: ${weights.map(w => w/100 + '%').join(', ')}`);

    printDeployingContract("Demo Vault");
    const tx = await factory.createVault(vaultConfig);
    const receipt = await tx.wait();

    // Get vault address from event
    const event = receipt.logs.find(
        (log) => log.topics[0] === ethers.id("VaultCreated(address,address,string,uint8)")
    );

    if (!event) {
        throw new Error("VaultCreated event not found in transaction receipt");
    }

    const vaultAddress = ethers.getAddress("0x" + event.topics[1].slice(-40));
    printExplorerContractLink("Demo Vault", vaultAddress, explorerUrl);

    // Get vault contract to save ABI
    const PraxosVault = await ethers.getContractFactory("PraxosVault", deployer);
    try {
        saveAbi("PraxosVault", PraxosVault);
    } catch (error) {
        console.warn("⚠️ Failed to save PraxosVault ABI:", error.message);
    }

    deploymentResults.vault = vaultAddress;
    console.log("");

    // ==================== STEP 7: Create Compliant Demo Vault ====================
    printStepHeader("7️⃣ Creating Compliant Demo Vault");

    // Whitelist the factory-compliant for creating vaults (we'll whitelist the vault after creation)
    // For now, we'll create the vault and then whitelist it

    const compliantVaultConfig = {
        baseAsset: usdcAddress,
        name: "Compliant " + CONFIG.vaultName,
        symbol: "COMP-" + CONFIG.vaultSymbol,
        strategy: CONFIG.vaultStrategy,
        riskTier: CONFIG.vaultRiskTier,
        targetDuration: CONFIG.vaultTargetDuration,
        assets: assets,
        weights: weights,
        dividendDistributors: [dividendDistributorAddress, dividendDistributorAddress, dividendDistributorAddress], // One per asset
    };

    console.log("📋 Compliant Vault Configuration:");
    console.log(`   Name: ${compliantVaultConfig.name}`);
    console.log(`   Strategy: ${compliantVaultConfig.strategy}`);
    console.log(`   Risk Tier: ${compliantVaultConfig.riskTier}`);
    console.log(`   Assets: ${assets.length}`);
    console.log(`   Weights: ${weights.map(w => w/100 + '%').join(', ')}`);

    // Note: The vault's addAsset function allows the owner (factory) to add assets
    // during initialization without whitelisting. After creation, we'll whitelist
    // the vault properly for future operations.

    printDeployingContract("Compliant Demo Vault");
    const compliantTx = await factoryCompliant.createVault(compliantVaultConfig);
    const compliantReceipt = await compliantTx.wait();

    // Get vault address from event
    const compliantEvent = compliantReceipt.logs.find(
        (log) => log.topics[0] === ethers.id("VaultCreated(address,address,string,uint8)")
    );

    if (!compliantEvent) {
        throw new Error("VaultCreated event not found in compliant vault transaction receipt");
    }

    const compliantVaultAddress = ethers.getAddress("0x" + compliantEvent.topics[1].slice(-40));
    printExplorerContractLink("Compliant Demo Vault", compliantVaultAddress, explorerUrl);
    deploymentResults.vaultCompliant = compliantVaultAddress;

    // Get vault contract to save ABI
    const PraxosVaultCompliant = await ethers.getContractFactory("PraxosVaultCompliant", deployer);
    try {
        saveAbi("PraxosVaultCompliant", PraxosVaultCompliant);
    } catch (error) {
        console.warn("⚠️ Failed to save PraxosVaultCompliant ABI:", error.message);
    }

    // Whitelist the compliant vault for all RWA tokens
    // This is needed for future operations (the factory bypassed the check during creation)
    // Note: The vault's addAsset function allows the owner (factory) to add assets
    // during initialization without whitelisting, but we whitelist it now for future use
    printInfo("Whitelisting compliant vault for RWA tokens...");
    try {
        for (const rwaAddress of assets) {
            await strategyAdapter.whitelistVault(rwaAddress, compliantVaultAddress);
        }
        console.log("✅ Compliant vault whitelisted for all RWA tokens\n");
    } catch (error) {
        console.warn("⚠️ Failed to whitelist vault (may already be whitelisted or ownership issue):", error.message);
        console.log("   Continuing with deployment...\n");
    }

    // ==================== STEP 8: Deploy Rewards Module (Optional) ====================
    printStepHeader("8️⃣ Deploying Rewards Module (Optional)");

    printDeployingContract("RewardsModule");
    const RewardsModule = await ethers.getContractFactory("RewardsModule", deployer);
    // Note: vaultShares will be the compliant vault address (it's an ERC20)
    const rewardsModule = await RewardsModule.deploy(usdcAddress, compliantVaultAddress);
    await rewardsModule.waitForDeployment();
    const rewardsModuleAddress = await rewardsModule.getAddress();
    printExplorerContractLink("RewardsModule", rewardsModuleAddress, explorerUrl);
    deploymentResults.rewardsModule = rewardsModuleAddress;

    // Save ABI
    try {
        saveAbi("RewardsModule", RewardsModule);
    } catch (error) {
        console.warn("⚠️ Failed to save RewardsModule ABI:", error.message);
    }

    // Set rewards module on the compliant vault (optional - skip if factory owns the vault)
    try {
        const compliantVault = await ethers.getContractAt("PraxosVaultCompliant", compliantVaultAddress, deployer);
        const vaultOwner = await compliantVault.owner();

        // If factory owns the vault, we can't set it directly (would need factory to have a function for this)
        if (vaultOwner.toLowerCase() === factoryCompliantAddress.toLowerCase()) {
            console.log("⚠️  Vault is owned by factory, skipping rewards module setup");
            console.log(`   Rewards module deployed at: ${rewardsModuleAddress}`);
            console.log("   (Can be set later by transferring vault ownership or adding factory function)\n");
        } else if (vaultOwner.toLowerCase() === deployer.address.toLowerCase()) {
            // Deployer owns the vault directly
            await compliantVault.setRewardsModule(rewardsModuleAddress);
            console.log("✅ Rewards module set on compliant vault\n");
        } else {
            console.log(`⚠️  Vault ownership is ${vaultOwner}, deployer cannot set rewards module`);
            console.log(`   Rewards module deployed at: ${rewardsModuleAddress}`);
            console.log("   (Rewards module can be set later by the vault owner)\n");
        }
    } catch (error) {
        console.warn("⚠️  Failed to set rewards module on compliant vault:", error.message);
        console.log(`   Rewards module deployed at: ${rewardsModuleAddress}`);
        console.log("   (This is optional - rewards module can be set later by the vault owner)\n");
    }

    // ==================== STEP 9: Log Deployment Data ====================
    printStepHeader("9️⃣ Logging Deployment Data");

    // Get PraxosVault factory for ABI extraction (if not already available)
    const PraxosVaultFactory = await ethers.getContractFactory("PraxosVault", deployer);

    // Extract ABIs - ethers v6 uses interface.formatJson() or interface.fragments
    const getAbi = (contractFactory) => {
        try {
            // In ethers v6, interface.formatJson() returns the ABI as JSON string
            // We can also use interface.fragments to get the fragments
            return JSON.parse(contractFactory.interface.formatJson());
        } catch (error) {
            // Fallback: try to get from fragments
            try {
                return contractFactory.interface.fragments.map(f => f.format("json")).map(j => JSON.parse(j));
            } catch (e) {
                console.warn(`⚠️ Could not extract ABI: ${error.message}`);
                return [];
            }
        }
    };

    const deploymentData = {
        deploymentId: Date.now().toString(),
        deployedBy: deployer.address,
        networkName,
        chainId: chainId.toString(),
        explorerUrl,
        deployedAt: new Date().toISOString(),
        deploymentType: 'PRAXOS_VAULT_SYSTEM',
        contracts: {
            PraxosFactory: {
                name: 'PraxosFactory',
                address: factoryAddress,
                explorerUrl: `${explorerUrl}/address/${factoryAddress}`,
                abiRaw: getAbi(PraxosFactory),
            },
            PraxosFactoryCompliant: {
                name: 'PraxosFactoryCompliant',
                address: factoryCompliantAddress,
                explorerUrl: `${explorerUrl}/address/${factoryCompliantAddress}`,
                abiRaw: getAbi(PraxosFactoryCompliant),
            },
            CompliantStrategyAdapter: {
                name: 'CompliantStrategyAdapter',
                address: strategyAdapterAddress,
                explorerUrl: `${explorerUrl}/address/${strategyAdapterAddress}`,
                abiRaw: getAbi(CompliantStrategyAdapter),
            },
            SimplePriceOracle: {
                name: 'SimplePriceOracle',
                address: priceOracleAddress,
                explorerUrl: `${explorerUrl}/address/${priceOracleAddress}`,
                abiRaw: getAbi(SimplePriceOracle),
            },
            SimpleDividendDistributor: {
                name: 'SimpleDividendDistributor',
                address: dividendDistributorAddress,
                explorerUrl: `${explorerUrl}/address/${dividendDistributorAddress}`,
                abiRaw: getAbi(SimpleDividendDistributor),
            },
            RewardsModule: {
                name: 'RewardsModule',
                address: rewardsModuleAddress,
                explorerUrl: `${explorerUrl}/address/${rewardsModuleAddress}`,
                abiRaw: getAbi(RewardsModule),
            },
            MockUSDC: {
                name: 'MockUSDC',
                address: usdcAddress,
                explorerUrl: `${explorerUrl}/address/${usdcAddress}`,
                abiRaw: getAbi(MockUSDC),
            },
            CorporateBondAlpha: {
                name: 'Corporate Bond Alpha',
                address: bondAddress,
                explorerUrl: `${explorerUrl}/address/${bondAddress}`,
                abiRaw: getAbi(MockERC3643),
            },
            RealEstateFundBeta: {
                name: 'Real Estate Fund Beta',
                address: realEstateAddress,
                explorerUrl: `${explorerUrl}/address/${realEstateAddress}`,
                abiRaw: getAbi(MockERC3643),
            },
            StartupFundGamma: {
                name: 'Startup Fund Gamma',
                address: startupAddress,
                explorerUrl: `${explorerUrl}/address/${startupAddress}`,
                abiRaw: getAbi(MockERC3643),
            },
            DemoVault: {
                name: CONFIG.vaultName,
                address: vaultAddress,
                explorerUrl: `${explorerUrl}/address/${vaultAddress}`,
                abiRaw: getAbi(PraxosVaultFactory),
            },
            DemoVaultCompliant: {
                name: compliantVaultConfig.name,
                address: compliantVaultAddress,
                explorerUrl: `${explorerUrl}/address/${compliantVaultAddress}`,
                abiRaw: getAbi(PraxosVaultCompliant),
            },
        },
        configuration: {
            vaultStrategy: CONFIG.vaultStrategy,
            vaultRiskTier: CONFIG.vaultRiskTier,
            vaultTargetDuration: CONFIG.vaultTargetDuration,
            vaultWeights: CONFIG.vaultWeights,
            bondYield: CONFIG.bondYield,
            realEstateYield: CONFIG.realEstateYield,
            startupYield: CONFIG.startupYield,
        },
    };

    // Log deployment data
    try {
        logDeploymentsHistory(deploymentData);
        console.log("📊 Deployment data logged successfully");
    } catch (error) {
        console.warn("⚠️ Failed to log deployment data:", error.message);
    }

    // Save to frontend contracts_data.json
    try {
        saveFrontendContractsData(deploymentData);
        savePraxosAppContractsData(deploymentData);
        console.log("📊 Frontend contracts data saved successfully");
    } catch (error) {
        console.warn("⚠️ Failed to save frontend contracts data:", error.message);
    }

    console.log("");

    // ==================== STEP 10: Print Summary ====================
    printSectionHeader("🎉 Deployment Complete!");

    console.log("📋 Contract Addresses:");
    console.log("=====================");
    printAddress("🏭 PraxosFactory", factoryAddress);
    printAddress("🏭 PraxosFactoryCompliant", factoryCompliantAddress);
    printAddress("🔐 CompliantStrategyAdapter", strategyAdapterAddress);
    printAddress("📊 SimplePriceOracle", priceOracleAddress);
    printAddress("💰 SimpleDividendDistributor", dividendDistributorAddress);
    printAddress("🎁 RewardsModule", rewardsModuleAddress);
    printAddress("💵 MockUSDC", usdcAddress);
    printAddress("📈 Corporate Bond Alpha", bondAddress);
    printAddress("🏘️  Real Estate Fund Beta", realEstateAddress);
    printAddress("🚀 Startup Fund Gamma", startupAddress);
    printAddress("🏦 Demo Vault", vaultAddress);
    printAddress("🏦 Demo Vault Compliant", compliantVaultAddress);
    console.log("");

    console.log("🔗 Explorer Links:");
    console.log("=================");
    console.log(`   PraxosFactory: ${explorerUrl}/address/${factoryAddress}`);
    console.log(`   PraxosFactoryCompliant: ${explorerUrl}/address/${factoryCompliantAddress}`);
    console.log(`   CompliantStrategyAdapter: ${explorerUrl}/address/${strategyAdapterAddress}`);
    console.log(`   SimplePriceOracle: ${explorerUrl}/address/${priceOracleAddress}`);
    console.log(`   SimpleDividendDistributor: ${explorerUrl}/address/${dividendDistributorAddress}`);
    console.log(`   RewardsModule: ${explorerUrl}/address/${rewardsModuleAddress}`);
    console.log(`   MockUSDC: ${explorerUrl}/address/${usdcAddress}`);
    console.log(`   Corporate Bond Alpha: ${explorerUrl}/address/${bondAddress}`);
    console.log(`   Real Estate Fund Beta: ${explorerUrl}/address/${realEstateAddress}`);
    console.log(`   Startup Fund Gamma: ${explorerUrl}/address/${startupAddress}`);
    console.log(`   Demo Vault: ${explorerUrl}/address/${vaultAddress}`);
    console.log(`   Demo Vault Compliant: ${explorerUrl}/address/${compliantVaultAddress}`);
    console.log("");

    console.log("📋 Next Steps:");
    console.log("==============");
    console.log("1. Verify contracts on block explorer");
    console.log("2. Test vault creation and deposits");
    console.log("3. Test RWA token interactions");
    console.log("4. Update frontend with new contract addresses");
    console.log("");

    printSuccess("Complete Praxos Vault System deployed successfully!");

    // ==================== STEP 11: Update Environment Variables ====================
    printStepHeader("1️⃣1️⃣ Updating Environment Variables");

    const envAddresses = {
        PRAXOS_FACTORY_ADDRESS: factoryAddress,
        PRAXOS_FACTORY_COMPLIANT_ADDRESS: factoryCompliantAddress,
        COMPLIANT_STRATEGY_ADAPTER_ADDRESS: strategyAdapterAddress,
        SIMPLE_PRICE_ORACLE_ADDRESS: priceOracleAddress,
        SIMPLE_DIVIDEND_DISTRIBUTOR_ADDRESS: dividendDistributorAddress,
        REWARDS_MODULE_ADDRESS: rewardsModuleAddress,
        MOCK_USDC_ADDRESS: usdcAddress,
        MOCK_ERC3643_CORPORATE_BOND_ALPHA_ADDRESS: bondAddress,
        MOCK_ERC3643_REAL_ESTATE_BETA_ADDRESS: realEstateAddress,
        MOCK_ERC3643_STARTUP_FUND_GAMMA_ADDRESS: startupAddress,
        PRAXOS_VAULT_ADDRESS: vaultAddress,
        PRAXOS_VAULT_COMPLIANT_ADDRESS: compliantVaultAddress,
    };

    try {
        updateEnvAddresses(envAddresses, false); // Update .env only, not .env.example
        console.log("");
    } catch (error) {
        console.warn("⚠️ Failed to update environment variables:", error.message);
        console.log("");
    }

    return deploymentResults;
}

// Execute deployment
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("💥 Deployment failed:", error);
        process.exit(1);
    });

export default main;