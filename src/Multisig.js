import 'regenerator-runtime/runtime';
import React, { useEffect, useState } from 'react';
import * as nearApi from 'near-api-js';
import { get, set, del } from 'idb-keyval';
import { copyToClipboard } from './util/util'
import './Multisig.scss';
import { toNear, BOATLOAD_OF_GAS } from './util/near-util';

const contractInterface = {
    Transfer: ['receiver_id', 'amount'],
    AddKey: ['public_key'],
    DeleteKey: ['public_key'],
    // FunctionCall: ['contract_id', 'method_name', 'args', 'deposit', 'gas'],
    SetNumConfirmations: ['num_confirmations'],
}

const Multisig = (props) => {

    const {
        contractName,
    } = props

    const [numConfirmations, setNumConfirmations] = useState(1)
    const [requests, setRequests] = useState([])
    const [key, setKey] = useState(contractName)
    const [keys, setKeys] = useState([])
    const [accessKeys, setAccessKeys] = useState([])

    /********************************
    On Mount
    ********************************/
    useEffect(() => {
        console.log('Multisig Mounted')
        getRequests()
        updateKeys()
        getAccessKeys()
    }, [])
    
    /********************************
     Get the current multisig contract state and access keys
     ********************************/
    const getAccessKeys = async () => setAccessKeys((await window.contractAccount.getAccessKeys()).map((k) => k.public_key.replace('ed25519:', '')))
    const getNumConfirmations = async () => setNumConfirmations(await viewMethod('get_num_confirmations'))
    const getRequests = async() => {
        getNumConfirmations()
        const requests = await viewMethod('list_request_ids')
        console.log('REQUESTS', requests)
        const update = []
        for (const request_id of requests) {
            // { request_id, confirmations: [...], txs: [{ receiver_id, actions: [{ type, args... }] }] }
            const req = { request_id }
            req.tx = await viewMethod('get_request', { request_id })
            req.confirmations = await viewMethod('get_confirmations', { request_id }) || []
            console.log('REQUEST', req)
            update.push(req)
        }


        const request_id = await viewMethod('get_request_nonce')
        console.log(request_id)


        setRequests(update)
    }
    /********************************
    Contract methods
    ********************************/
    const changeMethod = async(method, ...args) => {
        console.log('changeMethod', method, ...args)
        // make sure we don't add more confirmations than we have keys
        const request = args[0].request
        if (request) {
            const action = request.actions[0]
            console.log(action.type === 'SetNumConfirmations')
            if (action.type === 'SetNumConfirmations' && accessKeys.length < action.num_confirmations) {
                alert(`Cannot set num_confirmations > # of access keys (${accessKeys.length}) for multisig. Try adding another access key.`)
                return
            }
        }
        // check the current key we're going to use to sign the methods
        let secretKey
        if (key !== contractName) {
            secretKey = (await getKey(key)).secretKey
        }
        const contract = await window.getContract(secretKey)
        
        let res
        // batch add_request, confirm
        if (false && method === 'add_request') {
            const request_id = await viewMethod('get_request_nonce')
            const args1 = new TextEncoder().encode(JSON.stringify(...args))
            const args2 = new TextEncoder().encode(JSON.stringify({ request_id }))
            console.log('batch add_request & confirm', ...args, request_id)
            res = await contract.account.signAndSendTransaction(contractName, [
                nearApi.transactions.functionCall('add_request', args1, BOATLOAD_OF_GAS),
                nearApi.transactions.functionCall('confirm', args2, BOATLOAD_OF_GAS),
            ]).catch((e) => {
                console.log(e)
                if (e.message.indexOf('Already confirmed this request') > -1) {
                    alert('You already used this key. Try confirming with another key.')
                }
            })
        } else {
            // normal contract method call e.g. confirm
            res = await contract[method](...args).catch((e) => {
                console.log(e)
                if (e.message.indexOf('Already confirmed this request') > -1) {
                    alert('You already used this key. Try confirming with another key.')
                }
            })
        }
        console.log('changeMethod', res)
        // get the new requests
        getRequests()
        return res
    }
    const viewMethod = async(method, ...args) => {
        let secretKey
        if (key !== contractName) {
            secretKey = (await getKey(key)).secretKey
        }
        const contract = await window.getContract(secretKey)
        const res = await contract[method](...args).catch((e) => {
            console.log(e)
        })
        console.log(res)
        return res
    }
    /********************************
    Update local storage keys
    ********************************/
    const storageKey = '__keys_' + contractName
    async function getKey(public_key) {
        const keys = await get(storageKey) || []
        return keys.find((d) => d.public_key === public_key)
    }
    async function updateKeys() {
        const keys = (await get(storageKey) || [])
        setKeys(keys)
    }
    async function removeKey(public_key) {
        // get the keys from idb and remove the one matching this public_key
        const keys = await get(storageKey) || []
        const key = keys.splice(keys.findIndex((d) => d.public_key === public_key), 1)
        let confirm = true
        if (key.multisig) {
            confirm = window.confirm('This key can still be used to sign multisig requests. Are you sure you want to delete it?')
        }
        if (!confirm) return
        await set(storageKey, keys)
        updateKeys()
    }
    async function updateKey(public_key, prop, val) {
        const keys = await get(storageKey) || []
        const key = keys.find((d) => d.public_key === public_key)
        key[prop] = val
        await set(storageKey, keys)
        updateKeys()
    }
    async function addKey(newKeyPair) {
        const keys = await get(storageKey) || []
        keys.push(newKeyPair)
        await set(storageKey, keys)
        updateKeys()
    }
    /********************************
    Create a new local keypair, will add to localstorage
    Does NOT add to the account / multisig contract, it's only available to be added
    It can be used as a signer once created
    ********************************/
    const createKey = async() => {
        const newKeyPair = nearApi.KeyPair.fromRandom('ed25519')
        newKeyPair.public_key = newKeyPair.publicKey.toString().replace('ed25519:', '')
        await addKey(newKeyPair)
    }
    /********************************
    Render
    ********************************/
    return <div className="root">

        <h2>Current Requests</h2>

        <div>
            { requests.length === 0 && <p>No Requests</p>} 
            { 
                requests.map(({request_id, tx, confirmations}) => 
                    <div key={request_id} className="key">
                    <p>
                        <strong># {request_id} - {tx.actions.map(({type}) => type).join()}</strong>
                        <br/>
                        Current Confirmations: {confirmations.length} / {numConfirmations}
                        <br/> {
                            confirmations.length > 0 &&
                            confirmations.map((c) => <span key={c}><span>{c.replace('ed25519:', '')}</span><br/></span>)
                        }
                    </p>
                    </div>
                )
            }
        </div>

        <h2>Local Storage Keys</h2>
        {
            keys.map(({public_key}) => {
                 // public key should be in contract accessKeys
                const multisig = accessKeys.includes(public_key)
                return <div key={public_key} className="key">
                    <p>
                        Public Key: {public_key}<br/>
                        {multisig ? 'Key is added to multisig contract.' : 'Add this key to the multisig contract. Copy PK, then "AddKey" and "Confirm".'}
                    </p>
                    <div>
                        <button onClick={() => copyToClipboard(public_key)}>Copy PK</button>
                        { 
                            multisig ?
                                <button onClick={() => setKey(public_key)}>Use This Key</button>
                                :
                                <button onClick={() => removeKey(public_key)}>Remove from LocalStorage</button>
                        }
                    </div>
                </div>
            })
        }   
        { key !== contractName && <button onClick={() => setKey(contractName)}>Set Default</button> } 
        <button onClick={() => createKey()}>Create New Key</button>

        <h2>Multisig Requests</h2>

        <p style={{padding: 4, background: 'yellow'}}>Signing Key: {key === contractName ? 'Default' : key}</p>

        {
            Object.keys(contractInterface).map((type) => 
                <button
                    key={type}
                    onClick={() => {
                        const args = { type }
                        for (const arg of contractInterface[type]) {
                            args[arg] = window.prompt(`Value for argument '${arg}':\n`)
                            if (!args[arg]) return
                        }
                        if (args.num_confirmations) {
                            args.num_confirmations = parseInt(args.num_confirmations)
                        }
                        if (args.amount) {
                            args.amount = toNear(args.amount)
                        }
                        const MultiSigRequestAction = args
                        const MultiSigRequestTransaction = {
                            receiver_id: args.receiver_id ? args.receiver_id : contractName,
                            actions: [MultiSigRequestAction]
                        }
                        const MultiSigRequest = { request: MultiSigRequestTransaction }
                        changeMethod('add_request', MultiSigRequest)
                    }}
                >
                    { type }
                </button>
            )
        }
        <br/>
        {/* <button
            onClick={() => {
                let type = 'AddKey'
                let action1 = { type }
                for (const arg of contractInterface[type]) {
                    action1[arg] = window.prompt(`Value for argument '${arg}':\n`)
                    if (!action1[arg]) return
                }
                // action2
                type = 'DeleteKey'
                let action2 = { type }
                for (const arg of contractInterface[type]) {
                    action2[arg] = window.prompt(`Value for argument '${arg}':\n`)
                    if (!action2[arg]) return
                }
                const MultiSigRequestTransaction = {
                    receiver_id: contractName,
                    actions: [action1, action2]
                }
                const MultiSigRequest = { request: MultiSigRequestTransaction }
                changeMethod('add_request', MultiSigRequest)
            }}
        >
            AddKey,DeleteKey
        </button> */}

        <h3>Request Actions</h3>

        <button onClick={async () => {
            const request_id = parseInt(window.prompt(
                `Confirm which request?\n${JSON.stringify(await viewMethod('list_request_ids'))}`
            ))
            if (isNaN(request_id)) return
            changeMethod('confirm', { request_id })
        }}>Confirm Request</button>
        <button onClick={async () => {
            const request_id = parseInt(window.prompt(
                `Check which request?\n${JSON.stringify(await viewMethod('list_request_ids'))}`
            ))
            if (isNaN(request_id)) return
            const expired = await changeMethod('request_expired', { request_id })
            alert(expired)
        }}>Delete Request</button>
    </div>
}

export default Multisig