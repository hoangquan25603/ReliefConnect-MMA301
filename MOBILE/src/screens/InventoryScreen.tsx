import React, { useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useApp } from "../state/AppContext";
import { items } from "../lib/api";
import {
  Button,
  Card,
  Empty,
  Field,
  Heading,
  Notice,
  Screen,
  Select,
  confirmAction,
  palette,
  styles,
} from "../components/ui";

type Warehouse = {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  contactPhone: string;
  isActive: boolean;
};
type Stock = {
  id: string;
  warehouseId: string;
  itemName: string;
  category: string;
  unit: string;
  quantity: number;
  minimumQuantity: number;
  isLowStock: boolean;
};
type Summary = {
  totalItems: number;
  lowStockItems: number;
  totalQuantity: number;
  warehouses: number;
};
type Transaction = {
  id: string;
  transactionType: string;
  quantity: number;
  referenceNo?: string;
  note?: string;
  createdAt: string;
};
type Page<T> = { items: T[]; totalPages: number; totalCount: number };
const categories = [
  { value: "Food", label: "Lương thực" },
  { value: "Water", label: "Nước sạch" },
  { value: "Medicine", label: "Y tế" },
  { value: "Blanket", label: "Chăn màn" },
  { value: "Shelter", label: "Lều / nơi trú" },
  { value: "Other", label: "Khác" },
];
const stockBlank = {
  itemName: "",
  unit: "",
  category: "Other",
  minimumQuantity: "0",
};
const warehouseBlank = {
  name: "",
  address: "",
  latitude: "",
  longitude: "",
  contactPhone: "",
  isActive: true,
};
const number = (value: number) => value.toLocaleString("vi-VN");

export default function InventoryScreen() {
  const { api, user } = useApp();
  const canManage = ["Admin", "Coordinator"].includes(user?.role ?? "");
  const [tab, setTab] = useState("stock");
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [warehouseId, setWarehouseId] = useState("");
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [lowOnly, setLowOnly] = useState("all");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const generation = useRef(0);
  const mounted = useRef(true);
  const [editor, setEditor] = useState<
    "item" | "warehouse" | "in" | "out" | "transfer" | "history" | null
  >(null);
  const [target, setTarget] = useState<Stock | null>(null);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(
    null,
  );
  const [itemForm, setItemForm] = useState(stockBlank);
  const [warehouseForm, setWarehouseForm] = useState(warehouseBlank);
  const [quantity, setQuantity] = useState("");
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const [destination, setDestination] = useState("");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyPages, setHistoryPages] = useState(1);
  const selectedWarehouse = warehouses.find(
    (w) => String(w.id) === warehouseId,
  );
  const destinations = warehouses.filter(
    (w) => w.isActive && String(w.id) !== warehouseId,
  );
  const mutable = canManage && !!selectedWarehouse?.isActive;

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      generation.current++;
    };
  }, []);
  const loadWarehouses = useCallback(async () => {
    const first = await api<Page<Warehouse>>(
      "/warehouses?PageNumber=1&PageSize=100",
    );
    const all = [...items<Warehouse>(first)];
    for (let p = 2; p <= (first.totalPages || 1); p++)
      all.push(
        ...items<Warehouse>(
          await api(`/warehouses?PageNumber=${p}&PageSize=100`),
        ),
      );
    if (!mounted.current) return;
    setWarehouses(all);
    setWarehouseId((current) =>
      all.some((w) => String(w.id) === current)
        ? current
        : String(all.find((w) => w.isActive)?.id ?? all[0]?.id ?? ""),
    );
  }, [api]);

  const loadStock = useCallback(async () => {
    if (!warehouseId) {
      setStocks([]);
      setSummary(null);
      return;
    }
    const epoch = ++generation.current;
    setLoading(true);
    setError("");
    try {
      const query = `WarehouseId=${encodeURIComponent(warehouseId)}&PageNumber=${page}&PageSize=20&Search=${encodeURIComponent(appliedSearch)}&LowStockOnly=${lowOnly === "low"}`;
      const [data, totals] = await Promise.all([
        api<Page<Stock>>(`/inventory-items?${query}`),
        api<Summary>(
          `/inventory-items/summary?WarehouseId=${encodeURIComponent(warehouseId)}`,
        ),
      ]);
      if (epoch !== generation.current || !mounted.current) return;
      setStocks(items<Stock>(data));
      setPages(Math.max(1, data.totalPages || 1));
      setSummary(totals);
    } catch (e) {
      if (epoch === generation.current && mounted.current)
        setError((e as Error).message);
    } finally {
      if (epoch === generation.current && mounted.current) setLoading(false);
    }
  }, [api, warehouseId, page, appliedSearch, lowOnly]);
  useEffect(() => {
    setLoading(true);
    loadWarehouses()
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [loadWarehouses]);
  useEffect(() => {
    void loadStock();
  }, [loadStock]);
  async function refresh() {
    setLoading(true);
    setError("");
    try {
      await loadWarehouses();
      await loadStock();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }
  function chooseWarehouse(value: string) {
    if (value === warehouseId) return;
    setWarehouseId(value);
    setPage(1);
    setSummary(null);
    setStocks([]);
    setMessage("");
    setEditor(null);
  }
  function closeEditor() {
    if (!busy) {
      setEditor(null);
      setError("");
    }
  }
  function openItem(item: Stock | null) {
    setTarget(item);
    setItemForm(
      item
        ? {
            itemName: item.itemName,
            unit: item.unit,
            category: item.category,
            minimumQuantity: String(item.minimumQuantity),
          }
        : stockBlank,
    );
    setError("");
    setMessage("");
    setEditor("item");
  }
  function openWarehouse(warehouse: Warehouse | null) {
    setEditingWarehouse(warehouse);
    setWarehouseForm(
      warehouse
        ? {
            name: warehouse.name,
            address: warehouse.address,
            latitude: String(warehouse.latitude),
            longitude: String(warehouse.longitude),
            contactPhone: warehouse.contactPhone,
            isActive: warehouse.isActive,
          }
        : warehouseBlank,
    );
    setError("");
    setMessage("");
    setEditor("warehouse");
  }
  function openMove(item: Stock, kind: "in" | "out" | "transfer") {
    setTarget(item);
    setEditor(kind);
    setQuantity("");
    setReference("");
    setNote("");
    setDestination("");
    setError("");
    setMessage("");
  }
  async function saveItem() {
    if (busy) return;
    setError("");
    const min = Number(itemForm.minimumQuantity);
    if (
      !itemForm.itemName.trim() ||
      !itemForm.unit.trim() ||
      !itemForm.minimumQuantity.trim() ||
      !Number.isInteger(min) ||
      min < 0 ||
      min > 1000000000
    ) {
      setError("Nhập tên, đơn vị và ngưỡng tồn là số nguyên không âm.");
      return;
    }
    setBusy(true);
    try {
      await api(target ? `/inventory-items/${target.id}` : "/inventory-items", {
        method: target ? "PUT" : "POST",
        body: {
          ...itemForm,
          itemName: itemForm.itemName.trim(),
          unit: itemForm.unit.trim(),
          minimumQuantity: min,
          ...(!target ? { warehouseId } : {}),
        },
      });
      setEditor(null);
      setMessage(
        target
          ? "Đã cập nhật vật tư."
          : "Đã tạo vật tư. Nhập kho để bổ sung tồn.",
      );
      await loadStock();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function saveWarehouse() {
    if (busy) return;
    setError("");
    const lat = Number(warehouseForm.latitude),
      lng = Number(warehouseForm.longitude);
    if (
      !warehouseForm.name.trim() ||
      !warehouseForm.address.trim() ||
      !warehouseForm.contactPhone.trim() ||
      !warehouseForm.latitude.trim() ||
      !warehouseForm.longitude.trim() ||
      !Number.isFinite(lat) ||
      lat < -90 ||
      lat > 90 ||
      !Number.isFinite(lng) ||
      lng < -180 ||
      lng > 180
    ) {
      setError(
        "Điền tên, địa chỉ, điện thoại và tọa độ hợp lệ (vĩ độ -90…90, kinh độ -180…180).",
      );
      return;
    }
    setBusy(true);
    try {
      await api(
        editingWarehouse ? `/warehouses/${editingWarehouse.id}` : "/warehouses",
        {
          method: editingWarehouse ? "PUT" : "POST",
          body: {
            ...warehouseForm,
            name: warehouseForm.name.trim(),
            address: warehouseForm.address.trim(),
            contactPhone: warehouseForm.contactPhone.trim(),
            latitude: lat,
            longitude: lng,
          },
        },
      );
      setEditor(null);
      setMessage("Đã lưu kho hàng.");
      await loadWarehouses();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function deactivate(warehouse: Warehouse) {
    setBusy(true);
    setError("");
    try {
      await api(`/warehouses/${warehouse.id}`, { method: "DELETE" });
      setMessage("Đã ngưng hoạt động kho.");
      await loadWarehouses();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function submitMove() {
    if (!target || busy) return;
    setError("");
    const q = Number(quantity);
    if (!quantity.trim() || !Number.isInteger(q) || q <= 0 || q > 1000000000) {
      setError("Số lượng phải là số nguyên từ 1 đến 1.000.000.000.");
      return;
    }
    if (editor !== "in" && q > target.quantity) {
      setError("Số lượng vượt quá tồn kho hiện tại.");
      return;
    }
    if (
      editor === "transfer" &&
      !destinations.some((w) => String(w.id) === destination)
    ) {
      setError("Chọn kho nhận đang hoạt động.");
      return;
    }
    const action =
      editor === "transfer"
        ? "transfer"
        : editor === "in"
          ? "stock-in"
          : "stock-out";
    setBusy(true);
    try {
      await api(`/inventory-items/${target.id}/${action}`, {
        method: "POST",
        body: {
          quantity: q,
          referenceNo: reference.trim(),
          note: note.trim(),
          ...(editor === "transfer"
            ? { destinationWarehouseId: destination }
            : {}),
        },
      });
      setEditor(null);
      setMessage(
        action === "transfer"
          ? "Chuyển kho thành công; đã cập nhật cả hai kho."
          : action === "stock-in"
            ? "Nhập kho thành công."
            : "Xuất kho thành công.",
      );
      await loadStock();
    } catch (e) {
      await loadStock();
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function loadHistory(item: Stock, p = 1) {
    setTarget(item);
    setEditor("history");
    setBusy(true);
    setError("");
    setHistoryPage(p);
    try {
      const data = await api<Page<Transaction>>(
        `/inventory-items/${item.id}/transactions?PageNumber=${p}&PageSize=20`,
      );
      setTransactions(items<Transaction>(data));
      setHistoryPages(Math.max(1, data.totalPages || 1));
    } catch (e) {
      setTransactions([]);
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (editor)
    return (
      <Screen>
        <Heading
          title={
            editor === "item"
              ? target
                ? "Sửa vật tư"
                : "Thêm vật tư"
              : editor === "warehouse"
                ? editingWarehouse
                  ? "Sửa kho"
                  : "Tạo kho"
                : editor === "history"
                  ? "Lịch sử giao dịch"
                  : editor === "transfer"
                    ? "Chuyển kho"
                    : editor === "in"
                      ? "Nhập kho"
                      : "Xuất kho"
          }
          subtitle={target?.itemName}
        />
        <Button
          title="← Quay lại danh sách"
          variant="secondary"
          onPress={closeEditor}
          disabled={busy}
        />
        <Notice text={error} error />
        {editor === "item" && (
          <Card>
            <Field
              label="Tên vật tư"
              value={itemForm.itemName}
              onChangeText={(v) => setItemForm((p) => ({ ...p, itemName: v }))}
              maxLength={100}
            />
            <Select
              label="Nhóm vật tư"
              value={itemForm.category}
              options={categories}
              onChange={(v) => setItemForm((p) => ({ ...p, category: v }))}
            />
            <Field
              label="Đơn vị (kg, chai, hộp…)"
              value={itemForm.unit}
              onChangeText={(v) => setItemForm((p) => ({ ...p, unit: v }))}
              maxLength={30}
            />
            <Field
              label="Tồn tối thiểu"
              value={itemForm.minimumQuantity}
              onChangeText={(v) =>
                setItemForm((p) => ({ ...p, minimumQuantity: v }))
              }
              keyboardType="number-pad"
            />
            <Text style={styles.muted}>
              Tồn kho chỉ thay đổi qua nhập, xuất, chuyển kho và tiếp nhận quyên
              góp.
            </Text>
            <Button title="Lưu vật tư" onPress={saveItem} loading={busy} />
          </Card>
        )}
        {editor === "warehouse" && (
          <Card>
            <Field
              label="Tên kho"
              value={warehouseForm.name}
              onChangeText={(v) => setWarehouseForm((p) => ({ ...p, name: v }))}
              maxLength={100}
            />
            <Field
              label="Địa chỉ"
              value={warehouseForm.address}
              onChangeText={(v) =>
                setWarehouseForm((p) => ({ ...p, address: v }))
              }
              maxLength={255}
            />
            <Field
              label="Điện thoại"
              value={warehouseForm.contactPhone}
              onChangeText={(v) =>
                setWarehouseForm((p) => ({ ...p, contactPhone: v }))
              }
              keyboardType="phone-pad"
            />
            <Field
              label="Vĩ độ"
              value={warehouseForm.latitude}
              onChangeText={(v) =>
                setWarehouseForm((p) => ({ ...p, latitude: v }))
              }
              keyboardType="numbers-and-punctuation"
            />
            <Field
              label="Kinh độ"
              value={warehouseForm.longitude}
              onChangeText={(v) =>
                setWarehouseForm((p) => ({ ...p, longitude: v }))
              }
              keyboardType="numbers-and-punctuation"
            />
            {editingWarehouse && (
              <Select
                label="Hoạt động"
                value={warehouseForm.isActive ? "active" : "inactive"}
                options={[
                  { value: "active", label: "Đang hoạt động" },
                  { value: "inactive", label: "Tạm ngưng" },
                ]}
                onChange={(v) =>
                  setWarehouseForm((p) => ({ ...p, isActive: v === "active" }))
                }
              />
            )}
            <Button title="Lưu kho" onPress={saveWarehouse} loading={busy} />
          </Card>
        )}
        {["in", "out", "transfer"].includes(editor) && target && (
          <Card>
            <Text style={local.stockValue}>
              Tồn: {number(target.quantity)} {target.unit}
            </Text>
            {editor === "transfer" && (
              <>
                <Select
                  label="Kho nhận"
                  value={destination}
                  options={destinations.map((w) => ({
                    label: w.name,
                    value: String(w.id),
                  }))}
                  onChange={setDestination}
                />
                <Text style={styles.muted}>
                  Vật tư sẽ được trừ ở kho gửi và cộng vào kho nhận trong cùng
                  một giao dịch.
                </Text>
              </>
            )}
            <Field
              label="Số lượng"
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="number-pad"
            />
            <Field
              label="Mã chứng từ / tham chiếu"
              value={reference}
              onChangeText={setReference}
              maxLength={100}
            />
            <Field
              label="Ghi chú"
              value={note}
              onChangeText={setNote}
              multiline
              maxLength={1000}
            />
            <Button
              title={
                editor === "transfer"
                  ? "Xác nhận chuyển kho"
                  : editor === "in"
                    ? "Xác nhận nhập kho"
                    : "Xác nhận xuất kho"
              }
              onPress={submitMove}
              loading={busy}
              variant={editor === "out" ? "danger" : "primary"}
            />
          </Card>
        )}
        {editor === "history" && (
          <>
            {busy ? (
              <Empty text="Đang tải lịch sử…" />
            ) : transactions.length === 0 ? (
              <Empty
                text={error ? "Không tải được lịch sử." : "Chưa có giao dịch."}
              />
            ) : (
              transactions.map((tx) => {
                const kind = (tx.transactionType || "").toLowerCase();
                const inbound = kind.includes("in");
                const label = kind.includes("transfer")
                  ? inbound
                    ? "Nhận chuyển kho"
                    : "Chuyển sang kho khác"
                  : inbound
                    ? "Nhập kho"
                    : "Xuất kho";
                return (
                  <Card key={String(tx.id)}>
                    <View style={local.row}>
                      <Text style={local.title}>{label}</Text>
                      <Text
                        style={[
                          local.stockValue,
                          { color: inbound ? palette.green : palette.red },
                        ]}
                      >
                        {inbound ? "+" : "−"}
                        {number(tx.quantity)} {target?.unit}
                      </Text>
                    </View>
                    <Text style={styles.muted}>
                      {new Date(tx.createdAt).toLocaleString("vi-VN")}
                    </Text>
                    {tx.referenceNo && (
                      <Text style={styles.muted}>
                        Chứng từ: {tx.referenceNo}
                      </Text>
                    )}
                    {tx.note && <Text style={styles.muted}>{tx.note}</Text>}
                  </Card>
                );
              })
            )}
            {error && target && (
              <Button
                title="Thử tải lại"
                onPress={() => loadHistory(target, historyPage)}
                loading={busy}
              />
            )}
            <Text style={styles.muted}>
              Trang {historyPage}/{historyPages}
            </Text>
            <View style={local.row}>
              <View style={local.flex}>
                <Button
                  title="Trang trước"
                  variant="secondary"
                  disabled={historyPage <= 1 || busy}
                  onPress={() => target && loadHistory(target, historyPage - 1)}
                />
              </View>
              <View style={local.flex}>
                <Button
                  title="Trang sau"
                  variant="secondary"
                  disabled={historyPage >= historyPages || busy}
                  onPress={() => target && loadHistory(target, historyPage + 1)}
                />
              </View>
            </View>
          </>
        )}
      </Screen>
    );

  return (
    <Screen refreshing={loading} onRefresh={refresh}>
      <Heading
        title="Kho & vật tư"
        subtitle="Theo dõi tồn kho, giao dịch và nguồn lực cứu trợ."
      />
      <Select
        label="Danh mục"
        value={tab}
        options={[
          { value: "stock", label: "Vật tư & tồn kho" },
          { value: "warehouses", label: "Danh sách kho" },
        ]}
        onChange={(v) => {
          setTab(v);
          setMessage("");
        }}
      />
      <Notice text={error} error />
      <Notice text={message} />
      {!canManage && (
        <Text style={styles.muted}>
          Bạn có quyền xem. Quản trị viên và quản lý kho có thể thực hiện giao
          dịch.
        </Text>
      )}
      {tab === "warehouses" ? (
        <>
          {canManage && (
            <Button title="+ Tạo kho" onPress={() => openWarehouse(null)} />
          )}{" "}
          {!loading && !warehouses.length && (
            <Empty text="Chưa có kho. Tạo kho đầu tiên để quản lý vật tư." />
          )}
          {warehouses.map((w) => (
            <Card key={String(w.id)}>
              <Text style={local.title}>{w.name}</Text>
              <Text style={styles.muted}>{w.address}</Text>
              <Text style={styles.muted}>
                {w.contactPhone} ·{" "}
                {w.isActive ? "Đang hoạt động" : "Ngưng hoạt động"}
              </Text>
              <Button
                title="Xem tồn kho"
                variant="secondary"
                onPress={() => {
                  chooseWarehouse(String(w.id));
                  setTab("stock");
                }}
              />
              {canManage && (
                <>
                  <Button
                    title="Sửa thông tin kho"
                    variant="secondary"
                    onPress={() => openWarehouse(w)}
                  />
                  {w.isActive && (
                    <Button
                      title="Ngưng hoạt động kho"
                      variant="danger"
                      disabled={busy}
                      onPress={() =>
                        confirmAction(
                          `Ngưng hoạt động kho ${w.name}? Kho còn tồn có thể bị từ chối.`,
                          () => deactivate(w),
                        )
                      }
                    />
                  )}
                </>
              )}
            </Card>
          ))}
        </>
      ) : (
        <>
          {warehouses.length ? (
            <Select
              label="Chọn kho"
              value={warehouseId}
              options={warehouses.map((w) => ({
                value: String(w.id),
                label: w.name + (w.isActive ? "" : " · Tạm ngưng"),
              }))}
              onChange={chooseWarehouse}
            />
          ) : !loading ? (
            <Empty text="Chưa có kho. Mở Danh sách kho để tạo hoặc kiểm tra kết nối." />
          ) : null}
          {summary && (
            <View style={local.row}>
              <View style={local.metric}>
                <Text style={local.metricNumber}>
                  {number(summary.totalItems)}
                </Text>
                <Text style={styles.muted}>Loại vật tư</Text>
              </View>
              <View style={local.metric}>
                <Text style={[local.metricNumber, { color: palette.orange }]}>
                  {number(summary.lowStockItems)}
                </Text>
                <Text style={styles.muted}>Dưới mức tối thiểu</Text>
              </View>
            </View>
          )}
          {selectedWarehouse && !selectedWarehouse.isActive && (
            <Notice
              text="Kho đang ngưng hoạt động. Mở lại kho để thực hiện giao dịch."
              error
            />
          )}
          <Card>
            <Field
              label="Tìm tên vật tư"
              value={search}
              onChangeText={setSearch}
              placeholder="Gạo, nước uống…"
              returnKeyType="search"
              onSubmitEditing={() => {
                setAppliedSearch(search.trim());
                setPage(1);
              }}
            />
            <Select
              label="Hiển thị"
              value={lowOnly}
              options={[
                { value: "all", label: "Tất cả" },
                { value: "low", label: "Sắp hết" },
              ]}
              onChange={(v) => {
                setLowOnly(v);
                setPage(1);
              }}
            />
            <Button
              title="Tìm kiếm"
              variant="secondary"
              disabled={!warehouseId}
              onPress={() => {
                setAppliedSearch(search.trim());
                setPage(1);
              }}
            />
          </Card>
          {canManage && (
            <Button
              title="+ Thêm vật tư"
              disabled={!mutable}
              onPress={() => openItem(null)}
            />
          )}
          {!loading && stocks.length === 0 && warehouseId && (
            <Empty
              text={
                error
                  ? "Không tải được dữ liệu kho."
                  : "Không có vật tư phù hợp."
              }
            />
          )}
          {stocks.map((item) => (
            <Card key={String(item.id)}>
              <View style={local.row}>
                <Text style={[local.title, local.flex]}>{item.itemName}</Text>
                {item.isLowStock && <Text style={local.warning}>Sắp hết</Text>}
              </View>
              <Text style={styles.muted}>
                {categories.find((c) => c.value === item.category)?.label ??
                  item.category}
              </Text>
              <Text style={local.stockValue}>
                {number(item.quantity)} {item.unit}
              </Text>
              <Text style={styles.muted}>
                Tối thiểu: {number(item.minimumQuantity)} {item.unit}
              </Text>
              {canManage && (
                <>
                  <View style={local.row}>
                    <View style={local.flex}>
                      <Button
                        title="Nhập kho"
                        disabled={!mutable}
                        onPress={() => openMove(item, "in")}
                      />
                    </View>
                    <View style={local.flex}>
                      <Button
                        title="Xuất kho"
                        variant="secondary"
                        disabled={!mutable || item.quantity <= 0}
                        onPress={() => openMove(item, "out")}
                      />
                    </View>
                  </View>
                  <Button
                    title="Chuyển kho"
                    variant="secondary"
                    disabled={
                      !mutable || item.quantity <= 0 || !destinations.length
                    }
                    onPress={() => openMove(item, "transfer")}
                  />
                  <Button
                    title="Sửa vật tư"
                    variant="secondary"
                    disabled={!mutable}
                    onPress={() => openItem(item)}
                  />
                </>
              )}
              <Button
                title="Lịch sử giao dịch"
                variant="secondary"
                onPress={() => loadHistory(item)}
              />
            </Card>
          ))}
          {pages > 1 && (
            <>
              <Text style={styles.muted}>
                Trang {page}/{pages}
              </Text>
              <View style={local.row}>
                <View style={local.flex}>
                  <Button
                    title="Trang trước"
                    variant="secondary"
                    disabled={page <= 1 || loading}
                    onPress={() => setPage((p) => p - 1)}
                  />
                </View>
                <View style={local.flex}>
                  <Button
                    title="Trang sau"
                    variant="secondary"
                    disabled={page >= pages || loading}
                    onPress={() => setPage((p) => p + 1)}
                  />
                </View>
              </View>
            </>
          )}
        </>
      )}
      {error && (
        <Button
          title="Tải lại dữ liệu"
          variant="secondary"
          onPress={refresh}
          loading={loading}
        />
      )}
    </Screen>
  );
}

const local = StyleSheet.create({
  row: { flexDirection: "row", gap: 12, alignItems: "center" },
  flex: { flex: 1 },
  title: { fontSize: 17, fontWeight: "800", color: palette.navy },
  stockValue: { fontSize: 20, fontWeight: "800", color: palette.navy },
  warning: {
    color: palette.red,
    backgroundColor: "#FCEDEA",
    padding: 6,
    borderRadius: 8,
    fontSize: 12,
    fontWeight: "700",
  },
  metric: {
    flex: 1,
    backgroundColor: "white",
    padding: 18,
    borderRadius: 14,
    gap: 5,
    borderColor: palette.border,
    borderWidth: 1,
  },
  metricNumber: { fontSize: 27, color: palette.navy, fontWeight: "800" },
});
