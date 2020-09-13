const { accounts, contract } = require("@openzeppelin/test-environment");
const { expect } = require("chai");
const { expectRevert, BN, constants } = require("openzeppelin-test-helpers");
const { ZERO_ADDRESS } = constants;

require("chai").should;

const MinerCards = contract.fromArtifact("MinerCards");

describe("MinerCards", function() {
  const mintAmount = new BN(5000);
  const tokenID = new BN(1);
  const tokenBatchIds = [new BN(0), new BN(1), new BN(2), new BN(3), new BN(4)];
  const mintAmounts = [
    new BN(5000),
    new BN(10000),
    new BN(42195),
    new BN(2000),
    new BN(12000),
  ];

  let minerCards;

  beforeEach(async () => {
    minerCards = await MinerCards.new({ from: accounts[0] });
  });

  describe("mint(address, uint256, uint256)", function() {
    it("should mint tokens", async () => {
      await minerCards.mint(accounts[0], tokenID, mintAmount, {
        from: accounts[0],
      });

      const balance = await minerCards.balanceOf(accounts[0], tokenID);
      expect(balance.toString()).to.equal(mintAmount.toString());
    });

    it("should revert when mint is called by unauthorized sender", async () => {
      await expectRevert(
        minerCards.mint(accounts[0], tokenID, mintAmount, {
          from: accounts[1],
        }),
        "Sender is not authorized!"
      );
    });

    it("should revert when mint is called with a null destination address", async () => {
      await expectRevert(
        minerCards.mint(ZERO_ADDRESS, tokenID, mintAmount, {
          from: accounts[0],
        }),
        "ERC1155: mint to the zero address"
      );
    });

    it("should revert when mint is called with invalid token type", async () => {
      await expectRevert(
        minerCards.mint(accounts[0], new BN(7), mintAmount, {
          from: accounts[0],
        }),
        "MinerCards: Invalid Token Type."
      );
    });
  });

  describe("_mintBatch(address, uint256[] memory, uint256[] memory", function() {
    it("should mint tokens in batch", async () => {
      await minerCards.mintBatch(accounts[0], tokenBatchIds, mintAmounts, {
        from: accounts[0],
      });

      const balance_1 = await minerCards.balanceOf(
        accounts[0],
        tokenBatchIds[0]
      );
      const balance_2 = await minerCards.balanceOf(
        accounts[0],
        tokenBatchIds[1]
      );
      const balance_3 = await minerCards.balanceOf(
        accounts[0],
        tokenBatchIds[2]
      );
      const balance_4 = await minerCards.balanceOf(
        accounts[0],
        tokenBatchIds[3]
      );
      const balance_5 = await minerCards.balanceOf(
        accounts[0],
        tokenBatchIds[4]
      );

      expect(balance_1.toString()).to.equal(mintAmounts[0].toString());
      expect(balance_2.toString()).to.equal(mintAmounts[1].toString());
      expect(balance_3.toString()).to.equal(mintAmounts[2].toString());
      expect(balance_4.toString()).to.equal(mintAmounts[3].toString());
      expect(balance_5.toString()).to.equal(mintAmounts[4].toString());
    });

    it("should revert when mintBatch is called with a null destination address", async () => {
      await expectRevert(
        minerCards.mintBatch(ZERO_ADDRESS, tokenBatchIds, mintAmounts, {
          from: accounts[0],
        }),
        "ERC1155: mint to the zero address"
      );
    });
  });

  it("should revert if length of inputs do not match", async () => {
    await expectRevert(
      minerCards.mintBatch(accounts[0], tokenBatchIds, mintAmounts.slice(1), {
        from: accounts[0],
      }),
      "ERC1155: ids and amounts length mismatch"
    );
  });

  it("should revert when mintBatch is called with invalid token type", async () => {
    const invalidtokenBatchIds = [
      new BN(0),
      new BN(1),
      new BN(2),
      new BN(3),
      new BN(5),
    ];

    await expectRevert(
      minerCards.mintBatch(
        accounts[0],
        invalidtokenBatchIds,
        mintAmounts.slice(1),
        {
          from: accounts[0],
        }
      ),
      "MinerCards.mintBatch: Invalid Token Type."
    );

    it("should revert if mintBatch is called by unauthorized sender", async () => {
      await expectRevert(
        minerCards.mintBatch(accounts[0], tokenBatchIds, mintAmounts, {
          from: accounts[1],
        }),
        "Sender is not authorized!"
      );
    });
  });
});
