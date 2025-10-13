import { Address, parseUnits, formatUnits } from 'viem';
import { TOKENS } from './contracts';

export const AERODROME_ROUTER = '0xcF77a3Ba9A5CA399B7c97c74d54e5b1Beb874E43' as Address;
export const AERODROME_FACTORY = '0x420DD381b31aEf6683db6B902084cB0FFECe40Da' as Address;

export const AERODROME_ROUTER_ABI = [
  {
    inputs: [
      { name: 'amountIn', type: 'uint256' },
      { name: 'amountOutMin', type: 'uint256' },
      {
        name: 'routes',
        type: 'tuple[]',
        components: [
          { name: 'from', type: 'address' },
          { name: 'to', type: 'address' },
          { name: 'stable', type: 'bool' },
          { name: 'factory', type: 'address' }
        ]
      },
      { name: 'to', type: 'address' },
      { name: 'deadline', type: 'uint256' }
    ],
    name: 'swapExactTokensForTokens',
    outputs: [{ name: 'amounts', type: 'uint256[]' }],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { name: 'amountIn', type: 'uint256' },
      {
        name: 'routes',
        type: 'tuple[]',
        components: [
          { name: 'from', type: 'address' },
          { name: 'to', type: 'address' },
          { name: 'stable', type: 'bool' },
          { name: 'factory', type: 'address' }
        ]
      }
    ],
    name: 'getAmountsOut',
    outputs: [{ name: 'amounts', type: 'uint256[]' }],
    stateMutability: 'view',
    type: 'function'
  }
] as const;

interface SwapRoute {
  from: Address;
  to: Address;
  stable: boolean;
  factory: Address;
}

export interface SwapQuote {
  amountOut: string;
  amountOutFormatted: string;
  priceImpact: number;
  route: SwapRoute[];
  minimumReceived: string;
  rate: string;
}

export async function getSwapQuote(
  tokenIn: 'USDC' | 'BTC',
  tokenOut: 'USDC' | 'BTC',
  amountIn: string,
  slippageTolerance: number,
  publicClient: any
): Promise<SwapQuote> {
  const tokenInConfig = tokenIn === 'BTC' ? TOKENS.cbBTC : TOKENS.USDC;
  const tokenOutConfig = tokenOut === 'BTC' ? TOKENS.cbBTC : TOKENS.USDC;

  const amountInParsed = parseUnits(amountIn, tokenInConfig.decimals);

  const routes: SwapRoute[] = [
    {
      from: tokenInConfig.address,
      to: tokenOutConfig.address,
      stable: false,
      factory: AERODROME_FACTORY
    }
  ];

  try {
    const amounts = await publicClient.readContract({
      address: AERODROME_ROUTER,
      abi: AERODROME_ROUTER_ABI,
      functionName: 'getAmountsOut',
      args: [amountInParsed, routes]
    });

    const amountOut = amounts[amounts.length - 1];
    const amountOutFormatted = formatUnits(amountOut, tokenOutConfig.decimals);

    const inputValue = parseFloat(amountIn);
    const outputValue = parseFloat(amountOutFormatted);
    const priceImpact = Math.abs(1 - (outputValue / inputValue)) * 100;

    const slippageMultiplier = BigInt(Math.floor((100 - slippageTolerance) * 100));
    const minimumReceived = (amountOut * slippageMultiplier) / BigInt(10000);

    const rate = (outputValue / inputValue).toFixed(tokenOut === 'BTC' ? 8 : 2);

    return {
      amountOut: amountOut.toString(),
      amountOutFormatted,
      priceImpact,
      route: routes,
      minimumReceived: minimumReceived.toString(),
      rate
    };
  } catch (error) {
    console.error('Failed to get swap quote:', error);
    throw new Error('Failed to fetch swap quote');
  }
}

export async function checkAndApproveToken(
  token: 'USDC' | 'BTC',
  amount: string,
  userAddress: Address,
  publicClient: any,
  walletClient: any
): Promise<{ needsApproval: boolean; hash?: Address }> {
  const tokenConfig = token === 'BTC' ? TOKENS.cbBTC : TOKENS.USDC;
  const amountParsed = parseUnits(amount, tokenConfig.decimals);

  try {
    const allowance = await publicClient.readContract({
      address: tokenConfig.address,
      abi: tokenConfig.abi,
      functionName: 'allowance',
      args: [userAddress, AERODROME_ROUTER]
    });

    if (allowance >= amountParsed) {
      return { needsApproval: false };
    }

    const maxUint256 = BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff');
    
    const hash = await walletClient.writeContract({
      address: tokenConfig.address,
      abi: tokenConfig.abi,
      functionName: 'approve',
      args: [AERODROME_ROUTER, maxUint256]
    });

    return { needsApproval: true, hash };
  } catch (error) {
    console.error('Approval check/execution failed:', error);
    throw error;
  }
}

export async function executeSwap(
  tokenIn: 'USDC' | 'BTC',
  tokenOut: 'USDC' | 'BTC',
  amountIn: string,
  quote: SwapQuote,
  userAddress: Address,
  walletClient: any
): Promise<Address> {
  const tokenInConfig = tokenIn === 'BTC' ? TOKENS.cbBTC : TOKENS.USDC;
  const amountInParsed = parseUnits(amountIn, tokenInConfig.decimals);

  const deadline = BigInt(Math.floor(Date.now() / 1000) + 1200);

  try {
    const hash = await walletClient.writeContract({
      address: AERODROME_ROUTER,
      abi: AERODROME_ROUTER_ABI,
      functionName: 'swapExactTokensForTokens',
      args: [
        amountInParsed,
        BigInt(quote.minimumReceived),
        quote.route,
        userAddress,
        deadline
      ]
    });

    return hash;
  } catch (error) {
    console.error('Swap execution failed:', error);
    throw error;
  }
}
