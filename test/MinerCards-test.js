const { accounts, contract } = require("@openzeppelin/test-environment");
//const BN = require("big-number");
const { expect } = require("chai");
//const assert = require("chai").assert;
const { expectRevert, BN, constants } = require("openzeppelin-test-helpers");
//const truffleAssert = require("truffle-assertions");
const { ZERO_ADDRESS } = constants;

require("chai").should;

const MinerCards = contract.fromArtifact("MinerCards");

describe("MinerCards", function() {
  const mintAmount = new BN(5000);
  const tokenIDs = [0, 1, 2, 3, 4];
  let minerCards;

  beforeEach(async () => {
    minerCards = await MinerCards.new({ from: accounts[0] });
  });

  describe("mint(address, uint256, uint256)", function() {
    it("should mint tokens", async () => {
      await minerCards.mint(accounts[0], tokenIDs[0], mintAmount, {
        from: accounts[0],
      });

      const balance = await minerCards.balanceOf(accounts[0], tokenIDs[0]);
      expect(balance.toString()).to.equal(mintAmount.toString());
    });

    it("should revert when mint is called by unauthorized sender", async () => {
      await expectRevert(
        minerCards.mint(accounts[0], tokenIDs[0], mintAmount, {
          from: accounts[1],
        }),
        "Sender is not authorized!"
      );
    });

    it("should revert when mint is called with a null destination address", async () => {
      await expectRevert(
        minerCards.mint(ZERO_ADDRESS, tokenIDs[0], mintAmount, {
          from: accounts[0],
        }),
        "ERC1155: mint to the zero address"
      );
    });

    it("should revert when mint is called with invalid token type", async () => {
      await expectRevert(
        minerCards.mint(accounts[0], 7, mintAmount, {
          from: accounts[0],
        }),
        "MinerCards: Invalid Token Type."
      );
    });
  });
});
