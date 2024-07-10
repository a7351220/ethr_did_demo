// app/page.tsx
import Link from 'next/link';

export default function Home() {
  return (
    <div className="container">
      <main>
        <section className="hero">
          <h1 className="title">DID.</h1>
          <h2 className="subtitle">Decentralized Identity for Everyone</h2>
          <p className="description">去中心化身分</p>
          <div className="cta-buttons">
            <Link href="/did/create" className="cta-button primary">
              Create DID
            </Link>
            <Link href="/did/verify" className="cta-button secondary">
              Verify DID
            </Link>
            <Link href="/did/resolve" className="cta-button secondary">
              Resolve DID
            </Link>
            <Link href="/did/chat" className="cta-button secondary">
              Chat DID
            </Link>
          </div>
        </section>

        <section className="features">
          <div className="feature">
            <h3>Create</h3>
            <p>Generate your unique Decentralized Identifier.</p>
          </div>
          <div className="feature">
            <h3>Verify</h3>
            <p>Validate the authenticity of a DID.</p>
          </div>
          <div className="feature">
            <h3>Resolve</h3>
            <p>Retrieve and display DID document information.</p>
          </div>
        </section>
      </main>
    </div>
  );
}