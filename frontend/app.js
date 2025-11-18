// HoneyVaiult Frontend
// Connect to Rayls devnet and interact with vaults

const RAYLS_DEVNET = {
    chainId: '0x1E0F3', // 123123 in hex
    chainName: 'Rayls Devnet',
    nativeCurrency: {
        name: 'USDgas',
        symbol: 'USDr',
        decimals: 18
    },
    rpcUrls: ['https://devnet-rpc.rayls.com'],
    blockExplorerUrls: ['https://devnet-explorer.rayls.com']
};

let provider = null;
let signer = null;
let factoryAddress = null;
let vaultAddresses = [];

// Factory ABI (simplified)
const FACTORY_ABI = [
    "function getAllVaults() view returns (address[])",
    "function getVaultCount() view returns (uint256)",
    "function isVault(address) view returns (bool)"
];

// Vault ABI (simplified)
const VAULT_ABI = [
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function vaultStrategy() view returns (string)",
    "function riskTier() view returns (uint8)",
    "function targetDuration() view returns (uint256)",
    "function totalAssets() view returns (uint256)",
    "function balanceOf(address) view returns (uint256)",
    "function deposit(uint256, address) returns (uint256)",
    "function getVaultInfo() view returns (string, uint8, uint256, uint256)",
    "function getAllocations() view returns (address[], uint256[])",
    "function asset() view returns (address)"
];

async function connectWallet() {
    if (typeof window.ethereum === 'undefined') {
        alert('Please install MetaMask or another Web3 wallet');
        return;
    }

    try {
        // Request account access
        await window.ethereum.request({
            method: 'eth_requestAccounts'
        });

        // Switch to Rayls devnet
        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{
                    chainId: RAYLS_DEVNET.chainId
                }]
            });
        } catch (switchError) {
            // Chain doesn't exist, add it
            if (switchError.code === 4902) {
                await window.ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [RAYLS_DEVNET]
                });
            }
        }

        provider = new ethers.providers.Web3Provider(window.ethereum);
        signer = provider.getSigner();
        const address = await signer.getAddress();

        document.getElementById('wallet-address').textContent =
            `${address.substring(0, 6)}...${address.substring(38)}`;
        document.getElementById('connect-wallet').textContent = 'Connected';
        document.getElementById('connect-wallet').disabled = true;

        // Load vaults
        await loadVaults();
    } catch (error) {
        console.error('Error connecting wallet:', error);
        alert('Failed to connect wallet: ' + error.message);
    }
}

async function loadVaults() {
    if (!provider) {
        document.getElementById('vaults-container').innerHTML =
            '<div class="error">Please connect your wallet first</div>';
        return;
    }

    try {
        // TODO: Replace with actual factory address after deployment
        factoryAddress = '0x0000000000000000000000000000000000000000'; // Placeholder

        if (factoryAddress === '0x0000000000000000000000000000000000000000') {
            document.getElementById('vaults-container').innerHTML =
                '<div class="error">Factory not deployed. Please deploy contracts first.</div>';
            return;
        }

        const factory = new ethers.Contract(factoryAddress, FACTORY_ABI, provider);
        const count = await factory.getVaultCount();

        if (count.toString() === '0') {
            document.getElementById('vaults-container').innerHTML =
                '<div class="loading">No vaults available yet. Deploy some vaults first!</div>';
            return;
        }

        vaultAddresses = await factory.getAllVaults();
        await renderVaults();
    } catch (error) {
        console.error('Error loading vaults:', error);
        document.getElementById('vaults-container').innerHTML =
            `<div class="error">Error loading vaults: ${error.message}</div>`;
    }
}

async function renderVaults() {
    const container = document.getElementById('vaults-container');
    container.innerHTML = '<div class="vaults-grid"></div>';
    const grid = container.querySelector('.vaults-grid');

    for (const vaultAddress of vaultAddresses) {
        try {
            const vault = new ethers.Contract(vaultAddress, VAULT_ABI, provider);
            const [name, symbol, strategy, riskTier, targetDuration, assetCount] = await vault.getVaultInfo();
            const totalAssets = await vault.totalAssets();

            const userBalance = signer ? await vault.balanceOf(await signer.getAddress()) : ethers.BigNumber.from(0);

            const vaultCard = document.createElement('div');
            vaultCard.className = 'vault-card';
            vaultCard.innerHTML = `
                <div class="vault-header">
                    <div class="vault-name">${name}</div>
                    <span class="risk-badge risk-${riskTier}">Risk ${riskTier}</span>
                </div>
                <div class="vault-info">
                    <div class="info-row">
                        <span class="info-label">Strategy:</span>
                        <span class="info-value">${strategy}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Total Assets:</span>
                        <span class="info-value">${ethers.utils.formatEther(totalAssets)} USDr</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Your Balance:</span>
                        <span class="info-value">${ethers.utils.formatEther(userBalance)} ${symbol}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Assets:</span>
                        <span class="info-value">${assetCount.toString()}</span>
                    </div>
                </div>
                <div class="deposit-section">
                    <input type="number" class="deposit-input" placeholder="Amount to deposit" id="deposit-${vaultAddress}" step="0.0001" min="0">
                    <button onclick="depositToVault('${vaultAddress}')">Deposit</button>
                </div>
            `;
            grid.appendChild(vaultCard);
        } catch (error) {
            console.error(`Error loading vault ${vaultAddress}:`, error);
        }
    }
}

async function depositToVault(vaultAddress) {
    if (!signer) {
        alert('Please connect your wallet first');
        return;
    }

    const input = document.getElementById(`deposit-${vaultAddress}`);
    const amount = input.value;

    if (!amount || parseFloat(amount) <= 0) {
        alert('Please enter a valid amount');
        return;
    }

    try {
        const vault = new ethers.Contract(vaultAddress, VAULT_ABI, signer);
        const assetAddress = await vault.asset();
        const asset = new ethers.Contract(assetAddress, [
            "function approve(address, uint256) returns (bool)",
            "function balanceOf(address) view returns (uint256)"
        ], signer);

        const amountWei = ethers.utils.parseEther(amount);
        const balance = await asset.balanceOf(await signer.getAddress());

        if (balance.lt(amountWei)) {
            alert('Insufficient balance');
            return;
        }

        // Approve
        const approveTx = await asset.approve(vaultAddress, amountWei);
        await approveTx.wait();

        // Deposit
        const depositTx = await vault.deposit(amountWei, await signer.getAddress());
        await depositTx.wait();

        alert('Deposit successful!');
        input.value = '';
        await loadVaults(); // Refresh
    } catch (error) {
        console.error('Error depositing:', error);
        alert('Deposit failed: ' + error.message);
    }
}

// Event listeners
document.getElementById('connect-wallet').addEventListener('click', connectWallet);

// Auto-connect if already connected
if (typeof window.ethereum !== 'undefined') {
    window.ethereum.on('accountsChanged', () => {
        location.reload();
    });
    window.ethereum.on('chainChanged', () => {
        location.reload();
    });
}