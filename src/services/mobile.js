export function haptic(pattern = [30]) {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(pattern);
  }
}

export async function shareBooking({ reference, date, service, shopName = 'TROYA BARBER STUDIO' }) {
  const text = `¡Reserva confirmada en ${shopName}! 🎉\nServicio: ${service}\nFecha: ${date}\nRef: ${reference}`;
  const url = `${window.location.origin}/booking/status/${reference}`;

  if (navigator.share) {
    try {
      await navigator.share({ title: shopName, text, url });
      return true;
    } catch {
      return false;
    }
  }

  // Fallback: copy to clipboard
  try {
    await navigator.clipboard.writeText(`${text}\n${url}`);
    return 'copied';
  } catch {
    return false;
  }
}
