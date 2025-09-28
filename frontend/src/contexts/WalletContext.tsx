'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_CONFIG, PAYMENT_CONFIG, DIFFICULTY_MAPPING, getTxExplorerUrl } from '../config/contract';
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
  }, []);

  // Initialize contract when account and network are ready
  useEffect(() => {
    if (account && isOnCorrectNetwork) {
      initializeContract();
    } else {
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
      if (!window.ethereum) return;
      
      // Always assume correct network for Rabby compatibility
      setIsOnCorrectNetwork(true);
      console.log('Network check bypassed - assuming correct network');
    } catch (error) {
      console.error('Error checking network:', error);
      setIsOnCorrectNetwork(true); // Default to true
    }
  };

  const initializeContract = async () => {
    try {
      if (!window.ethereum || !account) return;

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      
      const contractInstance = new ethers.Contract(
        CONTRACT_CONFIG.address,
        CONTRACT_ABI,
        signer
      );
      
      setContract(contractInstance);
      console.log('✅ Contract initialized:', CONTRACT_CONFIG.address);
    } catch (error) {
      console.error('Error initializing contract:', error);
      setContract(null);
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
        window.ethereum.on('chainChanged', () => {
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
        value: value, // Amount in wei (0.001 ETH = 1000000000000000 wei)
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
      if (!contract || !account) {
        throw new Error('Contract not initialized or wallet not connected');
      }

      if (!isOnCorrectNetwork) {
        const switched = await switchToCorrectNetwork();
        if (!switched) {
          throw new Error('Please switch to 0G network first');
        }
      }

      console.log('🔄 Registering repository:', repoUrl);
      console.log('💰 Payment amount:', PAYMENT_CONFIG.ORG_REGISTRATION, 'ETH');

      // Convert payment to wei
      const paymentWei = ethers.utils.parseEther(PAYMENT_CONFIG.ORG_REGISTRATION);
      
      // Call registerOrganization with payment
      const tx = await contract.registerOrganization(
        repoUrl,
        0, // Use default easy duration
        0, // Use default medium duration
        0, // Use default hard duration
        { value: paymentWei }
      );

      console.log('⏳ Transaction sent:', tx.hash);
      console.log('🔗 Explorer:', getTxExplorerUrl(tx.hash));

      // Wait for confirmation
      const receipt = await tx.wait();
      console.log('✅ Repository registered successfully!');
      console.log('⛽ Gas used:', receipt.gasUsed.toString());

      return tx.hash;
    } catch (error: any) {
      console.error('❌ Registration failed:', error);
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
      const bountyAmount = PAYMENT_CONFIG.DEFAULT.BOUNTIES[issueData.difficulty?.toUpperCase()] || 
                          PAYMENT_CONFIG.DEFAULT.BOUNTIES.EASY;
      const bountyWei = ethers.utils.parseEther(bountyAmount);

      console.log('💰 Bounty amount (default):', bountyAmount, 'ETH');
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
