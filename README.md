<br />
<br />

<p>
<img src="https://nearprotocol.com/wp-content/themes/near-19/assets/img/logo.svg?t=1553011311" width="240">
</p>

## Multisig contract account example
Multisig Contract: https://github.com/near/core-contracts/tree/master/multisig

## About the app
This app allows you to control a multisig contract deployed by a contract account. You start with `num_confirmations: 1` which enables you to add keys to the contract in a single tx.

You can either:
1. claim the funds
2. create an account
3. create a contract account (deploys a locked multisig account)

## Quickstart
It's recommended you create a new developer account for deploying the multisig.
```
near create_account [new_account_id] --masterAccount [some_account.testnet] --initialBalance 50
```
Don't forget to update your developer account in the following places:
```
/neardev/dev-account
/neardev/dev-account.env
```
Now you should be ready to go and the contract will be automatically deployed
```
yarn && yarn dev
```

## Deploying your own contract
It's recommended you create a sub account to handle your contract deployments:
```
near login
near create_account [account_id] --masterAccount [your_account_id] --initialBalance [1-5 N]
```
Now update config.js and set:
```
const CONTRACT_NAME = [account_id]
```

## The Linkdrop contract and calling it from JS

All calls to the contract can be found in `src/Drops.js`.

The original linkdrop contract is here:
https://github.com/nearprotocol/near-linkdrop

An additional function is added to the regular linkdrop contract:
```
pub fn create_limited_contract_account
```
This takes 3 additional arguments over the existing `pub fn create_account_and_claim` function.
In order to successfully invoke from JS you must pass in the following:
```
new_account_id: string,
new_public_key: string,
allowance: string,
contract_bytes: [...new Uint8Array(contract_bytes)],
method_names: [...new Uint8Array(new TextEncoder().encode(`
    methods,account,is_limited_too_call
`))]
```

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