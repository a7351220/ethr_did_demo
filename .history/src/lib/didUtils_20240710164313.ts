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

// 初始化 provider
let provider: AlchemyProvider;

function initProvider(): AlchemyProvider {
    if (!provider) {
        const apiKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || defaultApiKey;
        provider = new AlchemyProvider(apiKey);
    }
    return provider;
}

// 创建解析器
const resolver = new Resolver(getEthrResolver({
    networks: [{ name: 'sepolia', provider: initProvider(), registry: REGISTRY_ADDRESS }]
}));

/**
 * 创建一个新的 DID
 * @returns 包含 DID 和私钥的对象
 */
export async function createDID(): Promise<{ did: string; privateKey: string }> {
    // 使用 EthrDID.createKeyPair() 創建密鑰對
    const keypair = EthrDID.createKeyPair();

    // 創建 EthrDID 實例
    const ethrDid = new EthrDID({
        ...keypair,
        chainNameOrId: 'sepolia', // 使用 Sepolia 測試網
        registry: REGISTRY_ADDRESS

    });
    console.log('keypair:', keypair);

    return {
        did: ethrDid.did,
        privateKey: keypair.privateKey
    };
}

/**
 * 解析 DID 并返回 DID 文档
 * @param did - 要解析的 DID
 * @returns DID 文档或 null（如果解析失败）
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
 * @returns 交易哈希
 */
export async function registerDID(did: string, privateKey: string): Promise<string> {
    console.log('Starting DID registration process...');

    // 初始化 provider
    const provider = initProvider();
    if (!provider) {
        throw new Error("Provider initialization failed");
    }

    const wallet = new ethers.Wallet(privateKey, provider);
    console.log('Wallet created:', wallet);
    const address = wallet.address;
    const publicKey = did;
    const keypair = {
        address,
        privateKey,
        publicKey,
        identifier: did
    };
    // 创建 EthrDID 实例
    const ethrDid = new EthrDID({
        ...keypair,
        provider: provider,
        chainNameOrId: 'sepolia',
        registry: REGISTRY_ADDRESS,
        txSigner: wallet,
    });
    console.log('EthrDID instance created:', ethrDid);
    console.log('Attempting to set attribute...');
    try {
        // 使用 EthrDID 实例设置属性
        const txHash = await ethrDid.setAttribute(
            'did/pub/Secp256k1/veriKey/hex',
            ethrDid.address,  // 使用地址作为值
            86400,  // 有效期为1天
            undefined,  // 不设置 gasLimit
            { gasLimit: 100000 }  // 使用 txOptions 设置 gasLimit
        );
        console.log('Attribute set, transaction hash:', txHash);

        // 等待交易被确认
        const receipt = await provider.waitForTransaction(txHash);
        console.log('Transaction confirmed, receipt:', receipt);

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




/**
 * 为 DID 添加一个新的属性
 * @param did - DID
 * @param privateKey - DID 控制者的私钥
 * @param key - 属性键
 * @param value - 属性值
 * @returns 包含交易哈希和属性信息的对象
 */
export async function addDIDAttribute(
    did: string, 
    privateKey: string, 
    key: string, 
    value: string
  ): Promise<{ txHash: string; key: string; value: string }> {
    try {
      const provider = initProvider();
      const wallet = new ethers.Wallet(privateKey, provider);
      const ethrDid = new EthrDID({
        identifier: wallet.address,
        chainNameOrId: 'sepolia',
        provider: provider,
        registry: REGISTRY_ADDRESS,
        privateKey: wallet.privateKey
      });
  
      console.log('Setting DID attribute...');
      const txHash = await ethrDid.setAttribute(key, value, 86400); // 设置属性有效期为 1 天
      console.log('Attribute set, transaction hash:', txHash);
  
      console.log('Waiting for transaction confirmation...');
      await provider.waitForTransaction(txHash);
      console.log('Transaction confirmed');
  
      return { txHash, key, value };
    } catch (error) {
      console.error('Error adding DID attribute:', error);
      throw error;
    }
  }


  