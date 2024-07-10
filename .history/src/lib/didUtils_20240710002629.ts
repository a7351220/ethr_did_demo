import { ethers } from 'ethers';
import { getResolver as getEthrResolver } from 'ethr-did-resolver';
import { EthrDID } from 'ethr-did';
import { SigningKey } from "@ethersproject/signing-key";
import { Resolver, DIDDocument as ResolverDIDDocument, DIDResolutionResult } from 'did-resolver';

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

export type DIDDocument = {
  '@context'?: string | string[];
  id: string;
  [key: string]: any;
};

/**
 * 创建一个新的 DID
 * @returns 包含 DID 和私钥的对象
 */
export async function createDID(): Promise<{ did: string; privateKey: string }> {
    const provider = initProvider();
    const wallet = ethers.Wallet.createRandom().connect(provider);
    const ethrDid = new EthrDID({
        identifier: wallet.address,
        chainNameOrId: 'sepolia',
        provider: provider,
        registry: REGISTRY_ADDRESS,
        privateKey: wallet.privateKey
    });
    return {
        did: ethrDid.did,
        privateKey: wallet.privateKey
    };
}

/**
 * 注册 DID 文档
 * @param did - 要注册的 DID
 * @param privateKey - DID 控制者的私钥
 * @returns 交易哈希
 */
export async function registerDID(did: string, privateKey: string): Promise<string> {
  console.log('Starting DID registration process...');

  // 解析 DID
  const didParts = did.split(':');
  if (didParts.length !== 4 || didParts[0] !== 'did' || didParts[1] !== 'ethr') {
      throw new Error('Invalid DID format. Expected: did:ethr:network:address');
  }
  const network = didParts[2];
  const address = didParts[3];

  // 初始化 provider 并进行检查
  const provider = initProvider();
  if (!provider) {
      throw new Error("Provider initialization failed");
  }

  // 检查网络连接
  try {
      const connectedNetwork = await provider.getNetwork();
      console.log('Connected to network:', connectedNetwork.name);
      if (connectedNetwork.name !== network) {
          throw new Error(`Connected to wrong network: ${connectedNetwork.name}. Expected: ${network}`);
      }
  } catch (error) {
      console.error('Failed to connect to network:', error);
      throw new Error('Provider network connection failed');
  }

  // 验证 provider 功能
  try {
      const blockNumber = await provider.getBlockNumber();
      console.log('Current block number:', blockNumber);
  } catch (error) {
      console.error('Failed to get block number:', error);
      throw new Error('Provider functionality check failed');
  }

  // 使用 SigningKey 获取公钥
  const signingKey = new SigningKey(privateKey);
  const publicKey = signingKey.publicKey;

  // 创建钱包
  const wallet = new ethers.Wallet(privateKey, provider);

  // 验证地址匹配
  if (wallet.address.toLowerCase() !== address.toLowerCase()) {
      throw new Error('Private key does not match the address in the DID');
  }

  // 创建 EthrDID 实例
  const ethrDid = new EthrDID({
      identifier: address,
      chainNameOrId: network,
      provider: provider,
      registry: REGISTRY_ADDRESS,
      privateKey: privateKey
  });

  console.log('Attempting to set attribute...');
  try {
      const tx = await ethrDid.setAttribute('did/pub/Secp256k1/veriKey/hex', publicKey, 86400);
      console.log('Attribute set, transaction hash:', tx);

      // 等待交易被确认
      const receipt = await provider.waitForTransaction(tx);
      console.log('Transaction confirmed, receipt:', receipt);

      return tx;
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
 * 解析 DID 并返回 DID 文档
 * @param did - 要解析的 DID
 * @returns DID 文档或 null（如果解析失败）
 */
export async function resolveDID(did: string): Promise<DIDDocument | null> {
  try {
      const resolution: DIDResolutionResult = await resolver.resolve(did);
      
      if (resolution.didDocument) {
          // 確保 @context 存在，如果不存在則設置一個默認值
          const didDocument: DIDDocument = {
              ...resolution.didDocument,
              '@context': resolution.didDocument['@context'] || 'https://www.w3.org/ns/did/v1'
          };
          return didDocument;
      }
      
      return null;
  } catch (error) {
      console.error('Error resolving DID:', error);
      return null;
  }
}

/**
 * 验证 DID 格式是否正确
 * @param did - 要验证的 DID
 * @returns 布尔值，表示 DID 是否有效
 */
export function verifyDID(did: string): boolean {
    const didRegex = /^did:ethr:0x[a-fA-F0-9]{40}$/;
    return didRegex.test(did);
}

/**
 * 获取 DID 的以太坊地址
 * @param did - DID
 * @returns 以太坊地址或 null（如果格式不正确）
 */
export function getAddressFromDID(did: string): string | null {
    if (!verifyDID(did)) {
        return null;
    }
    return did.split(':')[2];
}

/**
 * 检查 DID 控制者的余额
 * @param did - DID
 * @returns 余额（以 wei 为单位）
 */
export async function checkDIDBalance(did: string): Promise<string> {
    const address = getAddressFromDID(did);
    if (!address) {
        throw new Error('Invalid DID format');
    }
    const provider = initProvider();
    const balance = await provider.getBalance(address);
    return balance.toString();
}

/**
 * 为 DID 添加一个新的属性
 * @param did - DID
 * @param privateKey - DID 控制者的私钥
 * @param key - 属性键
 * @param value - 属性值
 * @returns 交易哈希
 */
export async function addDIDAttribute(did: string, privateKey: string, key: string, value: string): Promise<string> {
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
      const receipt = await provider.waitForTransaction(txHash);
      console.log('Transaction confirmed, receipt:', receipt);

      return txHash;
  } catch (error) {
      console.error('Error adding DID attribute:', error);
      throw error;
  }
}