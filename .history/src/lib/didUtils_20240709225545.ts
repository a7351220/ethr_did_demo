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

// 創建 provider
let provider: ethers.providers.JsonRpcProvider;

// 初始化 provider 函數
function initProvider() {
  if (!provider) {
    provider = new ethers.providers.JsonRpcProvider(providerConfig.rpcUrl);
  }
  return provider;
}

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
 * 註冊 DID 文檔
 * @param did - 要註冊的 DID
 * @param privateKey - DID 控制者的私鑰
 * @returns 交易哈希
 */
export async function registerDID(did: string, privateKey: string): Promise<string> {
  try {
    console.log('Starting DID registration process...');
    if (!process.env.NEXT_PUBLIC_ALCHEMY_API_KEY) {
      throw new Error('Alchemy API key is not set');
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

    // 檢查餘額
    const balance = await provider.getBalance(wallet.address);
    console.log('Wallet balance:', ethers.utils.formatEther(balance), 'ETH');

    if (balance.isZero()) {
      throw new Error('Insufficient balance to perform the transaction');
    }

    console.log('Attempting to set attribute...');
    const tx = await ethrDid.setAttribute(
      'did/pub/Ed25519/veriKey/base64',
      'QfeDA3qVPvQWf9d4BE9tFh3Jxiz5V4XQ5Z3MiiKMXh8',
      86400  // 有效期設置為 1 天
    );
    console.log('Attribute set, transaction hash:', tx);
    
    console.log('Waiting for transaction confirmation...');
    const receipt = await provider.waitForTransaction(tx);
    console.log('Transaction confirmed, receipt:', receipt);

    return receipt.transactionHash;
  } catch (error) {
    console.error('Error registering DID:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    throw error;  // 拋出原始錯誤以便更好地診斷
  }
}

/**
 * 解析 DID 並返回 DID 文檔
 * @param did - 要解析的 DID
 * @returns DID 文檔或 null（如果解析失敗）
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
 * 驗證 DID 格式是否正確
 * @param did - 要驗證的 DID
 * @returns 布爾值，表示 DID 是否有效
 */
export function verifyDID(did: string): boolean {
  console.log('Verifying DID format:', did);
  // 更新的格式驗證
  const didRegex = /^did:ethr:(0x[a-fA-F0-9]+)(:0x[a-fA-F0-9]{40})?$/;
  const match = did.match(didRegex);
  
  if (match) {
    const networkId = match[1];
    const address = match[2] ? match[2].slice(1) : null; // 如果存在地址部分，去掉前面的 ':'
    
    console.log('Network ID:', networkId);
    console.log('Address:', address);
    
    // 驗證網絡 ID（如果需要的話）
    if (networkId !== '0x1' && networkId !== '0xaa36a7') { // 0xaa36a7 是 Sepolia 的網絡 ID
      console.log('Invalid network ID');
      return false;
    }
    
    // 如果存在地址部分，驗證它是否是有效的以太坊地址
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
 * 獲取 DID 的以太坊地址
 * @param did - DID
 * @returns 以太坊地址或 null（如果格式不正確或沒有指定地址）
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
 * 檢查 DID 控制者的餘額
 * @param did - DID
 * @returns 餘額（以 wei 為單位）
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
 * 為 DID 添加一個新的屬性
 * @param did - DID
 * @param privateKey - DID 控制者的私鑰
 * @param key - 屬性鍵
 * @param value - 屬性值
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
    const tx = await ethrDid.setAttribute(key, value, 86400); // 設置有效期為 1 天
    console.log('Attribute set, transaction hash:', tx);

    console.log('Waiting for transaction confirmation...');
    const receipt = await provider.waitForTransaction(tx);
    console.log('Transaction confirmed, receipt:', receipt);

    return receipt.transactionHash;
  } catch (error) {
    console.error('Error adding DID attribute:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    throw error;  // 拋出原始錯誤以便更好地診斷
  }
}