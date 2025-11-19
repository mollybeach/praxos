const hre = require("hardhat");

async function main() {
    const [deployer] = await hre.ethers.getSigners();

    console.log("Deploying Praxos to Rayls Devnet...");
    console.log("Deployer:", deployer.address);
    console.log("Account balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString());

    // Deploy factory
    const PraxosFactory = await hre.ethers.getContractFactory("PraxosFactory");
    const factory = await PraxosFactory.deploy();
    await factory.waitForDeployment();
    console.log("Factory deployed at:", await factory.getAddress());

    // Deploy base asset
    const MockUSDC = await hre.ethers.getContractFactory("MockUSDC");
    const usdc = await MockUSDC.deploy();
    await usdc.waitForDeployment();
    console.log("Base asset (USDC) deployed at:", await usdc.getAddress());

    // Deploy mock RWA tokens for demo
    const MockERC3643 = await hre.ethers.getContractFactory("MockERC3643");

    const oneYearFromNow = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60;
    const bond = await MockERC3643.deploy(
        "Corporate Bond Alpha",
        "BOND-ALPHA",
        "corporate-bond",
        oneYearFromNow,
        500, // 5% yield
        2, // Risk tier 2
        hre.ethers.parseEther("1000000")
    );
    await bond.waitForDeployment();
    console.log("Bond RWA deployed at:", await bond.getAddress());

    const fiveYearsFromNow = Math.floor(Date.now() / 1000) + 1825 * 24 * 60 * 60;
    const realEstate = await MockERC3643.deploy(
        "Real Estate Fund Beta",
        "RE-BETA",
        "real-estate",
        fiveYearsFromNow,
        700, // 7% yield
        3, // Risk tier 3
        hre.ethers.parseEther("1000000")
    );
    await realEstate.waitForDeployment();
    console.log("Real Estate RWA deployed at:", await realEstate.getAddress());

    const startup = await MockERC3643.deploy(
        "Startup Fund Gamma",
        "STARTUP-GAMMA",
        "startup-fund",
        0, // No maturity
        1500, // 15% yield
        5, // Risk tier 5
        hre.ethers.parseEther("1000000")
    );
    await startup.waitForDeployment();
    console.log("Startup Fund RWA deployed at:", await startup.getAddress());

    // Create a demo vault
    const assets = [
        await bond.getAddress(),
        await realEstate.getAddress(),
        await startup.getAddress(),
    ];

    const weights = [4000, 4000, 2000]; // 40%, 40%, 20%

    const config = {
        baseAsset: await usdc.getAddress(),
        name: "Balanced Diversified Vault",
        symbol: "BAL-VAULT",
        strategy: "balanced-diversified",
        riskTier: 3,
        targetDuration: 1095 * 24 * 60 * 60, // 3 years in seconds
        assets: assets,
        weights: weights,
    };

    const tx = await factory.createVault(config);
    const receipt = await tx.wait();

    // Get vault address from event
    const event = receipt.logs.find(
        (log) => log.topics[0] === hre.ethers.id("VaultCreated(address,address,string,uint8)")
    );
    const vaultAddress = hre.ethers.getAddress("0x" + event.topics[1].slice(-40));

    console.log("Demo vault deployed at:", vaultAddress);

    console.log("\n=== Deployment Summary ===");
    console.log("Factory:", await factory.getAddress());
    console.log("Base Asset:", await usdc.getAddress());
    console.log("Bond RWA:", await bond.getAddress());
    console.log("Real Estate RWA:", await realEstate.getAddress());
    console.log("Startup Fund RWA:", await startup.getAddress());
    console.log("Demo Vault:", vaultAddress);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });