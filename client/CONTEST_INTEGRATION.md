# Chess Contest Integration with Rootstock & RIF Tokens

This document describes the integration of the Pool smart contract with the frontend for creating and managing chess contests using RIF tokens on the Rootstock blockchain.

## Overview

The contest system allows users to:
- Create contests with RIF token prize pools
- Join contests by staking 1% of the prize pool
- Distribute prizes among top 3 winners
- Organizers receive 10% of the total prize pool

## Architecture

### Smart Contract Integration
- **Pool Contract**: Manages contest creation, participation, and prize distribution
- **RIF Token**: Used for all staking and prize distribution
- **Rootstock Chain**: Deployed on Rootstock Mainnet/Testnet

### Frontend Components

#### 1. Contract Configuration (`lib/contracts.ts`)
- Pool contract ABI and address configuration
- RIF token contract configuration
- Chain configurations for Rootstock
- Contest economics configuration

#### 2. Pool Service (`services/poolService.ts`)
- Handles all smart contract interactions
- RIF token approval and balance checking
- Contest creation, joining, and ending
- Prize distribution calculations

#### 3. Contests Hook (`hooks/useContests.ts`)
- React hook for managing contest state
- Fetches contest data from blockchain
- Handles contest creation and participation
- Manages RIF token operations

#### 4. UI Components
- **CreateContestModal**: Modal for creating new contests
- **ContestList**: Displays all available contests
- **ContestsPage**: Main dashboard for contest management

## Contest Economics

### Prize Pool Distribution
- **Organizer**: 10% of total prize pool
- **Winners**: 90% of total prize pool distributed as:
  - 1st Place: 50% of winners share (45% of total)
  - 2nd Place: 30% of winners share (27% of total)
  - 3rd Place: 20% of winners share (18% of total)

### Staking Requirements
- **Organizer**: Must stake the full initial prize pool amount
- **Participants**: Must stake 1% of the initial prize pool

## Usage

### Creating a Contest
1. Navigate to `/dashboard/contests`
2. Click "Create Contest"
3. Enter prize pool amount in RIF tokens
4. Set maximum number of participants
5. Approve RIF token spending
6. Confirm contest creation

### Joining a Contest
1. View available contests on the contests page
2. Click "Join Contest" on desired contest
3. Approve RIF token spending (1% of prize pool)
4. Confirm participation

### Ending a Contest
1. Contest organizer can end the contest
2. Provide addresses of top 3 winners
3. Prizes are automatically distributed

## Configuration

### Environment Variables
```env
NEXT_PUBLIC_POOL_CONTRACT_ADDRESS=0x... # Pool contract address
```

### Chain Configuration
- **Rootstock Mainnet**: Chain ID 30
- **Rootstock Testnet**: Chain ID 31
- **RIF Token**: 0x2aCc95758f8b5F583470bA265Eb685a8f45fc69D

## Security Considerations

1. **Token Approvals**: Users must approve the Pool contract to spend RIF tokens
2. **Contest Validation**: All contest parameters are validated before creation
3. **Access Control**: Only contest organizers can end their contests
4. **Prize Distribution**: Automatic distribution prevents manual intervention

## Future Enhancements

1. **Tournament Brackets**: Support for elimination-style tournaments
2. **Time Limits**: Automatic contest ending based on time
3. **Multiple Rounds**: Support for multi-round contests
4. **Custom Prizes**: Support for non-RIF token prizes
5. **Contest Analytics**: Detailed statistics and reporting

## Troubleshooting

### Common Issues
1. **Insufficient RIF Balance**: Ensure user has enough RIF tokens
2. **Approval Required**: Users must approve token spending before transactions
3. **Network Issues**: Ensure connected to Rootstock network
4. **Contract Not Deployed**: Verify contract address is correct

### Error Handling
- All contract interactions include proper error handling
- User-friendly error messages for common issues
- Transaction status tracking and confirmation
