// useDeviceId.native.ts
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

const DEVICE_ID_KEY = 'tobochat_device_id';
export const useDeviceId = () => {
  const [deviceId, setDeviceId] = useState<string | null>(null);

  useEffect(() => {
    const initDeviceId = async () => {
      try {
        let storedId = await AsyncStorage.getItem(DEVICE_ID_KEY);

        if (!storedId) {
          storedId = Crypto.randomUUID();
          await AsyncStorage.setItem(DEVICE_ID_KEY, storedId);
        }

        setDeviceId(storedId);
      } catch (error) {
        console.error('Lỗi khi khởi tạo Device ID:', error);
      }
    };

    initDeviceId();
  }, []);

  return deviceId;
};