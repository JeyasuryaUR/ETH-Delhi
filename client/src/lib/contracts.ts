// Contract configurations for Rootstock chain
export const CONTRACTS = {
  // Pool contract ABI and address
  POOL: {
    // Replace with actual deployed contract address
    ADDRESS: process.env.NEXT_PUBLIC_POOL_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000',
    ABI: require('@/abi/Pool.json'),
  },
  
  // RIF Token contract (RIF on Rootstock)
  RIF_TOKEN: {
    // RIF token address on Rootstock Mainnet
    ADDRESS: '0x2aCc95758f8b5F583470bA265Eb685a8f45fc69D',
    // Standard ERC20 ABI for RIF token
    ABI: [
      {
        "constant": true,
        "inputs": [],
        "name": "name",
        "outputs": [{"name": "", "type": "string"}],
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "symbol",
        "outputs": [{"name": "", "type": "string"}],
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "decimals",
        "outputs": [{"name": "", "type": "uint8"}],
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [{"name": "_owner", "type": "address"}],
        "name": "balanceOf",
        "outputs": [{"name": "balance", "type": "uint256"}],
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {"name": "_spender", "type": "address"},
          {"name": "_value", "type": "uint256"}
        ],
        "name": "approve",
        "outputs": [{"name": "", "type": "bool"}],
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [
          {"name": "_owner", "type": "address"},
          {"name": "_spender", "type": "address"}
        ],
        "name": "allowance",
        "outputs": [{"name": "", "type": "uint256"}],
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {"name": "_to", "type": "address"},
          {"name": "_value", "type": "uint256"}
        ],
        "name": "transfer",
        "outputs": [{"name": "", "type": "bool"}],
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {"name": "_from", "type": "address"},
          {"name": "_to", "type": "address"},
          {"name": "_value", "type": "uint256"}
        ],
        "name": "transferFrom",
        "outputs": [{"name": "", "type": "bool"}],
        "type": "function"
      }
    ]
  }
} as const;

// Chain configurations
export const CHAINS = {
  ROOTSTOCK_MAINNET: 30,
  ROOTSTOCK_TESTNET: 31,
} as const;

// RIF Token configuration
export const RIF_TOKEN = {
  DECIMALS: 18,
  SYMBOL: 'RIF',
  NAME: 'RIF Token',
} as const;

// Contest configuration
export const CONTEST_CONFIG = {
  // Participants stake 1% of the prize pool
  PARTICIPANT_STAKE_PERCENTAGE: 1,
  // Organizer gets 10% of total prize pool
  ORGANIZER_REWARD_PERCENTAGE: 10,
  // Winners get the remaining 90% distributed among top 3
  WINNERS_SHARE_PERCENTAGE: 90,
} as const;
