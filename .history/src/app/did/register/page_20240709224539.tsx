'use client';

import { useState } from 'react';
import { registerDID } from '@/lib/didUtils';

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

  return (
    <div className="container">
      <h1 className="title">Register DID on Sepolia</h1>
      <p className="description">Register your Decentralized Identifier on the Sepolia network.</p>
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
          <p className="tx-hash">{txHash}</p>
          <p className="info">
            Your DID registration transaction has been submitted to the Sepolia network.
            Please wait for confirmation.
          </p>
        </div>
      )}
    </div>
  );
}