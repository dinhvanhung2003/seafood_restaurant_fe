export function mapBackendCodeToVI(code?: any): string | null {
    if (!code) return null;
    const s = String(code);
    switch (s) {
        case "COMBO_IN_USE_BY_OPEN_ORDERS":
            return "Combo đang được sử dụng trên đơn hàng đang mở.";
        case "COMBO_NOT_FOUND":
            return "Combo không tồn tại.";
        case "COMBO_HIDDEN":
            return "Combo đã có liên quan trong thanh toán (hoá đơn), không thể xóa hoàn toàn — chỉ có thể ẩn.";
        case "COMBO_DELETED":
            return "Combo đã được xoá.";
        default:
            return null;
    }
}

export function getFriendlyMessageFromError(e: any): string {
    const resp = e?.response?.data ?? {};
    const candidate = resp.errorMessage ?? resp.code ?? resp.message ?? e?.message;
    const mapped = mapBackendCodeToVI(candidate);
    if (mapped) return mapped;
    // if candidate looks human (not ALL_CAPS codes), use it
    if (typeof candidate === "string" && !/^[A-Z0-9_]+$/.test(candidate)) return candidate;
    return "Có lỗi xảy ra";
}
