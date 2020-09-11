var Exgold = artifacts.require("Exgold");

module.exports = function(deployer) {
  deployer.deploy(Exgold, "EXgold", "EXG");
};
