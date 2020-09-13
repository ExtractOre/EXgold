// SPDX-License-Identifier: MIT

pragma solidity ^0.6.0;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";

contract MinerCards is ERC1155 {
    uint256 public constant MINERCARD_1 = 0;
    uint256 public constant MINERCARD_2 = 1;
    uint256 public constant MINERCARD_3 = 2;
    uint256 public constant MINERCARD_4 = 3;
    uint256 public constant MINERCARD_5 = 4;

    struct AmountLocked {
        uint256 amount;
        uint8 duration;
    }

    address private owner;

    // Mapping from token ID to total supply
    mapping(uint256 => uint256) public tokenSupply;

    // Mapping from token ID to URI
    mapping(uint256 => string) public customUri;

    // Mapping of user address to array of locked amounts
    mapping(address => AmountLocked[]) public amountLocked;

    /**
     * @dev Require msg.sender to be an admin
     */
    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }

    constructor(string memory uri) public ERC1155(uri) {
        owner = msg.sender;
    }

    /**
     * @dev Creates `amount` tokens of token type `id`, and assigns them to `account`.
     *
     * Emits a {TransferSingle} event.
     *
     * Requirements:
     *
     * - `_to` cannot be the zero address.
     * - `_id` must be between 0 and 4
     */
    function mint(
        address _to,
        uint256 _id,
        uint256 _quantity,
        bytes memory _data,
        uint8 _duration
    ) public onlyOwner {
        require(msg.sender == owner);
        require(_id >= 0 && _id <= 4, "MinerCards: Invalid Token Type.");
        _mint(_to, _id, 1, _data);
    }

    /**
     * @dev Creates a new token type and assigns _initialSupply to an address
     *
     * Emits a {TransferSingle} event.
     *
     * Requirements:
     *
     * - `_to` cannot be the zero address.
     * - `_id` must be between 0 and 4
     */
    /* function create(
        address _to,
        uint256 _id,
        uint256 _initialSupply,
        bytes memory _data,
    ) public onlyOwner returns (uint256) {
        require(tokens[_id] == false, "Token type already exists!");
        _mint(_to, _id, _initialSupply, _data);
        tokens[_id] = true;
    } */
}
