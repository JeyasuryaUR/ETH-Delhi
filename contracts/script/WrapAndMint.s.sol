// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "forge-std/Script.sol";
import "../src/SubdomainIssuer.sol";
import { INameWrapper } from "../src/SubdomainIssuer.sol";


contract WrapAndMintScript is Script {
    // NOTE: verify these addresses for the network (Sepolia / other) BEFORE using.
    address constant NAMEWRAPPER = 0x114D4603199df73e7D157787f8778E21fCd13066;
    address constant PUBLIC_RESOLVER = 0x42D63ae25990889E35F215bC95884039Ba354115;

    // Replace with the true namehash computed off-chain: ethers.utils.namehash("chess.eth")
    bytes32 constant CHESS_NAMEHASH = 0x4a494f4f37d8fa8f6cefbafee6f04778a4c9fdf83a71f86e61d4d6d90896dbcf;

    function run() public {
        vm.startBroadcast();

        // deploy issuer
        SubdomainIssuer issuer = new SubdomainIssuer(NAMEWRAPPER, CHESS_NAMEHASH, PUBLIC_RESOLVER);

        // wrap chess.eth to the deployed issuer contract (caller must be current owner of chess.eth)
        uint32 fusesParent = 0;
        uint64 expiryParent = uint64(block.timestamp + 365 days);
        INameWrapper(NAMEWRAPPER).wrapETH2LD("chess", address(issuer), fusesParent, expiryParent);

        // now create a wrapped subdomain "sanket.chess.eth" and send it to the EOA that ran this script
        issuer.registerUsername("sanket", msg.sender);

        vm.stopBroadcast();
    }
}
