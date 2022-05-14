import { ethers } from 'ethers'
import { useEffect, useState } from 'react'
import axios from 'axios'
import Web3Modal from 'web3modal'
// https://dev.to/edge-and-node/building-scalable-full-stack-apps-on-ethereum-with-polygon-2cfb

// import NFTMarketplace from 'contract-abi.json'
require("dotenv").config();
const alchemyKey = process.env.REACT_APP_ALCHEMY_KEY;
const contractABI = require("./contract-abi.json");
const contractAddress = "0x26C8d2941B47E26BCBa33396cd3D59EDd1deD5DC";
const { createAlchemyWeb3 } = require("@alch/alchemy-web3");
const web3 = createAlchemyWeb3(alchemyKey);

export default function Home() {
  const [nfts, setNfts] = useState([])
  const [myNfts, setMyNfts] = useState([])
  const [loadingState, setLoadingState] = useState('not-loaded')
  useEffect(() => {
    loadNFTs()
    loadMyNFTs()
  }, [])
  async function loadNFTs() {
    /* create a generic provider and query for unsold market items */
    const provider = new ethers.providers.JsonRpcProvider(`https://goerli.infura.io/v3/06c059d611c641ffac588230c08f2e6c`)
    const contract = new ethers.Contract(contractAddress, contractABI, provider)
    const data = await contract.fetchMarketItems()
    console.log('fetchMarketItems')
    console.log(data)
    /*
    *  map over items returned from smart contract and format 
    *  them as well as fetch their token metadata
    */
    const items = await Promise.all(data.map(async i => {
      const tokenUri = await contract.tokenURI(i.tokenId)
      const meta = await axios.get(tokenUri)
      let price = ethers.utils.formatUnits(i.price.toString(), 'ether')
      let item = {
        price,
        tokenId: i.tokenId.toNumber(),
        seller: i.seller,
        owner: i.owner,
        image: meta.data.image,
        name: meta.data.name,
        description: meta.data.description,
      }
      return item
    }))
    setNfts(items)
    setLoadingState('loaded') 
  }

  async function loadMyNFTs() {
    /* create a generic provider and query for unsold market items */
    // const provider = new ethers.providers.JsonRpcProvider(`https://goerli.infura.io/v3/06c059d611c641ffac588230c08f2e6c`)
    // const contract = new ethers.Contract(contractAddress, contractABI, provider)
    // const data = await contract.fetchMyNFTs()

    const web3Modal = new Web3Modal()
    const connection = await web3Modal.connect()
    const provider = new ethers.providers.Web3Provider(connection)
    const signer = provider.getSigner()
    const contract = new ethers.Contract(contractAddress, contractABI, signer)

    const data = await contract.fetchMyNFTs()

    console.log('fetchMyNFTs')
    console.log(data)
    /*
    *  map over items returned from smart contract and format 
    *  them as well as fetch their token metadata
    */
    const items = await Promise.all(data.map(async i => {
      console.log(i)
      const tokenUri = await contract.tokenURI(i.tokenId)
      const meta = await axios.get(tokenUri)
      let price = ethers.utils.formatUnits(i.price.toString(), 'ether')
      let item = {
        price,
        tokenId: i.tokenId.toNumber(),
        seller: i.seller,
        owner: i.owner,
        image: meta.data.image,
        name: meta.data.name,
        description: meta.data.description,
      }
      return item
    }))
    setMyNfts(items)
    // setLoadingState('loaded') 
  }
  
  async function buyNft(nft) {
    /* needs the user to sign the transaction, so will use Web3Provider and sign it */
    const web3Modal = new Web3Modal()
    const connection = await web3Modal.connect()
    const provider = new ethers.providers.Web3Provider(connection)
    const signer = provider.getSigner()
    const contract = new ethers.Contract(contractAddress, contractABI, signer)

    /* user will be prompted to pay the asking proces to complete the transaction */
    const price = ethers.utils.parseUnits(nft.price.toString(), 'ether')   
    const transaction = await contract.createMarketSale(nft.tokenId, {
      value: price
    })
    await transaction.wait()
    loadNFTs()
    loadMyNFTs()
  }

  if (loadingState === 'loaded' && !nfts.length && !myNfts.length) return (<h1 className="px-20 py-10 text-3xl">No items in marketplace or no nft owned</h1>)
  return (
    <div className="flex justify-center">
      <div className="px-4" style={{ maxWidth: '1600px' }}>
        <h1>On Sale</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
          {
            nfts.map((nft, i) => (
              <div key={i} className="border shadow rounded-xl overflow-hidden">
                {/* <pre>{nft}</pre> */}
                <img src={nft.image}/>
                <div className="p-4">
                  <p style={{ height: '64px' }} className="text-2xl font-semibold">Seller: {nft.seller}</p>
                  {/* <p style={{ height: '64px' }} className="text-2xl font-semibold">Owner: {nft.owner}</p> */}
                  <p style={{ height: '64px' }} className="text-2xl font-semibold">Name: {nft.name}</p>
                  <div style={{ height: '70px', overflow: 'hidden' }}>
                    <p className="text-gray-400">Description: {nft.description}</p>
                  </div>
                </div>
                <div className="p-4 bg-black">
                  <p className="text-2xl font-bold text-white">{nft.price} ETH</p>
                  <button className="mt-4 w-full bg-pink-500 text-white font-bold py-2 px-12 rounded" onClick={() => buyNft(nft)}>Buy</button>
                </div>
              </div>
            ))
          }
        </div>
      </div>
      <div className="px-4" style={{ maxWidth: '1600px' }}>
      <h1>Your NFTs</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
          {
            myNfts.map((nft, i) => (
              <div key={i} className="border shadow rounded-xl overflow-hidden">
                <img src={nft.image}/>
                <div className="p-4">
                <p style={{ height: '64px' }} className="text-2xl font-semibold">Seller: {nft.seller}</p>
                {/* <p style={{ height: '64px' }} className="text-2xl font-semibold">Owner: {nft.owner}</p> */}
                  <p style={{ height: '64px' }} className="text-2xl font-semibold">Name: {nft.name}</p>
                  <div style={{ height: '70px', overflow: 'hidden' }}>
                    <p className="text-gray-400">Description: {nft.description}</p>
                  </div>
                </div>
                <div className="p-4 bg-black">
                  <p className="text-2xl font-bold text-white">{nft.price} ETH</p>
                  <button className="mt-4 w-full bg-pink-500 text-white font-bold py-2 px-12 rounded" onClick={() => buyNft(nft)}>Buy</button>
                </div>
              </div>
            ))
          }
        </div>
      </div>
  </div>
  )
}