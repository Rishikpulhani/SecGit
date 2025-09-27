/*-
 *
 * 0G Chain Deployment Script for DecentralizedIssueTracker
 *
 * Copyright (C) 2024 Your Project Name
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

const { ethers } = require("hardhat");

module.exports = async () => {
  // Get the signer for 0G testnet
  const [deployer] = await ethers.getSigners();
  
  console.log("🚀 Starting deployment of DecentralizedIssueTracker on 0G Chain...");
  console.log("👤 Deploying with account:", deployer.address);
  
  // Check balance before deployment
  const balance = await deployer.getBalance();
  console.log("💰 Account balance:", ethers.utils.formatEther(balance), "OG");
  
  if (balance.lt(ethers.utils.parseEther("0.1"))) {
    console.log("⚠️  Warning: Low balance. You may need more OG tokens from the faucet.");
    console.log("🔗 Faucet: https://faucet.0g.ai");
  }

  // Initialize contract factory
  const DecentralizedIssueTracker = await ethers.getContractFactory("DecentralizedIssueTracker", deployer);

  // Constructor parameters
  const aiAgentAddress = deployer.address; // You can change this to a specific AI agent address
  
  console.log("📋 Constructor parameters:");
  console.log("AI Agent Address:", aiAgentAddress);

  try {
    // Deploy the contract with gas estimation
    console.log("⛽ Estimating gas...");
    const estimatedGas = await DecentralizedIssueTracker.signer.estimateGas(
      DecentralizedIssueTracker.getDeployTransaction(aiAgentAddress)
    );
    console.log("📊 Estimated gas:", estimatedGas.toString());

    // Deploy with a gas limit buffer
    const gasLimit = estimatedGas.mul(120).div(100); // 20% buffer
    
    const decentralizedIssueTracker = await DecentralizedIssueTracker.deploy(
      aiAgentAddress,
      {
        gasLimit: gasLimit,
      }
    );

    console.log("⏳ Waiting for deployment confirmation...");
    console.log("📤 Transaction hash:", decentralizedIssueTracker.deployTransaction.hash);

    await decentralizedIssueTracker.deployed();

    const deploymentReceipt = await decentralizedIssueTracker.deployTransaction.wait();
    
    const contractAddress = decentralizedIssueTracker.address;

    console.log("\n✅ DecentralizedIssueTracker deployed successfully on 0G Chain!");
    console.log(`📍 Contract Address: ${contractAddress}`);
    console.log(`🔗 Transaction Hash: ${decentralizedIssueTracker.deployTransaction.hash}`);
    console.log(`⛽ Gas Used: ${deploymentReceipt.gasUsed?.toString()}`);
    console.log(`💸 Gas Price: ${deploymentReceipt.effectiveGasPrice?.toString()} wei`);
    
    // Calculate deployment cost
    const deploymentCost = deploymentReceipt.gasUsed.mul(deploymentReceipt.effectiveGasPrice);
    console.log(`💰 Deployment Cost: ${ethers.utils.formatEther(deploymentCost)} OG`);
    
    // 0G Chain Explorer links
    console.log("\n🔍 Explorer Links:");
    console.log(`📋 Contract: https://chainscan-testnet.0g.ai/address/${contractAddress}`);
    console.log(`📄 Transaction: https://chainscan-testnet.0g.ai/tx/${decentralizedIssueTracker.deployTransaction.hash}`);
    
    console.log("\n📋 For your 0G Chain integration:");
    console.log(`CONTRACT_ADDRESS = "${contractAddress}";`);
    console.log(`CHAIN_ID = 16601; // 0G Testnet`);
    console.log(`RPC_URL = "https://evmrpc-testnet.0g.ai";`);
    
    // Wait for additional confirmations
    console.log("\n⏳ Waiting for additional confirmations...");
    await decentralizedIssueTracker.deployTransaction.wait(2);
    
    try {
      // Verify contract state
      console.log("\n🔍 Verifying contract state:");
      const owner = await decentralizedIssueTracker.owner();
      console.log(`👤 Contract Owner: ${owner}`);
      
      // Check if deployer is verified
      const isDeployerVerified = await decentralizedIssueTracker.isAddressVerified(deployer.address);
      console.log(`✅ Deployer verified: ${isDeployerVerified}`);
      
      // Get deadline durations
      const durations = await decentralizedIssueTracker.getDeadlineDurations();
      console.log(`⏰ Easy duration: ${durations.easy} seconds`);
      console.log(`⏰ Medium duration: ${durations.medium} seconds`);  
      console.log(`⏰ Hard duration: ${durations.hard} seconds`);
      
      console.log("\n🎉 Contract successfully deployed and verified on 0G Chain!");
      
    } catch (error) {
      console.log("\n⚠️  Could not verify contract state immediately");
      console.log("Error:", error.message);
      console.log("This is normal - the contract was deployed successfully.");
      console.log("You can verify the state manually using the explorer links above.");
    }

    return {
      contractAddress,
      transactionHash: decentralizedIssueTracker.deployTransaction.hash,
      gasUsed: deploymentReceipt.gasUsed.toString(),
      deploymentCost: ethers.utils.formatEther(deploymentCost),
    };

  } catch (error) {
    console.error("\n❌ Deployment failed:");
    console.error("Error:", error.message);
    
    if (error.code === 'INSUFFICIENT_FUNDS') {
      console.log("\n💡 Troubleshooting:");
      console.log("1. Get testnet OG tokens from: https://faucet.0g.ai");
      console.log("2. Check your balance with: npx hardhat show-balance --network og-testnet");
    }
    
    if (error.code === 'NETWORK_ERROR') {
      console.log("\n💡 Network issue detected:");
      console.log("1. Check your internet connection");
      console.log("2. Verify RPC endpoint is accessible: https://evmrpc-testnet.0g.ai");
      console.log("3. Try again in a few moments");
    }
    
    throw error;
  }
};