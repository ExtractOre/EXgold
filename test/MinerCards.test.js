const { expect } = require("chai");
const { expectRevert, constants } = require("openzeppelin-test-helpers");
const { ZERO_ADDRESS } = constants;

require("chai").should;

describe("MinerCards", function() {
  const mintAmount = 5000;
  const tokenID = 100;
  let tokenBatchIds = [25, 50, 100, 250, 1000];
  const mintAmounts = [5000, 10000, 42195, 2000, 12000];

  let MinerCards, minerCards;
  let owner, addr1;
  let ownerAddress, addr1Address;

  beforeEach(async () => {
    [owner, addr1] = await ethers.getSigners();
    ownerAddress = owner._address;
    addr1Address = addr1._address;

    MinerCards = await ethers.getContractFactory("MinerCards");
    minerCards = await MinerCards.deploy();
  });

  describe("mint(address, uint256, uint256)", function() {
    it("should mint tokens", async () => {
      await minerCards.mint(ownerAddress, tokenID, mintAmount);

      const balance = await minerCards.balanceOf(ownerAddress, tokenID);
      expect(balance).to.equal(mintAmount);
    });

    it("should get token supply", async () => {
      await minerCards.mint(ownerAddress, tokenID, mintAmount);

      const totalSupply = await minerCards.totalSupply(tokenID);
      expect(totalSupply).to.equal(mintAmount);
    });

    it("should revert when mint is called by unauthorized sender", async () => {
      await expectRevert(
        minerCards.connect(addr1).mint(ownerAddress, tokenID, mintAmount),
        "Sender is not authorized!"
      );
    });

    it("should revert when mint is called with a null destination address", async () => {
      await expectRevert(
        minerCards.mint(ZERO_ADDRESS, tokenID, mintAmount),
        "ERC1155: mint to the zero address"
      );
    });

    it("should revert when mint is called with invalid token type", async () => {
      await expectRevert(
        minerCards.mint(ownerAddress, 7, mintAmount),
        "MinerCards.mint: Invalid Token Type."
      );
    });
  });

  describe("_mintBatch(address, uint256[] memory, uint256[] memory", function() {
    it("should mint tokens in batch", async () => {
      await minerCards.mintBatch(ownerAddress, tokenBatchIds, mintAmounts);

      const balance_1 = await minerCards.balanceOf(
        ownerAddress,
        tokenBatchIds[0]
      );
      const balance_2 = await minerCards.balanceOf(
        ownerAddress,
        tokenBatchIds[1]
      );
      const balance_3 = await minerCards.balanceOf(
        ownerAddress,
        tokenBatchIds[2]
      );
      const balance_4 = await minerCards.balanceOf(
        ownerAddress,
        tokenBatchIds[3]
      );
      const balance_5 = await minerCards.balanceOf(
        ownerAddress,
        tokenBatchIds[4]
      );

      expect(balance_1).to.equal(mintAmounts[0]);
      expect(balance_2).to.equal(mintAmounts[1]);
      expect(balance_3).to.equal(mintAmounts[2]);
      expect(balance_4).to.equal(mintAmounts[3]);
      expect(balance_5).to.equal(mintAmounts[4]);
    });

    it("should update token supply", async () => {
      await minerCards.mintBatch(ownerAddress, tokenBatchIds, mintAmounts);

      const totalSupply_1 = await minerCards.totalSupply(tokenBatchIds[0]);
      const totalSupply_2 = await minerCards.totalSupply(tokenBatchIds[1]);
      const totalSupply_3 = await minerCards.totalSupply(tokenBatchIds[2]);
      const totalSupply_4 = await minerCards.totalSupply(tokenBatchIds[3]);
      const totalSupply_5 = await minerCards.totalSupply(tokenBatchIds[4]);

      expect(totalSupply_1).to.equal(mintAmounts[0]);
      expect(totalSupply_2).to.equal(mintAmounts[1]);
      expect(totalSupply_3).to.equal(mintAmounts[2]);
      expect(totalSupply_4).to.equal(mintAmounts[3]);
      expect(totalSupply_5).to.equal(mintAmounts[4]);
    });

    it("should revert when mintBatch is called with a null destination address", async () => {
      await expectRevert(
        minerCards.mintBatch(ZERO_ADDRESS, tokenBatchIds, mintAmounts),
        "ERC1155: mint to the zero address"
      );
    });

    it("should revert if length of inputs do not match", async () => {
      await expectRevert(
        minerCards.mintBatch(ownerAddress, tokenBatchIds, mintAmounts.slice(1)),
        "ERC1155: ids and amounts length mismatch"
      );
    });

    it("should revert if mintBatch is called by unauthorized sender", async () => {
      await expectRevert(
        minerCards
          .connect(addr1)
          .mintBatch(addr1Address, tokenBatchIds, mintAmounts),
        "Sender is not authorized!"
      );
    });

    it("should revert when mintBatch is called with invalid token type", async () => {
      tokenBatchIds[tokenBatchIds.length - 1] = 10;

      await expectRevert(
        minerCards.mintBatch(ownerAddress, tokenBatchIds, mintAmounts.slice(1)),
        "MinerCards.mintBatch: Invalid Token Type."
      );
    });
  });

  describe("safeTransferFrom(address, address, uint256, uint256, bytes calldata)", function() {
    it("should make a safeTransfer", async () => {
      const value = 1000;
      const ID = tokenBatchIds[0];

      await minerCards.mint(ownerAddress, ID, mintAmount);

      await minerCards.safeTransferFrom(
        ownerAddress,
        addr1Address,
        ID,
        value,
        "0x00"
      );

      const balance = await minerCards.balanceOf(addr1Address, ID);
      expect(balance).to.equal(value);
    });
  });
});
