'use client';

import { useState, useEffect } from 'react';
import { resolveDID, addDelegate, setAttribute } from '@/lib/didUtils';
import { ethers } from 'ethers';

export default function DIDTweet() {
  const [did, setDid] = useState<string>('');
  const [privateKey, setPrivateKey] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [tweetHistory, setTweetHistory] = useState<Array<{
    message: string,
    signature: string,
    did: string,
    timestamp: number,
    address: string,
    attributes: Record<string, string>,
    showDetails: boolean
  }>>([]);
  const [error, setError] = useState<string | null>(null);
  const [address, setAddress] = useState<string>('');
  const [attributeName, setAttributeName] = useState<string>('');
  const [attributeValue, setAttributeValue] = useState<string>('');

  useEffect(() => {
    if (privateKey) {
      try {
        const wallet = new ethers.Wallet(privateKey);
        setAddress(wallet.address);
      } catch (err) {
        setError('Invalid private key');
        setAddress('');
      }
    } else {
      setAddress('');
    }
  }, [privateKey]);

  const handlePostTweet = async () => {
    if (!message.trim() || !did || !privateKey) {
      setError('Please enter DID, private key, and message');
      return;
    }
    setError(null);
    try {
      const wallet = new ethers.Wallet(privateKey);
      const signature = await wallet.signMessage(message);
      const verifiedAddress = ethers.verifyMessage(message, signature);
      
      const resolvedDid = await resolveDID(did);
      if (!resolvedDid) {
        throw new Error('Failed to resolve DID');
      }

      const isVerified = resolvedDid.verificationMethod.some((vm: any) => 
        vm.blockchainAccountId && vm.blockchainAccountId.toLowerCase().endsWith(verifiedAddress.toLowerCase())
      );

      if (isVerified) {
        const newTweet = { 
          message, 
          signature, 
          did, 
          timestamp: Date.now(),
          address: verifiedAddress,
          attributes: resolvedDid.attributes || {},
          showDetails: false 
        };
        setTweetHistory(prev => [...prev, newTweet]);
        setMessage('');
      } else {
        setError('Failed to verify the message. The DID does not match the signing address.');
      }
    } catch (err) {
      setError(`Failed to post tweet: ${err instanceof Error ? err.message : String(err)}`);
      console.error(err);
    }
  };

  const handleAddAttribute = async () => {
    if (!did || !privateKey || !attributeName || !attributeValue) {
      setError('Please fill all attribute fields');
      return;
    }
    try {
      await setAttribute(did, attributeName, attributeValue);
      setError(`Attribute "${attributeName}" added successfully. It will be visible in your next tweet.`);
      setAttributeName('');
      setAttributeValue('');
    } catch (err) {
      setError(`Failed to add attribute: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const toggleDetails = (index: number) => {
    setTweetHistory(tweetHistory.map((tweet, i) => {
      if (i === index) {
        return { ...tweet, showDetails: !tweet.showDetails };
      }
      return tweet;
    }));
  };

  return (
    <div className="container">
      <h1 className="title">DID-Verified Tweets</h1>
      <p className="description">Post tweets verified by your DID</p>
      
      <div className="input-group">
        <input
          type="text"
          value={did}
          onChange={(e) => setDid(e.target.value)}
          className="input"
          placeholder="Enter your DID"
        />
        <input
          type="password"
          value={privateKey}
          onChange={(e) => setPrivateKey(e.target.value)}
          className="input"
          placeholder="Enter your Private Key"
        />
      </div>
      {address && <p className="address-display">Your address: {address}</p>}

      <div className="tweet-box">
        <h2>Post a DID-Verified Tweet</h2>
        <div className="tweet-input">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="input large"
            placeholder="What's happening?!"
          />
          <button
            className="cta-button primary"
            onClick={handlePostTweet}
            disabled={!did || !privateKey}
          >
            Post Tweet
          </button>
        </div>
      </div>

      <div className="attribute-section">
        <h3>Add Attribute to Your DID</h3>
        <input
          type="text"
          value={attributeName}
          onChange={(e) => setAttributeName(e.target.value)}
          placeholder="Attribute Name (e.g., 'website')"
        />
        <input
          type="text"
          value={attributeValue}
          onChange={(e) => setAttributeValue(e.target.value)}
          placeholder="Attribute Value"
        />
        <button onClick={handleAddAttribute}>Add Attribute</button>
      </div>

      {error && <p className="error">{error}</p>}

      <div className="tweet-history">
        <h2>Tweet History</h2>
        {tweetHistory.map((tweet, index) => (
          <div key={index} className="tweet">
            <p>{tweet.message}</p>
            <small>{new Date(tweet.timestamp).toLocaleString()}</small>
            <button
              onClick={() => toggleDetails(index)}
              className="cta-button small"
            >
              {tweet.showDetails ? 'Hide Details' : 'View Details'}
            </button>
            {tweet.showDetails && (
              <div className="details">
                <p><strong>DID:</strong> {tweet.did}</p>
                <p><strong>Address:</strong> {tweet.address}</p>
                <p><strong>Signature:</strong> {tweet.signature}</p>
                <h4>Attributes:</h4>
                {Object.entries(tweet.attributes).map(([key, value]) => (
                  <p key={key}><strong>{key}:</strong> {value}</p>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
