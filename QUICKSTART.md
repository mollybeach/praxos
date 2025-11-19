# Praxos Quick Start Guide

Get up and running with Praxos in 5 minutes.

## Prerequisites Check

```bash
# Check Node.js (required for Hardhat)
node --version  # Should be 18.0.0 or higher
npm --version

# Check Python
python3 --version
```

## Step 1: Install Dependencies

```bash
# Install Hardhat and dependencies
make install
# Or: npm install

# Set up Python environment
cd offchain
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cd ..
```

## Step 2: Configure Rayls Devnet

1. **Add to MetaMask:**
   - Network Name: `Rayls Devnet`
   - RPC URL: `https://devnet-rpc.rayls.com`
   - Chain ID: `123123`
   - Currency Symbol: `USDr`
   - Block Explorer: `https://devnet-explorer.rayls.com`

2. **Get test tokens** from Rayls faucet (if available)

## Step 3: Deploy Contracts

```bash
# Create .env file with your private key
echo "PRIVATE_KEY=your_private_key_here" > .env
echo "RAYLS_RPC_URL=https://devnet-rpc.rayls.com" >> .env

# Deploy to Rayls devnet
make deploy
# Or: npx hardhat run scripts/deploy.js --network rayls_devnet
```

After deployment, note the addresses:
- Factory address
- Base asset (USDC) address
- RWA token addresses
- Demo vault address

## Step 4: Generate Vault Strategies

```bash
cd offchain
python vault_generator.py
```

This creates `vault_strategies.json` with AI-generated vault configurations.

## Step 5: Create Vaults from Strategies

Use the factory to deploy vaults. You can:

1. **Use Foundry scripts** (create a new script)
2. **Use the frontend** (update `factoryAddress` in `app.js`)
3. **Use web3.py** (create a Python script)

Example Foundry script call:

```solidity
// In a new script or via cast
cast send <FACTORY_ADDRESS> "createVault((address,string,string,string,uint8,uint256,address[],uint256[]))" \
  "(<BASE_ASSET>, 'Vault Name', 'SYMBOL', 'strategy-id', 3, 1095000, [<ASSET1>, <ASSET2>], [4000, 6000])" \
  --rpc-url https://devnet-rpc.rayls.com \
  --private-key $PRIVATE_KEY
```

## Step 6: Test the Frontend

```bash
cd frontend
python3 -m http.server 8000
```

Open `http://localhost:8000` and:
1. Connect your wallet
2. Update `factoryAddress` in `app.js` with your deployed factory
3. View and interact with vaults

## Example Workflow

### 1. Simulate Risk for RWAs

```python
from simulation.risk_model import RiskSimulator
from datetime import datetime, timedelta

simulator = RiskSimulator()
signature = simulator.simulate_risk(
    asset_address="0x...",
    asset_type="corporate-bond",
    annual_yield=500,  # 5%
    maturity_timestamp=int((datetime.now() + timedelta(days=365)).timestamp()),
    risk_tier=2
)
print(f"Credit Score: {signature.credit_score}")
```

### 2. Generate Vault Strategy

```python
from ai_engine.allocation_engine import AIAllocationEngine
from simulation.risk_model import RiskSimulator

simulator = RiskSimulator()
engine = AIAllocationEngine(simulator)

# Add your RWA signatures
strategies = engine.generate_vault_strategies(risk_signatures)
```

### 3. Deploy Vault

```python
from vault_generator import VaultGenerator

generator = VaultGenerator()
config = generator.get_vault_config_for_deployment(
    "balanced-diversified",
    base_asset_address="0x..."
)
# Use config to deploy via factory
```

## Testing

```bash
# Run Hardhat tests
make test
# Or: npx hardhat test

# Test Python components
cd offchain
python -m pytest  # If you add pytest tests
python vault_generator.py  # Run example
```

## Troubleshooting

### "Source not found" errors
Run `make install` or `npm install` to install dependencies including OpenZeppelin contracts.

### Python import errors
Ensure you're in the virtual environment: `source offchain/venv/bin/activate`

### Wallet connection issues
- Verify Rayls devnet is added to MetaMask
- Check chain ID is `123123`
- Ensure RPC URL is correct

### Deployment fails
- Check you have USDr for gas
- Verify private key is set correctly
- Check RPC endpoint is accessible

## Next Steps

- Read [SETUP.md](./SETUP.md) for detailed setup
- Read [README.md](./README.md) for architecture overview
- Check [HACKATHON_RULES.md](./HACKATHON_RULES.md) for hackathon requirements

## Demo Script

For a complete demo, see `script/Demo.s.sol` (create this to demonstrate the full flow).

