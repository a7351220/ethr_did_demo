import { ethers } from 'ethers';
import { Resolver } from 'did-resolver';
import { getResolver as getEthrResolver } from 'ethr-did-resolver';
import { EthrDID } from 'ethr-did';
import { SigningKey } from "@ethersproject/signing-key";
import { DIDDocument as ResolverDIDDocument, DIDResolutionResult } from 'did-resolver';

const defaultApiKey = "_gg7wSSi0KMBsdKnGVfHDueq6xMB9EkC";
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
  const provider = initProvider();
  const signingKey = new SigningKey(privateKey);
  const publicKey = signingKey.publicKey;

  const wallet = new ethers.Wallet(privateKey, provider);

  const ethrDid = new EthrDID({
      identifier: wallet.address,
      chainNameOrId: 'sepolia',
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
      throw error;
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
    const provider = initProvider();
    const wallet = new ethers.Wallet(privateKey, provider);
    const ethrDid = new EthrDID({
        identifier: wallet.address,
        chainNameOrId: 'sepolia',
        provider: provider,
        registry: REGISTRY_ADDRESS,
        privateKey: wallet.privateKey
    });

    const tx = await ethrDid.setAttribute(key, value, 86400); // 设置属性有效期为 1 天
    const receipt = await tx.wait();
    return receipt.transactionHash;
}