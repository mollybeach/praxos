.PHONY: install build test deploy clean check-balance

install:
	npm install

build:
	npx hardhat compile

test:
	npx hardhat test

deploy:
	npx hardhat run scripts/deploy.mjs --network rayls_devnet

clean:
	npx hardhat clean
	rm -rf node_modules

check-balance:
	npx hardhat run scripts/check/checkBalance.mjs --network rayls_devnet

