# HoneyVaiult Setup Guide

## Prerequisites

- [Foundry](https://book.getfoundry.sh/getting-started/installation) (for smart contracts)
- [Python 3.9+](https://www.python.org/downloads/) (for off-chain components)
- [Node.js](https://nodejs.org/) (optional, for frontend)
- MetaMask or compatible Web3 wallet

## Installation

### 1. Install Foundry

```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

### 2. Install Dependencies

```bash
# Install OpenZeppelin contracts
make install

# Or manually:
forge install OpenZeppelin/openzeppelin-contracts
forge install transmissions11/solmate
```

### 3. Set Up Python Environment

```bash
cd offchain
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 4. Configure Environment

Create a `.env` file in the root directory:

```bash
PRIVATE_KEY=your_private_key_here
RAYLS_RPC_URL=https://devnet-rpc.rayls.com
FACTORY_ADDRESS=0x...  # After deployment
```

## Building

### Compile Smart Contracts

```bash
make build
# Or: forge build
```

### Run Tests

```bash
make test
# Or: forge test -vvv
```

## Deployment

### Deploy to Rayls Devnet

1. Add Rayls devnet to your wallet:
   - Chain ID: `123123`
   - RPC URL: `https://devnet-rpc.rayls.com`
   - Explorer: `https://devnet-explorer.rayls.com`
   - Currency: USDgas (USDr)

2. Get test tokens (if needed) from Rayls faucet

3. Deploy contracts:

```bash
forge script script/Deploy.s.sol:DeployScript \
  --rpc-url rayls_devnet \
  --broadcast \
  --verify
```

4. Update `.env` with deployed addresses

## Running Off-Chain Components

### Generate Vault Strategies

```bash
cd offchain
python vault_generator.py
```

This will:
1. Simulate risk for RWA tokens
2. Generate vault strategies using the AI allocation engine
3. Export strategies to `vault_strategies.json`

### Use in Python Scripts

```python
from vault_generator import VaultGenerator

generator = VaultGenerator()

# Process RWA tokens
rwa_tokens = [
    {
        "address": "0x...",
        "asset_type": "corporate-bond",
        "annual_yield": 500,  # 5%
        "maturity_timestamp": 1735689600,
        "risk_tier": 2
    }
]

strategies = generator.process_rwa_tokens(rwa_tokens)
config = generator.get_vault_config_for_deployment(
    "balanced-diversified",
    base_asset_address="0x..."
)
```

## Frontend

### Local Development

1. Serve the frontend files:

```bash
cd frontend
python3 -m http.server 8000
# Or use any static file server
```

2. Open `http://localhost:8000` in your browser

3. Connect your wallet (MetaMask with Rayls devnet configured)

4. Update `factoryAddress` in `app.js` with your deployed factory address

## Project Structure

```
honeyvaiult/
├── src/
│   ├── interfaces/
│   │   └── IERC3643.sol          # ERC-3643 RWA interface
│   ├── mocks/
│   │   └── MockERC3643.sol       # Mock RWA tokens for testing
│   ├── HoneyVault.sol             # ERC-4626 vault implementation
│   └── HoneyVaultFactory.sol     # Vault factory
├── script/
│   └── Deploy.s.sol              # Deployment script
├── src/test/
│   └── HoneyVault.t.sol         # Tests
├── offchain/
│   ├── simulation/
│   │   └── risk_model.py         # Risk simulation layer
│   ├── ai_engine/
│   │   └── allocation_engine.py   # AI allocation engine
│   └── vault_generator.py         # Main orchestrator
├── frontend/
│   ├── index.html                # Frontend UI
│   └── app.js                    # Frontend logic
├── foundry.toml                  # Foundry configuration
└── README.md
```

## Testing the Full Flow

1. **Deploy Contracts**: Run deployment script
2. **Generate Strategies**: Run `vault_generator.py` with RWA token data
3. **Deploy Vaults**: Use factory to create vaults from strategies
4. **Interact**: Use frontend or scripts to deposit/withdraw

## Troubleshooting

### Contract Compilation Errors

- Ensure Foundry is up to date: `foundryup`
- Check Solidity version matches `foundry.toml`
- Verify dependencies are installed: `forge install`

### Python Import Errors

- Ensure you're in the virtual environment
- Install dependencies: `pip install -r requirements.txt`
- Check Python version: `python3 --version` (should be 3.9+)

### Wallet Connection Issues

- Ensure Rayls devnet is added to MetaMask
- Check RPC URL is correct
- Verify chain ID is `123123`

## Next Steps

- Integrate with real ERC-3643 tokens from Rayls private nodes
- Enhance AI allocation engine with more sophisticated algorithms
- Add more comprehensive testing
- Deploy to Rayls mainnet (Q1 2026)

