// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

contract DecentralizedIssueTracker is ReentrancyGuard, Ownable, Pausable {
    
    event OrganizationRegistered(address indexed org, string repoUrl, uint256 stakedAmount);
    event IssueCreated(uint256 indexed issueId, address indexed org, string githubIssueUrl, uint256 bounty, Difficulty difficulty);
    event IssueAssigned(uint256 indexed issueId, address indexed contributor, uint256 deadline);
    event IssueCompleted(uint256 indexed issueId, address indexed contributor, uint256 reward);
    event BountyIncreased(uint256 indexed issueId, uint256 newBounty);
    event StakeWithdrawn(address indexed user, uint256 amount);
    event AddressVerified(address indexed verifiedAddress);
    event AddressUnverified(address indexed unverifiedAddress);
    event DeadlineExpired(uint256 indexed issueId, address indexed contributor);
    
    enum Difficulty { EASY, MEDIUM, HARD }
    
    struct Organization {
        string repoUrl;
        uint256 totalStaked;
        uint256 availableRewards;
        bool isActive;
        address owner;
        uint256 easyDuration;
        uint256 mediumDuration;
        uint256 hardDuration;
    }
    
    struct Issue {
        uint256 id;
        address org;
        string githubIssueUrl;
        string description;
        uint256 bounty;
        address assignedTo;
        bool isCompleted;
        bool isAssigned;
        uint256 createdAt;
        Difficulty difficulty;
        uint256 deadline;
        uint256 presentHackerConfidenceScore;
    }
    
    mapping(address => Organization) public organizations;
    mapping(uint256 => Issue) public issues;
    mapping(address => uint256) public contributorStakes;
    mapping(address => uint256[]) public organizationIssues;
    mapping(address => uint256[]) public contributorAssignedIssues;
    mapping(uint256 => address[]) public issuePreviousContributors;
    mapping(uint256 => mapping(address => bool)) public hasAttemptedIssue;
    
    uint256 public nextIssueId = 1;
    uint256 public constant MIN_ORG_STAKE = 0.01 ether;
    address public AI_AGENT_ADDRESS = 0x0000000000000000000000000000000000000000; 

    uint256 public constant MIN_CONTRIBUTOR_STAKE_PERCENTAGE = 5;
    uint256 public constant MAX_CONTRIBUTOR_STAKE_PERCENTAGE = 20;
    
    uint256 public constant DEFAULT_EASY_DURATION = 7 days;      
    uint256 public constant DEFAULT_MEDIUM_DURATION = 30 days;   
    uint256 public constant DEFAULT_HARD_DURATION = 150 days;   
    
    modifier onlyRegisteredOrg() {
        require(organizations[msg.sender].isActive, "Organization not registered or inactive");
        _;
    }
    
    modifier onlyOrgOwner(address org) {
        require(organizations[org].owner == msg.sender, "Only organization owner can call this");
        _;
    }

    modifier onlyAIAgent() {
        require(AI_AGENT_ADDRESS == msg.sender, "Only AI Agent can call this");
        _;
    }
    
    modifier onlyVerified() {
        require(AI_AGENT_ADDRESS == msg.sender, "Only AI Agent can call this");
        require(organizations[msg.sender].isActive, "Organization not registered or inactive");
        _;
    }
    
    constructor(
        address _aiAgentAddress
    ) Ownable(msg.sender) {
        AI_AGENT_ADDRESS = _aiAgentAddress;
    }
    
    function registerOrganization(
        string memory _repoUrl,
        uint256 _easyDuration,
        uint256 _mediumDuration,
        uint256 _hardDuration
    ) external payable {
        require(msg.value >= MIN_ORG_STAKE , "Invalid stake amount");
        require(!organizations[msg.sender].isActive, "Organization already registered");
        require(bytes(_repoUrl).length > 0, "Repository URL cannot be empty");
        
        uint256 easyDur = _easyDuration > 0 ? _easyDuration : DEFAULT_EASY_DURATION;
        uint256 mediumDur = _mediumDuration > 0 ? _mediumDuration : DEFAULT_MEDIUM_DURATION;
        uint256 hardDur = _hardDuration > 0 ? _hardDuration : DEFAULT_HARD_DURATION;
        
        organizations[msg.sender] = Organization({
            repoUrl: _repoUrl,
            totalStaked: msg.value,
            availableRewards: msg.value,
            isActive: true,
            owner: msg.sender,
            easyDuration: easyDur,
            mediumDuration: mediumDur,
            hardDuration: hardDur
        });
        
        emit OrganizationRegistered(msg.sender, _repoUrl, msg.value);
    }
    
    function addFundsToOrganization() external payable onlyRegisteredOrg {
        require(msg.value > 0, "Must send some ETH");
        
        organizations[msg.sender].totalStaked += msg.value;
        organizations[msg.sender].availableRewards += msg.value;
    }
    
    function createIssue(
        string memory _githubIssueUrl,
        string memory _description,
        uint256 _bounty,
        Difficulty _difficulty,
        address _org
    ) external onlyVerified() returns (uint256) {
        require(organizations[_org].isActive, "Organization not registered or inactive");
        require(_bounty > 0, "Bounty must be greater than 0");
        require(organizations[_org].availableRewards >= _bounty, "Insufficient organization funds");
        require(bytes(_githubIssueUrl).length > 0, "GitHub issue URL cannot be empty");
        
        uint256 issueId = nextIssueId++;
        
        issues[issueId] = Issue({
            id: issueId,
            org: _org,
            githubIssueUrl: _githubIssueUrl,
            description: _description,
            bounty: _bounty,
            assignedTo: address(0),
            isCompleted: false,
            isAssigned: false,
            createdAt: block.timestamp,
            difficulty: _difficulty,
            deadline: 0,
            presentHackerConfidenceScore: 0
        });
        
        organizations[_org].availableRewards -= _bounty;
        organizationIssues[_org].push(issueId);
        
        emit IssueCreated(issueId, msg.sender, _githubIssueUrl, _bounty, _difficulty);
        return issueId;
    }
    
    function takeIssue(uint256 _issueId) external payable nonReentrant {
        Issue storage issue = issues[_issueId];
        require(issue.id != 0, "Issue does not exist");
        require(!issue.isAssigned, "Issue already assigned");
        require(!issue.isCompleted, "Issue already completed");
        require(msg.sender != issue.org, "Organization cannot assign issue to itself");
        require(!hasAttemptedIssue[_issueId][msg.sender], "You have already attempted this issue");
        
        uint256 requiredStake = (issue.bounty * MIN_CONTRIBUTOR_STAKE_PERCENTAGE) / 100;
        uint256 maxStake = (issue.bounty * MAX_CONTRIBUTOR_STAKE_PERCENTAGE) / 100;
        
        require(msg.value >= requiredStake && msg.value <= maxStake, "Invalid stake amount");
        
        Organization storage org = organizations[issue.org];
        uint256 deadline;
        if (issue.difficulty == Difficulty.EASY) {
            deadline = block.timestamp + org.easyDuration;
        } else if (issue.difficulty == Difficulty.MEDIUM) {
            deadline = block.timestamp + org.mediumDuration;
        } else {
            deadline = block.timestamp + org.hardDuration;
        }
        
        issue.assignedTo = msg.sender;
        issue.isAssigned = true;
        issue.deadline = deadline;
        
        hasAttemptedIssue[_issueId][msg.sender] = true;
        issuePreviousContributors[_issueId].push(msg.sender);
        
        contributorStakes[msg.sender] += msg.value;
        contributorAssignedIssues[msg.sender].push(_issueId);
        
        emit IssueAssigned(_issueId, msg.sender, deadline);
    }
    
    function gradeIssueByAI(uint256 _issueId, uint256 _confidenceScore) external nonReentrant onlyAIAgent{
        Issue storage issue = issues[_issueId];
        require(issue.id != 0, "Issue does not exist");
        require(msg.sender == organizations[issue.org].owner, "Only organization owner can grade issue");
        require(issue.isAssigned, "Issue not assigned");
        require(!issue.isCompleted, "Issue already completed");
        
        issue.presentHackerConfidenceScore = _confidenceScore;
        issue.isCompleted = true;
        uint256 contributorStake = contributorStakes[issue.assignedTo];
        uint256 totalReward = issue.bounty + contributorStake;
        contributorStakes[issue.assignedTo] -= contributorStake;
        payable(issue.assignedTo).transfer(totalReward);
        
        emit IssueCompleted(_issueId, issue.assignedTo, totalReward);
    }

    function completeIssue(uint256 _issueId) external nonReentrant {
        Issue storage issue = issues[_issueId];
        require(issue.id != 0, "Issue does not exist");
        require(issue.presentHackerConfidenceScore > 0, "Issue not graded by AI");
        require(msg.sender == organizations[issue.org].owner, "Only organization owner can complete issue");
        require(issue.isAssigned, "Issue not assigned");
        require(!issue.isCompleted, "Issue already completed");
        
        issue.isCompleted = true;
        uint256 contributorStake = contributorStakes[issue.assignedTo];
        uint256 totalReward = issue.bounty + contributorStake;
        contributorStakes[issue.assignedTo] -= contributorStake;
        payable(issue.assignedTo).transfer(totalReward);
        
        emit IssueCompleted(_issueId, issue.assignedTo, totalReward);
    }
    
    function claimExpiredIssue(uint256 _issueId) external nonReentrant {
        Issue storage issue = issues[_issueId];
        require(issue.id != 0, "Issue does not exist");
        require(issue.isAssigned, "Issue not assigned");
        require(!issue.isCompleted, "Issue already completed");
        require(issue.assignedTo == msg.sender, "Only assigned contributor can claim");
        require(block.timestamp > issue.deadline, "Deadline has not passed");
        
        issue.isAssigned = false;
        issue.assignedTo = address(0);
        issue.deadline = 0;
        issue.presentHackerConfidenceScore = 0;
        
        organizations[issue.org].availableRewards += issue.bounty;
        uint256 contributorStake = contributorStakes[msg.sender];
        contributorStakes[msg.sender] -= contributorStake;
        _removeIssueFromContributor(msg.sender, _issueId);
        payable(msg.sender).transfer(contributorStake);
        
        emit DeadlineExpired(_issueId, msg.sender);
    }
    
    function _removeIssueFromContributor(address _contributor, uint256 _issueId) internal {
        uint256[] storage assignedIssues = contributorAssignedIssues[_contributor];
        for (uint256 i = 0; i < assignedIssues.length; i++) {
            if (assignedIssues[i] == _issueId) {
                assignedIssues[i] = assignedIssues[assignedIssues.length - 1];
                assignedIssues.pop();
                break;
            }
        }
    }
    
    function increaseBounty(uint256 _issueId) external payable onlyRegisteredOrg {
        Issue storage issue = issues[_issueId];
        require(issue.id != 0, "Issue does not exist");
        require(issue.org == msg.sender, "Only issue creator can increase bounty");
        require(!issue.isCompleted, "Cannot increase bounty for completed issue");
        require(msg.value > 0, "Must send some ETH");
        
        organizations[msg.sender].totalStaked += msg.value;
        issue.bounty += msg.value;
        
        emit BountyIncreased(_issueId, issue.bounty);
    }
    
    function withdrawStake() external nonReentrant {
        uint256 stakeAmount = contributorStakes[msg.sender];
        require(stakeAmount > 0, "No stake to withdraw");
        
        contributorStakes[msg.sender] = 0;
        payable(msg.sender).transfer(stakeAmount);
        
        emit StakeWithdrawn(msg.sender, stakeAmount);
    }
    
    function updateOrganizationDeadlines(
        uint256 _easyDuration,
        uint256 _mediumDuration,
        uint256 _hardDuration
    ) external onlyRegisteredOrg {
        require(_easyDuration > 0, "Easy duration must be greater than 0");
        require(_mediumDuration > 0, "Medium duration must be greater than 0");
        require(_hardDuration > 0, "Hard duration must be greater than 0");
        
        Organization storage org = organizations[msg.sender];
        org.easyDuration = _easyDuration;
        org.mediumDuration = _mediumDuration;
        org.hardDuration = _hardDuration;
    }
    
    function getOrganizationInfo(address _org) external view returns (
        string memory repoUrl,
        uint256 totalStaked,
        uint256 availableRewards,
        bool isActive,
        address owner,
        uint256 easyDuration,
        uint256 mediumDuration,
        uint256 hardDuration
    ) {
        Organization storage org = organizations[_org];
        return (
            org.repoUrl, 
            org.totalStaked, 
            org.availableRewards, 
            org.isActive, 
            org.owner,
            org.easyDuration,
            org.mediumDuration,
            org.hardDuration
        );
    }
    
    function getIssueInfo(uint256 _issueId) external view returns (
        address org,
        string memory githubIssueUrl,
        string memory description,
        uint256 bounty,
        address assignedTo,
        bool isCompleted,
        bool isAssigned,
        uint256 createdAt,
        Difficulty difficulty,
        uint256 deadline
    ) {
        Issue storage issue = issues[_issueId];
        return (
            issue.org,
            issue.githubIssueUrl,
            issue.description,
            issue.bounty,
            issue.assignedTo,
            issue.isCompleted,
            issue.isAssigned,
            issue.createdAt,
            issue.difficulty,
            issue.deadline
        );
    }
    
    function getOrganizationIssues(address _org) external view returns (uint256[] memory) {
        return organizationIssues[_org];
    }
    
    function getContributorAssignedIssues(address _contributor) external view returns (uint256[] memory) {
        return contributorAssignedIssues[_contributor];
    }
    
    function getIssuePreviousContributors(uint256 _issueId) external view returns (address[] memory) {
        return issuePreviousContributors[_issueId];
    }
    
    function hasContributorAttemptedIssue(uint256 _issueId, address _contributor) external view returns (bool) {
        return hasAttemptedIssue[_issueId][_contributor];
    }
    
    function isIssueExpired(uint256 _issueId) external view returns (bool) {
        Issue storage issue = issues[_issueId];
        return issue.isAssigned && !issue.isCompleted && block.timestamp > issue.deadline;
    }
    
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }
}