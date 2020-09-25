const { expect } = require("chai");

const { expectRevert, time } = require("openzeppelin-test-helpers");

require("chai").should;

describe("MinerCardRewards", function() {
  const ID = 250;
  const INVALID_ID = 1;

  const decimals = 10 ** 6;
  const rate = 5;
  const approveAmount = 250 * decimals;
  const InvalidApproveAmount = 50 * decimals;

  const transferAmount = 10000 * decimals;

  let releaseTime;
  let MinerCardRewards, minerCardRewards;
  let MinerCards, minerCards;
  let Exgold, exgold;
  let owner, addr1, addr2;

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

  const transfer = async () => {
    // transfer some Exgold tokens to accounts[1]
    await exgold.transfer(addr1._address, transferAmount);
  };

  const mintMultiple = async () => {
    // mint new MinerCard token of ID.
    await minerCards.mintMultiple(owner._address, ID, 5000);
  };

  const setApprovalForAll = async () => {
    // set approval for MinerCards Contract
    await minerCards
      .connect(addr1)
      .setApprovalForAll(minerCardRewards.address, true);
  };

  const safeTransferFrom = async () => {
    // transfer 1 MinerCard token (ID = 25) to accounts[1]
    await minerCards.safeTransferFrom(
      owner._address,
      addr1._address,
      ID,
      1,
      "0x00"
    );
  };

  const approve = async () => {
    // accounts[1] sets approval for MinerCardRewards contract
    await exgold
      .connect(addr1)
      .approve(minerCardRewards.address, approveAmount);
  };

  const run = async (funcObjs) => {
    for (const [key, func] of Object.entries(funcObjs)) {
      func();
    }
  };

  beforeEach(async () => {
    [owner, addr1, addr2] = await ethers.getSigners();

    MinerCardRewards = await ethers.getContractFactory("MinerCardRewards");
    MinerCards = await ethers.getContractFactory("MinerCards");
    Exgold = await ethers.getContractFactory("Exgold");

    minerCardRewards = await MinerCardRewards.deploy();
    minerCards = await MinerCards.deploy();
    exgold = await Exgold.deploy();

    await exgold.initialize("EXgold", "EXG", 6, 5000000);
    await minerCards.addAdmin(minerCardRewards.address);
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
      const funcs = {
        transfer,
        mintMultiple,
        setApprovalForAll,
        safeTransferFrom,
        approve,
      };

      releaseTime = time.duration.days(90).toNumber();
      initialize(releaseTime);
      await transferExgoldToRewardsContract();
      await run(funcs);

      await minerCardRewards.connect(addr1).lockFunds(ID, approveAmount);
      let baalance = await exgold.balanceOf(addr1._address);
      const balance = await minerCardRewards.balance(addr1._address);

      const nft = await minerCards.balanceOf(minerCardRewards.address, ID);

      const id = await minerCardRewards.certToken(addr1._address, ID);
      const balAddr1 = await minerCards.balanceOf(addr1._address, ID);

      expect(nft).to.equal(1);
      expect(balance).to.equal(approveAmount);
      expect(balAddr1).to.equal(0);
      expect(id).to.not.equal(0); // Not recommended
    });

    it("should revert if invalid token ID", async () => {
      releaseTime = time.duration.days(90).toNumber();
      initialize(releaseTime);
      await transferExgoldToRewardsContract();
      const funcs = {
        transfer,
        mintMultiple,
        setApprovalForAll,
        safeTransferFrom,
        approve,
      };

      await run(funcs);
      await expectRevert(
        minerCardRewards.connect(addr1).lockFunds(INVALID_ID, approveAmount),
        "MinerCardRewards: Invalid token ID"
      );
    });

    it("should revert if user has insufficient miner cards", async () => {
      releaseTime = time.duration.days(90).toNumber();
      initialize(releaseTime);
      await transferExgoldToRewardsContract();

      await expectRevert(
        minerCardRewards.connect(addr1).lockFunds(ID, approveAmount),
        "MinerCardRewards: Account has insufficient miner cards to lock funds"
      );
    });

    it("should revert if insufficient allowance set for MinerCardsRewards  contract", async () => {
      releaseTime = time.duration.days(90).toNumber();
      initialize(releaseTime);
      await transferExgoldToRewardsContract();
      const funcs = {
        transfer,
        mintMultiple,
        setApprovalForAll,
        safeTransferFrom,
      };

      await run(funcs);
      await expectRevert(
        minerCardRewards.connect(addr1).lockFunds(ID, approveAmount),
        "MinerCardRewards: Insufficient allowance set for MinerRewards Contract"
      );
    });

    it("should revert if invalid lock amount provided", async () => {
      releaseTime = time.duration.days(90).toNumber();
      initialize(releaseTime);
      await transferExgoldToRewardsContract();
      const funcs = {
        transfer,
        mintMultiple,
        setApprovalForAll,
        safeTransferFrom,
        approve,
      };

      await run(funcs);
      await expectRevert(
        minerCardRewards.connect(addr1).lockFunds(ID, InvalidApproveAmount),
        "MinerCardRewards: Invalid amount provided."
      );
    });
  });

  describe("release()", function() {
    it("should revert if no funds locked", async () => {
      releaseTime = time.duration.days(90).toNumber();
      initialize(releaseTime);
      await transferExgoldToRewardsContract();
      const funcs = {
        transfer,
        mintMultiple,
        setApprovalForAll,
        safeTransferFrom,
        approve,
      };

      await run(funcs);

      const id = await minerCardRewards.certToken(addr1._address, ID);
      await expectRevert(
        minerCardRewards.connect(addr1).release(id),
        "MinerCardRewards: no funds locked"
      );
    });

    it("should revrt if account has no ERC-721", async () => {
      releaseTime = time.duration.days(90).toNumber();
      initialize(releaseTime);
      await transferExgoldToRewardsContract();
      const funcs = {
        transfer,
        mintMultiple,
        setApprovalForAll,
        safeTransferFrom,
        approve,
      };

      await run(funcs);
      await minerCardRewards.connect(addr1).lockFunds(ID, approveAmount);
      const id = await minerCardRewards.certToken(addr1._address, ID);

      await expectRevert(
        minerCardRewards.connect(addr2).release(id),
        "MinerCardRewards: Account has no cert to withdraw funds"
      );
    });

    it("should release locked funds", async () => {
      releaseTime = time.duration.days(90).toNumber();
      initialize(releaseTime);
      await transferExgoldToRewardsContract();
      const funcs = {
        transfer,
        mintMultiple,
        setApprovalForAll,
        safeTransferFrom,
        approve,
      };

      await run(funcs);
      await minerCardRewards.connect(addr1).lockFunds(ID, approveAmount);
      const id = await minerCardRewards.certToken(addr1._address, ID);

      // Before release transaction
      const erc1155_1 = await minerCards.balanceOf(addr1._address, ID);
      const idlf_1 = await minerCardRewards.idlf(id);
      const erc20_1 = await exgold.balanceOf(addr1._address);

      await minerCardRewards.connect(addr1).release(id);

      // After release transaction
      const erc1155_2 = await minerCards.balanceOf(addr1._address, ID);
      const idlf_2 = await minerCardRewards.idlf(id);
      const erc20_2 = await exgold.balanceOf(addr1._address);

      // Before
      expect(erc1155_1).to.equal(0);
      expect(idlf_1).to.equal(approveAmount);
      expect(erc20_1).to.equal(transferAmount - approveAmount);

      //After
      expect(erc1155_2).to.equal(1);
      expect(idlf_2).to.equal(0);
      expect(erc20_2).to.equal(transferAmount);
    });
  });

  describe("withdraw()", function() {
    it("should withdraw funds", async () => {
      releaseTime = time.duration.days(90).toNumber();
      initialize(releaseTime);
      await transferExgoldToRewardsContract();
      const funcs = {
        transfer,
        mintMultiple,
        setApprovalForAll,
        safeTransferFrom,
        approve,
      };

      await run(funcs);
      await minerCardRewards.connect(addr1).lockFunds(ID, approveAmount);

      const t = (await time.latest()).add(time.duration.days(90));
      ethers.provider.send("evm_increaseTime", [t.toNumber()]); // add 60 seconds
      ethers.provider.send("evm_mine"); // mine the next block

      const id = await minerCardRewards.certToken(addr1._address, ID);
      await minerCardRewards.connect(addr1).withdraw(id);

      const bal = await exgold.balanceOf(addr1._address);
      const rate = await minerCardRewards.getRate();
      const dividends = (rate / 100) * approveAmount;
      expect(dividends + transferAmount).to.equals(bal.toNumber());
    });

    it("should revrt if account has no ERC-721", async () => {
      releaseTime = time.duration.days(90).toNumber();
      initialize(releaseTime);
      await transferExgoldToRewardsContract();
      const funcs = {
        transfer,
        mintMultiple,
        setApprovalForAll,
        safeTransferFrom,
        approve,
      };

      await run(funcs);
      await minerCardRewards.connect(addr1).lockFunds(ID, approveAmount);
      const id = await minerCardRewards.certToken(addr1._address, ID);

      await expectRevert(
        minerCardRewards.connect(addr2).withdraw(id),
        "MinerCardRewards: Account has no cert to withdraw funds + dividends"
      );
    });
    it("should revrt if current time is before release time", async () => {
      releaseTime = time.duration.days(90).toNumber();
      initialize(releaseTime);
      await transferExgoldToRewardsContract();
      const funcs = {
        transfer,
        mintMultiple,
        setApprovalForAll,
        safeTransferFrom,
        approve,
      };

      await run(funcs);
      await minerCardRewards.connect(addr1).lockFunds(ID, approveAmount);
      const id = await minerCardRewards.certToken(addr1._address, ID);

      await expectRevert(
        minerCardRewards.connect(addr1).withdraw(id),
        "MinerCardRewards: current time is before release time"
      );
    });

    it("should revrt if no funds locked", async () => {
      releaseTime = time.duration.days(90).toNumber();
      initialize(releaseTime);
      await transferExgoldToRewardsContract();

      await expectRevert(
        minerCardRewards.connect(addr1).withdraw(3),
        "MinerCardRewards: no funds locked"
      );
    });

    it("should revrt if insufficient funds to pay dividends", async () => {
      releaseTime = time.duration.days(90).toNumber();
      initialize(releaseTime);
      const funcs = {
        transfer,
        mintMultiple,
        setApprovalForAll,
        safeTransferFrom,
        approve,
      };

      await run(funcs);
      await minerCardRewards.connect(addr1).lockFunds(ID, approveAmount);
      const id = await minerCardRewards.certToken(addr1._address, ID);
      const t = (await time.latest()).add(time.duration.days(90));

      ethers.provider.send("evm_increaseTime", [t.toNumber()]); // add 90+ days
      ethers.provider.send("evm_mine"); // mine the next block

      await expectRevert(
        minerCardRewards.connect(addr1).withdraw(id),
        "MinerCardRewards: Insufficient funds to pay dividends"
      );
    });
  });
});
