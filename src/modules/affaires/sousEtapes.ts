export function sousEtapesPonderees(avancement: number): { key: string; group: string; sub: string; weight: number; val: number }[] {
  const a = avancement;
  return [
    { key: 'dess_d', group: 'Dessin',   sub: 'D · Dessin',           weight: 10, val: a >= 10 ? 100 : a * 10 },
    { key: 'dess_f', group: 'Dessin',   sub: 'F · Finition dessin',  weight: 5,  val: a >= 15 ? 100 : Math.max(0, (a - 10) * 20) },
    { key: 'dess_t', group: 'Dessin',   sub: 'Tradit. (plan papier)', weight: 5,  val: a >= 20 ? 100 : Math.max(0, (a - 15) * 20) },
    { key: 'dess_n', group: 'Dessin',   sub: 'Num. (CN)',             weight: 5,  val: a >= 25 ? 100 : Math.max(0, (a - 20) * 20) },
    { key: 'deb_d',  group: 'Débit',    sub: 'D · Débit',             weight: 15, val: a >= 40 ? 100 : Math.max(0, (a - 25) * 6.66) },
    { key: 'deb_f',  group: 'Débit',    sub: 'F · Finition débit',    weight: 5,  val: a >= 45 ? 100 : Math.max(0, (a - 40) * 20) },
    { key: 'mont',   group: 'Montage',  sub: 'Montage atelier',       weight: 30, val: a >= 75 ? 100 : Math.max(0, (a - 45) * 3.33) },
    { key: 'fini',   group: 'Finition', sub: 'Finition + contrôle',   weight: 15, val: a >= 90 ? 100 : Math.max(0, (a - 75) * 6.66) },
    { key: 'term',   group: 'Terminé',  sub: 'Affaire terminée',      weight: 5,  val: a >= 95 ? 100 : Math.max(0, (a - 90) * 20) },
    { key: 'enl',    group: 'Enlevé',   sub: 'Enlevé / fin',          weight: 5,  val: a >= 100 ? 100 : Math.max(0, (a - 95) * 20) },
  ];
}
