// src/lib/mapServerError.ts
// Central helper to map backend error responses to a friendly message and expose the raw code.
export default function mapServerError(err: any): { code?: string; message: string } {
  const resp = err?.response?.data ?? (typeof err === 'string' ? err : undefined);
  // Backend in this project returns: { success:false, code:400, message: 'SOME_CODE' | ['msg1', 'msg2'], errorMessage: false }
  let raw = resp?.message ?? resp?.errorMessage ?? (typeof resp === 'string' ? resp : undefined);
  // if backend returns an array of messages, pick the first
  if (Array.isArray(raw) && raw.length > 0) raw = raw[0];
  const code = raw;

  const map: Record<string, string> = {
    CATEGORY_NOT_FOUND: 'Không tìm thấy danh mục.',
    CATEGORY_NAME_DUPLICATED: 'Tên danh mục đã tồn tại, vui lòng chọn tên khác.',
    CATEGORY_IN_USE_BY_MENU_ITEMS: 'Danh mục đang được sử dụng bởi các món (menu). Không thể đổi loại hoặc tắt.',
    CATEGORY_IN_USE_BY_INVENTORY_ITEMS: 'Danh mục đang được sử dụng trong kho (inventory). Không thể đổi loại hoặc tắt.',
    INTERNAL_SERVER_ERROR: 'Lỗi hệ thống, vui lòng thử lại sau.',
    OVERPAY_NOT_ALLOWED: 'Số tiền đã trả không được lớn hơn số tiền phải trả.',

    COMBO_NAME_REQUIRED: 'Vui lòng nhập tên combo.',
    COMBO_NAME_DUPLICATED: 'Tên combo này đã tồn tại. Vui lòng đặt tên khác.',
    COMBO_PRICE_INVALID: 'Giá combo không hợp lệ (phải lớn hơn 0).',
    COMBO_COMPONENTS_REQUIRED: 'Combo phải có ít nhất 1 món thành phần.',
    COMBO_COMPONENT_DUPLICATE: 'Có món thành phần bị trùng lặp trong danh sách.',
    COMBO_COMPONENT_INVALID_QUANTITY: 'Số lượng thành phần không hợp lệ.',
    COMBO_IN_USE_BY_OPEN_ORDERS: 'Combo đang có đơn hàng chưa hoàn thành, không thể sửa đổi cấu trúc.',

  };

  if (typeof code === 'string' && map[code]) return { code, message: map[code] };
  // common backend validation message patterns -> translate to Vietnamese
  if (typeof code === 'string') {
    // items.0.quantity must not be less than 0.001
    const m = String(code).match(/items\.(\d+)\.quantity must not be less than ([0-9.]+)/i);
    if (m) {
      const idx = Number(m[1]) + 1;
      const min = m[2];
      return { code, message: `Số lượng dòng ${idx} phải lớn hơn hoặc bằng ${min}` };
    }
    return { code, message: String(code) };
  }
  if (resp && typeof resp === 'string') return { message: resp };
  if (err && err.message) return { message: String(err.message) };
  return { message: 'Có lỗi xảy ra' };
}
