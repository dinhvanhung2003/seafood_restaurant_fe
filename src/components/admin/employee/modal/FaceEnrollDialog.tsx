"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import Image from "next/image";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
import {
  useFaceSnapshots,
  useAdminFaceEnroll,
  useAdminFaceReset,
  useAdminDeleteSnapshot,
    useFaceStats,
} from "@/hooks/admin/useFaceSnapshots";

type Props = {
  userId?: string;
  userName?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function FaceEnrollDialog({
  userId,
  userName,
  open,
  onOpenChange,
}: Props) {
  const { toast } = useToast();

  // ảnh đã lưu
  const { data: snaps = [], isLoading, refetch } = useFaceSnapshots(userId);
const { data: stats } = useFaceStats(userId);

  // mutation
  const { mutateAsync: adminEnroll, isPending } = useAdminFaceEnroll();
  const { mutateAsync: resetFaces, isPending: resetting } = useAdminFaceReset();
  const { mutateAsync: deleteSnapshot, isPending: deleting } =
    useAdminDeleteSnapshot();

  // camera
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [capturedBase64, setCapturedBase64] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [startingCam, setStartingCam] = useState(false);

  const canSubmit = useMemo(
    () => !!userId && !!capturedBase64,
    [userId, capturedBase64],
  );

  // bật/tắt camera theo open
  useEffect(() => {
    if (open) {
      startCamera();
    } else {
      stopCamera();
      setPreviewUrl(null);
      setCapturedBase64(null);
      setCameraReady(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function startCamera() {
    if (startingCam) return;
    setStartingCam(true);
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        toast({ description: "Trình duyệt không hỗ trợ camera." });
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 640, height: 480 },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraReady(true);
      }
    } catch (e: any) {
      const msg = e?.message ?? "Không mở được camera.";
      toast({ description: msg });
    } finally {
      setStartingCam(false);
    }
  }

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }

  function handleCapture() {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const w = video.videoWidth || 640;
    const h = video.videoHeight || 480;

    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, w, h);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.75); // "data:image/jpeg;base64,xxx"
    const [, base64] = dataUrl.split(",");

    setPreviewUrl(dataUrl);
    setCapturedBase64(base64 ?? dataUrl); // gửi phần base64 cho backend
  }

  async function handleSubmit() {
    if (!userId || !capturedBase64) return;
    try {
      const res = await adminEnroll({ userId, imageBase64: capturedBase64 });
      const ok = (res.data as any)?.ok ?? false;

      if (!ok) {
        toast({ description: "AWS không nhận diện được khuôn mặt." });
        return;
      }

      toast({ description: "Đăng ký khuôn mặt thành công." });
      setCapturedBase64(null);
      // ảnh mới sẽ được refetch nhờ invalidate trong hook,
      // nhưng để chắc ăn có thể refetch lại:
      refetch();
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ??
        e?.message ??
        "Không thể đăng ký khuôn mặt.";
      toast({ description: String(msg) });
    }
  }

  async function handleResetAll() {
  if (!userId) return;
  if (!confirm("Xoá toàn bộ ảnh khuôn mặt của nhân viên này?")) return;

  try {
    await resetFaces(userId);              // gọi POST /face/admin/reset
    toast({ description: "Đã xoá toàn bộ ảnh khuôn mặt." });
    refetch();                            // reload snapshots
  } catch (e: any) {
    const msg =
      e?.response?.data?.message ??
      e?.message ??
      "Không thể xoá khuôn mặt.";
    toast({ description: String(msg) });
  }
}


  async function handleDeleteOne(snapshotId: string) {
    if (!userId) return;
    try {
      await deleteSnapshot({ userId, snapshotId });
      toast({ description: "Đã xoá ảnh." });
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ?? e?.message ?? "Không thể xoá ảnh.";
      toast({ description: String(msg) });
    }
  }

  function handleClose(v: boolean) {
    if (!v) {
      stopCamera();
      setPreviewUrl(null);
      setCapturedBase64(null);
      setCameraReady(false);
    }
    onOpenChange(v);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      {/* max-h + overflow-y làm responsive theo chiều dọc */}
      <DialogContent className="max-w-[min(100vw,900px)] max-h-[min(90vh,760px)] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Đăng ký khuôn mặt bằng camera</DialogTitle>
          <DialogDescription>
            Nhân viên:{" "}
            <span className="font-semibold">
              {userName ?? userId ?? "—"}
            </span>
          </DialogDescription>
        </DialogHeader>

        {/* Trên mobile: dọc, trên md: 2 cột */}
        <div className="mt-2 flex flex-col gap-6 md:grid md:grid-cols-[3fr,2fr]">
          {/* Cột trái: camera + preview */}
          <div className="space-y-3">
            <p className="text-sm text-slate-600">
              Hướng dẫn: yêu cầu nhân viên ngồi chính giữa, bỏ khẩu trang/kính
              râm, nhìn thẳng vào camera, đủ sáng.
            </p>

            <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-black">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline
                muted
              />
              {!cameraReady && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-white text-sm">
                  {startingCam ? "Đang mở camera…" : "Đang khởi tạo camera…"}
                </div>
              )}
            </div>

            <canvas ref={canvasRef} className="hidden" />

            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleCapture}
                disabled={!cameraReady || isPending}
              >
                Chụp
              </Button>
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={!canSubmit || isPending}
              >
                {isPending ? "Đang đăng ký..." : "Đăng ký khuôn mặt"}
              </Button>
            </div>

            {previewUrl && (
              <div>
                <p className="text-xs text-slate-500 mb-1">Ảnh đã chụp:</p>
                <div className="relative w-40 h-40 rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                  <Image
                    src={previewUrl}
                    alt="preview"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Cột phải: danh sách ảnh đã lưu */}
          <div className="flex flex-col h-full">
           <div className="flex items-center justify-between mb-2">
  <h3 className="font-medium text-sm">Ảnh đã lưu</h3>
  <div className="flex flex-col items-end gap-1">
    {/* Dòng count local */}
    <div className="flex items-center gap-2">
      <span className="text-xs text-slate-500">
        {isLoading ? "Đang tải…" : `${snaps.length} ảnh`}
      </span>

      {snaps.length > 0 && (
        <Button
          variant="outline"
          size="sm"
          className="h-7 px-2 text-[11px]"
          onClick={handleResetAll}
          disabled={resetting || deleting}
        >
          Xoá tất cả
        </Button>
      )}
    </div>

    {/* Dòng stat AWS */}
    {stats && (
      <span className="text-[11px] text-slate-500">
        AWS: {stats.awsFaces} face / Local: {stats.localSnapshots} ảnh
        {stats.awsFaces !== stats.localSnapshots && (
          <span className="ml-1 text-[11px] text-amber-600">
            (chênh lệch, nên bấm "Xoá tất cả" để reset)
          </span>
        )}
      </span>
    )}
  </div>
</div>


            {snaps.length === 0 && !isLoading && (
              <p className="text-sm text-slate-500">
                Chưa có ảnh nào. Hãy chụp và đăng ký khuôn mặt.
              </p>
            )}

           {snaps.length > 0 && (
  <div className="grid grid-cols-2 gap-3 max-h-[320px] md:max-h-[380px] overflow-y-auto pr-1">
    {snaps.map((s) => {
      const imgSrc = s.imageUrl.startsWith("http")
        ? s.imageUrl
        : `${API_BASE}${s.imageUrl}`;

      return (
        <div
          key={s.id}
          className="border border-slate-200 rounded-xl overflow-hidden relative"
        >
          <button
            type="button"
            className="absolute right-1 top-1 z-10 h-5 w-5 rounded-full bg-black/60 text-[11px] text-white flex items-center justify-center hover:bg-black/80"
            onClick={() => handleDeleteOne(s.id)}
            disabled={deleting}
          >
            ×
          </button>

          <div className="relative w-full aspect-[4/5] bg-slate-100">
            <Image
              src={imgSrc}
              alt="face"
              fill
              className="object-cover"
              unoptimized   // dev/local cho khỏe, khỏi cấu hình domain
            />
          </div>

          <div className="px-2 py-1 border-t border-slate-100">
            <p className="text-[11px] text-slate-500">
              {format(new Date(s.createdAt), "HH:mm dd/MM/yyyy", {
                locale: vi,
              })}
            </p>
          </div>
        </div>
      );
    })}
  </div>
)}


            <p className="text-[11px] text-slate-400 mt-3">
              Lưu ý: admin chỉ nên đăng ký hộ khi kiểm tra giấy tờ và nhân thân
              trực tiếp, tránh chụp từ ảnh giấy / điện thoại khác.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
