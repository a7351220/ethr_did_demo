import { ethers } from 'ethers';
import { EthrDID } from 'ethr-did';
import { EthereumDIDRegistry } from 'ethr-did-registry';
import { Resolver, DIDResolutionResult, DIDDocument as ResolverDIDDocument, VerificationMethod } from 'did-resolver';

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

export type DIDDocument = {
    '@context'?: string | string[];
    id: string;
    alsoKnownAs?: string[];
    controller?: string | string[];
    verificationMethod?: VerificationMethod[];
    authentication?: (string | VerificationMethod)[];
    assertionMethod?: (string | VerificationMethod)[];
    keyAgreement?: (string | VerificationMethod)[];
    capabilityInvocation?: (string | VerificationMethod)[];
    capabilityDelegation?: (string | VerificationMethod)[];
    service?: ServiceEndpoint[];
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
  
    // 初始化 provider
    const provider = initProvider();
    if (!provider) {
      throw new Error("Provider initialization failed");
    }
  
    // 检查网络
    const connectedNetwork = await provider.getNetwork();
    if (connectedNetwork.name !== 'sepolia') {
      throw new Error(`Connected to wrong network: ${connectedNetwork.name}. Expected: sepolia`);
    }
  
    // 创建钱包
    const wallet = new ethers.Wallet(privateKey, provider);
  
    // 验证地址匹配
    if (wallet.address.toLowerCase() !== address.toLowerCase()) {
      throw new Error('Private key does not match the address in the DID');
    }
  
    // 创建 DID Registry 合约实例
    const didReg = new ethers.Contract(REGISTRY_ADDRESS, EthereumDIDRegistry.abi, wallet);
  
    console.log('Attempting to set attribute...');
    try {
      // 获取公钥
      const publicKey = wallet.address ;
  
      // 设置属性
      const tx = await didReg.setAttribute(
        address,
        ethers.id('did/pub/Secp256k1/veriKey/hex'),
        ethers.getBytes(publicKey),
        86400 // 有效期为1天
      );
  
      console.log('Attribute set, transaction hash:', tx.hash);
  
      // 等待交易被确认
      const receipt = await tx.wait();
      console.log('Transaction confirmed, receipt:', receipt);
  
      return tx.hash;
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
    console.log('Starting DID resolution for:', did);
    try {
      if (!verifyDID(did)) {
        throw new Error('Invalid ethr DID format');
      }
  
      const resolution: DIDResolutionResult = await resolver.resolve(did);
      console.log('DID resolution result:', JSON.stringify(resolution, null, 2));
  
      if (resolution.didDocument) {
        const document: DIDDocument = {
          ...resolution.didDocument,
          '@context': resolution.didDocument['@context'] || [
            "https://www.w3.org/ns/did/v1",
            "https://w3id.org/security/suites/secp256k1recovery-2020/v2"
          ]
        };
  
        // 确保验证方法存在
        if (!document.verificationMethod) {
          const address = did.split(':').pop();
          document.verificationMethod = [{
            id: `${did}#controller`,
            type: "EcdsaSecp256k1RecoveryMethod2020",
            controller: did,
            blockchainAccountId: `eip155:11155111:${address}` // Sepolia 链 ID
          }];
        }
  
        // 确保 authentication 和 assertionMethod 存在
        if (!document.authentication) {
          document.authentication = [`${did}#controller`];
        }
        if (!document.assertionMethod) {
          document.assertionMethod = [`${did}#controller`];
        }
  
        console.log('Processed DID document:', JSON.stringify(document, null, 2));
        return document;
      }
      
      console.log('No DID document found in resolution result');
      return null;
    } catch (error) {
      console.error('Error resolving DID:', error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      return null;
    }
  }
  
  /**
   * 验证 DID 格式是否正确
   * @param did - 要验证的 DID
   * @returns 布尔值，表示 DID 是否有效
   */
  export function verifyDID(did: string): boolean {
      // 更新正则表达式以匹配 Sepolia 测试网的 DID 格式
      const didRegex = /^did:ethr:(0x[a-fA-F0-9]{40}|11155111:0x[a-fA-F0-9]{40})$/;
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


/**
 * 验证 DID 所有权
 * @param did - 要验证的 DID
 * @param address - 声称拥有 DID 的地址
 * @returns 布尔值，表示地址是否拥有该 DID
 */
export async function verifyDIDOwnership(did: string, address: string): Promise<boolean> {
    try {
      const didDocument = await resolveDID(did);
      if (!didDocument) {
        throw new Error('Failed to resolve DID');
      }
      
      // 检查 DID 文档中的控制者地址
      const controller = didDocument.controller || didDocument.id.split(':')[2];
      return controller.toLowerCase() === address.toLowerCase();
    } catch (error) {
      console.error('Error verifying DID ownership:', error);
      return false;
    }
  }

/**
 * 获取 DID 的所有属性
 * @param did - 要获取属性的 DID
 * @returns DID 的所有属性
 */
export async function getDIDAttributes(did: string): Promise<Record<string, any>> {
    try {
      const didDocument = await resolveDID(did);
      if (!didDocument) {
        throw new Error('Failed to resolve DID');
      }
      
      // 提取 DID 文档中的属性
      const attributes: Record<string, any> = {};
      if (didDocument.service) {
        didDocument.service.forEach((service: { type: string | number; serviceEndpoint: any; }) => {
          attributes[service.type] = service.serviceEndpoint;
        });
      }
      
      return attributes;
    } catch (error) {
      console.error('Error getting DID attributes:', error);
      return {};
    }
  }



  