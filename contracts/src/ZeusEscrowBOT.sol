// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract ZeusEscrowBOT is AccessControl, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    using ECDSA for bytes32;

    enum EscrowType { Classic, Conditional, Recurring, MultiSig }
    enum EscrowStatus { Pending, Active, Released, Refunded, Disputed, Expired }

    struct EscrowAgreement {
        address buyer;
        address executor;
        address token;
        uint256 amount;
        uint256 timeout;
        EscrowType escrowType;
        bytes32 conditionHash;
        uint256 interval;
        uint256 requiredSignatures;
        EscrowStatus status;
        uint256 createdAt;
        uint256 lastReleasedAt;
        uint256 signaturesCount;
    }

    mapping(uint256 => EscrowAgreement) public escrows;
    mapping(uint256 => mapping(address => bool)) public hasSigned;
    mapping(uint256 => address[]) public signersList;

    uint256 private _escrowIdCounter;
    address public paymentToken;

    bytes32 public constant ESCROW_MANAGER_ROLE = keccak256("ESCROW_MANAGER_ROLE");
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");

    event EscrowCreated(uint256 indexed escrowId, address indexed buyer, address indexed executor, EscrowType escrowType, uint256 amount);
    event EscrowReleased(uint256 indexed escrowId, uint256 amount);
    event EscrowRefunded(uint256 indexed escrowId);
    event EscrowDisputed(uint256 indexed escrowId, address indexed by);
    event EscrowExpired(uint256 indexed escrowId);
    event MultiSigVote(uint256 indexed escrowId, address indexed signer, uint256 count);
    event ConditionResolved(uint256 indexed escrowId, bool fulfilled);

    constructor(address admin, address _paymentToken) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ESCROW_MANAGER_ROLE, admin);
        _grantRole(ORACLE_ROLE, admin);
        paymentToken = _paymentToken;
    }

    function pause() external onlyRole(ESCROW_MANAGER_ROLE) { _pause(); }
    function unpause() external onlyRole(ESCROW_MANAGER_ROLE) { _unpause(); }

    function createClassicEscrow(address executor, uint256 amount, uint256 timeoutSeconds)
        external payable whenNotPaused nonReentrant returns (uint256 escrowId)
    {
        require(executor != address(0) && amount > 0 && timeoutSeconds > 0, "ZE: invalid params");
        escrowId = _mintEscrow(msg.sender, executor, paymentToken, amount, timeoutSeconds, EscrowType.Classic);
        _lockFunds(msg.sender, paymentToken, amount);
        emit EscrowCreated(escrowId, msg.sender, executor, EscrowType.Classic, amount);
    }

    function createConditionalEscrow(address executor, uint256 amount, uint256 timeoutSeconds, bytes32 conditionHash)
        external payable whenNotPaused nonReentrant returns (uint256 escrowId)
    {
        require(conditionHash != bytes32(0), "ZE: empty condition");
        escrowId = _mintEscrow(msg.sender, executor, paymentToken, amount, timeoutSeconds, EscrowType.Conditional);
        escrows[escrowId].conditionHash = conditionHash;
        _lockFunds(msg.sender, paymentToken, amount);
        emit EscrowCreated(escrowId, msg.sender, executor, EscrowType.Conditional, amount);
    }

    function createRecurringEscrow(address executor, uint256 amount, uint256 timeoutSeconds, uint256 intervalSeconds)
        external payable whenNotPaused nonReentrant returns (uint256 escrowId)
    {
        require(intervalSeconds > 0, "ZE: zero interval");
        escrowId = _mintEscrow(msg.sender, executor, paymentToken, amount, timeoutSeconds, EscrowType.Recurring);
        escrows[escrowId].interval = intervalSeconds;
        escrows[escrowId].lastReleasedAt = block.timestamp;
        _lockFunds(msg.sender, paymentToken, amount);
        emit EscrowCreated(escrowId, msg.sender, executor, EscrowType.Recurring, amount);
    }

    function createMultiSigEscrow(address executor, uint256 amount, uint256 timeoutSeconds, address[] calldata _signers, uint256 requiredSignatures)
        external payable whenNotPaused nonReentrant returns (uint256 escrowId)
    {
        require(_signers.length > 0 && requiredSignatures > 0, "ZE: bad signers");
        require(requiredSignatures <= _signers.length, "ZE: required>signers");
        escrowId = _mintEscrow(msg.sender, executor, paymentToken, amount, timeoutSeconds, EscrowType.MultiSig);
        escrows[escrowId].requiredSignatures = requiredSignatures;
        for (uint256 i = 0; i < _signers.length; i++) {
            signersList[escrowId].push(_signers[i]);
        }
        _lockFunds(msg.sender, paymentToken, amount);
        emit EscrowCreated(escrowId, msg.sender, executor, EscrowType.MultiSig, amount);
    }

    function release(uint256 escrowId) external nonReentrant {
        EscrowAgreement storage e = escrows[escrowId];
        require(e.status == EscrowStatus.Active || e.status == EscrowStatus.Pending, "ZE: not releasable");
        require(block.timestamp <= e.timeout, "ZE: expired");

        if (e.escrowType == EscrowType.Classic) {
            _finalizeRelease(escrowId, e.amount);
        } else if (e.escrowType == EscrowType.Conditional) {
            require(hasRole(ORACLE_ROLE, msg.sender) || msg.sender == e.buyer, "ZE: not authorized");
            _finalizeRelease(escrowId, e.amount);
        } else if (e.escrowType == EscrowType.Recurring) {
            require(msg.sender == e.executor, "ZE: only executor");
            require(block.timestamp >= e.lastReleasedAt + e.interval, "ZE: too early");
            e.lastReleasedAt = block.timestamp;
            _sendToken(e.executor, e.token, e.amount);
            emit EscrowReleased(escrowId, e.amount);
        } else if (e.escrowType == EscrowType.MultiSig) {
            require(e.signaturesCount >= e.requiredSignatures, "ZE: not enough sigs");
            _finalizeRelease(escrowId, e.amount);
        }
    }

    function resolveCondition(uint256 escrowId, bool fulfilled, bytes32 expectedHash) external onlyRole(ORACLE_ROLE) {
        EscrowAgreement storage e = escrows[escrowId];
        require(e.escrowType == EscrowType.Conditional, "ZE: not conditional");
        require(e.conditionHash == expectedHash, "ZE: hash mismatch");
        emit ConditionResolved(escrowId, fulfilled);
        if (fulfilled) {
            _finalizeRelease(escrowId, e.amount);
        } else {
            _refund(escrowId);
        }
    }

    function sign(uint256 escrowId) external nonReentrant {
        EscrowAgreement storage e = escrows[escrowId];
        require(e.escrowType == EscrowType.MultiSig, "ZE: not multisig");
        require(!hasSigned[escrowId][msg.sender], "ZE: already signed");
        bool isSigner;
        address[] storage sigs = signersList[escrowId];
        for (uint256 i = 0; i < sigs.length; i++) {
            if (sigs[i] == msg.sender) { isSigner = true; break; }
        }
        require(isSigner, "ZE: not signer");
        hasSigned[escrowId][msg.sender] = true;
        e.signaturesCount += 1;
        emit MultiSigVote(escrowId, msg.sender, e.signaturesCount);
    }

    function refund(uint256 escrowId) external nonReentrant {
        EscrowAgreement storage e = escrows[escrowId];
        require(msg.sender == e.buyer, "ZE: not buyer");
        require(block.timestamp > e.timeout, "ZE: not expired");
        _refund(escrowId);
    }

    function dispute(uint256 escrowId) external {
        EscrowAgreement storage e = escrows[escrowId];
        require(msg.sender == e.buyer || msg.sender == e.executor, "ZE: not party");
        e.status = EscrowStatus.Disputed;
        emit EscrowDisputed(escrowId, msg.sender);
    }

    function getEscrow(uint256 escrowId) external view returns (EscrowAgreement memory) {
        return escrows[escrowId];
    }

    function getSigners(uint256 escrowId) external view returns (address[] memory) {
        return signersList[escrowId];
    }

    function currentEscrowId() external view returns (uint256) {
        return _escrowIdCounter > 0 ? _escrowIdCounter - 1 : 0;
    }

    function _mintEscrow(address buyer, address executor, address token, uint256 amount, uint256 timeout, EscrowType escrowType)
        internal returns (uint256 escrowId)
    {
        escrowId = _escrowIdCounter;
        unchecked { _escrowIdCounter++; }

        escrows[escrowId] = EscrowAgreement({
            buyer: buyer,
            executor: executor,
            token: token,
            amount: amount,
            timeout: block.timestamp + timeout,
            escrowType: escrowType,
            conditionHash: bytes32(0),
            interval: 0,
            requiredSignatures: 0,
            status: EscrowStatus.Active,
            createdAt: block.timestamp,
            lastReleasedAt: block.timestamp,
            signaturesCount: 0
        });
        return escrowId;
    }

    function _lockFunds(address from, address token, uint256 amount) internal {
        if (token == address(0)) {
            require(msg.value >= amount, "ZE: insufficient native");
            if (msg.value > amount) {
                payable(from).transfer(msg.value - amount);
            }
        } else {
            require(msg.value == 0, "ZE: native not accepted");
            IERC20(token).safeTransferFrom(from, address(this), amount);
        }
    }

    function _finalizeRelease(uint256 escrowId, uint256 amount) internal {
        EscrowAgreement storage e = escrows[escrowId];
        e.status = EscrowStatus.Released;
        _sendToken(e.executor, e.token, amount);
        emit EscrowReleased(escrowId, amount);
    }

    function _refund(uint256 escrowId) internal {
        EscrowAgreement storage e = escrows[escrowId];
        e.status = EscrowStatus.Refunded;
        _sendToken(e.buyer, e.token, e.amount);
        emit EscrowRefunded(escrowId);
    }

    function _sendToken(address to, address token, uint256 amount) internal {
        if (token == address(0)) {
            payable(to).transfer(amount);
        } else {
            IERC20(token).safeTransfer(to, amount);
        }
    }

    receive() external payable {}
}
