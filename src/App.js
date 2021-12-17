import './styles/App.css';
import twitterLogo from './assets/twitter-logo.svg';
import React, { useEffect, useState } from 'react';
import myEpicNft from './utils/MyEpicNFT.json';
import MetaMaskSVG from './assets/MetaMaskSVG.js';
import { ethers } from 'ethers';
// Constants
const TWITTER_HANDLE = 'GoloisaNinja';
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;
const RARIBLE_LINK = 'https://rinkeby.rarible.com/token/';
const RARIBLE_COLLECTION = 'https://rinkeby.rarible.com/collection/';
const TOTAL_MINT_COUNT = 50;

const ETHERSCANAPI = process.env.REACT_APP_ETHERSCAN_API_KEY;

const CONTRACT_ADDRESS = '0x6a1942C7402440B8Fb276f5E2dc017FF1a6EB9DC';

const App = () => {
	const [currentAccount, setCurrentAccount] = useState('');
	const [currentNFTCount, setCurrentNFTCount] = useState(0);
	const [isLoading, setIsLoading] = useState(false);
	const [messageText, setMessageText] = useState('Well hello there');
	const [transactionLink, setTransactionLink] = useState('');

	const checkIfWalletIsConnected = async () => {
		const { ethereum } = window;
		if (!ethereum) {
			console.log('Make sure you have MetaMask!');
			return;
		} else {
			console.log('We have the ethereum object', ethereum);
		}

		const accounts = await ethereum.request({ method: 'eth_accounts' });

		if (accounts.length !== 0) {
			const account = accounts[0];
			console.log('Found an authorized account', account);
			setMessageText(`Found an authorized account:
      ${account}`);
			setCurrentAccount(account);
		} else {
			console.log('No authorized accounts found...');
		}
	};

	const connectWallet = async () => {
		try {
			const { ethereum } = window;
			if (!ethereum) {
				setMessageText(`Get MetaMask! This app requires it!`);
				return;
			}
			const accounts = await ethereum.request({
				method: 'eth_requestAccounts',
			});
			console.log('Connected', accounts[0]);
			setMessageText(`Connected: ${accounts[0]}`);
			setCurrentAccount(accounts[0]);
			let chainId = await ethereum.request({ method: 'eth_chainId' });
			console.log(chainId);
			const rinkebyChainId = '0x4';
			if (chainId !== rinkebyChainId) {
				setMessageText('You are not connected to the Rinkeby Test Network');
			}
			setupEventListener();
		} catch (error) {
			console.log(error);
		}
	};

	const checkNFTCount = async () => {
		try {
			const { ethereum } = window;

			if (ethereum && currentAccount) {
				const provider = new ethers.providers.Web3Provider(ethereum);
				const signer = provider.getSigner();
				const connectedContract = new ethers.Contract(
					CONTRACT_ADDRESS,
					myEpicNft.abi,
					signer
				);
				let nftCount = await connectedContract.getTotalNFTsMintedCount();
				setCurrentNFTCount(nftCount.toNumber());
			} else if (ethereum && !currentAccount) {
				const network = ethers.providers.getNetwork('rinkeby');
				const provider = new ethers.providers.EtherscanProvider(
					network,
					ETHERSCANAPI
				);
				const connectedContract = new ethers.Contract(
					CONTRACT_ADDRESS,
					myEpicNft.abi,
					provider
				);
				let nftCount = await connectedContract.getTotalNFTsMintedCount();
				setCurrentNFTCount(nftCount.toNumber());
			} else {
				console.log("Ethereum object doesn't exist!");
			}
		} catch (error) {
			console.log('check nftcount did not run');
			console.log(error);
		}
	};

	const setupEventListener = async () => {
		// Most of this looks the same as our function askContractToMintNft
		try {
			const { ethereum } = window;

			if (ethereum) {
				// Same stuff again
				const provider = new ethers.providers.Web3Provider(ethereum);
				const signer = provider.getSigner();
				const connectedContract = new ethers.Contract(
					CONTRACT_ADDRESS,
					myEpicNft.abi,
					signer
				);

				// THIS IS THE MAGIC SAUCE.
				// This will essentially "capture" our event when our contract throws it.
				// If you're familiar with webhooks, it's very similar to that!
				connectedContract.on('NewEpicNFTMinted', (from, tokenId) => {
					console.log(from, tokenId.toNumber());
					setMessageText(
						`Hey there! We've minted your NFT and sent it to your wallet. It may be blank right now. It can take a max of 10 min to show up on Rarible. Here's the link: ${RARIBLE_LINK}${CONTRACT_ADDRESS}:${tokenId.toNumber()}`
					);
				});

				console.log('Setup event listener!');
			} else {
				console.log("Ethereum object doesn't exist!");
			}
		} catch (error) {
			console.log(error);
		}
	};

	const askContractToMintNft = async () => {
		try {
			const { ethereum } = window;

			if (ethereum) {
				const provider = new ethers.providers.Web3Provider(ethereum);
				const signer = provider.getSigner();
				const connectedContract = new ethers.Contract(
					CONTRACT_ADDRESS,
					myEpicNft.abi,
					signer
				);
				setIsLoading(true);
				console.log('Going to pop wallet now to pay gas...');
				setMessageText(`Gotta get that gas...`);
				let nftTxn = await connectedContract.makeAnEpicNFT();

				console.log('Mining...please wait.');
				setMessageText(`We are mining! Please wait...`);

				await nftTxn.wait();

				console.log(
					`Mined, see transaction: https://rinkeby.etherscan.io/tx/${nftTxn.hash}`
				);
				setMessageText(`Lets GOOOO - transaction mined! Check it out!`);
				setIsLoading(false);
				setTransactionLink(`https://rinkeby.etherscan.io/tx/${nftTxn.hash}`);
				checkNFTCount();
			} else {
				console.log("Ethereum object doesn't exist!");
			}
		} catch (error) {
			console.log(error);
			setIsLoading(false);
		}
	};

	const navigateToRarible = () => {
		window.open(`${RARIBLE_COLLECTION}${CONTRACT_ADDRESS}`);
	};
	// Render Methods
	const renderNotConnectedContainer = () => (
		<button
			onClick={connectWallet}
			disabled={currentNFTCount >= TOTAL_MINT_COUNT}
			className='cta-button connect-wallet-button'>
			Connect Wallet
		</button>
	);

	useEffect(() => {
		checkIfWalletIsConnected();
		checkNFTCount();
	}, []);
	return (
		<div className='App'>
			<div className='container'>
				<div className='header-container'>
					<div className='header-disclaimer-container'>
						<p>Requires MetaMask</p>
						<MetaMaskSVG />
					</div>
					<p className='header gradient-text'>gmMintr</p>
					<p className='sub-text'>
						Simple. Stunning. Original. Your NFT awaits.
					</p>
					<div className='header-btn-group'>
						{currentAccount === '' ? (
							renderNotConnectedContainer()
						) : (
							<button
								onClick={askContractToMintNft}
								disabled={currentNFTCount >= TOTAL_MINT_COUNT}
								className={
									isLoading
										? `cta-button mint-button loading`
										: `cta-button mint-button`
								}>
								<span className={isLoading ? `btn-text loading` : `btn-text`}>
									Mint NFT
								</span>
							</button>
						)}
						<button
							onClick={(e) => navigateToRarible()}
							className='cta-button rarible-button'>
							View Collection
						</button>
					</div>
				</div>
				<div className='message-container'>
					<h2 className='message-header gradient-text'>Message Center:</h2>
					<p className='message-text'>{messageText}</p>
					{transactionLink && (
						<a href={transactionLink} alt='link to your transaction'>
							See Transaction
						</a>
					)}
				</div>
				<div className='footer-container'>
					<div className='footer-sub'>
						{currentNFTCount >= TOTAL_MINT_COUNT ? (
							<p className='mint-count'>{`NFT's SOLD OUT ${currentNFTCount}/${TOTAL_MINT_COUNT}`}</p>
						) : (
							<p className='mint-count'>{`${currentNFTCount}/${TOTAL_MINT_COUNT} NFT's minted`}</p>
						)}
					</div>
					<div className='footer-sub'>
						<img
							alt='Twitter Logo'
							className='twitter-logo'
							src={twitterLogo}
						/>
						<a
							className='footer-text'
							href={TWITTER_LINK}
							target='_blank'
							rel='noreferrer'>{`built by @${TWITTER_HANDLE}`}</a>
					</div>
				</div>
			</div>
		</div>
	);
};

export default App;
