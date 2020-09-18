const { expect } = require("chai");
const { expectRevert } = require("openzeppelin-test-helpers");
require("chai").should;

describe("Exgold", function() {
  const name = "Exgold";
  const symbol = "EXG";
  const decimals = 6;

  const totalSupply = 5000000;

  let addr1;
  let exgold;
  let Exgold;

  beforeEach(async () => {
    [owner, addr1] = await ethers.getSigners();

    Exgold = await ethers.getContractFactory("Exgold");
    exgold = await Exgold.deploy();
  });

  it("should initialize contract with correct values", async () => {
    await exgold.initialize(name, symbol, decimals, totalSupply);

    expect(await exgold.name()).to.equal(name);
    expect(await exgold.symbol()).to.equal(symbol);
    expect(await exgold.decimals()).to.equal(decimals);
    expect(await exgold.totalSupply()).to.equal(totalSupply * 10 ** 6);
  });

  it("should call initialize function only once", async () => {
    await exgold.initialize(name, symbol, decimals, totalSupply);

    await expectRevert(
      exgold.initialize("Gold", "GLD", decimals, totalSupply),
      "Contract instance has already been initialized"
    );
  });

  it("should allow holder burn tokens", async () => {
    await exgold.initialize(name, symbol, decimals, totalSupply);

    await exgold.transfer(addr1._address, 1000);

    await exgold.connect(addr1).burn(300);
    const balance = await exgold.balanceOf(addr1._address);
    expect(balance).to.equal(700);
  });
});
