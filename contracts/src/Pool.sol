// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract ContestPlatform {
    struct Contest {
        address organizer;
        uint128 initialPrizePool;    // Packed into single slot
        uint128 totalPrizePool;      // Packed into single slot
        uint32 maxParticipants;      // Packed into next slot
        uint32 participantCount;     // Packed with above
        bool isActive;               // Packed with above
        bool isEnded;                // Packed with above
        mapping(address => bool) participants;
        address[3] winners; // Top 3 winners
    }

    mapping(uint256 => Contest) public contests;
    uint256 public contestCounter;
    
    // Events to track participants (replaces storage array)
    event ContestCreated(uint256 indexed contestId, address indexed organizer, uint256 prizePool, uint256 maxParticipants);
    event ParticipantJoined(uint256 indexed contestId, address indexed participant);
    event ContestEnded(uint256 indexed contestId, address[3] winners, uint256 totalPrizePool);
    event PrizeDistributed(uint256 indexed contestId, address indexed winner, uint256 amount, uint8 position);

    modifier onlyOrganizer(uint256 _contestId) {
        require(contests[_contestId].organizer == msg.sender, "Only organizer can call this function");
        _;
    }

    modifier contestActive(uint256 _contestId) {
        require(contests[_contestId].isActive, "Contest is not active");
        require(!contests[_contestId].isEnded, "Contest has ended");
        _;
    }

    modifier contestExists(uint256 _contestId) {
        require(_contestId < contestCounter, "Contest does not exist");
        _;
    }

    function createContest(uint32 _maxParticipants) external payable {
        require(msg.value > 0, "Initial prize pool must be greater than 0");
        require(_maxParticipants > 0, "Max participants must be greater than 0");
        require(msg.value <= type(uint128).max, "Prize pool too large");
        
        uint256 contestId = contestCounter++;
        Contest storage newContest = contests[contestId];
        
        newContest.organizer = msg.sender;
        newContest.initialPrizePool = uint128(msg.value);
        newContest.maxParticipants = _maxParticipants;
        newContest.participantCount = 0;
        newContest.isActive = true;
        newContest.isEnded = false;
        newContest.totalPrizePool = uint128(msg.value);

        emit ContestCreated(contestId, msg.sender, msg.value, _maxParticipants);
    }

    function joinContest(uint256 _contestId) external payable contestExists(_contestId) contestActive(_contestId) {
        Contest storage contest = contests[_contestId];
        uint256 stakingAmount = contest.initialPrizePool / 100; // Calculate 1% on-the-fly
        
        require(!contest.participants[msg.sender], "Already participated in this contest");
        require(contest.participantCount < contest.maxParticipants, "Contest is full");
        require(msg.value == stakingAmount, "Incorrect staking amount");

        contest.participants[msg.sender] = true;
        contest.participantCount++;
        contest.totalPrizePool += uint128(msg.value);

        emit ParticipantJoined(_contestId, msg.sender);
    }

    function endContest(uint256 _contestId, address[3] memory _winners) 
        external 
        contestExists(_contestId) 
        onlyOrganizer(_contestId) 
        contestActive(_contestId) 
    {
        Contest storage contest = contests[_contestId];
        
        require(_winners[0] != address(0), "First place winner must be specified");
        
        // Validate winners are participants
        for (uint8 i = 0; i < 3; i++) {
            if (_winners[i] != address(0)) {
                require(contest.participants[_winners[i]], "Winner must be a participant");
            }
        }

        contest.isEnded = true;
        contest.isActive = false;
        contest.winners = _winners;

        emit ContestEnded(_contestId, _winners, contest.totalPrizePool);
        
        // Distribute prizes
        _distributePrizes(_contestId);
    }

    function _distributePrizes(uint256 _contestId) internal {
        Contest storage contest = contests[_contestId];
        uint256 totalPrize = contest.totalPrizePool;
        
        // Organizer gets 10% of total prize pool
        uint256 organizerReward = (totalPrize * 10) / 100;
        uint256 remainingPrize = totalPrize - organizerReward;
        
        // Transfer organizer reward
        payable(contest.organizer).transfer(organizerReward);
        
        // Distribute remaining prize among top 3 winners (5:3:2 ratio)
        // Total ratio = 5 + 3 + 2 = 10
        uint256 firstPrize = (remainingPrize * 5) / 10;  // 50% of remaining
        uint256 secondPrize = (remainingPrize * 3) / 10; // 30% of remaining
        uint256 thirdPrize = (remainingPrize * 2) / 10;  // 20% of remaining
        
        // Transfer prizes to winners
        if (contest.winners[0] != address(0)) {
            payable(contest.winners[0]).transfer(firstPrize);
            emit PrizeDistributed(_contestId, contest.winners[0], firstPrize, 1);
        }
        
        if (contest.winners[1] != address(0)) {
            payable(contest.winners[1]).transfer(secondPrize);
            emit PrizeDistributed(_contestId, contest.winners[1], secondPrize, 2);
        }
        
        if (contest.winners[2] != address(0)) {
            payable(contest.winners[2]).transfer(thirdPrize);
            emit PrizeDistributed(_contestId, contest.winners[2], thirdPrize, 3);
        }
    }

    // View functions
    function getContestDetails(uint256 _contestId) external view contestExists(_contestId) returns (
        address organizer,
        uint256 initialPrizePool,
        uint256 maxParticipants,
        uint256 participantCount,
        uint256 stakingAmount,
        bool isActive,
        bool isEnded,
        uint256 totalPrizePool
    ) {
        Contest storage contest = contests[_contestId];
        return (
            contest.organizer,
            contest.initialPrizePool,
            contest.maxParticipants,
            contest.participantCount,
            contest.initialPrizePool / 100, // Calculate staking amount on-the-fly
            contest.isActive,
            contest.isEnded,
            contest.totalPrizePool
        );
    }

    function getContestWinners(uint256 _contestId) external view contestExists(_contestId) returns (address[3] memory) {
        return contests[_contestId].winners;
    }

    function isParticipant(uint256 _contestId, address _user) external view contestExists(_contestId) returns (bool) {
        return contests[_contestId].participants[_user];
    }

    function getStakingAmount(uint256 _contestId) external view contestExists(_contestId) returns (uint256) {
        return contests[_contestId].initialPrizePool / 100;
    }

    // Emergency function to withdraw contract balance (only if needed)
    function emergencyWithdraw() external {
        // This should only be used in emergency situations
        // In a production environment, you might want to add access control
        require(address(this).balance > 0, "No balance to withdraw");
        payable(msg.sender).transfer(address(this).balance);
    }

    // Get contract balance
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }
}