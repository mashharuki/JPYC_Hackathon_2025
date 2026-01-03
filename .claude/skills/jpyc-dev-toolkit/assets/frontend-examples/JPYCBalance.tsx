/**
 * JPYCBalance Component
 *
 * JPYC残高を表示するReactコンポーネント
 *
 * 依存関係:
 * - wagmi (useReadContract, useAccount)
 * - viem (formatUnits)
 */

import { useAccount, useReadContract } from 'wagmi';
import { formatUnits } from 'viem';

// JPYCコントラクトのABI（必要な部分のみ）
const jpycABI = [
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

interface JPYCBalanceProps {
  jpycAddress: `0x${string}`;
  address?: `0x${string}`;
  showSymbol?: boolean;
  className?: string;
}

export function JPYCBalance({
  jpycAddress,
  address: providedAddress,
  showSymbol = true,
  className = '',
}: JPYCBalanceProps) {
  // 接続されたウォレットのアドレスを取得
  const { address: connectedAddress } = useAccount();

  // 表示対象のアドレス（propsで指定されていればそれを、なければ接続アドレスを使用）
  const targetAddress = providedAddress || connectedAddress;

  // 残高を取得
  const {
    data: balance,
    isError: isBalanceError,
    isLoading: isBalanceLoading,
  } = useReadContract({
    address: jpycAddress,
    abi: jpycABI,
    functionName: 'balanceOf',
    args: targetAddress ? [targetAddress] : undefined,
    query: {
      enabled: !!targetAddress,
      refetchInterval: 10000, // 10秒ごとに更新
    },
  });

  // トークンのシンボルを取得
  const {
    data: symbol,
    isError: isSymbolError,
    isLoading: isSymbolLoading,
  } = useReadContract({
    address: jpycAddress,
    abi: jpycABI,
    functionName: 'symbol',
    query: {
      enabled: showSymbol,
    },
  });

  // decimalsを取得
  const {
    data: decimals,
    isError: isDecimalsError,
    isLoading: isDecimalsLoading,
  } = useReadContract({
    address: jpycAddress,
    abi: jpycABI,
    functionName: 'decimals',
  });

  // ローディング状態
  if (isBalanceLoading || isDecimalsLoading || (showSymbol && isSymbolLoading)) {
    return (
      <div className={className}>
        <span className="animate-pulse">Loading...</span>
      </div>
    );
  }

  // エラー状態
  if (isBalanceError || isDecimalsError || (showSymbol && isSymbolError)) {
    return (
      <div className={className}>
        <span className="text-red-500">Error loading balance</span>
      </div>
    );
  }

  // アドレスが未接続
  if (!targetAddress) {
    return (
      <div className={className}>
        <span className="text-gray-500">Wallet not connected</span>
      </div>
    );
  }

  // 残高をフォーマット
  const formattedBalance =
    balance !== undefined && decimals !== undefined
      ? formatUnits(balance, decimals)
      : '0';

  // 数値を3桁区切りでフォーマット
  const displayBalance = Number(formattedBalance).toLocaleString('ja-JP', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  return (
    <div className={className}>
      <span className="font-semibold">
        {displayBalance}
        {showSymbol && symbol && (
          <span className="ml-1 text-sm text-gray-600">{symbol}</span>
        )}
      </span>
    </div>
  );
}

// 使用例:
/*
import { JPYCBalance } from './JPYCBalance';

function App() {
  const jpycAddress = '0x431D5dfF03120AFA4bDf332c61A6e1766eF37BDB'; // Base Sepolia

  return (
    <div>
      <h2>Your JPYC Balance</h2>
      <JPYCBalance jpycAddress={jpycAddress} />

      {// 特定のアドレスの残高を表示}
      <JPYCBalance
        jpycAddress={jpycAddress}
        address="0x1234..."
      />

      {// カスタムスタイル}
      <JPYCBalance
        jpycAddress={jpycAddress}
        className="text-2xl text-blue-600"
      />
    </div>
  );
}
*/
