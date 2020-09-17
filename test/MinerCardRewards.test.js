const { accounts, contract, web3 } = require("@openzeppelin/test-environment");
const { expect } = require("chai");
const {
  expectRevert,
  expectEvent,
  BN,
  time,
} = require("openzeppelin-test-helpers");

require("chai").should;

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

  const lockFunds = async () => {
    const ID = new BN(25);
    // transfer some Exgold tokens to accounts[1]
    await exgold.transfer(addr1._address, 100);

    // mint new MinerCard token of ID 25.
    await minerCards.mint(owner._address, 25, 5000);

    // transfer 1 MinerCard token (ID = 25) to accounts[1]
    await minerCards.safeTransferFrom(
      owner._address,
      addr1._address,
      25,
      1,
      "0x00"
    );

    // accounts[1] sets approval for MinerCardRewards contract
    await exgold.connect(addr1).approve(minerCardRewards.address, 25);

    // lock funds
    await minerCardRewards.lockFunds(addr1._address, 25, 25);
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
    await exgold.transfer(minerCardRewards.address, new BN(4000000));
  });

  describe("withdraw()", function() {
    it("should withdraw funds", async () => {
      releaseTime = time.duration.days(90).toNumber();
      initialize(releaseTime);

      await lockFunds();
      console.log("ADDRESS:   ", addr1._address);
      //await time.increase((await time.latest()).add(time.duration.days(90)));
      const t = (await time.latest()).add(time.duration.days(90));
      console.log("ONE: ", t.toNumber());
      ethers.provider.send("evm_increaseTime", [t.toNumber()]); // add 60 seconds
      ethers.provider.send("evm_mine"); // mine the next block
      const receipt = await minerCardRewards.connect(addr1).withdraw();
      expectEvent(receipt, "Withdraw", {
        _account: addr1,
        _lockAmount: amount[0],
      });
    });
  });
});
