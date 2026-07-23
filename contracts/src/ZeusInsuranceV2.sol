// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract ZeusInsuranceV2 is AccessControl, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    uint256 public constant XLAYER_CHAIN_ID = 196;
    uint256 public constant ALL_INCLUSIVE_MASK = 0x1F;
    uint256 public constant BPS = 10_000;
    uint256 public constant DEFAULT_PENALTY_SCORE = 10_000;

    bytes32 public constant INSURANCE_MANAGER_ROLE = keccak256("INSURANCE_MANAGER_ROLE");
    bytes32 public constant CLAIM_EVALUATOR_ROLE = keccak256("CLAIM_EVALUATOR_ROLE");

    enum CoverageType { APIFailure, NetworkError, WalletLimit, GasShortage, MCPError, ArbitrationRisk }
    enum PolicyStatus { Active, Claimed, Expired, Cancelled }

    struct Policy {
        address buyer;
        address seller;
        uint256 amount;
        uint256 premium;
        uint256 timeout;
        uint256 coverageMask;
        PolicyStatus status;
        string metadata;
    }

    uint256 private _policyIdCounter;
    mapping(uint256 => Policy) public policies;
    mapping(address => uint256) public penaltyScores;
    address public paymentToken;

    event PolicyCreated(uint256 indexed policyId, address indexed buyer, address indexed seller, uint256 amount, uint256 premium, uint256 coverageMask, uint256 timeout, string metadata);
    event PolicyClaimed(uint256 indexed policyId, address indexed buyer, uint256 payout);
    event PolicyExpired(uint256 indexed policyId);
    event PolicyCancelled(uint256 indexed policyId);
    event PenaltyScoreUpdated(address indexed agent, uint256 oldScore, uint256 newScore);
    event PaymentTokenUpdated(address oldToken, address newToken);

    modifier onlyXLayer() {
        require(block.chainid == XLAYER_CHAIN_ID, "Zeus: not X Layer");
        _;
    }

    modifier policyActive(uint256 policyId) {
        require(policies[policyId].status == PolicyStatus.Active, "Zeus: policy not active");
        _;
    }

    constructor(address admin, address _paymentToken) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(INSURANCE_MANAGER_ROLE, admin);
        _grantRole(CLAIM_EVALUATOR_ROLE, admin);
        paymentToken = _paymentToken;
    }

    function pause() external onlyRole(INSURANCE_MANAGER_ROLE) { _pause(); }
    function unpause() external onlyRole(INSURANCE_MANAGER_ROLE) { _unpause(); }

    function setPaymentToken(address token) external onlyRole(DEFAULT_ADMIN_ROLE) {
        emit PaymentTokenUpdated(paymentToken, token);
        paymentToken = token;
    }

    function setPenaltyScore(address agent, uint256 scoreBps) external onlyRole(INSURANCE_MANAGER_ROLE) {
        require(scoreBps >= BPS && scoreBps <= 3 * BPS, "Zeus: invalid score");
        uint256 old = penaltyScores[agent];
        penaltyScores[agent] = scoreBps;
        emit PenaltyScoreUpdated(agent, old, scoreBps);
    }

    function buyPolicy(address seller, uint256 amount, uint256 coverageMask, uint256 timeoutSeconds, string calldata metadata)
        external payable onlyXLayer whenNotPaused nonReentrant returns (uint256 policyId)
    {
        require(coverageMask != 0, "Zeus: empty coverage");
        require((coverageMask & (1 << uint256(CoverageType.ArbitrationRisk))) == 0, "Zeus: arbitration is separate product");
        require(amount > 0 && timeoutSeconds > 0, "Zeus: invalid params");

        uint256 premium = _quote(coverageMask, msg.sender, amount);
        _collectPremium(msg.sender, premium);

        policyId = _policyIdCounter;
        unchecked { _policyIdCounter++; }

        policies[policyId] = Policy({
            buyer: msg.sender,
            seller: seller,
            amount: amount,
            premium: premium,
            timeout: block.timestamp + timeoutSeconds,
            coverageMask: coverageMask,
            status: PolicyStatus.Active,
            metadata: metadata
        });

        emit PolicyCreated(policyId, msg.sender, seller, amount, premium, coverageMask, timeoutSeconds, metadata);
    }

    function buyAllInclusivePolicy(address seller, uint256 amount, uint256 timeoutSeconds, string calldata metadata)
        external payable onlyXLayer whenNotPaused nonReentrant returns (uint256)
    {
        return _buyInternal(seller, amount, ALL_INCLUSIVE_MASK, timeoutSeconds, metadata);
    }

    function _buyInternal(address seller, uint256 amount, uint256 coverageMask, uint256 timeoutSeconds, string calldata metadata)
        internal returns (uint256 policyId)
    {
        uint256 premium = _quote(coverageMask, msg.sender, amount);
        _collectPremium(msg.sender, premium);

        policyId = _policyIdCounter;
        unchecked { _policyIdCounter++; }

        policies[policyId] = Policy({
            buyer: msg.sender,
            seller: seller,
            amount: amount,
            premium: premium,
            timeout: block.timestamp + timeoutSeconds,
            coverageMask: coverageMask,
            status: PolicyStatus.Active,
            metadata: metadata
        });

        emit PolicyCreated(policyId, msg.sender, seller, amount, premium, coverageMask, timeoutSeconds, metadata);
    }

    function claim(uint256 policyId, address payable to, uint256 payoutAmount)
        external onlyRole(CLAIM_EVALUATOR_ROLE) policyActive(policyId) nonReentrant
    {
        Policy storage p = policies[policyId];
        require(block.timestamp <= p.timeout, "Zeus: expired");
        require(payoutAmount <= p.amount, "Zeus: payout>amount");

        p.status = PolicyStatus.Claimed;
        _sendPayment(to, payoutAmount);
        emit PolicyClaimed(policyId, p.buyer, payoutAmount);
    }

    function expire(uint256 policyId) external policyActive(policyId) {
        Policy storage p = policies[policyId];
        require(block.timestamp > p.timeout, "Zeus: not expired yet");
        p.status = PolicyStatus.Expired;
        emit PolicyExpired(policyId);
    }

    function cancel(uint256 policyId) external policyActive(policyId) {
        Policy storage p = policies[policyId];
        require(msg.sender == p.buyer, "Zeus: not buyer");
        p.status = PolicyStatus.Cancelled;
        emit PolicyCancelled(policyId);
    }

    function getPolicy(uint256 policyId) external view returns (Policy memory) {
        return policies[policyId];
    }

    function hasCoverage(uint256 policyId, CoverageType ct) external view returns (bool) {
        return (policies[policyId].coverageMask & (1 << uint256(ct))) != 0;
    }

    function currentPolicyId() external view returns (uint256) {
        return _policyIdCounter > 0 ? _policyIdCounter - 1 : 0;
    }

    function quote(uint256 coverageMask, address agent, uint256 amount) external view returns (uint256) {
        return _quote(coverageMask, agent, amount);
    }

    function _quote(uint256 coverageMask, address agent, uint256 amount) internal view returns (uint256) {
        uint256 penalty = penaltyScores[agent] == 0 ? DEFAULT_PENALTY_SCORE : penaltyScores[agent];
        // Simplified pricing — API server uses full formula
        return (amount * coverageMask * penalty / BPS) / 10;
    }

    function _collectPremium(address from, uint256 amount) internal {
        if (paymentToken == address(0)) {
            require(msg.value >= amount, "Zeus: insufficient premium");
            if (msg.value > amount) {
                payable(from).transfer(msg.value - amount);
            }
        } else {
            require(msg.value == 0, "Zeus: native not accepted");
            IERC20(paymentToken).safeTransferFrom(from, address(this), amount);
        }
    }

    function _sendPayment(address payable to, uint256 amount) internal {
        if (paymentToken == address(0)) {
            to.transfer(amount);
        } else {
            IERC20(paymentToken).safeTransfer(to, amount);
        }
    }

    receive() external payable {}
}
