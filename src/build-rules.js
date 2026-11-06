const edges = [
  ['.timeline-year > ul', 'Left'],
  ['.creative-archive', 'Top'],
  ['.creative-archive', 'Bottom'],
  ['.portfolio-nav', 'Bottom'],
  ['.chapter:not(#work)', 'Top'],
  ['.about-copy, .wins-controls, .skills-grid, .contact-grid', 'Top'],
  ['.skill-row', 'Bottom'],
];

export function prepareRules(portfolio) {
  return edges.flatMap(([selector, edge]) => [...portfolio.querySelectorAll(selector)].map((target) => {
    const property = 'border' + edge + 'Color';
    const vertical = edge === 'Left';
    const color = getComputedStyle(target)[property];
    const original = target.style[property];
    const box = target.getBoundingClientRect();
    const top = box.top + scrollY + (edge === 'Bottom' ? box.height - 1 : 0);
    target.style[property] = 'transparent';
    if (vertical) target.classList.add('build-year-waiting');
    return {
      target, edge, color, vertical, top, length: vertical ? box.height : box.width,
      scene: target.closest('[data-scene]'),
      revealDot() { if (vertical) target.classList.remove('build-year-waiting'); },
      restore() {
        target.style[property] = original;
        this.revealDot();
      },
    };
  }));
}

// Secondary jobs use only the gaps left by placement and typing.
export function scheduleRules(rules, lanes, camera, duration, height) {
  const releases = [];
  for (const [index, rule] of rules.entries()) {
    const windows = camera.flatMap((shot, i) => {
      if (shot.scene !== rule.scene) return [];
      const y = rule.top - shot.top;
      const span = rule.vertical ? rule.length : 1;
      const visible = Math.min(height - 48, y + span) - Math.max(8, y);
      if (visible < Math.min(span, 32)) return [];
      return [{ start: shot.end, end: camera[i + 1]?.start ?? duration, visible }];
    }).sort((a, b) => b.visible - a.visible || a.start - b.start);

    let assigned = false;
    const preferred = rule.vertical ? Math.min(520, 290 + (windows[0]?.visible ?? 0) * .42) : 540;
    reservation: for (const needed of [preferred, Math.min(preferred, 350), 230]) {
      for (const window of windows) {
        for (let n = 0; n < lanes.length; n++) {
          const jobs = lanes[(index + n) % lanes.length];
          let start = window.start;
          let at = 0;
          for (; at < jobs.length; at++) {
            const next = jobs[at];
            if (start + needed <= next.start) break;
            start = Math.max(start, next.end);
          }
          if (start + needed > window.end) continue;
          jobs.splice(at, 0, { rule, start, end: start + needed, reverse: !rule.vertical && index % 2 === 1 });
          assigned = true;
          break reservation;
        }
      }
    }
    if (!assigned) {
      // At a narrow viewport there may be no free hand while a rule is visible.
      const shot = camera.find((view) => view.scene === rule.scene);
      releases.push({ rule, time: windows[0]?.end ?? shot?.end ?? duration });
    }
  }
  return releases.sort((a, b) => a.time - b.time);
}
