// create a secrets.json file in root, add object {projectId: INFURA_PROJECT_ID, mnemonic: Wallet mnemonic}
const { projectId, mnemonic } = require("./secrets.json");
const HDWalletProvider = require("@truffle/hdwallet-provider");

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
      network_id: 1, // Ropsten's id
      gas: 1000000, // Ropsten has a lower block limit than mainnet
      gasPrice: web3.utils.toWei("70", "gwei"),
      confirmations: 2, // # of confs to wait between deployments. (default: 0)
      timeoutBlocks: 200, // # of blocks before a deployment times out  (minimum/default: 50)
      skipDryRun: true, // Skip dry run before migrations? (default: false for public nets )
    },
  },
};
