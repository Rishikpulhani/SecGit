// Contract configuration for DecentralizedIssueTracker on 0G Chain

export const CONTRACT_CONFIG = {
  // Your deployed contract address
  address: "0x00C859968D2033743B5215dBC3263c7017FBA998",
  
  // 0G Chain network configuration - Matching your Rabby wallet
  network: {
    chainName: "0G-Galileo-Testnet",
    chainId: 16570, // Updated to match your actual Chain ID
    chainIdHex: "0x40da", // 16570 in hexadecimal  
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
  // REAL PAYMENT from user's wallet (using OG tokens)
  // Contract requires exactly 0.000001 ETH, so we'll use a precise OG amount
  ORG_REGISTRATION: "0.0011", // OG amount (converts to exactly 0.000001 ETH for contract)
  
  // Default values for frontend calculations (using OG tokens)
  DEFAULT: {
    AI_CREDITS: "0.0001",        // AI credits value (OG tokens)
    BOUNTIES: {
      EASY: "0.00001",           // Easy issue bounty (OG tokens)
      MEDIUM: "0.00005",         // Medium issue bounty (OG tokens)
      HARD: "0.0001"             // Hard issue bounty (OG tokens)
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

// OG to ETH conversion (actual market rate: 1 OG = 0.00091 ETH)
export const OG_TO_ETH_RATE = 0.00091;

// Helper function to convert OG amounts to ETH for contract calls
export const convertOgToEth = (ogAmount: string): string => {
  console.log('🔄 Converting OG to ETH:', ogAmount);
  console.log('🔍 PAYMENT_CONFIG.ORG_REGISTRATION:', PAYMENT_CONFIG.ORG_REGISTRATION);
  console.log('🔍 Are they equal?', ogAmount === PAYMENT_CONFIG.ORG_REGISTRATION);
  console.log('🔍 String comparison:', `"${ogAmount}" === "${PAYMENT_CONFIG.ORG_REGISTRATION}"`);
  
  // For registration, we need exactly 0.000001 ETH regardless of OG amount
  const isRegistrationPayment = ogAmount === PAYMENT_CONFIG.ORG_REGISTRATION || 
                               ogAmount === "0.0011" || 
                               parseFloat(ogAmount) === parseFloat(PAYMENT_CONFIG.ORG_REGISTRATION);
  
  if (isRegistrationPayment) {
    console.log('✅ Using special case: 0.000001 ETH');
    return "0.000001"; // Exact ETH amount required by contract
  }
  
  const ogValue = parseFloat(ogAmount);
  const ethValue = ogValue * OG_TO_ETH_RATE;
  console.log('📊 Normal conversion:', ogValue, 'OG →', ethValue, 'ETH');
  // Round to 6 decimal places to avoid precision issues
  return ethValue.toFixed(6);
};

// Helper function to convert ETH amounts to OG for UI display
export const convertEthToOg = (ethAmount: string): string => {
  const ethValue = parseFloat(ethAmount);
  const ogValue = ethValue / OG_TO_ETH_RATE;
  return ogValue.toString();
};
