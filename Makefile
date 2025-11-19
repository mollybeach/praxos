.PHONY: install build test deploy clean

install:
	npm install

build:
	npx hardhat compile

test:
	npx hardhat test

deploy:
	npx hardhat run scripts/deploy.js --network rayls_devnet

clean:
	npx hardhat clean
	rm -rf node_modules

