import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { Address, parseUnits, formatUnits } from 'viem';
import { LUMA_VAULT_ABI } from '../lib/vaultAbi';
import { LUMA_USDC_VAULT, TOKENS } from '../lib/contracts';

export function useUSDCVaultDeposit() {
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const deposit = async (amount: string) => {
    const amountWei = parseUnits(amount, TOKENS.USDC.decimals);
    
    return writeContract({
      address: LUMA_USDC_VAULT,
      abi: LUMA_VAULT_ABI,
      functionName: 'deposit',
      args: [amountWei],
    });
  };

  return { deposit, isPending: isPending || isConfirming, isSuccess, hash };
}

export function useUSDCVaultWithdraw() {
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const withdraw = async (shares: string) => {
    const sharesWei = parseUnits(shares, TOKENS.USDC.decimals);
    
    return writeContract({
      address: LUMA_USDC_VAULT,
      abi: LUMA_VAULT_ABI,
      functionName: 'withdraw',
      args: [sharesWei],
    });
  };

  return { withdraw, isPending: isPending || isConfirming, isSuccess, hash };
}

export function useUSDCVaultBalance(address?: Address) {
  const { data: balance } = useReadContract({
    address: LUMA_USDC_VAULT,
    abi: LUMA_VAULT_ABI,
    functionName: 'getUserBalance',
    args: address ? [address] : undefined,
  });

  const { data: shares } = useReadContract({
    address: LUMA_USDC_VAULT,
    abi: LUMA_VAULT_ABI,
    functionName: 'userShares',
    args: address ? [address] : undefined,
  });

  return {
    balance: balance ? Number(formatUnits(balance, TOKENS.USDC.decimals)) : 0,
    shares: shares ? Number(formatUnits(shares, TOKENS.USDC.decimals)) : 0,
  };
}

export function useClaimUSDCWellRewards() {
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const claimRewards = async () => {
    return writeContract({
      address: LUMA_USDC_VAULT,
      abi: LUMA_VAULT_ABI,
      functionName: 'claimWellRewards',
    });
  };

  return { claimRewards, isPending: isPending || isConfirming, isSuccess };
}
