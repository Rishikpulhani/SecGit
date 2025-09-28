'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_CONFIG, PAYMENT_CONFIG, DIFFICULTY_MAPPING, getTxExplorerUrl, convertOgToEth } from '../config/contract';
import { CONTRACT_ABI } from '../config/contractABI';

interface WalletContextType {
  account: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  isOnCorrectNetwork: boolean;
  contract: ethers.Contract | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  sendTransaction: (to: string, value: string) => Promise<string>;
  switchToCorrectNetwork: () => Promise<boolean>;
  registerRepository: (repoUrl: string) => Promise<string>;
  createContractIssue: (issueData: any) => Promise<string>;
  getOrganizationInfo: (address?: string) => Promise<any>;
  getIssueInfo: (issueId: number) => Promise<any>;
  isOrganizationRegistered: (address?: string) => Promise<boolean>;
  checkNetwork: () => Promise<void>;
  checkTransactionStatus: (txHash: string) => Promise<boolean>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const [account, setAccount] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isOnCorrectNetwork, setIsOnCorrectNetwork] = useState(false);
  const [contract, setContract] = useState<ethers.Contract | null>(null);

  // Check if wallet is already connected on page load
  useEffect(() => {
    checkConnection();
    
    // Add a debug function to window for manual testing
    (window as any).debugNetwork = async () => {
      if (!window.ethereum) {
        console.log('❌ No ethereum provider');
        return;
      }
      
      try {
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        console.log('🔍 Debug - Current chain ID:', chainId);
        console.log('🔍 Debug - Expected chain ID:', CONTRACT_CONFIG.network.chainIdHex);
        console.log('🔍 Debug - Expected decimal:', CONTRACT_CONFIG.network.chainId);
        
        const currentDecimal = parseInt(chainId, 16);
        console.log('🔍 Debug - Current decimal:', currentDecimal);
        
        const isCorrect = chainId === CONTRACT_CONFIG.network.chainIdHex;
        console.log('🔍 Debug - Is correct (hex):', isCorrect);
        
        const isCorrectDecimal = currentDecimal === CONTRACT_CONFIG.network.chainId;
        console.log('🔍 Debug - Is correct (decimal):', isCorrectDecimal);
        
        await checkNetwork();
      } catch (error) {
        console.error('Debug error:', error);
      }
    };
    
    // Add debug functions to window for manual testing
    (window as any).debugContract = async () => {
      console.log('🔧 Debug Contract Initialization:');
      console.log('  - Account:', account);
      console.log('  - Is Connected:', isConnected);
      console.log('  - Is On Correct Network:', isOnCorrectNetwork);
      console.log('  - Contract:', contract);
      console.log('  - Ethereum Provider:', !!window.ethereum);
      
      if (window.ethereum) {
        try {
          const chainId = await window.ethereum.request({ method: 'eth_chainId' });
          console.log('  - Current Chain ID:', chainId);
          console.log('  - Expected Chain ID:', CONTRACT_CONFIG.network.chainIdHex);
        } catch (error) {
          console.error('  - Error getting chain ID:', error);
        }
      }
      
      // Try to initialize contract manually
      if (account && isOnCorrectNetwork) {
        console.log('🔄 Attempting manual contract initialization...');
        await initializeContract();
      } else {
        console.log('❌ Cannot initialize: missing account or wrong network');
      }
    };
    
    // Check for ethereum provider conflicts
    if (window.ethereum) {
      // Test if ethereum provider is working (async check)
      window.ethereum.request({ method: 'eth_chainId' })
        .then(() => {
          console.log('✅ Ethereum provider is working correctly');
        })
        .catch((error) => {
          console.warn('⚠️ Ethereum provider conflict detected:', error);
          console.warn('💡 Try disabling browser extensions or impersonator tools');
        });
    }
    
    console.log('🛠️ Debug functions added: window.debugNetwork() and window.debugContract()');
  }, []);

  // Initialize contract when account and network are ready
  useEffect(() => {
    console.log('🔄 Contract useEffect triggered:', { account: !!account, isOnCorrectNetwork, contract: !!contract });
    
    if (account && isOnCorrectNetwork) {
      console.log('🚀 Attempting to initialize contract...');
      // Add a small delay to ensure everything is ready
      setTimeout(() => {
        initializeContract();
      }, 500);
    } else {
      console.log('❌ Cannot initialize contract:', { 
        hasAccount: !!account, 
        correctNetwork: isOnCorrectNetwork 
      });
      setContract(null);
    }
  }, [account, isOnCorrectNetwork]);

  const checkConnection = async () => {
    try {
      if (typeof window !== 'undefined' && window.ethereum) {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          setIsConnected(true);
          await checkNetwork();
        }
      }
    } catch (error) {
      console.error('Error checking wallet connection:', error);
    }
  };

  const checkNetwork = async () => {
    try {
      if (!window.ethereum) {
        console.log('❌ No ethereum provider found');
        setIsOnCorrectNetwork(false);
        return;
      }
      
      // Check current network with multiple methods
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      console.log('🔍 Current chain ID:', chainId);
      console.log('🎯 Expected chain ID:', CONTRACT_CONFIG.network.chainIdHex);
      console.log('📋 Expected decimal:', CONTRACT_CONFIG.network.chainId);
      
      // Convert to decimal for comparison
      const currentChainIdDecimal = parseInt(chainId, 16);
      const expectedChainIdDecimal = CONTRACT_CONFIG.network.chainId;
      
      console.log('🔢 Current decimal:', currentChainIdDecimal);
      console.log('🔢 Expected decimal:', expectedChainIdDecimal);
      
      const isCorrectNetwork = chainId === CONTRACT_CONFIG.network.chainIdHex || 
                              currentChainIdDecimal === expectedChainIdDecimal;
      
      console.log('✅ Is correct network:', isCorrectNetwork);
      setIsOnCorrectNetwork(isCorrectNetwork);
      
      if (isCorrectNetwork) {
        console.log('✅ Connected to OG-Galileo-Testnet (Chain ID:', chainId, ')');
        await initializeContract();
      } else {
        console.log('⚠️ Not on OG network. Current chain:', chainId, 'Expected:', CONTRACT_CONFIG.network.chainIdHex);
        console.log('💡 Please switch to OG-Galileo-Testnet to use OG tokens');
        setContract(null); // Clear contract if on wrong network
      }
    } catch (error) {
      console.error('❌ Error checking network:', error);
      setIsOnCorrectNetwork(false);
      setContract(null);
    }
  };

  const initializeContract = async () => {
    try {
      if (!window.ethereum || !account) {
        console.log('❌ Cannot initialize contract: missing ethereum or account');
        setContract(null);
        return;
      }

      // Double-check we're on the correct network
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      console.log('🔍 Contract init - Current chain ID:', chainId);
      console.log('🎯 Contract init - Expected chain ID:', CONTRACT_CONFIG.network.chainIdHex);
      
      if (chainId !== CONTRACT_CONFIG.network.chainIdHex) {
        console.log('❌ Cannot initialize contract: wrong network', chainId, 'expected', CONTRACT_CONFIG.network.chainIdHex);
        setContract(null);
        return;
      }

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      
      const contractInstance = new ethers.Contract(
        CONTRACT_CONFIG.address,
        CONTRACT_ABI,
        signer
      );
      
      // Test the contract connection
      try {
        await contractInstance.provider.getNetwork();
        console.log('✅ Contract provider network verified');
      } catch (providerError) {
        console.error('❌ Contract provider error:', providerError);
        setContract(null);
        return;
      }
      
      setContract(contractInstance);
      console.log('✅ Contract initialized successfully:', CONTRACT_CONFIG.address);
    } catch (error) {
      console.error('❌ Error initializing contract:', error);
      setContract(null);
    }
  };

  const switchToOGNetwork = async () => {
    try {
      if (!window.ethereum) {
        throw new Error('No wallet detected');
      }
      
      console.log('🔄 Switching to OG-Galileo-Testnet...');
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: CONTRACT_CONFIG.network.chainIdHex }],
      });
      
      console.log('✅ Network switch successful');
      await checkNetwork();
      return true;
    } catch (switchError: any) {
      console.log('⚠️ Switch error:', switchError);
      
      if (switchError.code === 4902) {
        console.log('🔧 Adding OG network...');
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [CONTRACT_CONFIG.network],
          });
          console.log('✅ Network added successfully');
          await checkNetwork();
          return true;
        } catch (addError: any) {
          console.error('❌ Error adding network:', addError);
          throw new Error(`Failed to add OG network: ${addError.message}`);
        }
      } else {
        throw new Error(`Failed to switch to OG network: ${switchError.message}`);
      }
    }
  };

  const connectWallet = async () => {
    try {
      setIsConnecting(true);
      
      if (!window.ethereum) {
        alert('MetaMask is not installed. Please install MetaMask to continue.');
        return;
      }

      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length > 0) {
        setAccount(accounts[0]);
        setIsConnected(true);
        await checkNetwork();
        
        // If not on correct network, try to switch
        if (!isOnCorrectNetwork) {
          try {
            await switchToOGNetwork();
          } catch (error) {
            console.error('Failed to switch to OG network:', error);
          }
        }
        
        // Listen for account changes
        window.ethereum.on('accountsChanged', (accounts: string[]) => {
          if (accounts.length > 0) {
            setAccount(accounts[0]);
            setIsConnected(true);
            checkNetwork();
          } else {
            disconnectWallet();
          }
        });

        // Listen for chain changes
        window.ethereum.on('chainChanged', (chainId: string) => {
          console.log('🔄 Chain changed to:', chainId);
          checkNetwork();
        });
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      alert('Failed to connect wallet. Please try again.');
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setIsConnected(false);
  };

  const sendTransaction = async (to: string, value: string): Promise<string> => {
    try {
      if (!window.ethereum || !account) {
        throw new Error('Wallet not connected');
      }

      const transactionParameters = {
        to,
        from: account,
        value: value, // Amount in wei (0.001 OG = 1000000000000000 wei)
        gas: '0x5208', // 21000 gas limit for simple transfer
      };

      const txHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [transactionParameters],
      });

      return txHash;
    } catch (error) {
      console.error('Transaction failed:', error);
      throw error;
    }
  };

  const switchToCorrectNetwork = async (): Promise<boolean> => {
    try {
      if (!window.ethereum) {
        throw new Error('Wallet is not installed');
      }

      console.log('Attempting to switch to 0G network...');
      
      // First try to switch to the network
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: CONTRACT_CONFIG.network.chainIdHex }],
      });
      
      console.log('Network switch successful');
      await checkNetwork();
      return true;
    } catch (switchError: any) {
      console.log('Switch error:', switchError);
      
      if (switchError.code === 4902) {
        // Network not added, try to add it
        console.log('Network not found, trying to add...');
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [CONTRACT_CONFIG.network],
          });
          console.log('Network added successfully');
          await checkNetwork();
          return true;
        } catch (addError: any) {
          console.error('Error adding network:', addError);
          throw new Error(`Failed to add 0G network: ${addError.message}`);
        }
      } else if (switchError.code === 4001) {
        // User rejected the request
        throw new Error('Network switch was cancelled by user');
      } else if (switchError.code === -32002) {
        // Request already pending
        throw new Error('Network switch request is already pending. Please check your wallet.');
      }
      
      console.error('Error switching network:', switchError);
      throw new Error(`Failed to switch to 0G network: ${switchError.message || 'Unknown error'}`);
    }
  };

  const registerRepository = async (repoUrl: string): Promise<string> => {
    try {
      // Check wallet connection
      if (!account) {
        throw new Error('Wallet not connected. Please connect your wallet first.');
      }

      // Check if organization is already registered
      const isAlreadyRegistered = await isOrganizationRegistered(account);
      if (isAlreadyRegistered) {
        throw new Error('This wallet address has already registered an organization. Please use a different wallet address or contact support to reset registration.');
      }

      // Check network
      if (!isOnCorrectNetwork) {
        console.log('⚠️ Not on OG network, attempting to switch...');
        try {
          await switchToOGNetwork();
        } catch (switchError) {
          throw new Error('Please switch to OG-Galileo-Testnet network first');
        }
      }

      // Check contract initialization
      if (!contract) {
        console.log('⚠️ Contract not initialized, attempting to initialize...');
        await initializeContract();
        if (!contract) {
          throw new Error('Failed to initialize contract. Please refresh and try again.');
        }
      }

      console.log('🔄 Registering repository:', repoUrl);
      console.log('💰 Payment amount:', PAYMENT_CONFIG.ORG_REGISTRATION, 'OG');

      // Convert OG amount to ETH for contract call
      const ethAmount = convertOgToEth(PAYMENT_CONFIG.ORG_REGISTRATION);
      console.log('💱 Converted to ETH for contract:', ethAmount, 'ETH');
      
      // FORCE the correct amount - always use 0.000001 ETH for registration
      const finalEthAmount = "0.000001";
      console.log('🔧 FORCED ETH amount for registration:', finalEthAmount);
      
      // Convert payment to wei (using FORCED ETH amount)
      const paymentWei = ethers.utils.parseEther(finalEthAmount);
      console.log('🔢 Payment in wei:', paymentWei.toString());
      console.log('🔢 Payment hex:', paymentWei.toHexString());
      
      // Try calling registerOrganization with different approach
      console.log('🚀 Attempting contract call with parameters:');
      console.log('  - repoUrl:', repoUrl);
      console.log('  - easyDuration: 0');
      console.log('  - mediumDuration: 0');
      console.log('  - hardDuration: 0');
      console.log('  - value:', paymentWei.toString());
      
      // Call registerOrganization with payment and manual gas limit
      const tx = await contract.registerOrganization(
        repoUrl,
        0, // Use default easy duration
        0, // Use default medium duration
        0, // Use default hard duration
        { 
          value: paymentWei,
          gasLimit: 1000000 // Increased gas limit
        }
      );

      console.log('⏳ Transaction sent:', tx.hash);
      console.log('🔗 Explorer:', getTxExplorerUrl(tx.hash));

      // Wait for confirmation with retry logic
      let receipt;
      let retries = 0;
      const maxRetries = 3;
      
      while (retries < maxRetries) {
        try {
          console.log(`⏳ Waiting for transaction confirmation (attempt ${retries + 1}/${maxRetries})...`);
          receipt = await tx.wait(1); // Wait for 1 confirmation
          console.log('✅ Repository registered successfully!');
          console.log('⛽ Gas used:', receipt.gasUsed.toString());
          break;
        } catch (waitError: any) {
          retries++;
          console.log(`⚠️ Receipt wait failed (attempt ${retries}/${maxRetries}):`, waitError.message);
          
          if (retries >= maxRetries) {
            // If we can't get the receipt, but the transaction was sent, return the hash
            console.log('⚠️ Could not retrieve receipt, but transaction was sent');
            console.log('🔗 Check transaction status manually:', getTxExplorerUrl(tx.hash));
            return tx.hash; // Return the transaction hash even without receipt
          }
          
          // Wait a bit before retrying
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      return tx.hash;
    } catch (error: any) {
      console.error('❌ Registration failed:', error);
      
      // Try to decode the error message if it's a contract revert
      if (error.data && error.data.data) {
        try {
          const decodedError = contract.interface.parseError(error.data.data);
          console.error('🔍 Contract error decoded:', decodedError);
          throw new Error(`Contract Error: ${decodedError.name} - ${decodedError.args}`);
        } catch (decodeError) {
          console.error('🔍 Could not decode contract error:', decodeError);
        }
      }
      
      // Check for common error patterns
      if (error.message?.includes('Organization already registered')) {
        throw new Error('This organization address has already been registered. Please use a different wallet or contact support.');
      } else if (error.message?.includes('Invalid stake amount')) {
        throw new Error('Invalid stake amount. Please ensure you have sufficient OG tokens.');
      } else if (error.message?.includes('Repository URL cannot be empty')) {
        throw new Error('Repository URL cannot be empty.');
      }
      
      throw new Error(`Registration failed: ${error.message}`);
    }
  };

  const createContractIssue = async (issueData: any): Promise<string> => {
    try {
      if (!contract || !account) {
        throw new Error('Contract not initialized or wallet not connected');
      }

      console.log('🔄 Creating contract issue:', issueData.title);

      // Map difficulty to contract enum
      const difficulty = DIFFICULTY_MAPPING[issueData.difficulty?.toLowerCase()] || 0;
      
      // Get default bounty amount (NOT charged from user)
      const bountyAmountOG = PAYMENT_CONFIG.DEFAULT.BOUNTIES[issueData.difficulty?.toUpperCase()] || 
                            PAYMENT_CONFIG.DEFAULT.BOUNTIES.EASY;
      
      // Convert OG amount to ETH for contract call
      const bountyAmountETH = convertOgToEth(bountyAmountOG);
      const bountyWei = ethers.utils.parseEther(bountyAmountETH);

      console.log('💰 Bounty amount (default):', bountyAmountOG, 'OG');
      console.log('💱 Converted to ETH for contract:', bountyAmountETH, 'ETH');
      console.log('🎯 Difficulty:', issueData.difficulty, '→', difficulty);

      // Create issue in contract (this doesn't charge the user, uses org's staked funds)
      const tx = await contract.createIssue(
        issueData.githubUrl || `https://github.com/placeholder`,
        issueData.body || issueData.description,
        bountyWei,
        difficulty,
        account // Organization address
      );

      console.log('⏳ Transaction sent:', tx.hash);
      console.log('🔗 Explorer:', getTxExplorerUrl(tx.hash));

      const receipt = await tx.wait();
      console.log('✅ Contract issue created successfully!');
      console.log('⛽ Gas used:', receipt.gasUsed.toString());

      return tx.hash;
    } catch (error: any) {
      console.error('❌ Issue creation failed:', error);
      throw new Error(`Issue creation failed: ${error.message}`);
    }
  };

  const getOrganizationInfo = async (address?: string): Promise<any> => {
    try {
      if (!contract) {
        throw new Error('Contract not initialized');
      }

      const orgAddress = address || account;
      if (!orgAddress) {
        throw new Error('No address provided');
      }

      const orgInfo = await contract.getOrganizationInfo(orgAddress);
      
      return {
        repoUrl: orgInfo.repoUrl,
        totalStaked: ethers.utils.formatEther(orgInfo.totalStaked),
        availableRewards: ethers.utils.formatEther(orgInfo.availableRewards),
        isActive: orgInfo.isActive,
        owner: orgInfo.owner,
        aiCredits: ethers.utils.formatEther(orgInfo.aiCredits),
        easyDuration: orgInfo.easyDuration.toNumber(),
        mediumDuration: orgInfo.mediumDuration.toNumber(),
        hardDuration: orgInfo.hardDuration.toNumber()
      };
    } catch (error: any) {
      console.error('Error getting organization info:', error);
      throw error;
    }
  };

  const getIssueInfo = async (issueId: number): Promise<any> => {
    try {
      if (!contract) {
        throw new Error('Contract not initialized');
      }

      const issueInfo = await contract.getIssueInfo(issueId);
      
      return {
        org: issueInfo.org,
        githubIssueUrl: issueInfo.githubIssueUrl,
        description: issueInfo.description,
        bounty: ethers.utils.formatEther(issueInfo.bounty),
        assignedTo: issueInfo.assignedTo,
        isCompleted: issueInfo.isCompleted,
        isAssigned: issueInfo.isAssigned,
        createdAt: new Date(issueInfo.createdAt.toNumber() * 1000),
        difficulty: ['Easy', 'Medium', 'Hard'][issueInfo.difficulty],
        deadline: issueInfo.deadline.toNumber() > 0 ? new Date(issueInfo.deadline.toNumber() * 1000) : null
      };
    } catch (error: any) {
      console.error('Error getting issue info:', error);
      throw error;
    }
  };

  const isOrganizationRegistered = async (address?: string): Promise<boolean> => {
    try {
      const orgInfo = await getOrganizationInfo(address);
      return orgInfo.isActive;
    } catch (error) {
      return false;
    }
  };

  const checkTransactionStatus = async (txHash: string): Promise<boolean> => {
    try {
      if (!window.ethereum) return false;
      
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const receipt = await provider.getTransactionReceipt(txHash);
      
      if (receipt) {
        console.log('📋 Transaction receipt found:', {
          hash: receipt.transactionHash,
          status: receipt.status,
          blockNumber: receipt.blockNumber,
          gasUsed: receipt.gasUsed.toString()
        });
        return receipt.status === 1; // 1 = success, 0 = failed
      }
      
      return false;
    } catch (error) {
      console.error('❌ Error checking transaction status:', error);
      return false;
    }
  };

  const contextValue: WalletContextType = {
    account,
    isConnected,
    isConnecting,
    isOnCorrectNetwork,
    contract,
    connectWallet,
    disconnectWallet,
    sendTransaction,
    switchToCorrectNetwork,
    registerRepository,
    createContractIssue,
    getOrganizationInfo,
    getIssueInfo,
    isOrganizationRegistered,
    checkNetwork,
    checkTransactionStatus,
  };

  return (
    <WalletContext.Provider value={contextValue}>
      {children}
    </WalletContext.Provider>
  );
};

// Extend Window interface for TypeScript
declare global {
  interface Window {
    ethereum?: any;
  }
}
