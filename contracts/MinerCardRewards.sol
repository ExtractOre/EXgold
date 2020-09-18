// SPDX-License-Identifier: MIT

pragma solidity ^0.6.0;

import "./MinerCards.sol";
import "@nomiclabs/buidler/console.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/Initializable.sol";

contract MinerCardRewards is Initializable {
    using SafeMath for uint256;

    IERC20 private token;
    MinerCards private minerCards;
    uint256 private _releaseTime;
    uint256 private rate;

    // mapping from address to time
    mapping(address => uint256) private unLockDates;

    // mapping from address to lockAmount
    mapping(address => uint256) private balances;

    // total amount locked
    uint256 private _lockedFunds;

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
        _releaseTime = _time;
        rate = _rate;
        minerCards = MinerCards(_minerCards);
        token = IERC20(_tokenAddress);
    }

    /**
     * @dev  Locks `_account` funds
     * Contract transfers the lock amount from `_account` to contract.
     * `_account` must set (ERC-20) allowance for contract address, else transaction reverts
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
            "MinerCardRewards: Account has insufficient miner card token to lock funds"
        );
        uint256 allowance = token.allowance(_account, address(this));
        require(
            allowance >= _lockAmount,
            "MinerCardRewards: lockAmount exceeds allowance"
        );

        token.transferFrom(_account, address(this), _lockAmount);
        balances[_account] = balances[_account].add(_lockAmount);
        _lockedFunds = _lockedFunds.add(_lockAmount);
        unLockDates[_account] = block.timestamp.add(_releaseTime);
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
            unLockDates[msg.sender] != 0 && balances[msg.sender] != 0,
            "MinerCardRewards: no funds locked"
        );
        uint256 balance = balances[msg.sender];
        token.transfer(msg.sender, balance);
        _lockedFunds = _lockedFunds.sub(balance);
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
            unLockDates[msg.sender] != 0 && balances[msg.sender] != 0,
            "MinerCardRewards: no funds locked"
        );
        require(
            block.timestamp >= unLockDates[msg.sender],
            "MinerCardRewards: current time is before release time"
        );

        uint256 _balance = balances[msg.sender];
        uint256 dividends = calcDividends(_balance);
        require(
            sufficientFunds(dividends) == true,
            "MinerCardRewards: Insufficient funds to pay dividends"
        );
        token.transfer(msg.sender, _balance.add(dividends));
        balances[msg.sender] = balances[msg.sender].sub(_balance);
        _lockedFunds = _lockedFunds.sub(_balance);
        emit Withdraw(msg.sender, _balance, dividends);
    }

    /**
     * @dev calculate dividends for `_lockAmount`
     */
    function calcDividends(uint256 _lockAmount) private view returns (uint256) {
        uint256 r = rate.mul(_lockAmount);
        return r.div(100);
    }

    function releaseTime() public view returns (uint256) {
        return _releaseTime;
    }

    function getRate() public view returns (uint256) {
        return rate;
    }

    function accountReleaseTime(address _account)
        public
        view
        returns (uint256)
    {
        return unLockDates[_account];
    }

    function balance(address _account) public view returns (uint256) {
        return balances[_account];
    }

    function sufficientFunds(uint256 _dividends) private view returns (bool) {
        uint256 _balance = token.balanceOf(address(this));
        uint256 r = _balance.sub(_lockedFunds);
        if (r > 0 && r >= _dividends) {
            return true;
        }

        return false;
    }
}
