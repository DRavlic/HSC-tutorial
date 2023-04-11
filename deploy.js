require("dotenv").config();
const {
  AccountBalanceQuery,
  AccountId,
  Client,
  ContractCreateFlow,
  PrivateKey,
} = require("@hashgraph/sdk");
const fs = require("fs");
const { exit } = require("process");

const MAX_GAS = 100000;
const HBAR_TO_TINYBAR = 100000000;

// Grab your Hedera testnet account ID and private key from .env file
const accountId = AccountId.fromString(process.env.ACCOUNT_ID);
const privateKey = PrivateKey.fromString(process.env.PRIVATE_KEY);

// Set the client with your account ID and private key
const client = Client.forTestnet().setOperator(accountId, privateKey);

async function main() {
  // Account balance before deploying the smart contract
  const balanceQuery = new AccountBalanceQuery().setAccountId(accountId);
  const accountBalanceBefore = await balanceQuery.execute(client);

  ////////////////////////////////////////
  // Import the compiled contract bytecode
  const contractBytecode = fs.readFileSync("PublicInfo_sol_PublicInfo.bin");

  /////////////////////////////////////////////////////////////////////////////////////
  // Deploy SC to Hedera network by creating a file on Hedera that contains SC's bytecode
  const contractDeployTx = new ContractCreateFlow()
    .setBytecode(contractBytecode)
    .setGas(MAX_GAS);
  const contractDeploySubmit = await contractDeployTx.execute(client);
  const contractDeployRx = await contractDeploySubmit.getReceipt(client);

  const contractId = contractDeployRx.contractId;
  const contractAddress = contractId.toSolidityAddress();
  console.log("Smart contract ID is: " + contractId);
  console.log(
    "Smart contract ID in Solidity format is " + contractAddress + "\n"
  );

  /////////////////
  // Log deploy fee
  const accountBalanceAfter = await balanceQuery.execute(client);
  console.log(
    "Deployment fee: " +
      (accountBalanceBefore.hbars.toTinybars() -
        accountBalanceAfter.hbars.toTinybars()) /
        HBAR_TO_TINYBAR +
      " ℏ \n"
  );

  await fs.promises.writeFile(
    "contract_address.txt",
    contractId.toString(),
    (err) => {
      if (err) {
        console.log(err);
      }
    }
  );

  exit();
}

main();
