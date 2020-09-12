const { accounts, contract, web3 } = require("@openzeppelin/test-environment");
const BN = require("big-number");
const { expect } = require("chai");
const truffleAssert = require("truffle-assertions");
require("chai").should;

const Exgold = contract.fromArtifact("Exgold");

describe("Exgold", function() {
  const name = "Exgold";
  const symbol = "EXG";
  const decimal = 18;
  const decimals = BN(10).pow(18);

  const totalSupply = 5000000;

  let exgold;

  beforeEach(async () => {
    exgold = await Exgold.new({ from: accounts[0] });
  });

  it("should initialize contract with correct values", async () => {
    await exgold.initialize(name, symbol, decimal, totalSupply, {
      from: accounts[0],
    });

    expect(await exgold.name()).to.equal(name);
    expect(await exgold.symbol()).to.equal(symbol);
    expect((await exgold.decimals()).toNumber()).to.equal(decimal);
    expect((await exgold.totalSupply()).toString()).to.equal(
      BN(totalSupply)
        .multiply(decimals)
        .toString()
    );
  });

  it("should call initialize function only once", async () => {
    await exgold.initialize(name, symbol, decimal, totalSupply, {
      from: accounts[0],
    });

    await truffleAssert.reverts(
      exgold.initialize("Gold", "GLD", 18, totalSupply, { from: accounts[1] }),
      " Contract instance has already been initialized."
    );
  });
});
