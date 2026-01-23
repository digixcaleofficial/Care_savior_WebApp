import { useEffect, useState } from 'react';
import axios from 'axios';

const NotificationPanel = () => {
  const [notifications, setNotifications] = useState([]);

  // Page load (Refresh) hone par DB se data lao
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        // Apni API call karo
        const res = await axios.get('/api/notifications/my-notifications', {
            headers: { Authorization: `Bearer ${token}` }
        });
        setNotifications(res.data);
      } catch (err) {
        console.log(err);
      }
    };

    fetchNotifications();
  }, []); // Empty dependency array = Runs once on mount

  return (
    <div>
      {notifications.map((notif) => (
        <div key={notif._id} style={{ opacity: notif.isRead ? 0.5 : 1 }}>
          <p>{notif.message}</p>
          <small>{new Date(notif.createdAt).toLocaleTimeString()}</small>
        </div>
      ))}
    </div>
  );
};