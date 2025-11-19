require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
    solidity: {
        version: "0.8.25",
        settings: {
            optimizer: {
                enabled: true,
                runs: 200,
            },
            viaIR: false,
            evmVersion: "cancun",
        },
    },
    paths: {
        sources: "./contracts",
        tests: "./test",
        cache: "./cache",
        artifacts: "./artifacts",
    },
    networks: {
        hardhat: {
            chainId: 1337,
        },
        rayls_devnet: {
            url: process.env.RAYLS_RPC_URL || "https://devnet-rpc.rayls.com",
            chainId: 123123,
            accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
            gasPrice: "auto",
        },
    },
    etherscan: {
        apiKey: {
            rayls_devnet: process.env.ETHERSCAN_API_KEY || "",
        },
        customChains: [{
            network: "rayls_devnet",
            chainId: 123123,
            urls: {
                apiURL: "https://devnet-explorer.rayls.com/api",
                browserURL: "https://devnet-explorer.rayls.com",
            },
        }, ],
    },
};