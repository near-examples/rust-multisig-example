import 'regenerator-runtime/runtime';
import React, { Component } from 'react';
import nearlogo from './assets/gray_near_logo.svg';
import './App.css';

import Multisig from './Multisig'

class App extends Component {
	constructor(props) {
		super(props);
		this.state = {
			login: false,
			speech: null
		}
		this.signedInFlow = this.signedInFlow.bind(this);
		this.requestSignIn = this.requestSignIn.bind(this);
		this.requestSignOut = this.requestSignOut.bind(this);
		this.signedOutFlow = this.signedOutFlow.bind(this);
		this.changeGreeting = this.changeGreeting.bind(this);
	}

	componentDidMount() {
		let loggedIn = this.props.wallet.isSignedIn();
		if (loggedIn) {
			this.signedInFlow();
		} else {
			this.signedOutFlow();
		}
	}

	async signedInFlow() {
		console.log("come in sign in flow")
		this.setState({
			login: true,
		})
		const accountId = await this.props.wallet.getAccountId()
		if (window.location.search.includes("account_id")) {
			window.location.replace(window.location.origin + window.location.pathname)
		}
	}

	async requestSignIn() {
		const appTitle = 'NEAR Multisig Example';
		await this.props.wallet.requestSignIn(
			window.nearConfig.contractName,
			appTitle
		)
	}

	requestSignOut() {
		this.props.wallet.signOut();
		setTimeout(this.signedOutFlow, 500);
		console.log("after sign out", this.props.wallet.isSignedIn())
	}

	async changeGreeting() {
		await this.props.contract.set_greeting({ message: 'howdy' });
		await this.welcome();
	}

	signedOutFlow() {
		if (window.location.search.includes("account_id")) {
			window.location.replace(window.location.origin + window.location.pathname)
		}
		this.setState({
			login: false,
			speech: null
		})
	}

	render() {
		return (
			<div className="App-header">
				<div className="image-wrapper">
					<img className="logo" src={nearlogo} alt="NEAR logo" />

				</div>
				<div>
					{this.state.login ?
						<div>
							<button onClick={this.requestSignOut}>Log out</button>
						</div>
						: <button onClick={this.requestSignIn}>Log in with NEAR</button>}
				</div>
				<div>
					<Multisig {...this.props} />
				</div>
			</div>
		)
	}

}

export default App;
