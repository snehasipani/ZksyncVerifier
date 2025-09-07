// hardhat.config.cjs
console.log("LOADING hardhat.config.cjs");

// Load environment variables
require("dotenv").config();

// Import plugins (CommonJS)
require("@nomicfoundation/hardhat-ethers");

// Export config (CommonJS)
module.exports = {
  solidity: {
    compilers: [
      { version: "0.8.29", settings: { optimizer: { enabled: true, runs: 200 } } },
      { version: "0.8.28", settings: { optimizer: { enabled: true, runs: 200 } } },
      { version: "0.8.20", settings: { optimizer: { enabled: true, runs: 200 } } }
    ],
  },

  networks: {
    hardhat: {},
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "",
      accounts: process.env.SEPOLIA_PRIVATE_KEY ? [process.env.SEPOLIA_PRIVATE_KEY] : [],
    },
  },
};
