/*-
 *
 * Hedera Hardhat Example Project
 *
 * Copyright (C) 2023 Hedera Hashgraph, LLC
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
const AIAgentAddress = ""; // Replace with the actual address you want to add
module.exports = async () => {
  // Assign the first signer, which comes from the first privateKey from our configuration in hardhat.config.js, to a wallet variable.
  let wallet = (await ethers.getSigners())[0];
  
  console.log("🚀 Starting deployment of DecentralizedIssueTracker...");
  console.log("👤 Deploying with account:", wallet.address);

  // Initialize a contract factory object
  // name of contract as first parameter
  // wallet/signer used for signing the contract calls/transactions with this contract
  const DecentralizedIssueTracker = await ethers.getContractFactory("DecentralizedIssueTracker", wallet);

  // Constructor parameters for DecentralizedIssueTracker
  const aiAgentAddress = wallet.address; // Replace with the actual address you want to add
  
  // Duration settings (in seconds) 150 days

  console.log("📋 Constructor parameters:");
  console.log("AI addresses:", aiAgentAddress);


  // Using already initialized contract factory object with our contract, we can invoke deploy function to deploy the contract.
  // Accepts constructor parameters from our contract
  const decentralizedIssueTracker = await DecentralizedIssueTracker.deploy(
    aiAgentAddress,  // address[] memory _initialVerifiedAddresse
  );

  console.log("⏳ Waiting for deployment confirmation...");

  // Wait for the contract to be deployed
  await decentralizedIssueTracker.deployed();
  
  // We use wait to receive the transaction (deployment) receipt, which contains gasUsed info
  const deploymentReceipt = await decentralizedIssueTracker.deployTransaction.wait();
  
  // Use the contract instance address directly - this is the correct address
  const contractAddress = decentralizedIssueTracker.address;

  console.log("✅ DecentralizedIssueTracker contract deployed successfully!");
  console.log(`📍 Contract Address: ${contractAddress}`);
  console.log(`🔗 Transaction Hash: ${decentralizedIssueTracker.deployTransaction.hash}`);
  console.log(`⛽ Gas Used: ${deploymentReceipt.gasUsed?.toString()}`);
  
  // Convert to Hedera account ID format (you'll need this for your plugin)
  console.log("\n📋 For your Hedera Agent Kit plugin:");
  console.log(`CONTRACT_ID = "${contractAddress}"; // Update this in your plugin`);
  
  // Wait for additional confirmations before calling contract methods
  console.log("\n⏳ Waiting for additional confirmations...");
  await decentralizedIssueTracker.deployTransaction.wait(2);
  
  try {
    // Verify the contract owner
    const owner = await decentralizedIssueTracker.owner();
    console.log(`👤 Contract Owner: ${owner}`);
    
    // Verify initial setup
    console.log("\n🔍 Verifying initial setup:");
    const isDeployerVerified = await decentralizedIssueTracker.isAddressVerified(wallet.address);
    console.log(`✅ Deployer (${wallet.address}) is verified: ${isDeployerVerified}`);
    
    const durations = await decentralizedIssueTracker.getDeadlineDurations();
    console.log(`⏰ Easy duration: ${durations.easy} seconds`);
    console.log(`⏰ Medium duration: ${durations.medium} seconds`);  
    console.log(`⏰ Hard duration: ${durations.hard} seconds`);
  } catch (error) {
    console.log("\n⚠️  Could not verify contract state (this is OK if using Hedera testnet)");
    console.log("Error:", error.message);
    console.log("Contract was deployed successfully, you can verify manually.");
  }

  return contractAddress;
};