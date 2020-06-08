import 'regenerator-runtime/runtime';
import React, { useEffect } from 'react';
import './Multisig.scss';

const Multisig = (props) => {

    const {
        contract
    } = props

    console.log(contract)
    
    useEffect(() => {
        console.log('mounted')
    }, [])

    return <div className="root">
        
    </div>
}

export default Multisig