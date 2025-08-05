import { useState, useEffect, useCallback } from 'react';

interface LocationState {
  latitude: number;
  longitude: number;
}

interface UseGeolocationReturn {
  location: LocationState | null;
  permission: 'granted' | 'denied' | 'prompt' | null;
  isLoading: boolean;
  error: string | null;
  requestLocation: () => void;
}

export const useGeolocation = (): UseGeolocationReturn => {
  const [location, setLocation] = useState<LocationState | null>(null);
  const [permission, setPermission] = useState<'granted' | 'denied' | 'prompt' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setError('该浏览器不支持地理位置服务');
      setPermission('denied');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // 检查权限状态
      const permissionStatus = await navigator.permissions.query({ name: 'geolocation' });
      setPermission(permissionStatus.state as 'granted' | 'denied' | 'prompt');

      if (permissionStatus.state === 'denied') {
        setError('位置权限被拒绝');
        // 使用默认位置（北京市中心）
        setLocation({ latitude: 39.9042, longitude: 116.4074 });
        return;
      }

      // 获取当前位置
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 10000,
          enableHighAccuracy: true,
          maximumAge: 300000, // 5分钟缓存
        });
      });

      setLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      });
      setPermission('granted');

    } catch (err) {
      console.warn('获取位置失败:', err);
      setError('获取位置失败');
      setPermission('denied');
      
      // 使用默认位置（北京市中心）
      setLocation({ latitude: 39.9042, longitude: 116.4074 });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 自动请求位置权限（仅在组件挂载时）
  useEffect(() => {
    // 仅在初次挂载时请求位置，避免循环依赖
    if (navigator.geolocation) {
      requestLocation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 空依赖数组，仅在组件挂载时执行一次

  return {
    location,
    permission,
    isLoading,
    error,
    requestLocation
  };
};