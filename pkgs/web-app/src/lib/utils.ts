import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Tailwind CSSクラス名をマージするユーティリティ関数
 * clsxとtailwind-mergeを組み合わせて、条件付きクラス名と競合解決を提供
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
