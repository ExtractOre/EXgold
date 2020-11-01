// create a secrets.json file in root, add object {projectId: INFURA_PROJECT_ID, mnemonic: Wallet mnemonic}
const { projectId, mnemonic } = require("./secrets.json");
const HDWalletProvider = require("@truffle/hdwallet-provider");
const Web3 = require("web3");
const web3 = new Web3(
  "https://mainnet.infura.io/v3/e228b98ae15a4883851dc90add14d465"
);

module.exports = {
  networks: {
    development: {
      protocol: "http",
      host: "localhost",
      port: 8545,
      gas: 5000000,
      gasPrice: 5e9,
      networkId: "*",
    },
    ropsten: {
      provider: () =>
        new HDWalletProvider(
          mnemonic,
          `https://ropsten.infura.io/v3/${projectId}`
        ),
      networkId: 3,
      gasPrice: 10e9,
    },
    mainnet: {
      provider: () =>
        new HDWalletProvider(
          mnemonic,
          `https://mainnet.infura.io/v3/${projectId}`
        ),
      network_id: 1, 
      gas: 2000000, 
      gasPrice: web3.utils.toWei("38", "gwei"),
      confirmations: 2, 
      timeoutBlocks: 200, 
      skipDryRun: true, // Skip dry run before migrations? (default: false for public nets )
    },
  },
};
