'use client';
import { useState } from 'react';
import { resolveDID, DIDDocument } from '@/lib/didUtils';

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
      setError('An error occurred while resolving the DID');
    }
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
          placeholder="Enter DID (e.g., did:example:123...)"
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
          <pre className="did-document">
            {JSON.stringify(resolvedDocument, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
