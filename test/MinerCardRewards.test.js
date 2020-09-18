const { expect } = require("chai");
const { expectRevert, time } = require("openzeppelin-test-helpers");

require("chai").should;

describe("MinerCardRewards", function() {
  const ID = 250;
  const decimals = 10 ** 6;
  const rate = 5;
  const approveAmount = 50 * decimals;

  const transferAmount = 10000 * decimals;

  let releaseTime;
  let MinerCardRewards, minerCardRewards;
  let MinerCards, minerCards;
  let Exgold, exgold;
  let owner, addr1;

  const initialize = async (releaseTime) => {
    await minerCardRewards.initialize(
      minerCards.address,
      exgold.address,
      releaseTime,
      rate
    );
  };

  const transferExgoldToRewardsContract = async () => {
    await exgold.transfer(minerCardRewards.address, 4000000 * decimals);
  };

  const lockFunds = async () => {
    // transfer some Exgold tokens to accounts[1]
    await exgold.transfer(addr1._address, transferAmount);

    // mint new MinerCard token of ID.
    await minerCards.mint(owner._address, ID, 5000);

    // transfer 1 MinerCard token (ID = 25) to accounts[1]
    await minerCards.safeTransferFrom(
      owner._address,
      addr1._address,
      ID,
      1,
      "0x00"
    );

    // accounts[1] sets approval for MinerCardRewards contract
    await exgold
      .connect(addr1)
      .approve(minerCardRewards.address, approveAmount);

    // lock funds
    const lf = await minerCardRewards.lockFunds(
      addr1._address,
      ID,
      approveAmount
    );
    return lf;
  };

  beforeEach(async () => {
    [owner, addr1] = await ethers.getSigners();

    MinerCardRewards = await ethers.getContractFactory("MinerCardRewards");
    MinerCards = await ethers.getContractFactory("MinerCards");
    Exgold = await ethers.getContractFactory("Exgold");

    minerCardRewards = await MinerCardRewards.deploy();
    minerCards = await MinerCards.deploy();
    exgold = await Exgold.deploy();

    await exgold.initialize("EXgold", "EXG", 6, 5000000);
  });

  describe("initialize(address, address, uint256, uint256)", function() {
    it("should initialize contract once with correct values", async () => {
      releaseTime = time.duration.days(90).toNumber();
      initialize(releaseTime);
      await transferExgoldToRewardsContract();

      const t = await minerCardRewards.releaseTime();
      const r = await minerCardRewards.getRate();
      expect(t).to.equal(releaseTime);
      expect(r).to.equal(rate);
    });

    it("should revert if initialize is called more than once", async () => {
      releaseTime = time.duration.days(90).toNumber();

      // first call
      initialize(releaseTime);
      await transferExgoldToRewardsContract();

      await expectRevert(
        minerCardRewards.initialize(
          minerCards.address,
          exgold.address,
          releaseTime,
          rate
        ),
        "Contract instance has already been initialized"
      );
    });
  });

  describe("lockFunds(address, uint256, uint256)", function() {
    it("should lock funds", async () => {
      releaseTime = time.duration.days(90).toNumber();
      initialize(releaseTime);
      await transferExgoldToRewardsContract();

      await lockFunds();
      const balance = await minerCardRewards.balance(addr1._address);
      expect(balance).to.equal(approveAmount);
    });
  });

  describe("release()", function() {
    it("should revert if no funds locked", async () => {
      releaseTime = time.duration.days(90).toNumber();
      initialize(releaseTime);
      await transferExgoldToRewardsContract();

      await expectRevert(
        minerCardRewards.connect(addr1).release(),
        "MinerCardRewards: no funds locked"
      );
    });

    it("should release locked funds", async () => {
      releaseTime = time.duration.days(90).toNumber();
      initialize(releaseTime);
      await transferExgoldToRewardsContract();
      await lockFunds();

      let balance = await exgold.balanceOf(addr1._address);
      expect(balance).to.equal(transferAmount - approveAmount);
      await minerCardRewards.connect(addr1).release();
      balance = await exgold.balanceOf(addr1._address);

      expect(balance).to.equal(transferAmount);
    });
  });

  describe("withdraw()", function() {
    it("should withdraw funds", async () => {
      releaseTime = time.duration.days(90).toNumber();
      initialize(releaseTime);
      await transferExgoldToRewardsContract();
      await lockFunds();

      const t = (await time.latest()).add(time.duration.days(90));
      ethers.provider.send("evm_increaseTime", [t.toNumber()]); // add 60 seconds
      ethers.provider.send("evm_mine"); // mine the next block
      await minerCardRewards.connect(addr1).withdraw();

      const bal = await exgold.balanceOf(addr1._address);
      const rate = await minerCardRewards.getRate();
      const dividends = (rate / 100) * approveAmount;
      expect(dividends + transferAmount).to.equals(bal.toNumber());
    });

    it("should revrt if current time is before release time", async () => {
      releaseTime = time.duration.days(90).toNumber();
      initialize(releaseTime);
      await lockFunds();
      await transferExgoldToRewardsContract();

      await expectRevert(
        minerCardRewards.connect(addr1).withdraw(),
        "MinerCardRewards: current time is before release time"
      );
    });

    it("should revrt if no funds locked", async () => {
      releaseTime = time.duration.days(90).toNumber();
      initialize(releaseTime);
      await transferExgoldToRewardsContract();

      await expectRevert(
        minerCardRewards.connect(addr1).withdraw(),
        "MinerCardRewards: no funds locked"
      );
    });

    it("should revrt if insufficient funds to pay dividends", async () => {
      releaseTime = time.duration.days(90).toNumber();
      initialize(releaseTime);
      await lockFunds();
      const t = (await time.latest()).add(time.duration.days(90));
      ethers.provider.send("evm_increaseTime", [t.toNumber()]); // add 90+ days
      ethers.provider.send("evm_mine"); // mine the next block

      await expectRevert(
        minerCardRewards.connect(addr1).withdraw(),
        "MinerCardRewards: Insufficient funds to pay dividends"
      );
    });
  });
});
