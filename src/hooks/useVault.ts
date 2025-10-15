import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { Address, parseUnits } from 'viem';
import { LUMA_VAULT, TOKENS } from '../lib/contracts';

const VAULT_ABI = [
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'amount', type: 'uint256' }],
    name: 'deposit',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'amount', type: 'uint256' }],
    name: 'withdraw',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

export function useVaultBalance(address: Address | undefined) {
  const { data: balance } = useReadContract({
    address: LUMA_VAULT,
    abi: VAULT_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  });

  // Convert to number safely
  const balanceValue = balance ? Number(balance) / 1e8 : 0;

  return typeof balanceValue === 'number' && !isNaN(balanceValue) ? balanceValue : 0;
}

export function useVaultDeposit() {
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const deposit = async (amount: string) => {
    const amountWei = parseUnits(amount, TOKENS.cbBTC.decimals);
    
    return writeContract({
      address: LUMA_VAULT,
      abi: VAULT_ABI,
      functionName: 'deposit',
      args: [amountWei],
    });
  };

  return { deposit, isPending: isPending || isConfirming, isSuccess, hash };
}

export function useVaultWithdraw() {
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const withdraw = async (amount: string) => {
    const amountWei = parseUnits(amount, TOKENS.cbBTC.decimals);
    
    return writeContract({
      address: LUMA_VAULT,
      abi: VAULT_ABI,
      functionName: 'withdraw',
      args: [amountWei],
    });
  };

  return { withdraw, isPending: isPending || isConfirming, isSuccess, hash };
}
