// SPDX-License-Identifier: MIT

pragma solidity ^0.6.0;

import "./MinerCards.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/Initializable.sol";

contract MinerCardRewards is Initializable {
    using SafeMath for uint256;

    IERC20 private token;
    MinerCards private minerCards;
    uint256 private time;
    uint256 private rate;

    // mapping from address to time
    mapping(address => uint256) private timeLock;

    // mapping from address to lockAmount
    mapping(address => uint256) private balances;

    /* uint256 private constant MINERCARD_1 = 25;
    uint256 private constant MINERCARD_2 = 50;
    uint256 private constant MINERCARD_3 = 100;
    uint256 private constant MINERCARD_4 = 250;
    uint256 private constant MINERCARD_5 = 1000; */

    // Emitted when funds is locked.
    event LockFund(
        address indexed _account,
        uint256 indexed _tokenType,
        uint256 _lockAmount
    );

    // Emitted when funds and dividends is withdrawn.
    event Withdraw(
        address indexed _account,
        uint256 indexed _lockAmount,
        uint256 _dividends
    );

    // Emitted when only lock fund is withdrwan.
    event Release(address indexed _account, uint256 indexed _lockAmount);

    /**
     * @dev  Initializer function (replaces constructor)
     * Sets the initializes {naMinerCards}, {Exgold} token, and sets value fo
     r {time}
     *
     * All three of these values are immutable: they can only be set once during
     * construction.
     */
    function initialize(
        address _minerCards,
        address _tokenAddress,
        uint256 _time,
        uint256 _rate
    ) public initializer {
        time = _time;
        rate = _rate;
        minerCards = MinerCards(_minerCards);
        token = IERC20(_tokenAddress);
    }

    /**
     * @dev  Locks `_account` funds
     * Contract transfers the lock amount from `_account` to contract.
     * Sets the lock time and balances.
     * Emits `LockFund` event.
     */
    function lockFunds(
        address _account,
        uint256 _id,
        uint256 _lockAmount
    ) public {
        uint256 balance = minerCards.balanceOf(_account, _id);
        require(
            balance > 0,
            "MinerCardRewards: Account has insufficient miner card token to lock funds."
        );
        uint256 allowance = token.allowance(_account, address(this));
        require(
            allowance >= _lockAmount,
            "MinerCardRewards: lockAmount exceeds allowance."
        );
        require(
            _id == _lockAmount,
            "MinerCardRewards: id not equal to lock amount."
        );
        token.transferFrom(_account, address(this), _lockAmount);
        balances[_account] = balances[_account].add(_lockAmount);
        timeLock[_account] = block.timestamp;
        emit LockFund(_account, _id, _lockAmount);
    }

    /**
     * @dev  release locked funds excluding dividends.
     * Calling this function releases the locked funds to `msg.sender`.
     * Note: Calling this function assumes the lock time has not been met.
     * Emits `Release` event.
     */
    function release() public {
        require(
            timeLock[msg.sender] != 0 && balances[msg.sender] != 0,
            "MinerCardRewards: no funds locked."
        );
        uint256 balance = balances[msg.sender];
        token.transfer(msg.sender, balance);
        balances[msg.sender] = balances[msg.sender].sub(balance);
        emit Release(msg.sender, balance);
    }

    /**
     * @dev  release locked funds plus dividends.
     * Dividends is 5% of amount locked
     * Emits `Withdraw` event.
     */
    function withdraw() public {
        require(
            block.timestamp >= timeLock[msg.sender],
            "MinerCardRewards: current time is before release time."
        );
        require(
            timeLock[msg.sender] != 0 && balances[msg.sender] != 0,
            "MinerCardRewards: no funds locked."
        );

        uint256 _balance = balances[msg.sender];
        uint256 dividends = calcDividends(_balance, timeLock[msg.sender]);
        require(
            token.balanceOf(address(this)) >= dividends,
            "MinerCardRewards: Insufficient funds to pay dividends"
        );
        token.transfer(msg.sender, _balance.add(dividends));
        balances[msg.sender] = balances[msg.sender].sub(_balance);
        emit Release(msg.sender, _balance);
    }

    /**
     * @dev calculate dividends for `_lockAmount`
     */
    function calcDividends(uint256 _lockAmount, uint256 _lockTime)
        private
        returns (uint256)
    {
        uint256 a = rate.div(100);
        return a.mul(_lockAmount);
    }
}
