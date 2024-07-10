'use client';

import { useState } from 'react';
import { registerDID } from '@/lib/didUtils';
import Footer from '@/components/Footer';

export default function RegisterDID() {
  const [did, setDid] = useState<string>('');
  const [privateKey, setPrivateKey] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const handleRegisterDID = async () => {
    if (!did || !privateKey) {
      setError('Please enter DID and Private Key');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const hash = await registerDID(did, privateKey);
      setTxHash(hash);
    } catch (err) {
      setError('Failed to register DID. Please check your input and try again.');
      console.error('Error details:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('Copied to clipboard!');
    }).catch((err) => {
      console.error('Failed to copy: ', err);
    });
  };

  return (
    <div className="container">
      <h1 className="title">Register DID on Sepolia</h1>
      <p className="description">Register your Decentralized Identifier on the Sepolia network.</p>
      <div className="info-box">
        <p><strong>Important:</strong> Your wallet must have Sepolia ETH to complete this transaction.</p>
        <p>You can import your private key into a wallet and then add Sepolia ETH to it.</p>
        <p>Get Sepolia ETH from a faucet: <a href="https://sepoliafaucet.com/" target="_blank" rel="noopener noreferrer">Sepolia Faucet</a></p>
      </div>
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
      <button
        className="cta-button primary"
        onClick={handleRegisterDID}
        disabled={isLoading}
      >
        {isLoading ? 'Registering...' : 'Register DID'}
      </button>
      {error && <p className="error">{error}</p>}
      {txHash && (
        <div className="result">
          <h2>Transaction Hash:</h2>
          <div className="copy-wrapper">
            <p className="tx-hash">{txHash}</p>
            <button className="copy-button" onClick={() => copyToClipboard(txHash)}>Copy</button>
          </div>
          <p className="info">
            Your DID registration transaction has been submitted to the Sepolia network.
            Please wait for confirmation.
          </p>
        </div>
      )}
      <Footer />
    </div>
  );
}