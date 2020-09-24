// SPDX-License-Identifier: MIT

pragma solidity ^0.6.0;

import "./MinerCards.sol";
import "@nomiclabs/buidler/console.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155Holder.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/Initializable.sol";

contract MinerCardRewards is Initializable, ERC1155Holder {
    using SafeMath for uint256;

    uint256 private count = 0;
    uint256 public constant MINERCARD_1 = 25;
    uint256 public constant MINERCARD_2 = 50;
    uint256 public constant MINERCARD_3 = 100;
    uint256 public constant MINERCARD_4 = 250;
    uint256 public constant MINERCARD_5 = 1000;

    IERC20 private token;
    MinerCards private minerCards;
    uint256 private _releaseTime;
    uint256 private rate;

    // mapping from address to time
    mapping(address => uint256) private unLockDates;

    // mapping from address to lockAmount
    mapping(address => uint256) private balances;

    mapping(uint256 => address) private _nfts;

    mapping(address => mapping(uint256 => uint256)) private _certNft;

    // mapping from id to amount locked
    mapping(uint256 => uint256) private _idlf;

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

    // Emitted when funds and dividends is withdrawn.
    event IssueNFT(address indexed _account, uint256 indexed _id);

    // Emitted when only lock fund is withdrwan.
    event Release(address indexed _account, uint256 indexed _lockAmount);

    /**
     * @dev Require funds to be locked
     */
    modifier fundsLocked(uint256 _id) {
        require(
            _idlf[_id] != 0 && _nfts[_id] != address(0),
            "MinerCardRewards: no funds locked"
        );
        _;
    }

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
     * @dev  Locks `_account` funds and Issues NFT
     * Contract transfers the lock amount from `_account` to contract.
     * `_account` must set (ERC-20) allowance for contract address, else transaction reverts
     * `_account` must set (ERC-1155) setApprovalForAll for contract address, else transaction fails
     * Sets the lock time and balances.
     * Emits `LockFund`  and IssueNFT event
     */
    function lockFunds(uint256 _id, uint256 _lockAmount) public {
        address _account = msg.sender;
        require(
            validateTokenType(_id) == true,
            "MinerCardRewards: Invalid token ID"
        );
        uint256 balance = minerCards.balanceOf(_account, _id);
        require(
            balance > 0,
            "MinerCardRewards: Account has insufficient miner cards to lock funds"
        );
        uint256 allowance = token.allowance(_account, address(this));
        require(
            allowance >= _lockAmount,
            "MinerCardRewards: Insufficient allowance set for MinerRewards Contract"
        );

        require(
            checkLockAmount(_lockAmount, _id) == true,
            "MinerCardRewards: Invalid amount provided."
        );

        require(
            minerCards.isApprovedForAll(_account, address(this)) == true,
            "MinerCardRewards: setApprovalForAll not set for MinerRewards Contract"
        );

        uint256 id = getId();
        minerCards.safeTransferFrom(_account, address(this), _id, 1, "");
        token.transferFrom(_account, address(this), _lockAmount);
        minerCards.mint(_account, id);
        _nfts[id] = _account;
        _idlf[id] = _lockAmount;
        _certNft[_account][_id] = id;
        emit IssueNFT(_account, id);
        balances[_account] = balances[_account].add(_lockAmount);
        _lockedFunds = _lockedFunds.add(_lockAmount);
        unLockDates[_account] = block.timestamp.add(_releaseTime);
        emit LockFund(_account, _id, _lockAmount);
    }

    /**
     * @dev  release locked funds excluding dividends.
     * `_id` is ID of ERC-721 token issued during locking funds
     * Calling this function releases the locked funds to `msg.sender`.
     * Note: Calling this function assumes the lock time has not been met.
     * Emits `Release` event.
     */
    function release(uint256 _id) public fundsLocked(_id) {
        uint256 _amountLocked = _idlf[_id];
        token.transfer(msg.sender, _amountLocked);
        uint256 nftId = _amountLocked.div(10**uint256(6));
        transferERC1155(msg.sender, nftId);
        _idlf[_id] = 0;
        _nfts[_id] = address(0);
        _lockedFunds = _lockedFunds.sub(_amountLocked);
        balances[msg.sender] = balances[msg.sender].sub(_amountLocked);
        emit Release(msg.sender, _amountLocked);
    }

    /**
     * @dev  release locked funds plus dividends.
     * Dividends is 5% of amount locked
     * Emits `Withdraw` event.
     */
    function withdraw(uint256 _id) public fundsLocked(_id) {
        require(
            block.timestamp >= unLockDates[msg.sender],
            "MinerCardRewards: current time is before release time"
        );

        uint256 _amountLocked = _idlf[_id];
        uint256 dividends = calcDividends(_amountLocked);
        require(
            sufficientFunds(dividends) == true,
            "MinerCardRewards: Insufficient funds to pay dividends"
        );
        token.transfer(msg.sender, _amountLocked.add(dividends));
        uint256 nftId = _amountLocked.div(10**uint256(6));
        transferERC1155(msg.sender, nftId);
        balances[msg.sender] = balances[msg.sender].sub(_amountLocked);
        _lockedFunds = _lockedFunds.sub(_amountLocked);
        emit Withdraw(msg.sender, _amountLocked, dividends);
    }

    function idlf(uint256 id) public view returns (uint256) {
        return _idlf[id];
    }

    function nfts(uint256 id) public view returns (address) {
        return _nfts[id];
    }

    function certToken(address _account, uint256 _id)
        public
        view
        returns (uint256)
    {
        return _certNft[_account][_id];
    }

    // checks if `_id` is a valid token type
    function validateTokenType(uint256 _id) internal pure returns (bool) {
        if (
            _id == MINERCARD_1 ||
            _id == MINERCARD_2 ||
            _id == MINERCARD_3 ||
            _id == MINERCARD_4 ||
            _id == MINERCARD_5
        ) {
            return true;
        }

        return false;
    }

    function getId() public returns (uint256) {
        count = count.add(1);
        if (
            count == MINERCARD_1 ||
            count == MINERCARD_2 ||
            count == MINERCARD_3 ||
            count == MINERCARD_4 ||
            count == MINERCARD_5
        ) {
            count = count.add(3);
            return count;
        }

        return count;
    }

    function transferERC1155(address _account, uint256 _id) public {
        minerCards.safeTransferFrom(address(this), _account, _id, 1, "");
    }

    function checkLockAmount(uint256 _lockAmount, uint256 _id)
        public
        pure
        returns (bool)
    {
        uint256 _amount = _lockAmount.div(10**uint256(6));
        if (validateTokenType((_amount)) == true && _amount == _id) {
            return true;
        }

        return false;
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
