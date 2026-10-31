// ============================================================
//  Inventory Items – Types
//  Sinh từ docs/swagger.json (schema thật của BE, 2026-07-14)
// ============================================================

/** [Giới hạn tồn kho] Nhóm nhu cầu — khớp enum InventoryCategory phía BE */
export type InventoryCategory = 'Food' | 'Water' | 'Medicine' | 'Blanket' | 'Shelter' | 'Other'

export const INVENTORY_CATEGORIES: InventoryCategory[] =
  ['Food', 'Water', 'Medicine', 'Blanket', 'Shelter', 'Other']

/** Schema: InventoryItemResponse */
export interface InventoryItemResponse {
  id: string                 // GUID
  warehouseId: string        // GUID
  itemName: string | null
  category: InventoryCategory
  unit: string | null
  quantity: number
  minimumQuantity: number
  isLowStock: boolean
}

/** Schema: CreateInventoryItemCommand — body POST /inventory-items */
export interface CreateInventoryItemPayload {
  warehouseId: string
  itemName: string
  unit: string
  minimumQuantity: number
  /** Không truyền → BE mặc định "Other" */
  category?: InventoryCategory
}

/** Schema: UpdateInventoryItemRequest — body PUT /inventory-items/{id} (không đụng tồn) */
export interface UpdateInventoryItemPayload {
  itemName: string
  unit: string
  minimumQuantity: number
  category?: InventoryCategory
}

/** Schema: StockMoveCommand — body POST .../stock-in | .../stock-out */
export interface StockMovePayload {
  quantity: number
  referenceNo: string
  note: string
}

/** Schema: StockMoveResponse — tồn MỚI sau khi nhập/xuất */
export interface StockMoveResult {
  inventoryItemId: string
  quantity: number
  isLowStock: boolean
}

/** Schema: Create/Update InventoryItemResponse — result các action ghi */
export interface InventoryActionResult {
  id: string
  message: string | null
}

/** Schema: InventoryTransactionResponse */
export interface InventoryTransaction {
  id: string
  transactionType: string | null
  quantity: number
  referenceNo: string | null
  note: string | null
  createdAt: string
}

export interface InventorySummary {
  totalItems: number
  totalQuantity: number
  lowStockItems: number
  warehouses: number
}

export interface StockTransferPayload extends StockMovePayload {
  destinationWarehouseId: string
}

export interface StockTransferResult {
  inventoryItemId: string
  destinationInventoryItemId: string
  quantity: number
  destinationQuantity: number
  message: string
}
