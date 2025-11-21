// src/lib/mapServerError.ts
// Central helper to map backend error responses to a friendly message and expose the raw code.
export default function mapServerError(err: any): { code?: string; message: string } {
  const resp = err?.response?.data ?? (typeof err === 'string' ? err : undefined);
  // Backend in this project returns: { success:false, code:400, message: 'SOME_CODE', errorMessage: false }
  const code = resp?.message ?? resp?.errorMessage ?? (typeof resp === 'string' ? resp : undefined);

  const map: Record<string, string> = {
    CATEGORY_NOT_FOUND: 'Không tìm thấy danh mục.',
    CATEGORY_NAME_DUPLICATED: 'Tên danh mục đã tồn tại, vui lòng chọn tên khác.',
    CATEGORY_IN_USE_BY_MENU_ITEMS: 'Danh mục đang được sử dụng bởi các món (menu). Không thể đổi loại hoặc tắt.',
    CATEGORY_IN_USE_BY_INVENTORY_ITEMS: 'Danh mục đang được sử dụng trong kho (inventory). Không thể đổi loại hoặc tắt.',
    INTERNAL_SERVER_ERROR: 'Lỗi hệ thống, vui lòng thử lại sau.',
  };

  if (typeof code === 'string' && map[code]) return { code, message: map[code] };
  if (typeof code === 'string') return { code, message: String(code) };
  if (resp && typeof resp === 'string') return { message: resp };
  if (err && err.message) return { message: String(err.message) };
  return { message: 'Có lỗi xảy ra' };
}
