// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract ZeusArbitrationRisk is AccessControl, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    uint256 public constant XLAYER_CHAIN_ID = 196;
    uint256 public constant BPS = 10_000;
    uint256 public constant ARBITRATION_RATE_BPS = 800;

    bytes32 public constant ARBITRATION_EVALUATOR_ROLE = keccak256("ARBITRATION_EVALUATOR_ROLE");

    enum ArbStatus { Active, Resolved, Paid, Expired }

    struct ArbPolicy {
        address buyer;
        uint256 amount;
        uint256 premium;
        bytes32 caseId;
        uint256 timeout;
        ArbStatus status;
        string metadata;
    }

    uint256 private _arbIdCounter;
    mapping(uint256 => ArbPolicy) public arbPolicies;
    address public paymentToken;

    event ArbitrationPolicyPurchased(uint256 indexed policyId, address indexed buyer, bytes32 indexed caseId, uint256 amount, uint256 premium, uint256 timeout);
    event ArbitrationPayout(uint256 indexed policyId, address indexed buyer, uint256 payout);
    event ArbitrationPolicyExpired(uint256 indexed policyId);

    constructor(address admin, address _paymentToken) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ARBITRATION_EVALUATOR_ROLE, admin);
        paymentToken = _paymentToken;
    }

    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) { _pause(); }
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) { _unpause(); }

    function buyArbitrationInsurance(uint256 amount, bytes32 caseId, uint256 timeoutSeconds)
        external payable whenNotPaused nonReentrant returns (uint256 policyId)
    {
        require(block.chainid == XLAYER_CHAIN_ID, "ZAR: only X Layer");
        require(amount > 0 && caseId != bytes32(0) && timeoutSeconds > 0, "ZAR: invalid params");

        uint256 premium = (amount * ARBITRATION_RATE_BPS) / BPS;
        _collect(msg.sender, premium);

        policyId = _arbIdCounter;
        unchecked { _arbIdCounter++; }

        arbPolicies[policyId] = ArbPolicy({
            buyer: msg.sender,
            amount: amount,
            premium: premium,
            caseId: caseId,
            timeout: block.timestamp + timeoutSeconds,
            status: ArbStatus.Active,
            metadata: ""
        });

        emit ArbitrationPolicyPurchased(policyId, msg.sender, caseId, amount, premium, timeoutSeconds);
    }

    function claimArbitrationPayout(uint256 policyId) external onlyRole(ARBITRATION_EVALUATOR_ROLE) nonReentrant {
        ArbPolicy storage p = arbPolicies[policyId];
        require(p.status == ArbStatus.Active, "ZAR: not active");
        require(block.timestamp <= p.timeout, "ZAR: expired");
        p.status = ArbStatus.Paid;
        _send(payable(p.buyer), p.amount);
        emit ArbitrationPayout(policyId, p.buyer, p.amount);
    }

    function expire(uint256 policyId) external {
        ArbPolicy storage p = arbPolicies[policyId];
        require(p.status == ArbStatus.Active, "ZAR: not active");
        require(block.timestamp > p.timeout, "ZAR: not expired");
        p.status = ArbStatus.Expired;
        emit ArbitrationPolicyExpired(policyId);
    }

    function getPolicy(uint256 policyId) external view returns (ArbPolicy memory) {
        return arbPolicies[policyId];
    }

    function quote(uint256 amount) external pure returns (uint256) {
        return (amount * ARBITRATION_RATE_BPS) / BPS;
    }

    function _collect(address from, uint256 value) internal {
        if (paymentToken == address(0)) {
            require(msg.value >= value, "ZAR: insufficient premium");
            if (msg.value > value) {
                payable(from).transfer(msg.value - value);
            }
        } else {
            require(msg.value == 0, "ZAR: no native expected");
            IERC20(paymentToken).safeTransferFrom(from, address(this), value);
        }
    }

    function _send(address payable to, uint256 value) internal {
        if (paymentToken == address(0)) {
            to.transfer(value);
        } else {
            IERC20(paymentToken).safeTransfer(to, value);
        }
    }

    receive() external payable {}
}
