// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title ZeusEscrowBOT
 * @notice Trustless ERC-20 escrow for BOT Chain transactions.
 *
 * Roles:
 *   Initiator — funds the agreement (the paying party).
 *   Executor  — fulfills the agreement and receives payment.
 *
 * Flow:
 *   1. Initiator calls depositAndCreateAgreement() — tokens are locked in escrow.
 *   2. Executor calls confirmExecution() after delivering — tokens are released to Executor.
 *      OR
 *   3. Initiator calls requestRefund() after timeout — tokens are returned to Initiator.
 */
contract ZeusEscrowBOT is ReentrancyGuard {
    using SafeERC20 for IERC20;

    // -------------------------------------------------------------------------
    // Types
    // -------------------------------------------------------------------------

    enum AgreementStatus { Active, Completed, Refunded }

    struct Agreement {
        address initiator;   // Party that deposited funds
        address executor;    // Party that must fulfill the agreement
        uint256 amount;      // Token amount locked in escrow (token-native units)
        uint256 timeout;     // Duration in seconds before initiator may refund
        uint256 createdAt;   // Block timestamp at agreement creation
        AgreementStatus status;
        bytes proof;         // Off-chain proof submitted by executor (stored as-is, not validated)
    }

    // -------------------------------------------------------------------------
    // State
    // -------------------------------------------------------------------------

    /// @notice The ERC-20 token used for all agreements (e.g. USDC, BOT token).
    IERC20 public immutable token;

    /// @notice Auto-incrementing agreement counter; also used as the agreement ID.
    uint256 public agreementCount;

    /// @notice agreementId => Agreement
    mapping(uint256 => Agreement) public agreements;

    // -------------------------------------------------------------------------
    // Events
    // -------------------------------------------------------------------------

    event AgreementCreated(
        uint256 indexed agreementId,
        address indexed initiator,
        address indexed executor,
        uint256 amount,
        uint256 timeout,
        uint256 createdAt
    );

    /// @param proof  Off-chain evidence submitted by the executor (stored on-chain for auditability).
    event ExecutionConfirmed(
        uint256 indexed agreementId,
        address indexed executor,
        uint256 amount,
        bytes   proof
    );

    event RefundIssued(
        uint256 indexed agreementId,
        address indexed initiator,
        uint256 amount
    );

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    /**
     * @param _token Address of the ERC-20 token used for escrow settlements.
     */
    constructor(address _token) {
        require(_token != address(0), "ZeusEscrowBOT: zero token address");
        token = IERC20(_token);
    }

    // -------------------------------------------------------------------------
    // Initiator actions
    // -------------------------------------------------------------------------

    /**
     * @notice Deposit tokens and open a new escrow agreement.
     * @param executor  Address of the party that must fulfill the agreement.
     * @param amount    Token amount to lock (in the token's native units).
     * @param timeout   Seconds from now after which the initiator may request a refund.
     * @return agreementId  The ID of the newly created agreement.
     *
     * Requirements:
     *   - Caller must have approved this contract for at least `amount` tokens.
     *   - `executor` must differ from the caller.
     *   - `amount` and `timeout` must be non-zero.
     */
    function depositAndCreateAgreement(
        address executor,
        uint256 amount,
        uint256 timeout
    ) external nonReentrant returns (uint256 agreementId) {
        require(executor != address(0),   "ZeusEscrowBOT: zero executor address");
        require(executor != msg.sender,   "ZeusEscrowBOT: initiator and executor must differ");
        require(amount  > 0,              "ZeusEscrowBOT: amount must be positive");
        require(timeout > 0,              "ZeusEscrowBOT: timeout must be positive");

        token.safeTransferFrom(msg.sender, address(this), amount);

        agreementId = ++agreementCount;
        agreements[agreementId] = Agreement({
            initiator: msg.sender,
            executor:  executor,
            amount:    amount,
            timeout:   timeout,
            createdAt: block.timestamp,
            status:    AgreementStatus.Active,
            proof:     ""
        });

        emit AgreementCreated(
            agreementId,
            msg.sender,
            executor,
            amount,
            timeout,
            block.timestamp
        );
    }

    /**
     * @notice Initiator reclaims funds when the executor has not delivered within the timeout.
     * @param agreementId  ID of the agreement to refund.
     *
     * Requirements:
     *   - Caller must be the initiator.
     *   - Agreement must still be Active.
     *   - `timeout` seconds must have elapsed since creation.
     */
    function requestRefund(uint256 agreementId) external nonReentrant {
        Agreement storage ag = agreements[agreementId];

        require(ag.initiator != address(0),           "ZeusEscrowBOT: agreement does not exist");
        require(ag.status == AgreementStatus.Active,  "ZeusEscrowBOT: agreement not active");
        require(msg.sender == ag.initiator,           "ZeusEscrowBOT: only initiator can request refund");
        require(
            block.timestamp >= ag.createdAt + ag.timeout,
            "ZeusEscrowBOT: timeout has not elapsed yet"
        );

        ag.status = AgreementStatus.Refunded;
        token.safeTransfer(ag.initiator, ag.amount);

        emit RefundIssued(agreementId, ag.initiator, ag.amount);
    }

    // -------------------------------------------------------------------------
    // Executor actions
    // -------------------------------------------------------------------------

    /**
     * @notice Executor confirms delivery and releases escrowed tokens to themselves.
     * @param agreementId  ID of the agreement being fulfilled.
     * @param proof        Off-chain proof of delivery (e.g. IPFS CID, tx hash, signed receipt).
     *                     Stored on-chain via the event for auditability; not validated here.
     *
     * Requirements:
     *   - Caller must be the executor.
     *   - Agreement must still be Active.
     */
    function confirmExecution(
        uint256 agreementId,
        bytes calldata proof
    ) external nonReentrant {
        Agreement storage ag = agreements[agreementId];

        require(ag.initiator != address(0),           "ZeusEscrowBOT: agreement does not exist");
        require(ag.status == AgreementStatus.Active,  "ZeusEscrowBOT: agreement not active");
        require(msg.sender == ag.executor,            "ZeusEscrowBOT: only executor can confirm");

        ag.status = AgreementStatus.Completed;
        ag.proof  = proof;
        token.safeTransfer(ag.executor, ag.amount);

        emit ExecutionConfirmed(agreementId, ag.executor, ag.amount, proof);
    }

    // -------------------------------------------------------------------------
    // View helpers
    // -------------------------------------------------------------------------

    /**
     * @notice Returns full details for a given agreement.
     */
    function getAgreement(uint256 agreementId)
        external
        view
        returns (Agreement memory)
    {
        require(
            agreements[agreementId].initiator != address(0),
            "ZeusEscrowBOT: agreement does not exist"
        );
        return agreements[agreementId];
    }
}
