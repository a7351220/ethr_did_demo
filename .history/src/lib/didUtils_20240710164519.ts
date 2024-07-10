import { ethers } from 'ethers';
import { EthrDID } from 'ethr-did';
import { Resolver, DIDDocument, DIDResolutionResult } from 'did-resolver';
import { getResolver as getEthrResolver } from 'ethr-did-resolver';


const defaultApiKey = "J6sPVZDl16QhXFbA79nlxZQfZRyDpV2R";
const REGISTRY_ADDRESS = '0x03d5003bf0e79C5F5223588F347ebA39AfbC3818';

export class AlchemyProvider extends ethers.JsonRpcProvider {
    readonly apiKey: string;

    constructor(apiKey?: string) {
        const url = `https://eth-sepolia.g.alchemy.com/v2/${apiKey || defaultApiKey}`;
        super(url, 'sepolia');
        this.apiKey = apiKey || defaultApiKey;
    }
}

let provider: AlchemyProvider;
function initProvider(): AlchemyProvider {
    if (!provider) {
        const apiKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || defaultApiKey;
        provider = new AlchemyProvider(apiKey);
    }
    return provider;
}

const resolver = new Resolver(getEthrResolver({
    networks: [{ name: 'sepolia', provider: initProvider(), registry: REGISTRY_ADDRESS }]
}));

/**
 * 創建一個新的DID
 * @returns 包含 DID 和私鑰的對象
 */
export async function createDID(): Promise<{ did: string; privateKey: string }> {
    const keypair = EthrDID.createKeyPair();
    const ethrDid = new EthrDID({
        ...keypair,
        chainNameOrId: 'sepolia', 
        registry: REGISTRY_ADDRESS

    });
    return {
        did: ethrDid.did,
        privateKey: keypair.privateKey
    };
}

/**
 * 解析 DID 並返回 DID 文檔
 * @param did - 要解析的 DID
 * @returns DID 文檔
 */
export async function resolveDID(did: string): Promise<DIDDocument | null> {
    try {
        const resolution: DIDResolutionResult = await resolver.resolve(did);
        console.log('Resolution result:', resolution);

        if (resolution.didDocument) {
            return resolution.didDocument;
        }

        return null;
    } catch (error) {
        console.error('Error resolving DID:', error);
        return null;
    }
}


/**
 * 註冊 DID 並設置屬性
 * @param did - DID
 * @param privateKey - 私鑰
 * @returns 交易HASH
 */
export async function registerDID(did: string, privateKey: string): Promise<string> {

    const provider = initProvider();
    if (!provider) {
        throw new Error("Provider initialization failed");
    }

    const wallet = new ethers.Wallet(privateKey, provider);
    const address = wallet.address;
    const publicKey = did;
    const keypair = {
        address,
        privateKey,
        publicKey,
        identifier: did
    };

    const ethrDid = new EthrDID({
        ...keypair,
        provider: provider,
        chainNameOrId: 'sepolia',
        registry: REGISTRY_ADDRESS,
        txSigner: wallet,
    });

    try {
        const txHash = await ethrDid.setAttribute(
            'did/pub/Secp256k1/veriKey/hex',
            ethrDid.address, 
            86400, 
            undefined,  
            { gasLimit: 100000 }  
        );
        return txHash;
    } catch (error) {
        console.error('Error setting attribute:', error);
        if (error instanceof Error) {
            if (error.message.includes('insufficient funds')) {
                throw new Error('Insufficient funds to perform the transaction');
            } else if (error.message.includes('nonce')) {
                throw new Error('Nonce mismatch. Please try again');
            }
        }
        throw new Error('Failed to register DID: ' + (error instanceof Error ? error.message : String(error)));
    }
}


  