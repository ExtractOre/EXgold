// SPDX-License-Identifier: MIT

pragma solidity ^0.6.0;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

contract MinerCards is ERC1155 {
    using SafeMath for uint256;

    uint256 public constant MINERCARD_1 = 0;
    uint256 public constant MINERCARD_2 = 1;
    uint256 public constant MINERCARD_3 = 2;
    uint256 public constant MINERCARD_4 = 3;
    uint256 public constant MINERCARD_5 = 4;

    address private owner;

    // Mapping from token ID to total supply
    mapping(uint256 => uint256) public tokenSupply;

    /**
     * @dev Require msg.sender to be an admin
     */
    modifier onlyOwner() {
        require(msg.sender == owner, "Sender is not authorized!");
        _;
    }

    constructor() public ERC1155("") {
        owner = msg.sender;
    }

    /**
     * @dev Creates `amount` tokens of token type `id`, and assigns them to `_account`.
     * It updates the token supply for the token type.
     * Emits a {TransferSingle} event.
     *
     * - `_account`      cannot be the zero address.
     * - `_id`          must be between 0 and 4.
     * - `_quantity`    quantity of tokens to mint.
     */
    function mint(
        address _account,
        uint256 _id,
        uint256 _quantity
    ) public onlyOwner {
        require(_id >= 0 && _id <= 4, "MinerCards: Invalid Token Type.");

        _mint(_account, _id, _quantity, "");
        tokenSupply[_id] = tokenSupply[_id].add(_quantity);
    }

    function getowner() public view returns (address) {
        return owner;
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
    ) public onlyOwner {
        for (uint256 i = 0; i < _ids.length; i++) {
            require(
                checkID(_ids[i]) != false,
                "MinerCards.mintBatch: Invalid Token Type."
            );
        }
        _mintBatch(_account, _ids, _amounts, "");

        for (uint256 i = 0; i < _amounts.length; i++) {
            tokenSupply[_ids[i]] = tokenSupply[_ids[i]].add(_amounts[i]);
        }
    }

    // checks if `_id` is a valid token type
    function checkID(uint256 _id) internal returns (bool) {
        return (_id >= 0 && _id <= 4);
    }
}
