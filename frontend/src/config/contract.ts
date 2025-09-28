// Contract configuration for DecentralizedIssueTracker on 0G Chain

export const CONTRACT_CONFIG = {
  // Your deployed contract address
  address: "0x56De76f5b27e1BeE19f813B1B2035D05331dBe45",
  
  // 0G Chain network configuration - Matching your Rabby wallet
  network: {
    chainName: "0G-Galileo-Testnet",
    chainId: 16602, // Your actual Chain ID in Rabby
    chainIdHex: "0x40EA", // 16602 in hexadecimal  
    rpcUrls: ["https://evmrpc-testnet.0g.ai"],
    blockExplorerUrls: ["https://chainscan-galileo.0g.ai"],
    nativeCurrency: {
      name: "OG",
      symbol: "OG", 
      decimals: 18
    }
  }
} as const;

// Payment configuration - ONLY registerOrganization charges user's wallet
export const PAYMENT_CONFIG = {
  // REAL PAYMENT from user's wallet
  ORG_REGISTRATION: "0.000001", // 0.000001 ETH - charged from user wallet
  
  // Default values for frontend calculations
  DEFAULT: {
    AI_CREDITS: "0.0001",        // AI credits value
    BOUNTIES: {
      EASY: "0.00001",           // Easy issue bounty
      MEDIUM: "0.00005",         // Medium issue bounty
      HARD: "0.0001"             // Hard issue bounty
    }
  }
} as const;

// Difficulty enum mapping (matches contract)
export const DIFFICULTY_MAPPING = {
  "easy": 0,
  "medium": 1,
  "hard": 2
} as const;

// Duration mappings (matches contract defaults)
export const DURATION_CONFIG = {
  EASY: 7 * 24 * 60 * 60,      // 7 days in seconds
  MEDIUM: 30 * 24 * 60 * 60,   // 30 days in seconds
  HARD: 150 * 24 * 60 * 60     // 150 days in seconds
} as const;

// Helper function to get transaction explorer URL
export const getTxExplorerUrl = (txHash: string): string => {
  return `${CONTRACT_CONFIG.network.blockExplorerUrls[0]}/tx/${txHash}`;
};

// Helper function to get contract explorer URL
export const getContractExplorerUrl = (): string => {
  return `${CONTRACT_CONFIG.network.blockExplorerUrls[0]}/address/${CONTRACT_CONFIG.address}`;
};
