const DEV = import.meta.env.DEV;

const EVENTS = {
  BOOKING_STARTED:        'booking_started',
  BOOKING_SLOT_SELECTED:  'booking_slot_selected',
  BOOKING_CUSTOMER_FILLED:'booking_customer_filled',
  BOOKING_PAYMENT_SHOWN:  'booking_payment_shown',
  BOOKING_CREATED:        'booking_created',
  RESCHEDULE_STARTED:     'reschedule_started',
  RESCHEDULE_SLOT_SELECTED:'reschedule_slot_selected',
  RESCHEDULE_CONFIRMED:   'reschedule_confirmed',
};

function track(event, props = {}) {
  const payload = { event, ts: new Date().toISOString(), ...props };

  if (DEV) {
    console.debug('[analytics]', event, props);
  }

  // Future: send to backend endpoint or third-party SDK here
  // fetch('/api/events', { method: 'POST', body: JSON.stringify(payload) })
}

export { EVENTS };
export default track;
