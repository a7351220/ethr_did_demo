import { Resolver } from 'did-resolver';
import { getResolver as getEthrResolver } from 'ethr-did-resolver';
import { ethers } from 'ethers';
import { EthrDID } from 'ethr-did';

// Sepolia 配置
const providerConfig = {
  name: 'sepolia',
  chainId: 11155111,
  rpcUrl: `https://eth-sepolia.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`,
  registry: ethers.utils.getAddress('0x03d5003bf0e79C5F5223588F347ebA39AfbC3818') // 确保这是正确的 ERC1056 注册表合约地址
};

const provider = new ethers.providers.JsonRpcProvider(providerConfig.rpcUrl);

// 创建解析器
const resolver = new Resolver({
  ...getEthrResolver(providerConfig),
});

// 定义 DIDDocument 类型
export type DIDDocument = {
  '@context': string | string[];
  id: string;
  [key: string]: any;
};

/**
 * 创建一个新的 DID
 * @returns 包含 DID 和私钥的对象
 */
export async function createDID(): Promise<{ did: string; privateKey: string }> {
  try {
    const wallet = ethers.Wallet.createRandom().connect(provider);
    const ethrDid = new EthrDID({
      identifier: wallet.address,
      privateKey: wallet.privateKey,
      provider,
      chainNameOrId: providerConfig.chainId
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
//did:ethr:0xaa36a7:0xd08ef7f3CA0aE33abE84bB497c0DD18F4725ea67
/**
 * 解析 DID 并返回 DID 文档
 * @param did - 要解析的 DID
 * @returns DID 文档或 null（如果解析失败）
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
 * 验证 DID 格式是否正确
 * @param did - 要验证的 DID
 * @returns 布尔值，表示 DID 是否有效
 */
export function verifyDID(did: string): boolean {
  // 基本格式验证
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
  try {
    const balance = await provider.getBalance(address);
    return balance.toString();
  } catch (error) {
    console.error('Error checking DID balance:', error);
    throw new Error('Failed to check DID balance');
  }
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
    const wallet = new ethers.Wallet(privateKey, provider);
    const ethrDid = new EthrDID({
      identifier: wallet.address,
      privateKey: wallet.privateKey,
      provider,
      chainNameOrId: providerConfig.chainId
    });
    const txHash = await ethrDid.setAttribute(key, value);
    return txHash;
  } catch (error) {
    console.error('Error adding DID attribute:', error);
    throw new Error('Failed to add DID attribute');
  }
}
