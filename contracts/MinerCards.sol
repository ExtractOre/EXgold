// SPDX-License-Identifier: MIT

pragma solidity ^0.6.0;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

contract MinerCards is ERC1155 {
    using SafeMath for uint256;

    address private owner;

    uint256[] ids;
    uint256[] supply;

    uint256 public constant MINERCARD_1 = 25;
    uint256 public constant MINERCARD_2 = 50;
    uint256 public constant MINERCARD_3 = 100;
    uint256 public constant MINERCARD_4 = 250;
    uint256 public constant MINERCARD_5 = 1000;

    address private _admin;

    // Mapping from token ID to total supply
    mapping(uint256 => uint256) public _totalSupply;

    mapping(uint256 => Data) public _data;

    mapping(address => uint256[]) private account;

    struct Data {
        uint256 amountLocked;
        uint256 duration;
        uint256 releaseDate;
        uint256 idErc1155;
        bool active;
    }

    /**
     * @dev Require msg.sender to be an admin
     */
    modifier onlyAdmin(address _address) {
        require(_admin == _address, "Sender is not authorized!");
        _;
    }

    /**
     * @dev Require msg.sender to be an admin
     */
    modifier onlyOwner() {
        require(msg.sender == owner, "Sender is not authorized!");
        _;
    }

    constructor() public ERC1155("") {
        owner = msg.sender;
        ids = [
            uint256(25),
            uint256(50),
            uint256(100),
            uint256(250),
            uint256(1000)
        ];
        supply = [
            uint256(5000),
            uint256(5000),
            uint256(1000),
            uint256(500),
            uint256(400)
        ];

        mintBatch(owner, ids, supply);
    }

    /**
     * @dev Creates an ERC-721 NFT of token type `id`, and assigns them to `_account`.
     * Emits a {TransferSingle} event.
     *
     * - `_account`         receiver account, cannot be the zero address.
     * - `_id`              token ID.
     * - `_amountLocked`    amount to be locked.
     * -   _duration        duration to lock funds
     * -  _releaseDate      date funds are eligible to be witjdrawn
     * -  _idErc1155        ID of ERC-1155 NFT
     */
    function mint(
        address _account,
        uint256 _id,
        uint256 _amountLocked,
        uint256 _duration,
        uint256 _releaseDate,
        uint256 _idErc1155
    ) external onlyAdmin(msg.sender) {
        require(
            validateTokenType(_id) == false,
            "MinerCards.mint: Invalid Token Type."
        );
        _mint(_account, _id, 1, "");
        Data memory data = Data(
            _amountLocked,
            _duration,
            _releaseDate,
            _idErc1155,
            true
        );
        _data[_id] = data;
        account[_account].push(_id);
    }

    function invalidate(uint256 _id) external onlyAdmin(msg.sender) {
        _data[_id].active = false;
    }

    function getAmountLocked(uint256 _id) external view returns (uint256) {
        return _data[_id].amountLocked;
    }

    function getReleaseDate(uint256 _id) external view returns (uint256) {
        return _data[_id].releaseDate;
    }

    function isActive(uint256 _id) external view returns (bool) {
        return _data[_id].active;
    }

    function idERC155(uint256 _id) external view returns (uint256) {
        return _data[_id].idErc1155;
    }

    function admin() external view returns (address) {
        return _admin;
    }

    function addAdmin(address _address) external onlyOwner {
        _admin = _address;
    }

    function revokeAdmin() external onlyOwner {
        _admin = address(0);
    }

    function getAccount(address _account)
        external
        view
        returns (uint256[] memory)
    {
        return account[_account];
    }

    /**
     * @dev mints a batch ot tokens of different types and assigns them to `_account`
     *
     * Requirements:
     *
     * - `ids` and `amounts` must have the same length.
     * - If `_account` refers to a smart contract, it must implement {IERC1155Receiver-onERC1155BatchReceived} and return the
     * acceptance magic value.
     */
    function mintBatch(
        address _account,
        uint256[] memory _ids,
        uint256[] memory _amounts
    ) private onlyOwner {
        for (uint256 i = 0; i < _ids.length; i++) {
            require(
                validateTokenType(_ids[i]) == true,
                "MinerCards.mintBatch: Invalid Token Type."
            );
        }
        _mintBatch(_account, _ids, _amounts, "");

        for (uint256 i = 0; i < _amounts.length; i++) {
            _totalSupply[_ids[i]] = _totalSupply[_ids[i]].add(_amounts[i]);
        }
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

    // get the total supply for a token type `_id`
    function totalSupply(uint256 _id) external view returns (uint256) {
        return _totalSupply[_id];
    }
}
