import { Resolver } from 'did-resolver';
import { getResolver as getEthrResolver } from 'ethr-did-resolver';
import { ethers } from 'ethers';
import { EthrDID } from 'ethr-did';
import { InfuraProvider } from '@ethersproject/providers';

// Sepolia 配置
const providerConfig = {
  name: 'sepolia',
  chainId: 11155111,
  projectId: process.env.NEXT_PUBLIC_INFURA_PROJECT_ID,
  projectSecret: process.env.NEXT_PUBLIC_INFURA_PROJECT_SECRET,
  registry: '0x03d5003bf0e79C5F5223588F347ebA39AfbC3818'
};

// 初始化 provider
let provider: ethers.providers.InfuraProvider;

function initProvider() {
  if (!provider) {
    provider = new ethers.providers.InfuraProvider('sepolia', {
      projectId: providerConfig.projectId,
      projectSecret: providerConfig.projectSecret
    });
    console.log('Provider initialized:', provider);
  }
  return provider;
}

// 创建解析器
const resolver = new Resolver(getEthrResolver({
  name: 'sepolia',
  chainId: providerConfig.chainId,
  rpcUrl: providerConfig.apiKey,
  registry: providerConfig.registry
}));

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
    console.log('Starting DID creation process...');
    const provider = initProvider();
    console.log('Provider initialized');
    
    const wallet = ethers.Wallet.createRandom().connect(provider);
    console.log('Random wallet created with address:', wallet.address);

    const ethrDid = new EthrDID({
      identifier: wallet.address,
      privateKey: wallet.privateKey,
      provider: provider,
      chainNameOrId: providerConfig.chainId,
      registry: providerConfig.registry
    });
    console.log('EthrDID instance created');

    const did = `did:ethr:${providerConfig.chainId}:${wallet.address}`;
    console.log('Created DID:', did);

    return {
      did: did,
      privateKey: wallet.privateKey
    };
  } catch (error) {
    console.error('Error creating DID:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    throw new Error('Failed to create DID');
  }
}

/**
 * 注册 DID 文档
 * @param did - 要注册的 DID
 * @param privateKey - DID 控制者的私钥
 * @returns 交易哈希
 */
export async function registerDID(did: string, privateKey: string): Promise<string> {
  try {
    console.log('Starting DID registration process...');
    if (!process.env.NEXT_PUBLIC_INFURA_PROJECT_ID || !process.env.NEXT_PUBLIC_INFURA_PROJECT_SECRET) {
      throw new Error('Infura Project ID or Project Secret is not set');
    }
    
    if (!verifyDID(did)) {
      throw new Error('Invalid DID format');
    }
    
    const provider = initProvider();
    console.log('Provider initialized');
    
    const network = await provider.getNetwork();
    console.log('Connected to network:', network.name);

    const wallet = new ethers.Wallet(privateKey, provider);
    console.log('Wallet created with address:', wallet.address);

    const ethrDid = new EthrDID({
      identifier: wallet.address,
      privateKey: wallet.privateKey,
      provider: provider,
      registry: providerConfig.registry,
      chainNameOrId: providerConfig.chainId
    });
    console.log('EthrDID instance created');

    // 检查余额
    const balance = await provider.getBalance(wallet.address);
    console.log('Wallet balance:', ethers.utils.formatEther(balance), 'ETH');

    if (balance.isZero()) {
      throw new Error('Insufficient balance to perform the transaction');
    }

    console.log('Attempting to set attribute...');
    const tx = await ethrDid.setAttribute(
      'did/pub/Ed25519/veriKey/base64',
      'QfeDA3qVPvQWf9d4BE9tFh3Jxiz5V4XQ5Z3MiiKMXh8',
      86400  // 有效期设置为 1 天
    );
    console.log('Attribute set, transaction hash:', tx);
    
    console.log('Waiting for transaction confirmation...');
    const receipt = await provider.waitForTransaction(tx.hash);
    console.log('Transaction confirmed, receipt:', receipt);

    return receipt.transactionHash;
  } catch (error) {
    console.error('Error registering DID:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    throw error;  // 抛出原始错误以便更好地诊断
  }
}

/**
 * 解析 DID 并返回 DID 文档
 * @param did - 要解析的 DID
 * @returns DID 文档或 null（如果解析失败）
 */
export async function resolveDID(did: string): Promise<DIDDocument | null> {
  try {
    console.log('Starting DID resolution process for:', did);
    const resolution = await resolver.resolve(did);
    console.log('DID resolution successful');
    return resolution.didDocument as DIDDocument;
  } catch (error) {
    console.error('Error resolving DID:', error);
    console.error('DID:', did);
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
  console.log('Verifying DID format:', did);
  // 更新的格式验证
  const didRegex = /^did:ethr:(0x[a-fA-F0-9]+)(:0x[a-fA-F0-9]{40})?$/;
  const match = did.match(didRegex);
  
  if (match) {
    const networkId = match[1];
    const address = match[2] ? match[2].slice(1) : null; // 如果存在地址部分，去掉前面的 ':'
    
    console.log('Network ID:', networkId);
    console.log('Address:', address);
    
    // 验证网络 ID（如果需要的话）
    if (networkId !== '0x1' && networkId !== '0xaa36a7') { // 0xaa36a7 是 Sepolia 的网络 ID
      console.log('Invalid network ID');
      return false;
    }
    
    // 如果存在地址部分，验证它是否是有效的以太坊地址
    if (address && !ethers.utils.isAddress(address)) {
      console.log('Invalid Ethereum address');
      return false;
    }
    
    console.log('DID format is valid');
    return true;
  }
  
  console.log('DID format is invalid');
  return false;
}

/**
 * 获取 DID 的以太坊地址
 * @param did - DID
 * @returns 以太坊地址或 null（如果格式不正确或没有指定地址）
 */
export function getAddressFromDID(did: string): string | null {
  console.log('Extracting address from DID:', did);
  if (!verifyDID(did)) {
    console.log('Invalid DID format, cannot extract address');
    return null;
  }
  
  const match = did.match(/^did:ethr:(0x[a-fA-F0-9]+)(:0x[a-fA-F0-9]{40})?$/);
  if (match && match[2]) {
    const address = match[2].slice(1); // 去掉前面的 ':'
    console.log('Extracted address:', address);
    return address;
  }
  
  console.log('No specific address in DID');
  return null;
}

/**
 * 检查 DID 控制者的余额
 * @param did - DID
 * @returns 余额（以 wei 为单位）
 */
export async function checkDIDBalance(did: string): Promise<string> {
  console.log('Checking balance for DID:', did);
  const address = getAddressFromDID(did);
  if (!address) {
    throw new Error('Invalid DID format or no address specified');
  }
  try {
    const provider = initProvider();
    const balance = await provider.getBalance(address);
    console.log('Balance:', ethers.utils.formatEther(balance), 'ETH');
    return balance.toString();
  } catch (error) {
    console.error('Error checking DID balance:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
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
    console.log('Starting process to add DID attribute');
    console.log('DID:', did);
    console.log('Attribute key:', key);
    
    if (!verifyDID(did)) {
      throw new Error('Invalid DID format');
    }
    
    const provider = initProvider();
    console.log('Provider initialized');
    
    const wallet = new ethers.Wallet(privateKey, provider);
    console.log('Wallet created with address:', wallet.address);

    const ethrDid = new EthrDID({
      identifier: wallet.address,
      privateKey: wallet.privateKey,
      provider: provider,
      registry: providerConfig.registry,
      chainNameOrId: providerConfig.chainId
    });
    console.log('EthrDID instance created');

    console.log('Attempting to set attribute...');
    const tx = await ethrDid.setAttribute(key, value, 86400); // 设置有效期为 1 天
    console.log('Attribute set, transaction hash:', tx);

    console.log('Waiting for transaction confirmation...');
    const receipt = await provider.waitForTransaction(tx.hash);
    console.log('Transaction confirmed, receipt:', receipt);

    return receipt.transactionHash;
  } catch (error) {
    console.error('Error adding DID attribute:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    throw error;  // 抛出原始错误以便更好地诊断
  }
}
