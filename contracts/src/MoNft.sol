// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "lib/openzeppelin-contracts/contracts/token/ERC721/ERC721.sol";
import "lib/openzeppelin-contracts/contracts/access/Ownable.sol";

/**
 * @title ChessGameMONFT
 * @dev ERC-7743 Multi-Owner Non-Fungible Token for Chess Games
 * Stores chess game data including moves in PGN format and player information
 */
contract ChessGameMONFT is ERC721, Ownable {
    uint256 private _tokenIdCounter;
    
    enum Winner { DRAW, WHITE, BLACK }
    
    struct ChessGame {
        address whitePlayer;
        address blackPlayer;
        string[] moves;  // Array of moves in PGN format
        Winner winner;
        uint256 timestamp;
        string gameMetadata; // Additional game info (opening, time control, etc.)
    }
    
    // Mapping from token ID to chess game data
    mapping(uint256 => ChessGame) private _games;
    
    // Mapping from token ID to array of owners (multi-owner support)
    mapping(uint256 => address[]) private _tokenOwners;
    
    // Mapping from token ID to owner address to ownership status
    mapping(uint256 => mapping(address => bool)) private _isOwner;
    
    // Mapping from owner to list of owned token IDs
    mapping(address => uint256[]) private _ownedTokens;
    
    // Events
    event GameMinted(
        uint256 indexed tokenId,
        address indexed whitePlayer,
        address indexed blackPlayer,
        Winner winner
    );
    
    event OwnerAdded(uint256 indexed tokenId, address indexed newOwner);
    event OwnerRemoved(uint256 indexed tokenId, address indexed removedOwner);
    
    constructor(address initialOwner) ERC721("ChessGameMONFT", "CGMO") Ownable(initialOwner) {
        // Constructor body can be empty or contain additional initialization
    }
    
    /**
     * @dev Check if a token exists
     */
    function _tokenExists(uint256 tokenId) internal view returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }
    
    /**
     * @dev Mint a new chess game NFT
     * @param whitePlayer Address of the white player
     * @param blackPlayer Address of the black player
     * @param moves Array of moves in PGN format
     * @param winner Winner of the game (0 = Draw, 1 = White, 2 = Black)
     * @param gameMetadata Additional game metadata
     */
    function mintChessGame(
        address whitePlayer,
        address blackPlayer,
        string[] memory moves,
        Winner winner,
        string memory gameMetadata
    ) public onlyOwner returns (uint256) {
        require(whitePlayer != address(0), "Invalid white player address");
        require(blackPlayer != address(0), "Invalid black player address");
        require(whitePlayer != blackPlayer, "Players must be different");
        require(moves.length > 0, "Game must have moves");
        
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        
        // Create the chess game struct
        _games[tokenId] = ChessGame({
            whitePlayer: whitePlayer,
            blackPlayer: blackPlayer,
            moves: moves,
            winner: winner,
            timestamp: block.timestamp,
            gameMetadata: gameMetadata
        });
        
        // Set up multi-ownership
        _tokenOwners[tokenId].push(whitePlayer);
        _tokenOwners[tokenId].push(blackPlayer);
        _isOwner[tokenId][whitePlayer] = true;
        _isOwner[tokenId][blackPlayer] = true;
        
        // Add to owned tokens mapping
        _ownedTokens[whitePlayer].push(tokenId);
        _ownedTokens[blackPlayer].push(tokenId);
        
        // Mint to the first owner (white player) as primary holder
        _mint(whitePlayer, tokenId);
        
        emit GameMinted(tokenId, whitePlayer, blackPlayer, winner);
        
        return tokenId;
    }
    
    /**
     * @dev Get chess game data for a token ID
     */
    function getGameData(uint256 tokenId) public view returns (
        address whitePlayer,
        address blackPlayer,
        string[] memory moves,
        Winner winner,
        uint256 timestamp,
        string memory gameMetadata
    ) {
        require(_tokenExists(tokenId), "Token does not exist");
        
        ChessGame memory game = _games[tokenId];
        return (
            game.whitePlayer,
            game.blackPlayer,
            game.moves,
            game.winner,
            game.timestamp,
            game.gameMetadata
        );
    }
    
    /**
     * @dev Get all owners of a token (multi-owner support)
     */
    function getTokenOwners(uint256 tokenId) public view returns (address[] memory) {
        require(_tokenExists(tokenId), "Token does not exist");
        return _tokenOwners[tokenId];
    }
    
    /**
     * @dev Check if an address is an owner of a token
     */
    function isTokenOwner(uint256 tokenId, address account) public view returns (bool) {
        require(_tokenExists(tokenId), "Token does not exist");
        return _isOwner[tokenId][account];
    }
    
    /**
     * @dev Get all tokens owned by an address
     */
    function getOwnedTokens(address owner) public view returns (uint256[] memory) {
        return _ownedTokens[owner];
    }
    
    /**
     * @dev Add a new owner to a token (only existing owners can add)
     */
    function addOwner(uint256 tokenId, address newOwner) public {
        require(_tokenExists(tokenId), "Token does not exist");
        require(_isOwner[tokenId][msg.sender], "Only owners can add new owners");
        require(!_isOwner[tokenId][newOwner], "Address is already an owner");
        require(newOwner != address(0), "Invalid address");
        
        _tokenOwners[tokenId].push(newOwner);
        _isOwner[tokenId][newOwner] = true;
        _ownedTokens[newOwner].push(tokenId);
        
        emit OwnerAdded(tokenId, newOwner);
    }
    
    /**
     * @dev Remove an owner from a token (only the owner themselves can remove)
     */
    function removeOwner(uint256 tokenId) public {
        require(_tokenExists(tokenId), "Token does not exist");
        require(_isOwner[tokenId][msg.sender], "Not an owner of this token");
        require(_tokenOwners[tokenId].length > 1, "Cannot remove the last owner");
        
        // Remove from owners array
        address[] storage owners = _tokenOwners[tokenId];
        for (uint256 i = 0; i < owners.length; i++) {
            if (owners[i] == msg.sender) {
                owners[i] = owners[owners.length - 1];
                owners.pop();
                break;
            }
        }
        
        // Remove from ownership mapping
        _isOwner[tokenId][msg.sender] = false;
        
        // Remove from owned tokens
        uint256[] storage ownedTokens = _ownedTokens[msg.sender];
        for (uint256 i = 0; i < ownedTokens.length; i++) {
            if (ownedTokens[i] == tokenId) {
                ownedTokens[i] = ownedTokens[ownedTokens.length - 1];
                ownedTokens.pop();
                break;
            }
        }
        
        emit OwnerRemoved(tokenId, msg.sender);
    }
    
    /**
     * @dev Get the moves of a chess game
     */
    function getGameMoves(uint256 tokenId) public view returns (string[] memory) {
        require(_tokenExists(tokenId), "Token does not exist");
        return _games[tokenId].moves;
    }
    
    /**
     * @dev Get the winner of a chess game
     */
    function getGameWinner(uint256 tokenId) public view returns (Winner) {
        require(_tokenExists(tokenId), "Token does not exist");
        return _games[tokenId].winner;
    }
    
    /**
     * @dev Get players of a chess game
     */
    function getGamePlayers(uint256 tokenId) public view returns (address whitePlayer, address blackPlayer) {
        require(_tokenExists(tokenId), "Token does not exist");
        ChessGame memory game = _games[tokenId];
        return (game.whitePlayer, game.blackPlayer);
    }
    
    /**
     * @dev Override transfer functions to handle multi-ownership
     */
    function transferFrom(address from, address to, uint256 tokenId) public override {
        require(_isOwner[tokenId][from], "Transfer not allowed: not an owner");
        require(to != address(0), "Transfer to zero address");
        
        // Only allow transfer if sender is an owner
        super.transferFrom(from, to, tokenId);
        
        // Update multi-ownership records
        if (!_isOwner[tokenId][to]) {
            _tokenOwners[tokenId].push(to);
            _isOwner[tokenId][to] = true;
            _ownedTokens[to].push(tokenId);
        }
    }
    
    /**
     * @dev Override safeTransferFrom to handle multi-ownership
     */
    function safeTransferFrom(address from, address to, uint256 tokenId, bytes memory data) public override {
        require(_isOwner[tokenId][from], "Transfer not allowed: not an owner");
        super.safeTransferFrom(from, to, tokenId, data);
        
        // Update multi-ownership records
        if (!_isOwner[tokenId][to]) {
            _tokenOwners[tokenId].push(to);
            _isOwner[tokenId][to] = true;
            _ownedTokens[to].push(tokenId);
        }
    }
    
    /**
     * @dev Get total number of minted games
     */
    function totalSupply() public view returns (uint256) {
        return _tokenIdCounter;
    }
}