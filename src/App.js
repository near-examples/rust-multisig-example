import 'regenerator-runtime/runtime';
import React, { Component } from 'react';
import nearlogo from './assets/gray_near_logo.svg';
import './App.css';

import Multisig from './Multisig'

class App extends Component {
	constructor(props) {
		super(props);
	}

	componentDidMount() {
		
	}

	render() {
		return (
			<div className="App-header">
				<div className="image-wrapper">
					<img className="logo" src={nearlogo} alt="NEAR logo" />
				</div>
				<div>
					<Multisig {...this.props} />
				</div>
			</div>
		)
	}

}

export default App;
