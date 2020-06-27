import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import getConfig from './config.js';
import getSecret from './config-secret.js';
import { getCurrentUser } from './util/near-util';
import * as nearApi from 'near-api-js';
import {
    NETWORK_ID, BOATLOAD_OF_GAS,
} from './util/near-util'

// console.log(getSecret)
const CONTRACT_SECRET = '3pibUb66KGTgaCMUCtw7ncjF1CkHuE9QXCa7UVWqNGvVj5uC5X3c5jS1RtYjzVhgUS9XWSZHRNYZW4GYZv5XUgMZ'//getSecret()

// Initializing contract
async function initContract() {
	window.nearConfig = getConfig(process.env.NODE_ENV || 'development')
	// console.log("nearConfig", window.nearConfig);
	window.keyStore = new nearApi.keyStores.BrowserLocalStorageKeyStore(window.localStorage, 'nearlib:keystore:')
	// console.log(window.keyStore)
	window.near = await nearApi.connect(Object.assign({ deps: { keyStore: window.keyStore } }, window.nearConfig));

	window.contractAccount = new nearApi.Account(window.near.connection, window.nearConfig.contractName)
	window.walletAccount = new nearApi.WalletAccount(window.near)

	const { contractName } = window.nearConfig
	const viewMethods = ['get_request', 'list_request_ids', 'get_confirmations',
		'get_num_confirmations', 'get_request_nonce',
	]
	const changeMethods = ['new', 'add_request', 'add_request_and_confirm', 'delete_request', 'confirm', 'request_expired']
	/********************************
	Set up a contract instance for the currently logged in user
	********************************/
	// window.userContract = await new nearApi.Contract(account, contractName, {
	// 	viewMethods,
	// 	changeMethods,
	// 	sender: window.currentUser.accountId
	// })
	// console.log('window.userContract', window.userContract)
	/********************************
	Set up a contract method so we can choose keys
	********************************/
	window.getContract = async (secretKey = CONTRACT_SECRET) => {
		if (secretKey) {
			await window.keyStore.setKey(
				NETWORK_ID, contractName,
				nearApi.KeyPair.fromString(secretKey)
			)
		}
		// console.log('Using secretKey', secretKey)
		const contract = new nearApi.Contract(window.contractAccount, contractName, {
			viewMethods,
			changeMethods,
			sender: contractName
		})
		return contract
	} 

	// test contract and call new if needed
	const contract = await window.getContract()
	console.log('contract', contract)
	// if this fails on load, maybe the contract wasn't instantiated, call new
	// @todo check error message to avoid looping if contract/network unavailable
	await contract.list_request_ids().catch(async (e) => {
		console.log(e)
		await contract.new({ num_confirmations: 1 })
		window.location = '/'
	})
}

window.nearInitPromise = initContract().then(() => {
	ReactDOM.render(<App
		wallet={window.walletAccount}
		currentUser={window.currentUser}
		contractName={window.nearConfig.contractName}
	/>,
		document.getElementById('root')
	);
}).catch(console.error)

