const { accounts, contract } = require("@openzeppelin/test-environment");
const { expect } = require("chai");
const {
  expectRevert,
  expectEvent,
  BN,
  time,
} = require("openzeppelin-test-helpers");

require("chai").should;

const MinerCardRewards = contract.fromArtifact("MinerCardRewards");
const MinerCards = contract.fromArtifact("MinerCards");
const Exgold = contract.fromArtifact("Exgold");

describe("MinerCardRewards", function() {
  let releaseTime;
  const rate = 5;
  const amount = [
    new BN(25),
    new BN(50),
    new BN(100),
    new BN(250),
    new BN(1000),
  ];
  const data = "0xcafebabe";

  let minerCardRewards;
  let minerCards;
  let exgold;

  const initialize = async (releaseTime) => {
    await minerCardRewards.initialize(
      minerCards.address,
      exgold.address,
      releaseTime,
      rate
    );
  };

  const mintNft = async (owner, amount, ID) => {
    await minerCards.mint(owner, ID, amount, {
      from: owner,
    });
  };

  const transferExgold = async (from, to, amount) => {
    await exgold.transfer(to, amount, { from });
  };

  const transferNft = async (from, to, ID, amount) => {
    await minerCards.safeTransferFrom(from, to, ID, amount, "0x0", {
      from,
    });
  };

  const lockFunds = async () => {
    const ID = new BN(25);

    // mint new MinerCard token of ID 25.
    await mintNft(accounts[0], new BN(5000), ID);

    // transfer some Exgold tokens to accounts[1]
    await transferExgold(accounts[0], accounts[1], new BN(100));

    // transfer 1 MinerCard token (ID = 25) to accounts[1]
    await transferNft(accounts[0], accounts[1], ID, new BN(1));

    // accounts[1] sets approval for MinerCardRewards contract
    await exgold.approve(minerCardRewards.address, new BN(25), {
      from: accounts[1],
    });

    // lock funds
    await minerCardRewards.lockFunds(accounts[1], amount[0], amount[0], {
      from: accounts[1],
    });
  };

  beforeEach(async () => {
    minerCardRewards = await MinerCardRewards.new({ from: accounts[0] });
    minerCards = await MinerCards.new({ from: accounts[0] });
    exgold = await Exgold.new({ from: accounts[0] });

    await exgold.initialize("EXgold", "EXG", 6, 5000000, { from: accounts[0] });
    await exgold.transfer(minerCardRewards.address, new BN(4000000), {
      from: accounts[0],
    });
  });

  describe("initialize(address, address, uint256, uint256)", function() {
    it("should initialize contract once with correct values", async () => {
      releaseTime = (await time.latest()).add(time.duration.days(90));
      initialize(releaseTime);

      const t = await minerCardRewards.releaseTime();
      const r = await minerCardRewards.getRate();
      expect(t.toString()).to.equal(releaseTime.toString());
      expect(r.toString()).to.equal(new BN(rate).toString());
    });

    it("should revert if initialize is called more than once", async () => {
      releaseTime = (await time.latest()).add(time.duration.days(90));
      // first call
      initialize(releaseTime);

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
      releaseTime = (await time.latest()).add(time.duration.days(90));
      initialize(releaseTime);

      const ID = new BN(25);

      // mint new MinerCard token of ID 25.
      await mintNft(accounts[0], new BN(5000), ID);

      // transfer some Exgold tokens to accounts[1]
      await transferExgold(accounts[0], accounts[1], new BN(100));

      // transfer 1 MinerCard token (ID = 25) to accounts[1]
      await transferNft(accounts[0], accounts[1], ID, new BN(1));

      // accounts[1] sets approval for MinerCardRewards contract
      await exgold.approve(minerCardRewards.address, new BN(25), {
        from: accounts[1],
      });

      // retrieve logs
      const receipt = await minerCardRewards.lockFunds(
        accounts[1],
        amount[0],
        amount[0],
        {
          from: accounts[1],
        }
      );

      const balance = await minerCardRewards.balance(accounts[1]);
      expectEvent(receipt, "LockFund", {
        _account: accounts[1],
        _tokenType: ID,
        _lockAmount: amount[0],
      });
      expect(balance.toString()).to.equal(amount[0].toString());
    });
  });

  describe("release()", function() {
    it("should revert if no funds locked", async () => {
      releaseTime = (await time.latest()).add(time.duration.days(90));
      initialize(releaseTime);

      await expectRevert(
        minerCardRewards.release({ from: accounts[1] }),
        "MinerCardRewards: no funds locked."
      );
    });

    it("should release locked funds", async () => {
      releaseTime = (await time.latest()).add(time.duration.days(90));
      initialize(releaseTime);
      await lockFunds();

      let balance = await exgold.balanceOf(accounts[1]);
      expect(balance.toString()).to.equal(new BN(75).toString());
      const receipt = await minerCardRewards.release({ from: accounts[1] });
      balance = await exgold.balanceOf(accounts[1]);

      expect(balance.toString()).to.equal(new BN(100).toString());
      expectEvent(receipt, "Release", {
        _account: accounts[1],
        _lockAmount: amount[0],
      });
    });
  });

  describe("withdraw()", function() {
    it("should withdraw funds", async () => {
      releaseTime = time.duration.seconds(1);
      initialize(releaseTime);
      await lockFunds();

      //await time.increaseTo(releaseTime.add(time.duration.days(10)));

      console.log(
        (await minerCardRewards.accountReleaseTime(accounts[1])).toString(),
        (await minerCardRewards.releaseTime()).toString()
      );
      console.log(
        (await minerCardRewards.accountReleaseTime(accounts[1])) > releaseTime
      );
      const receipt = await minerCardRewards.withdraw({ from: accounts[1] });
      expectEvent(receipt, "Withdraw", {
        _account: accounts[1],
        _lockAmount: amount[0],
      });
    });
  });
});
