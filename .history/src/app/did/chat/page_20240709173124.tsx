'use client';
import { useState } from 'react';
import { resolveDID } from '@/lib/didUtils';
import { ethers } from 'ethers';

export default function ChatDID() {
  const [did, setDid] = useState<string>('');
  const [privateKey, setPrivateKey] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [chatHistory, setChatHistory] = useState<Array<{ message: string, signature: string, did: string, showDetails: boolean }>>([]);
  const [error, setError] = useState<string | null>(null);

  const handleSendMessage = async () => {
    if (!message.trim()) {
      setError('Message cannot be empty');
      return;
    }
    setError(null);
    try {
      const wallet = new ethers.Wallet(privateKey);
      const signature = await wallet.signMessage(message);

      const verifiedAddress = ethers.utils.verifyMessage(message, signature);
      const resolvedDid = await resolveDID(did);

      if (resolvedDid && resolvedDid.verificationMethod.some((vm: any) => vm.blockchainAccountId.endsWith(verifiedAddress))) {
        setChatHistory([...chatHistory, { message, signature, did, showDetails: false }]);
        setMessage('');
      } else {
        setError('Failed to verify the message');
      }
    } catch (err) {
      setError('Failed to send message. Please try again.');
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
      {(!did || !privateKey) && (
        <div className="input-group">
          <input
            type="text"
            value={did}
            onChange={(e) => setDid(e.target.value)}
            className="input"
            placeholder="Enter your DID"
          />
          <input
            type="text"
            value={privateKey}
            onChange={(e) => setPrivateKey(e.target.value)}
            className="input"
            placeholder="Enter your Private Key"
          />
        </div>
      )}
      {did && privateKey && (
        <div className="cta-buttons">
          <button
            className="cta-button secondary"
            onClick={() => {
              setDid('');
              setPrivateKey('');
            }}
          >
            Update DID and Private Key
          </button>
        </div>
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
          >
            Post
          </button>
        </div>
        {error && <p className="error">{error}</p>}
        <div className="chat-history">
          {chatHistory.map((chat, index) => (
            <div key={index} className="chat-message">
              <p>{chat.message}</p>
              <button
                onClick={() => toggleDetails(index)}
                className="cta-button small"
              >
                {chat.showDetails ? 'Hide Details' : 'View Details'}
              </button>
              {chat.showDetails && (
                <div className="details">
                  <p><strong>DID:</strong> {chat.did}</p>
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
