
// Simulated dialer that updates a few leads and emits transcript-like logs.
export function startMockCampaign(db, campaign) {
  console.log('Starting mock campaign:', campaign.name);
  const leads = db.data.leads.filter(l => l.status === 'NEW').slice(0, 10);
  let i = 0;
  const interval = setInterval(async () => {
    if (i >= leads.length) {
      campaign.status = 'COMPLETED';
      await db.write();
      clearInterval(interval);
      console.log('Mock campaign completed');
      return;
    }
    const lead = leads[i++];
    // Simulate call result
    const r = Math.random();
    lead.status = 'CALLED';
    if (r > 0.7) { lead.intent = 'HIGH'; lead.next_action = 'TRANSFER_TO_AGENT'; }
    else if (r > 0.4) { lead.intent = 'MEDIUM'; lead.next_action = 'FOLLOW_UP'; }
    else { lead.intent = 'LOW'; lead.next_action = 'NONE'; }
    await db.write();
    console.log(`Called ${lead.name || lead.phone}: intent=${lead.intent}`);
  }, 1000);
}
