// buidler.config.js
//usePlugin("@nomiclabs/buidler-ethers");
usePlugin("@nomiclabs/buidler-waffle");
usePlugin("@openzeppelin/buidler-upgrades");

module.exports = {
  solc: {
    version: "0.6.2",
  },
};
