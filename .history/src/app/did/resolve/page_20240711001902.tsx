'use client';

import { useState } from 'react';
import { resolveDID } from '@/lib/didUtils';
import { DIDDocument } from 'did-resolver';
import Footer from '@/components/Footer';

export default function ResolveDID() {
  const [did, setDid] = useState<string>('');
  const [resolvedDocument, setResolvedDocument] = useState<DIDDocument | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleResolve = async () => {
    setError(null);
    setResolvedDocument(null);

    if (!did) {
      setError('Please enter a DID');
      return;
    }

    try {
      const result = await resolveDID(did);
      if (result) {
        setResolvedDocument(result);
      } else {
        setError('Unable to resolve DID or DID is invalid');
      }
    } catch (error) {
      console.error('Error resolving DID:', error);
      setError('An error occurred while resolving the DID');
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
      <h1 className="title">Resolve DID</h1>
      <p className="description">Enter a DID to resolve and view its document.</p>
      <div className="input-group">
        <input
          type="text"
          value={did}
          onChange={(e) => setDid(e.target.value)}
          className="input"
          placeholder="Enter DID (e.g., did:ethr:0x1234...)"
        />
        <button
          onClick={handleResolve}
          className="cta-button primary"
        >
          Resolve
        </button>
      </div>
      {error && <p className="error">{error}</p>}
      {resolvedDocument && (
        <div className="result">
          <h2>Resolved DID Document:</h2>
          <div className="did-document-wrapper">
            <pre className="did-document">
              {JSON.stringify(resolvedDocument, null, 2)}
            </pre>
            <button
              className="copy-button"
              onClick={() => copyToClipboard(JSON.stringify(resolvedDocument, null, 2))}
            >
              Copy
            </button>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
}