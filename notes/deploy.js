const fs = require('fs');
const account = await near.account("multisig.testnet");
const contractName = "multisig.testnet"; // same as account if account has no contract
const methodNames = ["add_request","delete_request","confirm"];
const newArgs = {"num_confirmations": 2};
const result = account.signAndSendTransaction(
    contractName,
    [
        // nearAPI.transactions.createAccount(),
        // nearAPI.transactions.transfer("100000000000000000000000000"),  
        nearAPI.transactions.addKey(
            nearAPI.utils.PublicKey.from("7CFtGxHt66Trcry9LRvXu4DG1UPK4kNDENaZcEtTA2vG"), //ms1
            nearAPI.transactions.functionCallAccessKey(contractName, methodNames, null)),
        nearAPI.transactions.addKey(
            nearAPI.utils.PublicKey.from("4Mo6Uo4Skd1vxbFBW64f9Pw7Sg7YLgid6r8VLuaQ4Gup"), //ms2
            nearAPI.transactions.functionCallAccessKey(contractName, methodNames, null)),
        nearAPI.transactions.addKey(
            nearAPI.utils.PublicKey.from("E76MKjTgcM2xFE2rN81yCCz47HqCHd1Zw6zTgqPu8fYr"), //ms3
            nearAPI.transactions.functionCallAccessKey(contractName, methodNames, null)),
        nearAPI.transactions.deployContract(fs.readFileSync("contract/res/multisig.wasm")),
        nearAPI.transactions.functionCall("new", Buffer.from(JSON.stringify(newArgs)), 10000000000000, "0"),
    ]);