// রিয়েল-টাইম নোটিফিকেশন (ঐচ্ছিক সুবিধা)। সংযোগ না হলে কিছু ভাঙে না — অ্যাপ নিয়মিত পোলিং করে।
// socket.io-client দেরিতে লোড হয়, যাতে মূল বান্ডিল ছোট থাকে।
const apiBase = import.meta.env.VITE_API_URL || "/api";

function socketOrigin() {
  try {
    return /^https?:\/\//.test(apiBase)
      ? new URL(apiBase).origin
      : window.location.origin;
  } catch {
    return window.location.origin;
  }
}

export function connectNotificationSocket({ onNotification, onConnect }) {
  let socket = null;
  let stopped = false;

  import("socket.io-client")
    .then(({ io }) => {
      if (stopped) return;
      const sameOrigin = socketOrigin() === window.location.origin;
      socket = io(socketOrigin(), {
        withCredentials: true,
        transports: sameOrigin ? ["polling"] : ["websocket", "polling"],
        reconnectionAttempts: 10, // সার্ভারে সকেট না থাকলে অনন্তকাল চেষ্টা করে না
        reconnectionDelayMax: 30000,
      });
      socket.on("notification", onNotification);
      socket.on("connect", () => onConnect?.());
      socket.on("connect_error", () => {
        /* নীরবে উপেক্ষা: পোলিং আছে */
      });
    })
    .catch(() => {
      /* লাইব্রেরি লোড না হলেও সমস্যা নেই */
    });

  return () => {
    stopped = true;
    if (socket) {
      socket.off();
      socket.disconnect();
    }
  };
}
