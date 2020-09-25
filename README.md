# EXgold
Repo of EXgold

**Exgold** is composed of 3 smart contracts:

* Exgold
* MinerCards
* MinerCardRewards

The project was developed using [openzeppelin CLI](https://www.npmjs.com/package/@openzeppelin/cli), and [buidler](https://buidler.dev) as the testing framework.

### Exgold
Exgold is an upgradeable ERC-20 token. It was implemented using [openzeppelin upgradeable smart contracts](https://github.com/OpenZeppelin/openzeppelin-contracts-ethereum-package). It's supply is fixed at **5,000,000**, and its decimals is **6**.

## MinerCards
MinerCards is an ERC-1155 standard contract. It supports standard ERC-1155 NFTs, and an ERC-721 NFT. The contract supports the minting of ERC-721 NFT by its mint function (which mints a single NFT to an address with unique ID). Also, it supports minting NFTs in batches with its mintBatch function. Only owner/deployer of contract and any added admin can mint NFTs. The MinerCards contract was implemented using openzeppelin contracts. The ERC-1155 supports only five IDs: 25, 50, 100, 250, 1000.

## MinerCardRewards
MinerCardRewards contracts is a timelock and dividends sharing contract. It locks funds for a certain duration and pays out locked funds + dividends. Its three key functions are:

**LockFunds**
This function locks the funds of caller (**msg.sender**). To luck funds, caller must have ERC-1155 NFT, and sufficient Exgold token. Also, caller must set **setApprovalForAll** in ERC-1155, and set approval for MinerCardRewards contarct address in Exgold (by calling its approve function). When calling this function, provide the correct ERC-1155 ID (25, 50, 100, 250, 1000) and the amount to be locked (25, 50, 100, 250, 1000). If these conditions are met the fund is locked, and MinerCardRewards issues an ERC-721 to caller. Note that anyone with this issued NFT, can redeem the locked funds + dividends.

**Release**
This function is called if caller wants to withdraw funds without dividends. Caller provides the ID os issued ERC-721, if valid locked funds is sent to caller.

**Withdraw**
This function is called if caller wants to withdraw locked funds + dividends. Caller provides the ID of issued ERC-721. Before funds + dividends are paid to caller, caller must have locked funds for the specified time, and also must be the holder of the issued (interest bearing) ERC-721 NFT.


## How It Works

1. Deploy Exgold contract, then call its initializer function **initialize(name, symbol)**.
2. Deploy MinerCards contract.
3. Deploy MinerCardRewards contract, then call its initializer function  **initialize(_minerCards = address of deployed minercards, _tokenAddress = address of deployed exgold,      _time = release time, _rate = rate)**. 
4. Transfer 4,000,000 Exgold tokens to the MinerCardRewards contract.
5. Transfer ETH to MinerCardRewards contract, to be used for minting ERC-721 NFTs, and transferring funds.

## Build and Test

```
git clone https://github.com/ExtractOre/EXgold.git
cd EXgold
npm install

npx buidler test
```
