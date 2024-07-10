'use client';

import { useState, useEffect } from 'react';
import { resolveDID, verifyDID } from '@/lib/didUtils';
import { ethers } from 'ethers';
import { EthrDID } from 'ethr-did';
import { DIDDocument, VerificationMethod } from 'did-resolver';

export default function ChatDID() {
  const [did, setDid] = useState<string>('');
  const [privateKey, setPrivateKey] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [chatHistory, setChatHistory] = useState<Array<{
    message: string,
    signature: string,
    did: string,
    timestamp: number,
    address: string,
    showDetails: boolean
  }>>([]);
  const [error, setError] = useState<string | null>(null);
  const [address, setAddress] = useState<string>('');

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

  const handleSendMessage = async () => {
    if (!message.trim()) {
      setError('Message cannot be empty');
      return;
    }
    if (!did || !privateKey) {
      setError('Please enter both DID and private key');
      return;
    }
    if (!verifyDID(did)) {
      setError('Invalid DID format');
      return;
    }
    setError(null);
    try {
      const wallet = new ethers.Wallet(privateKey);
      const ethrDid = new EthrDID({
        identifier: wallet.address,
        privateKey: wallet.privateKey,
        chainNameOrId: 'sepolia'
      });
  
      const signature = await ethrDid.signJWT({ message });
      const resolvedDid = await resolveDID(did);
      if (!resolvedDid) {
        throw new Error('Failed to resolve DID');
      }
  
      const verifiedAddress = wallet.address.toLowerCase();
      const isVerified = resolvedDid.verificationMethod?.some((vm: VerificationMethod) => {
        if (vm.type === 'EcdsaSecp256k1RecoveryMethod2020' && vm.blockchainAccountId) {
          const [, , address] = vm.blockchainAccountId.split(':');
          return address.toLowerCase() === verifiedAddress;
        }
        return false;
      });
  
      if (isVerified) {
        const newMessage = { 
          message, 
          signature, 
          did, 
          timestamp: Date.now(),
          address: verifiedAddress,
          showDetails: false 
        };
        setChatHistory(prev => [...prev, newMessage]);
        setMessage('');
      } else {
        setError('Failed to verify the message. The DID does not match the signing address.');
      }
    } catch (err) {
      setError(`Failed to send message: ${err instanceof Error ? err.message : String(err)}`);
      console.error(err);
    }
  };

  const toggleDetails = (index: number) => {
    setChatHistory(chatHistory.map((chat, i) => {
      if (i === index) {
        return { ...chat, showDetails: !chat.showDetails };
      }
      return chat;
    }));
  };

  return (
    <div className="container">
      <h1 className="title">Chat with DID</h1>
      <p className="description">Use your DID to sign and verify chat messages.</p>
      <div className="input-group">
        <input
          type="text"
          value={did}
          onChange={(e) => setDid(e.target.value)}
          className="input"
          placeholder="Enter your DID (e.g., did:ethr:sepolia:0x...)"
        />
        <input
          type="password"
          value={privateKey}
          onChange={(e) => setPrivateKey(e.target.value)}
          className="input"
          placeholder="Enter your Private Key"
        />
      </div>
      {address && (
        <p className="address-display">Your address: {address}</p>
      )}
      <div className="chat-box">
        <h2>Create a Tweet</h2>
        <div className="chat-input">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="input large"
            placeholder="What's happening?!"
          />
          <button
            className="cta-button primary"
            onClick={handleSendMessage}
            disabled={!did || !privateKey}
          >
            Post
          </button>
        </div>
        {error && <p className="error">{error}</p>}
        <div className="chat-history">
          {chatHistory.map((chat, index) => (
            <div key={index} className="chat-message">
              <p>{chat.message}</p>
              <small>{new Date(chat.timestamp).toLocaleString()}</small>
              <button
                onClick={() => toggleDetails(index)}
                className="cta-button small"
              >
                {chat.showDetails ? 'Hide Details' : 'View Details'}
              </button>
              {chat.showDetails && (
                <div className="details">
                  <p><strong>DID:</strong> {chat.did}</p>
                  <p><strong>Address:</strong> {chat.address}</p>
                  <p><strong>Signature:</strong> {chat.signature}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}