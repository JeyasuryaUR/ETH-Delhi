# Contest Platform Smart Contract Methods Overview

## Write Methods (Require Gas & ETH)

### 1. `createContest(uint32 _maxParticipants)`
**What it does**: Creates a new contest with organizer staking initial prize pool
**Parameters**:
- `_maxParticipants`: Maximum number of participants allowed (e.g., 5, 10, 100)
**Requires**: ETH payment (this becomes the initial prize pool)
**Who can call**: Anyone
**Example**: Call with `_maxParticipants = 5` and send `1 ETH` to create a contest for 5 people with 1 ETH prize pool

### 2. `joinContest(uint256 _contestId)`
**What it does**: Allows users to join an active contest by staking 1% of initial prize pool
**Parameters**:
- `_contestId`: The ID of the contest to join (starts from 0)
**Requires**: ETH payment (exactly 1% of the contest's initial prize pool)
**Who can call**: Anyone (except those already in the contest)
**Example**: Call with `_contestId = 0` and send `0.01 ETH` (if initial prize was 1 ETH)

### 3. `endContest(uint256 _contestId, address[3] _winners)`
**What it does**: Ends the contest and automatically distributes prizes
**Parameters**:
- `_contestId`: The contest ID to end
- `_winners`: Array of 3 addresses [1st place, 2nd place, 3rd place]
**Requires**: No ETH payment needed
**Who can call**: Only the contest organizer
**Prize Distribution**: 
  - Organizer gets 10% of total pool
  - Winners get remaining 90% split as 50%:30%:20%
**Example**: Call with `_contestId = 0` and `_winners = ["0x123...", "0x456...", "0x789..."]`

### 4. `emergencyWithdraw()`
**What it does**: Withdraws all contract balance (emergency function)
**Parameters**: None
**Requires**: No ETH payment
**Who can call**: Anyone (should be restricted in production)
**Use case**: Only for emergency situations or contract maintenance

---

## Read Methods (Free - No Gas Required)

### 5. `contestCounter()`
**What it does**: Returns total number of contests created
**Returns**: Number (e.g., if 3 contests created, returns 3)
**Use case**: To know how many contests exist, loop through contest IDs

### 6. `contests(uint256 contestId)`
**What it does**: Returns basic contest information
**Parameters**: 
- `contestId`: The contest ID to query
**Returns**: 
- `organizer`: Address who created the contest
- `initialPrizePool`: Original ETH staked by organizer
- `totalPrizePool`: Current total pool (initial + all participant stakes)
- `maxParticipants`: Maximum allowed participants
- `participantCount`: Current number of participants
- `isActive`: Whether contest is accepting participants
- `isEnded`: Whether contest has ended

### 7. `getContestDetails(uint256 _contestId)`
**What it does**: Returns complete contest information (more detailed than `contests`)
**Parameters**: 
- `_contestId`: Contest ID to query
**Returns**: Same as above plus:
- `stakingAmount`: How much ETH participants need to stake (1% of initial)

### 8. `getContestWinners(uint256 _contestId)`
**What it does**: Returns the 3 winners of a contest
**Parameters**: 
- `_contestId`: Contest ID to query
**Returns**: Array of 3 addresses [1st, 2nd, 3rd place winners]
**Note**: Returns zero addresses (0x000...) for empty positions

### 9. `isParticipant(uint256 _contestId, address _user)`
**What it does**: Checks if a specific user joined a specific contest
**Parameters**: 
- `_contestId`: Contest ID to check
- `_user`: User address to check
**Returns**: `true` if user is participant, `false` if not

### 10. `getStakingAmount(uint256 _contestId)`
**What it does**: Returns how much ETH is required to join the contest
**Parameters**: 
- `_contestId`: Contest ID to query
**Returns**: Amount in Wei (1% of initial prize pool)
**Example**: If initial prize was 1 ETH, returns 0.01 ETH

### 11. `getContractBalance()`
**What it does**: Returns total ETH balance held by the contract
**Returns**: Amount in Wei
**Use case**: To see how much ETH the contract currently holds

---

## Events (Automatic Notifications)

### `ContestCreated`
**Triggered when**: Someone creates a new contest
**Data**: Contest ID, organizer address, prize pool amount, max participants

### `ParticipantJoined`
**Triggered when**: Someone joins a contest
**Data**: Contest ID, participant address

### `ContestEnded`
**Triggered when**: Contest is ended by organizer
**Data**: Contest ID, winners array, total prize pool

### `PrizeDistributed`
**Triggered when**: Each prize is sent to winners (3 separate events)
**Data**: Contest ID, winner address, prize amount, position (1st/2nd/3rd)

---

## Typical Usage Flow:

1. **Organizer**: Calls `createContest(5)` with 1 ETH → Creates contest for 5 people
2. **Participants**: Call `joinContest(0)` with 0.01 ETH each → Join the contest
3. **Check Status**: Use `getContestDetails(0)` → See participant count, total pool, etc.
4. **Organizer**: Calls `endContest(0, [addr1, addr2, addr3])` → Ends contest and pays winners
5. **Everyone**: Check final results with `getContestWinners(0)`

Each method serves a specific purpose in the contest lifecycle, from creation to completion and prize distribution.