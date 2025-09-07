// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.29;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title ProofNFT
/// @notice Minimal ERC721 wrapper for Proof NFTs. Uses ERC721URIStorage for simple metadata storage.
contract ProofNFT is ERC721URIStorage, Ownable {
    uint256 private _nextTokenId = 1;

    event Minted(address indexed to, uint256 indexed tokenId, string tokenUri);
    event Burned(address indexed operator, uint256 indexed tokenId);

    // forward name/symbol to ERC721 and msg.sender as initial owner to Ownable
    constructor(string memory name_, string memory symbol_) ERC721(name_, symbol_) Ownable(msg.sender) {}

    /// @notice Mint a new NFT to `to` with tokenURI `uri`. Only owner can mint in this minimal example.
    function mint(address to, string calldata uri) external onlyOwner returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        emit Minted(to, tokenId, uri);
        return tokenId;
    }

    /// @notice Burn a token if the caller is owner or approved
    function burnIfAllowed(uint256 tokenId) external {
        // Use _ownerOf (internal) to check existence without revert
        address owner = _ownerOf(tokenId);
        require(owner != address(0), "Token does not exist");

        address sender = _msgSender();

        // Equivalent of old _isApprovedOrOwner:
        bool allowed = (sender == owner)
            || (getApproved(tokenId) == sender)
            || isApprovedForAll(owner, sender);

        require(allowed, "not owner/approved");

        // Use OZ's _burn implementation from ERC721URIStorage / ERC721
        _burn(tokenId);
        emit Burned(sender, tokenId);
    }

    // NOTE:
    // We intentionally do NOT override _burn() or tokenURI() here.
    // ERC721URIStorage already provides tokenURI + _burn behavior compatible with OZ v5.
}
