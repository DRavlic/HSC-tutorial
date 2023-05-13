require("dotenv").config();
const {
  AccountBalanceQuery,
  AccountId,
  Client,
  ContractCallQuery,
  ContractExecuteTransaction,
  ContractFunctionParameters,
  ContractId,
  Hbar,
  PrivateKey,
} = require("@hashgraph/sdk");
const { exit } = require("process");
const fs = require("fs");

const MAX_GAS = 3000000;
const MAX_QUERY_HBARS = 100;
const HBAR_TO_TINYBAR = 100000000;

// Grab your Hedera testnet account ID and private key from .env file
const accountId = AccountId.fromString(process.env.ACCOUNT_ID);
const privateKey = PrivateKey.fromString(process.env.PRIVATE_KEY);

// Set the client with your account ID and private key
const client = Client.forTestnet().setOperator(accountId, privateKey);
client.setMaxQueryPayment(new Hbar(MAX_QUERY_HBARS));

async function main() {
  ///////////////////////////////////////////
  // Get SC address from contract_address.txt
  const contractIdString = fs.readFileSync("contract_address.txt");
  const contractId = ContractId.fromString(contractIdString);

  //////////////////////////////////////////////////////////////
  // Get account's balance before submitting setter transactions
  const balanceQuery = new AccountBalanceQuery().setAccountId(accountId);
  const accountBalanceBeforeTx = await balanceQuery.execute(client);

  ////////////////////////////////////////////
  // Update this account's age via deployed SC
  const setAgeTx = new ContractExecuteTransaction()
    .setContractId(contractId)
    .setGas(MAX_GAS)
    .setFunction("setAge", new ContractFunctionParameters().addUint256(27));
  await executeInConsole(
    setAgeTx,
    "Setting account's age via deployed SC...",
    client
  );

  /////////////////////////////////////////////////////////
  // Update this account's name and surname via deployed SC
  const setNameTx = new ContractExecuteTransaction()
    .setContractId(contractId)
    .setGas(MAX_GAS)
    .setFunction("setName", new ContractFunctionParameters().addString("John"));
  await executeInConsole(
    setNameTx,
    "Setting account's name via deployed SC...",
    client
  );

  const setSurnameTx = new ContractExecuteTransaction()
    .setContractId(contractId)
    .setGas(MAX_GAS)
    .setFunction(
      "setSurname",
      new ContractFunctionParameters().addString("Doe")
    );
  await executeInConsole(
    setSurnameTx,
    "Setting account's surname via deployed SC...",
    client
  );

  //////////////////////////////////////////
  // Log average fee for setter transactions
  const accountBalanceAfterTx = await balanceQuery.execute(client);
  console.log(
    "Average fee for setter transactions " +
      (
        (accountBalanceBeforeTx.hbars.toTinybars() -
          accountBalanceAfterTx.hbars.toTinybars()) /
        HBAR_TO_TINYBAR /
        3
      ).toFixed(2) +
      " ℏ \n"
  );

  /////////////////////////////////////////////////
  // Query age, name and surname of current account
  const accountBalanceBeforeQuery = await balanceQuery.execute(client);
  const ageQuery = new ContractCallQuery()
    .setContractId(contractId)
    .setGas(MAX_GAS)
    .setFunction(
      "getAge",
      new ContractFunctionParameters().addAddress(accountId.toSolidityAddress())
    );
  const ageQuerySubmit = await ageQuery.execute(client);
  const ageQueryResult = ageQuerySubmit.getUint256(0);
  console.log("Here's the age you've asked for: " + ageQueryResult);

  const nameQuery = new ContractCallQuery()
    .setContractId(contractId)
    .setGas(MAX_GAS)
    .setFunction(
      "getName",
      new ContractFunctionParameters().addAddress(accountId.toSolidityAddress())
    );
  const nameQuerySubmit = await nameQuery.execute(client);
  const nameQueryResult = nameQuerySubmit.getString(0);
  console.log("Here's the name you've asked for: " + nameQueryResult);

  const surnameQuery = new ContractCallQuery()
    .setContractId(contractId)
    .setGas(MAX_GAS)
    .setFunction(
      "getSurname",
      new ContractFunctionParameters().addAddress(accountId.toSolidityAddress())
    );
  const surnameQuerySubmit = await surnameQuery.execute(client);
  const surnameQueryResult = surnameQuerySubmit.getString(0);
  console.log("Here's the surname you've asked for: " + surnameQueryResult);

  //////////////////////////////////////////
  // Log average fee for query transactions
  const accountBalanceAfterQuery = await balanceQuery.execute(client);
  console.log(
    "\nAverage fee for query transactions " +
      (
        (accountBalanceBeforeQuery.hbars.toTinybars() -
          accountBalanceAfterQuery.hbars.toTinybars()) /
        HBAR_TO_TINYBAR /
        3
      ).toFixed(2) +
      " ℏ \n"
  );

  exit();
}

async function executeInConsole(tx, msg, client) {
  console.log(msg);

  const timeBeforeTx = performance.now();
  const receipt = await (await tx.execute(client)).getReceipt(client);
  const timeAfterTx = performance.now();

  console.log(
    `...${receipt.status}! in ${Math.round(timeAfterTx - timeBeforeTx)} ms\n`
  );

  return receipt;
}

main();
