import { useCallback } from 'react';

/**
 * Hook kustom untuk memutar suara.
 * @param soundSrc Sumber data audio (misalnya, string base64).
 * @param isMuted Apakah suara dimatikan atau tidak.
 * @param volume Volume pemutaran (0.0 hingga 1.0).
 * @returns Fungsi `play` yang dapat dipanggil untuk memutar suara.
 */
export const useSound = (soundSrc: string, isMuted: boolean, volume: number = 0.7) => {
  // useCallback memastikan fungsi 'play' tidak dibuat ulang pada setiap render,
  // kecuali jika soundSrc, volume, atau isMuted berubah.
  const play = useCallback(() => {
    if (isMuted) return; // Jangan putar suara jika dimatikan

    try {
      // Membuat instance Audio baru setiap kali diputar lebih andal untuk efek suara pendek
      // dan menghindari masalah tumpang tindih atau audio yang 'macet'.
      const audio = new Audio(soundSrc);
      audio.volume = volume;
      audio.play().catch(e => {
        // Gagal memutar suara sering terjadi karena kebijakan putar otomatis browser.
        // Kita catat errornya tapi tidak membuat aplikasi crash.
        console.error("Gagal memutar suara:", e);
      });
    } catch (e) {
      console.error("Gagal membuat objek Audio:", e);
    }
  }, [soundSrc, volume, isMuted]);

  return play;
};
