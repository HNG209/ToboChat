// useDeviceId.ts
import { useState, useEffect } from 'react';

const DEVICE_ID_KEY = 'tobochat_device_id';
export const useDeviceId = () => {
  // Khởi tạo null để đồng nhất type với Native
  const [deviceId, setDeviceId] = useState<string | null>(null);

  useEffect(() => {
    // Đảm bảo code chỉ chạy trên Client (tránh lỗi SSR của Next.js)
    if (typeof window !== 'undefined') {
      let storedId = localStorage.getItem(DEVICE_ID_KEY);

      if (!storedId) {
        // Tạo UUID mới nếu chưa có
        storedId = crypto.randomUUID();
        localStorage.setItem(DEVICE_ID_KEY, storedId);
      }

      setDeviceId(storedId);
    }
  }, []);

  return deviceId;
};