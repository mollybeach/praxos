.PHONY: install build test deploy clean check-balance

install:
	npm install

build:
	npx hardhat compile

test:
	npx hardhat test

deploy:
	npx hardhat run scripts/deploy.mjs --network rayls_devnet

mint-usdc:
	@if [ -z "$(ADDRESS)" ]; then \
		echo "Usage: make mint-usdc ADDRESS=0xYourAddress [AMOUNT=1000]"; \
		echo "Example: make mint-usdc ADDRESS=0x123... AMOUNT=5000"; \
		exit 1; \
	fi
	@AMOUNT=$${AMOUNT:-1000}; \
	npx hardhat run scripts/faucet/mintUSDC.mjs --network rayls_devnet --address $(ADDRESS) --amount $$AMOUNT

clean:
	npx hardhat clean
	rm -rf node_modules

check-balance:
	npx hardhat run scripts/check/checkBalance.mjs --network rayls_devnet

