
export async function ensureData(db) {
  db.data ||= { leads: [], campaigns: [], voices: [] };
  await db.write();
}
