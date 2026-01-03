/**
 * JPYCTransfer Component
 *
 * JPYC送金フォームのReactコンポーネント
 *
 * 依存関係:
 * - wagmi (useWriteContract, useWaitForTransactionReceipt, useAccount)
 * - viem (parseUnits, isAddress)
 * - react (useState)
 */

import { useState } from 'react';
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
} from 'wagmi';
import { parseUnits, isAddress } from 'viem';

// JPYCコントラクトのABI（必要な部分のみ）
const jpycABI = [
  {
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'transfer',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

interface JPYCTransferProps {
  jpycAddress: `0x${string}`;
  decimals?: number;
  onSuccess?: (txHash: string) => void;
  onError?: (error: Error) => void;
  className?: string;
}

export function JPYCTransfer({
  jpycAddress,
  decimals = 18,
  onSuccess,
  onError,
  className = '',
}: JPYCTransferProps) {
  const { address: userAddress, isConnected } = useAccount();

  // フォーム状態
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');

  // コントラクト書き込み
  const {
    data: hash,
    isPending: isWritePending,
    writeContract,
    reset,
  } = useWriteContract();

  // トランザクション完了待機
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  // フォームバリデーション
  const validateForm = (): boolean => {
    setError('');

    if (!isConnected) {
      setError('Please connect your wallet');
      return false;
    }

    if (!recipient) {
      setError('Recipient address is required');
      return false;
    }

    if (!isAddress(recipient)) {
      setError('Invalid recipient address');
      return false;
    }

    if (!amount || Number(amount) <= 0) {
      setError('Amount must be greater than 0');
      return false;
    }

    return true;
  };

  // 送金処理
  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      // 金額をWei単位に変換
      const amountInWei = parseUnits(amount, decimals);

      // トランザクション送信
      writeContract({
        address: jpycAddress,
        abi: jpycABI,
        functionName: 'transfer',
        args: [recipient as `0x${string}`, amountInWei],
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Transfer failed';
      setError(errorMessage);
      onError?.(err instanceof Error ? err : new Error(errorMessage));
    }
  };

  // トランザクション確認後の処理
  if (isConfirmed && hash) {
    onSuccess?.(hash);

    // フォームをリセット
    setRecipient('');
    setAmount('');
    reset();
  }

  // 最大値設定（オプション: 残高から計算する場合）
  const handleMaxAmount = () => {
    // 実装する場合は、useReadContractで残高を取得して設定
    // const { data: balance } = useReadContract({ ... });
    // setAmount(formatUnits(balance, decimals));
  };

  return (
    <div className={`max-w-md mx-auto ${className}`}>
      <form onSubmit={handleTransfer} className="space-y-4">
        {/* 受取人アドレス */}
        <div>
          <label
            htmlFor="recipient"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Recipient Address
          </label>
          <input
            id="recipient"
            type="text"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="0x..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isWritePending || isConfirming}
          />
        </div>

        {/* 送金額 */}
        <div>
          <label
            htmlFor="amount"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Amount (JPYC)
          </label>
          <div className="flex gap-2">
            <input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              step="0.01"
              min="0"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isWritePending || isConfirming}
            />
            {/* 最大値ボタン（オプション） */}
            {/*
            <button
              type="button"
              onClick={handleMaxAmount}
              className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
              disabled={isWritePending || isConfirming}
            >
              MAX
            </button>
            */}
          </div>
        </div>

        {/* エラーメッセージ */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* 送金ボタン */}
        <button
          type="submit"
          disabled={!isConnected || isWritePending || isConfirming}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {isWritePending
            ? 'Confirming...'
            : isConfirming
            ? 'Processing...'
            : 'Send JPYC'}
        </button>

        {/* トランザクションハッシュ */}
        {hash && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-green-600">
              Transaction submitted!
              <br />
              <a
                href={`https://sepolia.basescan.org/tx/${hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="underline break-all"
              >
                View on Explorer
              </a>
            </p>
          </div>
        )}
      </form>
    </div>
  );
}

// 使用例:
/*
import { JPYCTransfer } from './JPYCTransfer';

function App() {
  const jpycAddress = '0x431D5dfF03120AFA4bDf332c61A6e1766eF37BDB'; // Base Sepolia

  const handleSuccess = (txHash: string) => {
    console.log('Transfer successful:', txHash);
    // 成功時の処理（通知表示など）
  };

  const handleError = (error: Error) => {
    console.error('Transfer failed:', error);
    // エラー時の処理
  };

  return (
    <div>
      <h2>Send JPYC</h2>
      <JPYCTransfer
        jpycAddress={jpycAddress}
        onSuccess={handleSuccess}
        onError={handleError}
      />
    </div>
  );
}
*/
