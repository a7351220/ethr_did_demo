'use client';

import { useState } from 'react';
import { createDID } from '@/lib/didUtils';
import Footer from '@/components/Footer';

export default function CreateDID() {
  const [did, setDid] = useState<string>('');
  const [privateKey, setPrivateKey] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('Copied to clipboard!');
    }).catch((err) => {
      console.error('Failed to copy: ', err);
    });
  };

  return (
    <div className="container">
      <h1 className="title">Create DID on Sepolia</h1>
      <p className="description">Generate your unique Decentralized Identifier on the Sepolia network.</p>
      <button
        className="cta-button primary"
        onClick={handleCreateDID}
        disabled={isLoading}
      >
        {isLoading ? 'Generating...' : 'Generate DID'}
      </button>
      {error && <p className="error">{error}</p>}
      {did && (
        <div className="result">
          <h2>Your DID:</h2>
          <div className="copy-wrapper">
            <p className="did-value">{did}</p>
            <button className="copy-button" onClick={() => copyToClipboard(did)}>Copy</button>
          </div>
          <h2>Your Private Key (Keep this secret!):</h2>
          <div className="copy-wrapper">
            <p className="private-key">{privateKey}</p>
            <button className="copy-button" onClick={() => copyToClipboard(privateKey)}>Copy</button>
          </div>
          <p className="warning">
            Warning: Store this private key securely. It's required to control your DID.
          </p>
        </div>
      )}
      <Footer />
    </div>
  );
}