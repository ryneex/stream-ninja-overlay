import { cn, type ClassValue } from "cn"

export { cn, type ClassValue } from "cn"
export { tv, type VariantProps } from "tailwind-variants"

/**
 * Helper function to provide type safety for tailwind class names
 * @param strings - The template strings to join
 * @returns The joined class names
 *
 * @example
 * const className = tw`bg-red-500 text-white`
 * console.log(className) // "bg-red-500 text-white"
 * @example
 * const className = tw("bg-red-500 text-white")
 * console.log(className) // "bg-red-500 text-white"
 */
export function tw(...inputs: ClassValue[]) {
  return cn(...inputs)
}
