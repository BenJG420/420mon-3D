import { maxHp, type Partner } from "./save";

/** Resting at a physical mattress restores the party, including defeated partners. */
export function restTeam(team: Partner[]): { revived: number; healed: number } {
  let revived = 0, healed = 0;
  for (const mon of team) {
    const maximum = maxHp(mon);
    if (mon.hp === maximum) continue;
    if (mon.hp <= 0) revived++;
    else healed++;
    mon.hp = maximum;
  }
  return { revived, healed };
}
