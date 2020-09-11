pragma solidity ^0.6.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Exgold is ERC20 {
    uint8 private _decimals;

    /**
     * @dev Sets the values for {name} and {symbol}, initializes {decimals} with
     * a value of 18.
     *
     * All three of these values are immutable: they can only be set once during
     * construction.
     */
    constructor(string memory _name, string memory _symbol)
        public
        ERC20(_name, _symbol)
    {
        _setupDecimals(_decimals);
        _mint(msg.sender, 5000000 * (10**uint256(_decimals)));
    }
}
