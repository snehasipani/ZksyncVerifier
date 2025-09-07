// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

/// @title ProofOfCreativity
/// @notice Minimal contract to record proofs (CID commitments or plain CID events) for creators.
///         Designed to emit events (cheap) and optionally store commitments for privacy workflows.
contract ProofOfCreativity {
    /// @dev Emitted when a proof is stored (plain CID stored in event)
    event ProofStored(address indexed owner, bytes32 indexed proof, string cid, uint256 timestamp, bytes32 indexed meta);
    /// @dev Emitted when a commitment (e.g., Poseidon(cid, salt)) is stored on-chain
    event CommitmentStored(address indexed owner, bytes32 indexed commitment, uint256 timestamp);
    /// @dev Emitted when a proof/commitment is revoked
    event ProofRevoked(address indexed owner, bytes32 indexed proofOrCommitment, uint256 timestamp);

    // Optional mapping of commitments to owner (allows simple on-chain checks)
    mapping(bytes32 => address) public commitmentOwner;
    // Optional mapping of proof hash (keccak) to revoked flag
    mapping(bytes32 => bool) public revoked;

    address public admin;

    modifier onlyAdmin() {
        require(msg.sender == admin, "Not admin");
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    /// @notice Store a plain CID proof by emitting an event. Minimal gas usage (no storage)
    /// @param cid IPFS CID as a string (human-friendly). Proof is computed client-side as keccak(cid, owner, ts)
    /// @return proofHash the computed bytes32 proof (keccak256)
    function storeProof(string calldata cid) external returns (bytes32 proofHash) {
        uint256 ts = block.timestamp;
        // Compute proof server-side for convenience (client could compute offchain too)
        proofHash = keccak256(abi.encodePacked(cid, msg.sender, ts));
        // meta slot reserved for extra short data (set to 0 for now)
        bytes32 meta = bytes32(0);
        emit ProofStored(msg.sender, proofHash, cid, ts, meta);
    }

    /// @notice Store a commitment on-chain (for privacy mode). Commitment should be computed offchain (e.g., Poseidon(cid, salt))
    /// @param commitment bytes32 commitment value
    function storeCommitment(bytes32 commitment) external {
        require(commitment != bytes32(0), "Zero commitment");
        require(commitmentOwner[commitment] == address(0), "Commitment exists");
        commitmentOwner[commitment] = msg.sender;
        emit CommitmentStored(msg.sender, commitment, block.timestamp);
    }

    /// @notice Revoke a proof or commitment (owner or admin)
    /// @param proofOrCommitment bytes32 hash (proof or commitment) to revoke
    function revoke(bytes32 proofOrCommitment) external {
        address owner = commitmentOwner[proofOrCommitment];
        // If mapping has owner, require owner or admin, else allow owner inferred offchain only (we allow admin to revoke any)
        if (owner != address(0)) {
            require(msg.sender == owner || msg.sender == admin, "Not owner/admin");
        } else {
            // if no mapping owner (it was a plain proof event), only admin can revoke since we can't verify owner onchain
            require(msg.sender == admin, "Only admin to revoke plain proofs");
        }
        revoked[proofOrCommitment] = true;
        emit ProofRevoked(msg.sender, proofOrCommitment, block.timestamp);
    }

    /// @notice Helper: check if commitment is owned by an address
    function isCommitmentOwner(bytes32 commitment, address user) external view returns (bool) {
        return commitmentOwner[commitment] == user;
    }

    /// @notice Admin can change admin
    function setAdmin(address newAdmin) external onlyAdmin {
        require(newAdmin != address(0), "zero address");
        admin = newAdmin;
    }

    // --------------------
    // Optional verifier integration (call external verifier contract)
    // --------------------
    // If you generate a Verifier.sol from snarkjs and deploy it, you can set its address and call
    // revealWithProof(...) passing the proof parameters. The Verifier contract must implement the
    // appropriate verifier interface (Groth16/PLONK). This function is intentionally left as a flexible hook.
    // Example usage would validate a zk proof and then mark the commitment as revealed onchain.

    address public verifier; // optional verifier contract address

    event VerifierSet(address indexed addr);

    function setVerifier(address v) external onlyAdmin {
        verifier = v;
        emit VerifierSet(v);
    }

    // NOTE: the exact revealWithProof signature depends on generated Verifier.sol. For Groth16, it is often:
    // function verifyProof(uint[2] calldata a, uint[2][2] calldata b, uint[2] calldata c, uint[] calldata input) public view returns (bool);
    // You would call verifier.verifyProof(...) and, on success, mark the commitment revealed/stored.
    // For safety and flexibility, we leave the concrete wrapper to your project after you generate Verifier.sol.
}
