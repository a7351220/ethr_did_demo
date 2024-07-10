import { Resolver } from 'did-resolver';
import { getResolver as getEthrResolver } from 'ethr-did-resolver';
import { ethers } from 'ethers';
import { EthrDID } from 'ethr-did';

// Sepolia 配置
const providerConfig = {
  name: 'sepolia',
  chainId: 11155111,
  rpcUrl: `https://eth-sepolia.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`,
  registry: '0x03d5003bf0e79C5F5223588F347ebA39AfbC3818'
};

const provider = new ethers.providers.JsonRpcProvider(providerConfig.rpcUrl);

// 創建解析器
const resolver = new Resolver(getEthrResolver(providerConfig));

// 定義 DIDDocument 類型
export type DIDDocument = {
  '@context': string | string[];
  id: string;
  [key: string]: any;
};

/**
 * 創建一個新的 DID
 * @returns 包含 DID 和私鑰的對象
 */
export async function createDID(): Promise<{ did: string; privateKey: string }> {
  try {
    const wallet = ethers.Wallet.createRandom().connect(provider);
    const ethrDid = new EthrDID({
      identifier: wallet.address,
      privateKey: wallet.privateKey,
      provider,
      chainNameOrId: providerConfig.chainId,
      registry: providerConfig.registry
    });

    return {
      did: ethrDid.did,
      privateKey: wallet.privateKey
    };
  } catch (error) {
    console.error('Error creating DID:', error);
    throw new Error('Failed to create DID');
  }
}

/**
 * 註冊 DID 文檔
 * @param did - 要註冊的 DID
 * @param privateKey - DID 控制者的私鑰
 * @returns 交易哈希
 */
export async function registerDID(did: string, privateKey: string): Promise<string> {
  try {
    const wallet = new ethers.Wallet(privateKey, provider);
    const ethrDid = new EthrDID({
      identifier: wallet.address,
      privateKey: wallet.privateKey,
      provider,
      registry: providerConfig.registry,
      chainNameOrId: providerConfig.chainId
    });

    // 使用 setAttributeAsync 來設置一個初始屬性
    const tx = await ethrDid.setAttributeAsync(
      'did/pub/Ed25519/veriKey/base64',
      'QfeDA3qVPvQWf9d4BE9tFh3Jxiz5V4XQ5Z3MiiKMXh8',
      86400  // 有效期設置為 1 天
    );
    
    // 等待交易被確認
    const receipt = await tx.wait();
    return receipt.transactionHash;
  } catch (error) {
    console.error('Error registering DID:', error);
    console.error('Full error details:', error);
    throw new Error('Failed to register DID');
  }
}

/**
 * 解析 DID 並返回 DID 文檔
 * @param did - 要解析的 DID
 * @returns DID 文檔或 null（如果解析失敗）
 */
export async function resolveDID(did: string): Promise<DIDDocument | null> {
  try {
    const resolution = await resolver.resolve(did);
    return resolution.didDocument as DIDDocument;
  } catch (error) {
    console.error('Error resolving DID:', error);
    console.error('DID:', did);
    return null;
  }
}

/**
 * 驗證 DID 格式是否正確
 * @param did - 要驗證的 DID
 * @returns 布爾值，表示 DID 是否有效
 */
export function verifyDID(did: string): boolean {
  // 基本格式驗證
  const didRegex = /^did:ethr:0x[a-fA-F0-9]{40}$/;
  return didRegex.test(did);
}

/**
 * 獲取 DID 的以太坊地址
 * @param did - DID
 * @returns 以太坊地址或 null（如果格式不正確）
 */
export function getAddressFromDID(did: string): string | null {
  if (!verifyDID(did)) {
    return null;
  }
  return did.split(':')[2];
}

/**
 * 檢查 DID 控制者的餘額
 * @param did - DID
 * @returns 餘額（以 wei 為單位）
 */
export async function checkDIDBalance(did: string): Promise<string> {
  const address = getAddressFromDID(did);
  if (!address) {
    throw new Error('Invalid DID format');
  }
  try {
    const balance = await provider.getBalance(address);
    return balance.toString();
  } catch (error) {
    console.error('Error checking DID balance:', error);
    throw new Error('Failed to check DID balance');
  }
}

/**
 * 為 DID 添加一個新的屬性
 * @param did - DID
 * @param privateKey - DID 控制者的私鑰
 * @param key - 屬性鍵
 * @param value - 屬性值
 * @returns 交易哈希
 */
export async function addDIDAttribute(did: string, privateKey: string, key: string, value: string): Promise<string> {
  try {
    const wallet = new ethers.Wallet(privateKey, provider);
    const ethrDid = new EthrDID({
      identifier: wallet.address,
      privateKey: wallet.privateKey,
      provider,
      registry: providerConfig.registry,
      chainNameOrId: providerConfig.chainId
    });
    const tx = await ethrDid.setAttributeAsync(key, value, 86400); // 設置有效期為 1 天
    const receipt = await tx.wait();
    return receipt.transactionHash;
  } catch (error) {
    console.error('Error adding DID attribute:', error);
    console.error('Full error details:', error);
    throw new Error('Failed to add DID attribute');
  }
}