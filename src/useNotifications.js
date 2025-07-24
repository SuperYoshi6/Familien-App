import { useState, useEffect, useCallback } from 'react';

export const useNotifications = () => {
  const [permission, setPermission] = useState(Notification.permission);

  const requestPermission = useCallback(() => {
    if (permission === 'granted') return;
    Notification.requestPermission().then(setPermission);
  }, [permission]);

  useEffect(() => {
    requestPermission();
  }, [requestPermission]);

  const sendNotification = useCallback((title, options) => {
    if (permission !== 'granted') return;
    new Notification(title, options);
  }, [permission]);

  return { sendNotification, requestPermission, permission };
};
