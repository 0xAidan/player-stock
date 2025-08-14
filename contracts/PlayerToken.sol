// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

contract PlayerToken is ERC20, Ownable, Pausable {
    uint256 public constant INITIAL_SUPPLY = 50_000_000 * 10**18; // 50M tokens
    uint256 public constant BURN_RATE_GOOD_WEEK = 1000; // 0.1% burn per good week
    uint256 public constant EMISSION_RATE_BAD_WEEK = 500; // 0.05% emission per bad week
    
    struct PlayerStats {
        uint256 lastWeekPPR;
        uint256 currentWeekPPR;
        uint256 totalBurned;
        uint256 totalEmitted;
        bool isActive;
    }
    
    mapping(address => PlayerStats) public playerStats;
    address[] public activePlayers;
    
    event PlayerAdded(address indexed player, string name);
    event WeekUpdated(address indexed player, uint256 pprPoints, bool isGoodWeek);
    event TokensBurned(address indexed player, uint256 amount);
    event TokensEmitted(address indexed player, uint256 amount);
    
    constructor() ERC20("Player Stock Token", "PST") {
        _mint(msg.sender, INITIAL_SUPPLY);
    }
    
    function addPlayer(address player, string memory name) external onlyOwner {
        require(!playerStats[player].isActive, "Player already exists");
        
        playerStats[player] = PlayerStats({
            lastWeekPPR: 0,
            currentWeekPPR: 0,
            totalBurned: 0,
            totalEmitted: 0,
            isActive: true
        });
        
        activePlayers.push(player);
        emit PlayerAdded(player, name);
    }
    
    function updatePlayerWeek(address player, uint256 pprPoints) external onlyOwner {
        require(playerStats[player].isActive, "Player not found");
        
        PlayerStats storage stats = playerStats[player];
        stats.lastWeekPPR = stats.currentWeekPPR;
        stats.currentWeekPPR = pprPoints;
        
        bool isGoodWeek = pprPoints > stats.lastWeekPPR;
        
        if (isGoodWeek) {
            _burnTokens(player, pprPoints);
        } else {
            _emitTokens(player, pprPoints);
        }
        
        emit WeekUpdated(player, pprPoints, isGoodWeek);
    }
    
    function _burnTokens(address player, uint256 pprPoints) internal {
        uint256 burnAmount = (totalSupply() * BURN_RATE_GOOD_WEEK * pprPoints) / (1000000 * 100);
        if (burnAmount > 0) {
            _burn(player, burnAmount);
            playerStats[player].totalBurned += burnAmount;
            emit TokensBurned(player, burnAmount);
        }
    }
    
    function _emitTokens(address player, uint256 pprPoints) internal {
        uint256 emissionAmount = (totalSupply() * EMISSION_RATE_BAD_WEEK * pprPoints) / (1000000 * 100);
        if (emissionAmount > 0) {
            _mint(player, emissionAmount);
            playerStats[player].totalEmitted += emissionAmount;
            emit TokensEmitted(player, emissionAmount);
        }
    }
    
    function getActivePlayers() external view returns (address[] memory) {
        return activePlayers;
    }
    
    function getPlayerStats(address player) external view returns (PlayerStats memory) {
        return playerStats[player];
    }
    
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
    
    function _beforeTokenTransfer(address from, address to, uint256 amount)
        internal
        whenNotPaused
        override
    {
        super._beforeTokenTransfer(from, to, amount);
    }
} 