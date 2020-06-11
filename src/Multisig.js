import 'regenerator-runtime/runtime';
import React, { useEffect, useState } from 'react';
import * as nearApi from 'near-api-js';
import { get, set, del } from 'idb-keyval';
import { copyToClipboard } from './util/util'
import './Multisig.scss';

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

    /********************************
    On Mount
    ********************************/
    useEffect(() => {
        console.log('Multisig Mounted')
        getRequests()
        updateKeys()
    }, [])
    
    /********************************
     Get the current multisig contract requests
     ********************************/
    const getNumConfirmations = async () => setNumConfirmations(await viewMethod('get_num_confirmations'))
    const getRequests = async() => {
        getNumConfirmations()
        const requests = await viewMethod('list_request_ids')
        console.log('REQUESTS', requests)
        const update = []
        for (const request_id of requests) {
            // { request_id, confirmations: [...], txs: [{ receiver_id, actions: [{ type, args... }] }] }
            const req = { request_id }
            req.txs = await viewMethod('get_request', { request_id })
            req.confirmations = []//await viewMethod('get_confirmations', { request_id }) || []
            console.log('REQUEST', req)
            update.push(req)
        }
        setRequests(update)
    }
    /********************************
    Contract methods
    ********************************/
    const changeMethod = async(method, ...args) => {
        // temp store request
        let req
        if (method === 'confirm') {
            const { request_id } = args[0]
            req = await viewMethod('get_request', { request_id })
        }
        console.log('req', req)
        let secretKey
        if (key !== contractName) {
            secretKey = (await getKey(key)).secretKey
        }
        console.log('changeMethod args', args)
        const contract = await window.getContract(secretKey)
        await contract[method](...args)
            .then(async (res) => {
                console.log('CONTRACT RESPONSE', res)

                if (!req) return
                console.log('CONFIRM REQ', req)
                if (req.type === 'AddKey') {
                    await updateKey(req.public_key.replace('ed25519:', ''), 'multisig', true)
                }
                if (req.type === 'DeleteKey') {
                    await updateKey(req.public_key.replace('ed25519:', ''), 'multisig', false)
                }
            }).catch((e) => {
                console.log(e)
            })
        getRequests()
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
        newKeyPair.multisig = false
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
                requests.map(({request_id, txs, confirmations}) => 
                    <div key={request_id} className="key">
                    <p>
                        <strong># {request_id} - {txs.map(({actions}) => actions.map(({type}) => type).join())}</strong>
                        <br/>
                        Current Confirmations: {confirmations.length} / {numConfirmations}
                        <br/> {
                            confirmations.length > 0 &&
                            confirmations.map((c) => <span key={c}><span>{c}</span><br/></span>)
                        }
                    </p>
                    </div>
                )
            }
        </div>

        <h2>Local Storage Keys</h2>
        {
            keys.map(({public_key, multisig}) => <div key={public_key} className="key">
                <p>
                    Public Key: {public_key}<br/>
                    {multisig ? 'Key is added to multisig contract.' : 'Add this key to the multisig contract. Copy PK, then "AddKey" and "Confirm".'}
                </p>
                <div>
                    <button onClick={() => copyToClipboard(public_key)}>Copy PK</button>
                    <button onClick={() => setKey(public_key)}>Use This Key</button>
                    <button onClick={() => removeKey(public_key)}>Remove Key</button>
                    {/* { 
                        multisig ?
                            <button onClick={() => setKey(public_key)}>Use This Key</button>
                            :
                            <button onClick={() => removeKey(public_key)}>Remove Key</button>
                    } */}
                </div>
            </div>)
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
                        const MultiSigRequestAction = args
                        const MultiSigRequestTransaction = {
                            receiver_id: contractName,
                            actions: [MultiSigRequestAction]
                        }
                        const MultiSigRequest = { request: [MultiSigRequestTransaction] }
                        changeMethod('add_request', MultiSigRequest)
                    }}
                >
                    { type }
                </button>
            )
        }

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
                `Remove which request?\n${JSON.stringify(await viewMethod('list_request_ids'))}`
            ))
            if (isNaN(request_id)) return
            changeMethod('delete_request', { request_id })
        }}>Remove Request</button>
    </div>
}

export default Multisig