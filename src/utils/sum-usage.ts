const multiple = 10000000
/**
 * 小数计算存在偏差，因此先转为整数值后再进行计算
 */
export function sumUsage(u1: number, u2: number): number {
  return (u1 * multiple + u2 * multiple) / multiple
}
