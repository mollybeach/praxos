const {
    expect
} = require("chai");
const {
    ethers
} = require("hardhat");

describe("Praxos", function() {
    let factory;
    let baseAsset;
    let bond1;
    let realEstate;
    let startupFund;
    let owner;
    let user;

    beforeEach(async function() {
        [owner, user] = await ethers.getSigners();

        // Deploy factory
        const PraxosFactory = await ethers.getContractFactory("PraxosFactory");
        factory = await PraxosFactory.deploy();
        await factory.waitForDeployment();

        // Deploy base asset (stablecoin)
        const MockERC20 = await ethers.getContractFactory("MockERC20");
        baseAsset = await MockERC20.deploy("USD Stablecoin", "USDS");
        await baseAsset.waitForDeployment();

        // Deploy mock RWA tokens
        const MockERC3643 = await ethers.getContractFactory("MockERC3643");

        const oneYearFromNow = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60;
        bond1 = await MockERC3643.deploy(
            "Corporate Bond A",
            "BOND-A",
            "corporate-bond",
            oneYearFromNow,
            500, // 5% yield
            2, // Risk tier 2
            ethers.parseEther("1000000")
        );
        await bond1.waitForDeployment();

        const fiveYearsFromNow = Math.floor(Date.now() / 1000) + 1825 * 24 * 60 * 60;
        realEstate = await MockERC3643.deploy(
            "Real Estate Fund B",
            "RE-B",
            "real-estate",
            fiveYearsFromNow,
            700, // 7% yield
            3, // Risk tier 3
            ethers.parseEther("1000000")
        );
        await realEstate.waitForDeployment();

        startupFund = await MockERC3643.deploy(
            "Startup Fund C",
            "STARTUP-C",
            "startup-fund",
            0, // No maturity
            1500, // 15% yield
            5, // Risk tier 5 (highest)
            ethers.parseEther("1000000")
        );
        await startupFund.waitForDeployment();
    });

    describe("Vault Creation", function() {
        it("Should create a vault successfully", async function() {
            const assets = [await bond1.getAddress(), await realEstate.getAddress()];
            const weights = [6000, 4000]; // 60%, 40%

            const config = {
                baseAsset: await baseAsset.getAddress(),
                name: "Conservative Vault",
                symbol: "CONS-VAULT",
                strategy: "conservative-short-term",
                riskTier: 2,
                targetDuration: 365 * 24 * 60 * 60, // 365 days in seconds
                assets: assets,
                weights: weights,
            };

            const tx = await factory.createVault(config);
            const receipt = await tx.wait();

            // Get vault address from event
            const event = receipt.logs.find(
                (log) => log.topics[0] === ethers.id("VaultCreated(address,address,string,uint8)")
            );
            expect(event).to.not.be.undefined;

            const vaultAddress = ethers.getAddress("0x" + event.topics[1].slice(-40));
            expect(await factory.isVault(vaultAddress)).to.be.true;
            expect(await factory.getVaultCount()).to.equal(1);
        });

        it("Should create multiple vaults", async function() {
            // Create first vault
            const assets1 = [await bond1.getAddress()];
            const weights1 = [10000];

            const config1 = {
                baseAsset: await baseAsset.getAddress(),
                name: "Vault 1",
                symbol: "V1",
                strategy: "conservative",
                riskTier: 1,
                targetDuration: 365 * 24 * 60 * 60,
                assets: assets1,
                weights: weights1,
            };

            await factory.createVault(config1);

            // Create second vault
            const assets2 = [await startupFund.getAddress()];
            const weights2 = [10000];

            const config2 = {
                baseAsset: await baseAsset.getAddress(),
                name: "Vault 2",
                symbol: "V2",
                strategy: "high-yield",
                riskTier: 5,
                targetDuration: 0,
                assets: assets2,
                weights: weights2,
            };

            await factory.createVault(config2);

            expect(await factory.getVaultCount()).to.equal(2);
        });
    });

    describe("Vault Deposits", function() {
        it("Should allow deposits and allocate assets", async function() {
            // Create vault
            const assets = [await bond1.getAddress()];
            const weights = [10000];

            const config = {
                baseAsset: await baseAsset.getAddress(),
                name: "Test Vault",
                symbol: "TEST",
                strategy: "test",
                riskTier: 1,
                targetDuration: 365 * 24 * 60 * 60,
                assets: assets,
                weights: weights,
            };

            const tx = await factory.createVault(config);
            const receipt = await tx.wait();

            const event = receipt.logs.find(
                (log) => log.topics[0] === ethers.id("VaultCreated(address,address,string,uint8)")
            );
            const vaultAddress = ethers.getAddress("0x" + event.topics[1].slice(-40));

            const PraxosVault = await ethers.getContractFactory("PraxosVault");
            const vault = PraxosVault.attach(vaultAddress);

            // Transfer ownership from factory to owner for testing
            await factory.connect(owner).transferOwnership(await owner.getAddress());

            // Mint base asset to user
            await baseAsset.mint(await user.getAddress(), ethers.parseEther("10000"));

            // Approve and deposit
            await baseAsset.connect(user).approve(vaultAddress, ethers.parseEther("1000"));
            await vault.connect(user).deposit(ethers.parseEther("1000"), await user.getAddress());

            expect(await vault.balanceOf(await user.getAddress())).to.be.gt(0);
            expect(await vault.totalAssets()).to.equal(ethers.parseEther("1000"));
        });
    });
});