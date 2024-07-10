import Link from 'next/link';

export default function Home() {
  return (
    <div className="container">
      <main>
        <section className="hero">
          <h1 className="title">DID.</h1>
          <h2 className="subtitle">Decentralized Identity for Everyone</h2>
          <p className="description">あなたのアイデンティティを自分で管理しましょう。</p>
          <div className="cta-buttons">
            <Link href="/did/create" className="cta-button primary">
              Create DID
            </Link>
            <Link href="/did/register" className="cta-button secondary">
              Register DID
            </Link>
            <Link href="/did/verify" className="cta-button secondary">
              Verify DID
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
            <h3>Register</h3>
            <p>Register your DID on the Sepolia network.</p>
          </div>
          <div className="feature">
            <h3>Verify</h3>
            <p>Validate the authenticity of a DID.</p>
          </div>
          <div className="feature">
            <h3>Resolve</h3>
            <p>Retrieve and display DID document information.</p>
          </div>
          <div className="feature">
    <h3>Chat</h3>
    <p>Securely communicate using your DID for authentication.</p>
  </div>
        </section>
      </main>
    </div>
  );
}
