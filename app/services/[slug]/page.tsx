'use client';

import React, { use, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useStore } from '@/components/shared/StoreProvider';
import { createClient } from '@/lib/supabase/client';
import { formatPHP } from '@/lib/utils/format';
import { ServiceBooking } from '@/types/database';
import { Check, CheckCircle2, Clock } from 'lucide-react';

function getManilaTomorrow(): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date());
  const base = `${parts.find(p => p.type === 'year')?.value}-${parts.find(p => p.type === 'month')?.value}-${parts.find(p => p.type === 'day')?.value}`;
  const tomorrow = new Date(`${base}T00:00:00+08:00`);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit' }).format(tomorrow);
}

export default function ServiceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const { services, createServiceBooking, customerVehicles, user } = useStore();
  const service = services.find((s) => s.slug === slug);

  const [customerName, setCustomerName] = useState(user?.name || '');
  const [customerEmail, setCustomerEmail] = useState(user?.email || '');
  const [customerPhone, setCustomerPhone] = useState(user?.phone || '');
  const [vehicleDetails, setVehicleDetails] = useState(user?.garage_vehicle || '');
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [slots, setSlots] = useState<Array<{id:string;branch_id:string;start_time:string;end_time:string;capacity:number;branch_name:string}>>([]);
  const [selectedSlotId, setSelectedSlotId] = useState('');
  const [preferredDate, setPreferredDate] = useState(getManilaTomorrow);
  const [preferredTime, setPreferredTime] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmedBooking, setConfirmedBooking] =
    useState<ServiceBooking | null>(null);
  useEffect(() => {
    if (!selectedVehicleId) return;
    const selected = customerVehicles.find((vehicle) => vehicle.id === selectedVehicleId);
    if (selected) {
      setVehicleDetails([selected.make_name, selected.model_name, selected.variant_name].filter(Boolean).join(' '));
    }
  }, [customerVehicles, selectedVehicleId]);

  useEffect(() => {
    const c = createClient();
    if (!c || !service) return;
    void c.from('service_slots')
      .select('id,branch_id,start_time,end_time,capacity,branches(name)')
      .eq('service_id', service.id)
      .eq('is_available', true)
      .gte('start_time', new Date().toISOString())
      .order('start_time')
      .limit(100)
      .then(({ data }) => {
        const next = (data || []).map((row:any) => ({
          id: row.id,
          branch_id: row.branch_id,
          start_time: row.start_time,
          end_time: row.end_time,
          capacity: row.capacity,
          branch_name: row.branches?.name || 'Branch',
        }));
        setSlots(next);
        if (next[0]) {
          setSelectedSlotId(next[0].id);
          setPreferredDate(new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Manila'}).format(new Date(next[0].start_time)));
          setPreferredTime(new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Manila',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(next[0].start_time)));
        }
      });
  }, [service]);


  if (!service) {
    return (
      <div className="max-w-[1360px] mx-auto px-4 sm:px-8 py-20 text-center space-y-4">
        <h1 className="font-display text-3xl font-bold text-[#141413]">
          Service Package Not Found
        </h1>
        <Link
          href="/services"
          className="inline-block px-6 py-2.5 bg-[#141413] text-white text-xs font-semibold rounded-lg"
        >
          Browse All Services
        </Link>
      </div>
    );
  }

  const handleBookService = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!customerName.trim()) errs.name = 'Full name is required.';
    if (!customerEmail.trim() || !customerEmail.includes('@')) errs.email = 'Valid email is required.';
    if (!customerPhone.trim()) errs.phone = 'Mobile number is required.';
    if (!selectedVehicleId && !vehicleDetails.trim()) errs.vehicle = 'Select a saved vehicle or enter your vehicle details.';
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    if (!user) { setErrors({ submit: 'Please sign in before booking a service.' }); return; }
    try {
      const selectedSlot = slots.find((slot) => slot.id === selectedSlotId);
      const scheduled = new Date(preferredDate + 'T' + preferredTime + ':00+08:00');
      if (Number.isNaN(scheduled.getTime())) {
        setErrors({ submit: 'Choose a valid appointment date and time.' });
        return;
      }
      const booking = await createServiceBooking({ service_id: service.id, branch_id: selectedSlot?.branch_id, customer_vehicle_id: selectedVehicleId || undefined, scheduled_start: scheduled.toISOString(), notes: [vehicleDetails.trim(), notes.trim()].filter(Boolean).join(' — ') });
      setErrors({});
      setConfirmedBooking({ ...booking, service_id: service.id, created_at: new Date().toISOString(), booking_reference: booking.appointment_number, service_slug: service.slug, service_name: service.name, service_price: service.price, user_id: user.id, customer_name: customerName.trim(), customer_email: customerEmail.trim(), customer_phone: customerPhone.trim(), vehicle_details: vehicleDetails.trim(), preferred_date: preferredDate, preferred_time: preferredTime, notes: notes.trim() || undefined } as ServiceBooking);
    } catch (error) { setErrors({ submit: error instanceof Error ? error.message : 'Unable to book this service.' }); }
  };

  if (confirmedBooking) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-8 py-16">
        <div className="bg-white border border-[#E5E5E0] rounded-xl p-8 sm:p-10 text-center space-y-6">
          <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="space-y-2">
            <h1 className="font-display text-3xl font-bold text-[#141413]">
              Service Appointment Request Submitted
            </h1>
            <p className="text-sm text-[#6E6E68]">
              Your booking request was submitted and is currently pending confirmation.
            </p>
          </div>

          <div className="p-5 bg-[#FAF9F6] border border-[#E5E5E0] rounded-lg space-y-2 text-left text-xs">
            <div className="flex justify-between">
              <span className="text-[#6E6E68]">Booking Reference</span>
              <span className="font-mono font-bold text-[#141413] text-sm">
                #{confirmedBooking.booking_reference}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6E6E68]">Service Package</span>
              <span className="font-semibold text-[#141413]">
                {confirmedBooking.service_name}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6E6E68]">Date & Time Slot</span>
              <span className="font-mono font-semibold text-[#141413]">
                {confirmedBooking.preferred_date} ·{' '}
                {confirmedBooking.preferred_time}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6E6E68]">Vehicle</span>
              <span className="font-semibold text-[#141413]">
                {confirmedBooking.vehicle_details}
              </span>
            </div>
            <div className="pt-2 border-t border-[#E5E5E0] flex justify-between text-sm font-bold text-[#141413]">
              <span>Service Package Price</span>
              <span className="font-mono tabular-nums">
                {formatPHP(confirmedBooking.service_price)}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/orders"
              className="px-6 py-2.5 bg-[#141413] text-white text-xs font-semibold rounded-lg"
            >
              View My Service Bookings
            </Link>
            <Link
              href="/parts"
              className="px-6 py-2.5 bg-[#FAF9F6] border border-[#E5E5E0] text-[#141413] text-xs font-semibold rounded-lg"
            >
              Browse Car Parts
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1360px] mx-auto px-4 sm:px-8 py-10 space-y-10">
      <nav className="flex items-center gap-2 text-xs text-[#6E6E68]">
        <Link href="/" className="hover:text-[#141413]">
          Home
        </Link>
        <span>/</span>
        <Link href="/services" className="hover:text-[#141413]">
          Services
        </Link>
        <span>/</span>
        <span className="text-[#141413] font-medium truncate max-w-xs">
          {service.service_code}
        </span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Service Details Left Column */}
        <div className="lg:col-span-7 space-y-8">
          <div className="relative aspect-[16/9] w-full bg-[#141413] rounded-xl overflow-hidden border border-[#E5E5E0]">
            <Image
              src={service.image_url}
              alt={service.name}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 60vw"
              referrerPolicy="no-referrer"
              className="object-cover"
            />
          </div>

          <div className="bg-white border border-[#E5E5E0] rounded-xl p-6 sm:p-8 space-y-6">
            <div className="space-y-2 border-b border-[#E5E5E0] pb-5">
              <div className="flex items-center justify-between text-xs text-[#6E6E68] tabular-nums">
                <span>
                  {service.category} · Code: {service.service_code}
                </span>
                <span className="text-emerald-700 font-semibold">
                  {service.availability}
                </span>
              </div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#141413]">
                {service.name}
              </h1>
              <div className="flex items-center gap-4 text-xs text-[#52524E] pt-1">
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  Estimated Duration: {service.duration_label}
                </span>
                <span>·</span>
                <span>Interval: {service.recommended_interval}</span>
              </div>
            </div>

            <div className="space-y-3">
              <h2 className="font-display text-lg font-bold text-[#141413]">
                Service Description
              </h2>
              <p className="text-sm sm:text-base text-[#52524E] leading-relaxed">
                {service.description}
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <h2 className="font-display text-lg font-bold text-[#141413]">
                Included Workshop Operations
              </h2>
              <ul className="space-y-2.5 text-sm text-[#141413]">
                {service.included_operations.map((op) => (
                  <li key={op} className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                    <span>{op}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Service Appointment Booking Form Right Column */}
        <aside className="lg:col-span-5 lg:sticky lg:top-24">
          {errors.submit && <p className="text-xs text-red-700">{errors.submit}</p>}
          <form
            onSubmit={handleBookService}
            noValidate
            className="bg-white border border-[#E5E5E0] rounded-xl p-6 sm:p-7 space-y-5"
          >
            <div className="space-y-1 border-b border-[#E5E5E0] pb-4">
              <p className="text-xs text-[#6E6E68]">Service Package Rate</p>
              <p className="text-2xl sm:text-3xl font-bold text-[#141413] font-mono tabular-nums">
                {formatPHP(service.price)}
              </p>
              <p className="text-xs text-[#6E6E68]">
                Includes labor, diagnostic scan & workshop consumables
              </p>
            </div>

            <h2 className="font-display text-lg font-bold text-[#141413]">
              Request / Book Service Appointment
            </h2>

            <div className="space-y-4">
              {slots.length > 0 ? (
                <div>
                  <label htmlFor="sb-slot" className="block text-xs font-semibold text-[#141413] mb-1">Available Service Slot</label>
                  <select
                    id="sb-slot"
                    required
                    value={selectedSlotId}
                    onChange={(e) => {
                      const slot = slots.find((item) => item.id === e.target.value);
                      setSelectedSlotId(e.target.value);
                      if (slot) {
                        setPreferredDate(new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Manila'}).format(new Date(slot.start_time)));
                        setPreferredTime(new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Manila',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(slot.start_time)));
                      }
                    }}
                    className="w-full px-3 py-2 text-xs bg-[#FAF9F6] border border-[#E5E5E0] rounded-lg"
                  >
                    {slots.map((slot) => (
                      <option key={slot.id} value={slot.id}>
                        {new Date(slot.start_time).toLocaleString('en-PH',{timeZone:'Asia/Manila',dateStyle:'medium',timeStyle:'short'})} · {slot.branch_name} · capacity {slot.capacity}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="sb-date" className="block text-xs font-semibold text-[#141413] mb-1">Preferred Date</label>
                    <input id="sb-date" type="date" required value={preferredDate} onChange={(e) => setPreferredDate(e.target.value)} className="w-full px-3 py-2 text-xs bg-[#FAF9F6] border border-[#E5E5E0] rounded-lg font-mono tabular-nums" />
                  </div>
                  <div>
                    <label htmlFor="sb-time" className="block text-xs font-semibold text-[#141413] mb-1">Preferred Time</label>
                    <input id="sb-time" type="time" required value={preferredTime} onChange={(e) => setPreferredTime(e.target.value)} className="w-full px-3 py-2 text-xs bg-[#FAF9F6] border border-[#E5E5E0] rounded-lg font-mono tabular-nums" />
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="sb-vehicle-select" className="block text-xs font-semibold text-[#141413] mb-1">Saved Vehicle</label>
                <select id="sb-vehicle-select" value={selectedVehicleId} onChange={(e) => setSelectedVehicleId(e.target.value)} className="w-full px-3 py-2 text-sm bg-[#FAF9F6] border border-[#E5E5E0] rounded-lg">
                  <option value="">Choose a saved vehicle</option>
                  {customerVehicles.map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.nickname || [vehicle.make_name, vehicle.model_name, vehicle.variant_name].filter(Boolean).join(' ')}
                      {vehicle.plate_number ? ' · ' + vehicle.plate_number : ''}
                    </option>
                  ))}
                </select>
                {customerVehicles.length === 0 && (
                  <Link href="/account/vehicles" className="inline-block mt-1 text-[11px] font-semibold text-[#141413] hover:underline">
                    Add a vehicle to your garage →
                  </Link>
                )}
              </div>

              <div>
                <label htmlFor="sb-vehicle" className="block text-xs font-semibold text-[#141413] mb-1">Vehicle Details {selectedVehicleId ? '(saved vehicle selected)' : ''}</label>
                <input id="sb-vehicle" type="text" value={vehicleDetails} onChange={(e) => setVehicleDetails(e.target.value)} placeholder="Make, model, year, engine or other vehicle details" className="w-full px-3 py-2 text-sm bg-[#FAF9F6] border border-[#E5E5E0] rounded-lg" />
                {errors.vehicle && <p className="text-xs text-red-700 mt-1">{errors.vehicle}</p>}
              </div>
            </div>

            <div>
              <label
                htmlFor="sb-name"
                className="block text-xs font-semibold text-[#141413] mb-1"
              >
                Customer Full Name
              </label>
              <input
                id="sb-name"
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#FAF9F6] border border-[#E5E5E0] rounded-lg"
              />
              {errors.name && (
                <p className="text-xs text-red-700 mt-1">{errors.name}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="sb-email"
                  className="block text-xs font-semibold text-[#141413] mb-1"
                >
                  Email Address
                </label>
                <input
                  id="sb-email"
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-[#FAF9F6] border border-[#E5E5E0] rounded-lg"
                />
                {errors.email && (
                  <p className="text-xs text-red-700 mt-1">{errors.email}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="sb-phone"
                  className="block text-xs font-semibold text-[#141413] mb-1"
                >
                  Mobile Number
                </label>
                <input
                  id="sb-phone"
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-[#FAF9F6] border border-[#E5E5E0] rounded-lg font-mono tabular-nums"
                />
                {errors.phone && (
                  <p className="text-xs text-red-700 mt-1">{errors.phone}</p>
                )}
              </div>
            </div>

            <div>
              <label
                htmlFor="sb-notes"
                className="block text-xs font-semibold text-[#141413] mb-1"
              >
                Specific Symptoms or Instructions (Optional)
              </label>
              <textarea
                id="sb-notes"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any specific noises, warning lights, or parts to bring..."
                className="w-full px-3 py-2 text-sm bg-[#FAF9F6] border border-[#E5E5E0] rounded-lg"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 px-5 bg-[#141413] hover:bg-neutral-800 text-white text-xs sm:text-sm font-semibold rounded-lg transition-colors cursor-pointer"
            >
              Request Service Booking
            </button>
          </form>
        </aside>
      </div>
    </div>
  );
}
