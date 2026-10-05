import { redirect } from 'next/navigation';

import { createServerSupabaseClient } from '@/lib/supabase/server';

type Props = {
  searchParams: Promise<{ session_id?: string }>;
};

export default async function CheckoutSuccessPage({ searchParams }: Props) {
  const params = await searchParams;
  const client = await createServerSupabaseClient();
  if (!client) redirect('/');
  const { data: { user } } = await client.auth.getUser();
  if (!user) redirect('/auth/login');

  const sessionId = params.session_id;
  const query = client.from('checkout_sessions')
    .select('id,order_id,status,provider,provider_session_id,total_amount,currency')
    .eq('customer_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1);
  const { data } = sessionId
    ? await query.eq('provider_session_id', sessionId).maybeSingle()
    : await query.maybeSingle();

  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-8 py-16">
      <section className="bg-white border border-[#E5E5E0] rounded-xl p-8 sm:p-10 text-center space-y-5">
        <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center mx-auto">
          <span className="text-xl">✓</span>
        </div>
        <h1 className="font-display text-3xl font-bold text-[#141413]">Payment Processing</h1>
        <p className="text-sm text-[#6E6E68]">Your payment provider has returned you to the store. Final confirmation is completed by the secure provider webhook.</p>
        {data?.order_id && <a href={`/orders/${data.order_id}`} className="inline-block px-6 py-2.5 bg-[#141413] text-white text-xs font-semibold rounded-lg">View Order</a>}
      </section>
    </main>
  );
}