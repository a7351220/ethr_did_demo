'use client';
import { useState } from 'react';
import { createDID, resolveDID } from '@/lib/didUtils';
import { ethers } from 'ethers';

export default function ChatDID() {
  const [did, setDid] = useState<string>('');
  const [privateKey, setPrivateKey] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string>('');
  const [chatHistory, setChatHistory] = useState<Array<{ message: string, signature: string }>>([]);

  const handleCreateDID = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await createDID();
      setDid(result.did);
      setPrivateKey(result.privateKey);
    } catch (err) {
      setError('Failed to create DID. Please check your network connection and try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

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
        setChatHistory([...chatHistory, { message, signature }]);
        setMessage('');
      } else {
        setError('Failed to verify the message');
      }
    } catch (err) {
      setError('Failed to send message. Please try again.');
      console.error(err);
    }
  };

  return (
    <div className="container">
      <h1 className="title">Chat with DID</h1>
      <p className="description">Create a DID and use it to sign and verify your chat messages.</p>
      <button
        className="cta-button primary"
        onClick={handleCreateDID}
        disabled={isLoading || did !== ''}
      >
        {isLoading ? 'Generating...' : 'Generate DID'}
      </button>
      {error && <p className="error">{error}</p>}
      {did && (
        <div className="result">
          <h2>Your DID:</h2>
          <p className="did-value">{did}</p>
          <h2>Your Private Key (Keep this secret!):</h2>
          <p className="private-key">{privateKey}</p>
          <p className="warning">
            Warning: Store this private key securely. It's required to control your DID.
          </p>
          <div className="chat-box">
            <h2>Chat</h2>
            <div className="chat-history">
              {chatHistory.map((chat, index) => (
                <div key={index} className="chat-message">
                  <p><strong>Message:</strong> {chat.message}</p>
                  <p><strong>Signature:</strong> {chat.signature}</p>
                </div>
              ))}
            </div>
            <div className="chat-input">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="input"
                placeholder="Enter your message"
              />
              <button
                className="cta-button primary"
                onClick={handleSendMessage}
                disabled={!did}
              >
                Send Message
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
