<br />
<br />

<p>
<img src="https://nearprotocol.com/wp-content/themes/near-19/assets/img/logo.svg?t=1553011311" width="240">
</p>

# WARNING WIP

## Multisig contract account example
Multisig Contract: https://github.com/near/core-contracts/tree/master/multisig

## About the app
This app allows you to control a multisig contract deployed by a contract account. You start with `num_confirmations: 1` which enables you to add keys to the contract in a single tx.

You can either:
1. transfer funds
2. add a key as signer
3. delete a key
4. set the total number of confirmations required

## Quickstart
It's recommended you create a new developer account for deploying the multisig.
```
near create_account [new_account_id] --masterAccount [some_account.testnet] --initialBalance 50
```
Don't forget to update your developer account in the following places (if not done automatically):
```
/neardev/dev-account
/neardev/dev-account.env
```
Now you should be ready to go and the contract will be automatically deployed
```
yarn && yarn dev
```

## Calling the multisig from JS

All calls to the contract can be found in `src/Multisig.js`.

The original linkdrop contract is here:
https://github.com/near/core-contracts/blob/master/multisig/src/lib.rs

@todo
update branch info later
more info about multisig, request structs etc...

##### IMPORTANT: Make sure you have the latest version of NEAR Shell and Node Version > 10.x 

1. [Node.js](https://nodejs.org/en/download/package-manager/)
2. near-shell
```
npm i -g near-shell
```
### To run on NEAR testnet

```bash
yarn && yarn dev
```