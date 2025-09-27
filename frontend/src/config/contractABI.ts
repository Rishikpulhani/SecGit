// Contract ABI for DecentralizedIssueTracker
// Generated from DecentralizedIssueTracker.sol

export const CONTRACT_ABI = [
  // Events
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "address", "name": "org", "type": "address"},
      {"indexed": false, "internalType": "string", "name": "repoUrl", "type": "string"},
      {"indexed": false, "internalType": "uint256", "name": "stakedAmount", "type": "uint256"}
    ],
    "name": "OrganizationRegistered",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "uint256", "name": "issueId", "type": "uint256"},
      {"indexed": true, "internalType": "address", "name": "org", "type": "address"},
      {"indexed": false, "internalType": "string", "name": "githubIssueUrl", "type": "string"},
      {"indexed": false, "internalType": "uint256", "name": "bounty", "type": "uint256"},
      {"indexed": false, "internalType": "uint8", "name": "difficulty", "type": "uint8"}
    ],
    "name": "IssueCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "uint256", "name": "issueId", "type": "uint256"},
      {"indexed": true, "internalType": "address", "name": "contributor", "type": "address"},
      {"indexed": false, "internalType": "uint256", "name": "deadline", "type": "uint256"}
    ],
    "name": "IssueAssigned",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "uint256", "name": "issueId", "type": "uint256"},
      {"indexed": true, "internalType": "address", "name": "contributor", "type": "address"},
      {"indexed": false, "internalType": "uint256", "name": "reward", "type": "uint256"}
    ],
    "name": "IssueCompleted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "address", "name": "org", "type": "address"},
      {"indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256"},
      {"indexed": false, "internalType": "uint256", "name": "newBalance", "type": "uint256"}
    ],
    "name": "AICreditsAdded",
    "type": "event"
  },

  // Core Functions
  {
    "inputs": [
      {"internalType": "string", "name": "_repoUrl", "type": "string"},
      {"internalType": "uint256", "name": "_easyDuration", "type": "uint256"},
      {"internalType": "uint256", "name": "_mediumDuration", "type": "uint256"},
      {"internalType": "uint256", "name": "_hardDuration", "type": "uint256"}
    ],
    "name": "registerOrganization",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "addAICredits",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "string", "name": "_githubIssueUrl", "type": "string"},
      {"internalType": "string", "name": "_description", "type": "string"},
      {"internalType": "uint256", "name": "_bounty", "type": "uint256"},
      {"internalType": "uint8", "name": "_difficulty", "type": "uint8"},
      {"internalType": "address", "name": "_org", "type": "address"}
    ],
    "name": "createIssue",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "_issueId", "type": "uint256"}],
    "name": "takeIssue",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "_issueId", "type": "uint256"}],
    "name": "completeIssue",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },

  // View Functions
  {
    "inputs": [{"internalType": "address", "name": "_org", "type": "address"}],
    "name": "getOrganizationInfo",
    "outputs": [
      {"internalType": "string", "name": "repoUrl", "type": "string"},
      {"internalType": "uint256", "name": "totalStaked", "type": "uint256"},
      {"internalType": "uint256", "name": "availableRewards", "type": "uint256"},
      {"internalType": "bool", "name": "isActive", "type": "bool"},
      {"internalType": "address", "name": "owner", "type": "address"},
      {"internalType": "uint256", "name": "easyDuration", "type": "uint256"},
      {"internalType": "uint256", "name": "mediumDuration", "type": "uint256"},
      {"internalType": "uint256", "name": "hardDuration", "type": "uint256"},
      {"internalType": "uint256", "name": "aiCredits", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "_issueId", "type": "uint256"}],
    "name": "getIssueInfo",
    "outputs": [
      {"internalType": "address", "name": "org", "type": "address"},
      {"internalType": "string", "name": "githubIssueUrl", "type": "string"},
      {"internalType": "string", "name": "description", "type": "string"},
      {"internalType": "uint256", "name": "bounty", "type": "uint256"},
      {"internalType": "address", "name": "assignedTo", "type": "address"},
      {"internalType": "bool", "name": "isCompleted", "type": "bool"},
      {"internalType": "bool", "name": "isAssigned", "type": "bool"},
      {"internalType": "uint256", "name": "createdAt", "type": "uint256"},
      {"internalType": "uint8", "name": "difficulty", "type": "uint8"},
      {"internalType": "uint256", "name": "deadline", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "_org", "type": "address"}],
    "name": "getOrganizationIssues",
    "outputs": [{"internalType": "uint256[]", "name": "", "type": "uint256[]"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "nextIssueId",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },

  // Constants
  {
    "inputs": [],
    "name": "MIN_ORG_STAKE",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const;
