// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

/// @notice Minimal interface for the ENS NameWrapper used in this flow.
/// Note: verify actual NameWrapper ABI on the target network; adjust if necessary.
interface INameWrapper {
    function wrapETH2LD(string calldata label, address wrappedOwner, uint32 fuses, uint64 expiry) external;

    function setSubnodeRecord(
        bytes32 parentNode,
        string calldata label,
        address owner,
        address resolver,
        uint64 ttl,
        uint32 fuses,
        uint64 expiry
    ) external;
}

interface INameWrapperExtended is INameWrapper {
    function ownerOf(uint256 id) external view returns (address);
}

/// @title SubdomainIssuer
/// @notice Deployed as the "wrapped owner" of a 2LD (e.g., chess.eth). Calls into NameWrapper to mint wrapped subdomains.
contract SubdomainIssuer {
    INameWrapper public immutable wrapper;
    bytes32 public immutable parentNode; // namehash("chess.eth")
    address public immutable resolver;

    event SubdomainIssued(string label, address owner);

    constructor(address _wrapper, bytes32 _parentNode, address _resolver) {
        wrapper = INameWrapper(_wrapper);
        parentNode = _parentNode;  // chess.eth
        resolver = _resolver;
    }

    /// @notice register a username as a wrapped subdomain, e.g., sanket.chess.eth
    /// @dev No access control here — anyone can call this to create a subnode. Add ACL if needed.
    function registerUsername(string calldata label, address owner) external {
    bytes32 subnodeHash = keccak256(abi.encodePacked(parentNode, keccak256(bytes(label))));
    bytes32 fullNode = subnodeHash;

    // check if already wrapped
    require(INameWrapperExtended(address(wrapper)).ownerOf(uint256(fullNode)) == address(0), "Subdomain already exists");

    uint32 fuses = 1; 
    uint64 expiry = type(uint64).max;

    wrapper.setSubnodeRecord(
        parentNode,
        label,
        owner,
        resolver,
        0,
        fuses,
        expiry
    );

    emit SubdomainIssued(label, owner);
}

}
