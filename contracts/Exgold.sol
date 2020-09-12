// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

// Import base and ERC20 contract
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/ERC20.sol";

contract Exgold is ERC20UpgradeSafe {
    /**
     * @dev  Initializer function (replaces constructor)
     * Sets the values for {name} and {symbol}, initializes {decimals} using {_setupDecimals}
     *
     * All three of these values are immutable: they can only be set once during
     * construction.
     */
    function initialize(
        string memory _name,
        string memory _symbol,
        uint8 _decimals
    ) public initializer {
        __ERC20_init(_name, _symbol);
        _setupDecimals(_decimals);
        _mint(msg.sender, 5000000 * (10**uint256(_decimals)));
    }
}
