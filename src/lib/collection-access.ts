export type DeskRole = "admin" | "registrar" | "viewer";
type Organization = { id: string; name: string; slug: string };
type AuthorizedCollection = Organization & { role: DeskRole; viaOrg: string | null };
type Seat = { tenantId: string; role: string };
const ranks: Record<DeskRole, number> = { viewer: 1, registrar: 2, admin: 3 };
function deskRole(role?: string): DeskRole | null {
  return role === "owner" || role === "admin" ? "admin" : role === "manager" || role === "member" ? "registrar" : role === "viewer" ? "viewer" : null;
}
export function authorizedCollections(orgs: Organization[], seats: Seat[], pinnedSlug: string, entryNames: string[]) {
  const team = orgs.filter(o => entryNames.includes(o.name)).flatMap(org => {
    const role = deskRole(seats.find(s => s.tenantId === org.id)?.role);
    return role ? [{ role, name: org.name }] : [];
  }).sort((a, b) => ranks[b.role] - ranks[a.role])[0];
  return orgs.filter(o => o.slug === pinnedSlug || !entryNames.includes(o.name)).flatMap<AuthorizedCollection>(org => {
    const direct = deskRole(seats.find(s => s.tenantId === org.id)?.role);
    if (org.slug !== pinnedSlug) return direct ? [{ ...org, role: direct, viaOrg: null }] : [];
    const role = direct && (!team || ranks[direct] >= ranks[team.role]) ? direct : team?.role;
    return role ? [{ ...org, role, viaOrg: team?.name ?? null }] : [];
  });
}
