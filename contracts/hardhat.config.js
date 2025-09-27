require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-chai-matchers");
require("@nomiclabs/hardhat-ethers");
require("dotenv").config();

// Define Hardhat tasks here
task("show-balance", async () => {
  const showBalance = require("./scripts/showBalance");
  return showBalance();
});

task("deploy-contract", async () => {
  const deployContract = require("./scripts/deployContract");
  return deployContract();
});

// New task for 0G deployment
task("deploy-og-contract", async () => {
  const deployOGContract = require("./scripts/deployOGContract");
  return deployOGContract();
});

task("contract-view-call", async (taskArgs) => {
  const contractViewCall = require("./scripts/contractViewCall");
  return contractViewCall(taskArgs.contractAddress);
});

task("contract-call", async (taskArgs) => {
  const contractCall = require("./scripts/contractCall");
  return contractCall(taskArgs.contractAddress, taskArgs.msg);
});

module.exports = {
  mocha: {
    timeout: 3600000,
  },
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 500,
      },
    },
  },
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      chainId: 31337,
      allowUnlimitedContractSize: false
    },
    local: {
      url: process.env.LOCAL_NODE_ENDPOINT,
      accounts: [process.env.LOCAL_NODE_OPERATOR_PRIVATE_KEY],
    },
    testnet: {
      url: process.env.TESTNET_ENDPOINT,
      accounts: [process.env.TESTNET_OPERATOR_PRIVATE_KEY],
    },
    // New 0G testnet configuration
    "og-testnet": {
      url: "https://evmrpc-testnet.0g.ai",
      chainId: 16602,
      accounts: [process.env.OG_TESTNET_PRIVATE_KEY],
      gasPrice: 20000000000, // 20 Gwei
      gas: 8000000, // 8M gas limit
      timeout: 60000,
    },
  },
};