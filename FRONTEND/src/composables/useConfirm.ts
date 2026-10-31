// ============================================================
//  useConfirm – simple confirmation dialog via window.confirm
//  Có thể swap sang Element Plus ElMessageBox sau
// ============================================================

export function useConfirm() {
  /**
   * @example
   * const { confirm } = useConfirm()
   * if (await confirm('Bạn chắc chắn muốn xóa?')) { ... }
   */
  async function confirm(message: string): Promise<boolean> {
    return window.confirm(message)
  }

  return { confirm }
}
