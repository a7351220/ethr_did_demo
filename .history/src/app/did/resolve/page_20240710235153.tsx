'use client';

import { useState } from 'react';
import { resolveDID } from '@/lib/didUtils';
import { DIDDocument } from 'did-resolver';
import Footer from '@/components/Footer';

const FormatDIDDocument: React.FC<{ document: DIDDocument }> = ({ document }) => {
  return (
    <div className="did-document">
      <h3>id: <span className="did-value">{document.id}</span></h3>
      {document.verificationMethod && (
        <div>
          <h3>verificationMethod:</h3>
          <ul>
            {document.verificationMethod.map((method, index) => (
              <li key={index}>
                <p>id: <span className="did-value">{method.id}</span></p>
                <p>type: {method.type}</p>
                <p>controller: <span className="did-value">{method.controller}</span></p>
                {method.publicKeyHex && <p>publicKeyHex: <span className="did-value">{method.publicKeyHex}</span></p>}
                {method.publicKeyMultibase && <p>publicKeyMultibase: <span className="did-value">{method.publicKeyMultibase}</span></p>}
              </li>
            ))}
          </ul>
        </div>
      )}
      {document.authentication && (
        <div>
          <h3>authentication:</h3>
          <ul>
            {document.authentication.map((auth, index) => (
              <li key={index} className="did-value">{auth}</li>
            ))}
          </ul>
        </div>
      )}
      {/* Add more sections for other DID Document properties as needed */}
    </div>
  );
};

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
          <FormatDIDDocument document={resolvedDocument} />
        </div>
      )}
      <Footer />
    </div>
  );
}