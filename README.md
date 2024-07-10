# Decentralized Identifier (DID) Management System

This project is a comprehensive Decentralized Identifier (DID) management system built on the Ethereum Sepolia network. It provides a user-friendly interface for creating, registering, resolving, and utilizing DIDs for secure communication.

## Features

### 1. Create

Generate your unique Decentralized Identifier (DID) with ease. Our system leverages the power of blockchain technology to create a secure and verifiable digital identity.

### 2. Register

Seamlessly register your newly created DID on the Sepolia network. This process anchors your identity to the Ethereum blockchain, ensuring its integrity and accessibility.

### 3. Resolve

Quickly retrieve and display DID document information. This feature allows users to verify and access the public information associated with any registered DID.

### 4. Chat

Engage in secure communication using your DID for authentication. This feature demonstrates the practical application of DIDs in ensuring the confidentiality and authenticity of digital interactions.

## Technologies Used

- **Frontend**: React 18, Next.js 14
- **Styling**: Tailwind CSS
- **Language**: TypeScript
- **Blockchain Interaction**: ethers.js v6
- **DID Libraries**: did-jwt, ethr-did, ethr-did-registry
- **Ethereum Interaction**: Alchemy SDK
- **Development Tools**: ESLint, PostCSS

## Getting Started

### Prerequisites

- Node.js (v14.0.0 or later)
- npm (v6.0.0 or later)
- An Ethereum wallet with some Sepolia testnet ETH

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/a7351220/ethr_did_demo.git
   ```

2. Navigate to the project directory:
   ```
   cd ethr_did_demo
   ```

3. Install dependencies:
   ```
   npm install
   ```

4. Set up environment variables:
   Create a `.env` file in the root directory and add your ALCHEMY API KEY:
   ```
   NEXT_PUBLIC_ALCHEMY_API_KEY=your_alchemy_api_key

   ```

5. Start the development server:
   ```
   npm run dev
   ```

## Usage

1. **Create a DID**: Navigate to the "Create" page and follow the prompts to generate your unique DID.

2. **Register your DID**: Once created, go to the "Register" page to anchor your DID to the Sepolia network.

3. **Resolve a DID**: Use the "Resolve" page to look up information about any registered DID.

4. **Chat**: Navigate to the "Chat" section to start a secure conversation using your DID for authentication.

## Contributing

We welcome contributions to this project. Please feel free to submit issues and pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

## Acknowledgments

- Ethereum Foundation for the Sepolia testnet
- The DID community for standards and inspiration
- Alchemy for providing robust Ethereum API services

---

For more information on Decentralized Identifiers (DIDs), visit [W3C DID Specification](https://www.w3.org/TR/did-core/).
