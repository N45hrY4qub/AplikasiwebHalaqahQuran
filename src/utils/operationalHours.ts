/**
 * UTILITY UNTUK PEMBATASAN JAM OPERASIONAL AKUN SISWA (WIB - Asia/Jakarta)
 * Konfigurasi terpusat untuk efisiensi kuota Firebase
 */

export const OPERATIONAL_CONFIG = {
  get OPEN_TIME(): string {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('app_open_time') || "17:00";
    }
    return "17:00";
  },
  set OPEN_TIME(val: string) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('app_open_time', val);
    }
  },
  get CLOSE_TIME(): string {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('app_close_time') || "20:00";
    }
    return "20:00";
  },
  set CLOSE_TIME(val: string) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('app_close_time', val);
    }
  },
  TIMEZONE: "Asia/Jakarta" // Waktu Indonesia Barat (WIB)
};

export interface WIBTimeInfo {
  hour: number;
  minute: number;
  second: number;
  formattedTime: string; // HH:mm:ss WIB
  formattedDate: string; // YYYY-MM-DD
}

/**
 * Mendapatkan informasi waktu saat ini di zona Asia/Jakarta (WIB)
 */
export function getWIBTime(): WIBTimeInfo {
  const date = new Date();
  
  // Format waktu
  const timeFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: OPERATIONAL_CONFIG.TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  });
  
  // Format tanggal
  const dateFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: OPERATIONAL_CONFIG.TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });

  let timeStr = timeFormatter.format(date);
  const dateStr = dateFormatter.format(date);

  // Parse jam, menit, detik
  let [hour, minute, second] = timeStr.split(":").map(Number);
  
  // SUPPORT SIMULATION OVERRIDE FOR DEV TESTING
  if (typeof window !== 'undefined') {
    let mockHourToUse: number | null = null;
    const mockMode = localStorage.getItem('mh_dev_mock_mode');
    
    if (mockMode) {
      if (mockMode === 'open') {
        const saved = localStorage.getItem('mh_dev_mock_open_hour');
        mockHourToUse = saved ? parseInt(saved, 10) : 18;
      } else if (mockMode === 'before_open') {
        const saved = localStorage.getItem('mh_dev_mock_before_open_hour');
        mockHourToUse = saved ? parseInt(saved, 10) : 14;
      } else if (mockMode === 'after_close') {
        const saved = localStorage.getItem('mh_dev_mock_after_close_hour');
        mockHourToUse = saved ? parseInt(saved, 10) : 21;
      }
    } else {
      const mockHourStr = localStorage.getItem('mh_dev_mock_hour');
      if (mockHourStr !== null) {
        mockHourToUse = parseInt(mockHourStr, 10);
      }
    }

    if (mockHourToUse !== null && !isNaN(mockHourToUse) && mockHourToUse >= 0 && mockHourToUse <= 23) {
      hour = mockHourToUse;
      timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`;
    }
  }
  
  // Ubah format tanggal MM/DD/YYYY ke YYYY-MM-DD
  const [month, day, year] = dateStr.split("/");
  const formattedDate = `${year}-${month}-${day}`;

  return {
    hour,
    minute,
    second,
    formattedTime: `${timeStr} WIB`,
    formattedDate
  };
}

/**
 * Mengecek apakah waktu WIB saat ini berada di dalam jam operasional (17:00 s.d. 20:00 WIB)
 */
export function isWithinOperationalHours(): boolean {
  const wib = getWIBTime();
  const currentMinutes = wib.hour * 60 + wib.minute;
  
  const [openHour, openMinute] = OPERATIONAL_CONFIG.OPEN_TIME.split(":").map(Number);
  const [closeHour, closeMinute] = OPERATIONAL_CONFIG.CLOSE_TIME.split(":").map(Number);
  
  const startMinutes = openHour * 60 + openMinute;
  const endMinutes = closeHour * 60 + closeMinute;
  
  return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
}

/**
 * Mendapatkan status operasional untuk Siswa
 */
export function getOperationalStatus() {
  const wib = getWIBTime();
  const isOpen = isWithinOperationalHours();
  
  return {
    isOpen,
    currentWIB: wib.formattedTime,
    openTimeStr: `${OPERATIONAL_CONFIG.OPEN_TIME} WIB`,
    closeTimeStr: `${OPERATIONAL_CONFIG.CLOSE_TIME} WIB`,
    statusText: isOpen ? "AKSES ONLINE DIIZINKAN" : "AKSES ONLINE DITUTUP",
    nextOpenText: `Akses akan dibuka kembali pukul ${OPERATIONAL_CONFIG.OPEN_TIME} WIB`
  };
}
