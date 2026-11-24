// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

export const BASE_STYLE = `
  :host { --cc-accent: #2e7d32; --cc-ok: var(--success-color, #43a047); --cc-warn: var(--warning-color, #ffa600);
          --cc-crit: var(--error-color, #db4437); --cc-idle: var(--disabled-text-color, #9e9e9e); }
  :host { display: block; }
  ha-card { overflow: hidden; container: cc-card / inline-size; }
  /* A size container has no content width: this empty, zero-height grid gives the card a natural width of 300 px with
     no minimum, so it still shrinks to its track in a grid or a flex row. */
  :host::before { content: ""; display: grid; grid-template-columns: minmax(0, 300px); height: 0; }
  .icon { width: 18px; height: 18px; fill: currentColor; flex: none; }
  .muted { color: var(--secondary-text-color); }
  .clickable { cursor: pointer; }
  [role="button"]:focus-visible { outline: 2px solid var(--primary-color, #03a9f4); outline-offset: 2px; }
  .ok { --c: var(--cc-ok); } .warn { --c: var(--cc-warn); } .crit { --c: var(--cc-crit); } .idle { --c: var(--cc-idle); }
  .dot { width: 6px; height: 6px; border-radius: 50%; background: var(--c, var(--cc-ok)); flex: none; display: inline-block; }
  .chip { display: inline-flex; align-items: center; gap: 4px; padding: 1px 8px; border-radius: 12px; font-size: 11px; font-weight: 500;
          background: color-mix(in srgb, var(--c, var(--cc-ok)) 15%, transparent); color: var(--c, var(--cc-ok)); white-space: nowrap; }
  .chip.idle { color: var(--primary-text-color); }
  .bar { height: 4px; border-radius: 3px; background: var(--divider-color, rgba(127,127,127,.25)); overflow: hidden; }
  .bar > div { height: 100%; border-radius: 3px; background: var(--c, var(--cc-ok)); transition: width .6s ease; }
  .header { display: flex; align-items: center; gap: 10px; padding: 12px 12px 8px; }
  /* Tinted round icon, in the colour of the overall status. */
  .logo { height: 40px; width: 40px; flex: none; border-radius: 50%; display: grid; place-items: center;
          color: var(--c, var(--cc-ok)); background: color-mix(in srgb, var(--c, var(--cc-ok)) 16%, transparent); }
  .logo .icon { width: 24px; height: 24px; }
  /* Brand badge at the icon's lower right corner, as the other ha-* cards. */
  .logo { position: relative; }
  .logo .brand { position: absolute; right: -4px; bottom: -4px; width: 18px; height: 18px; border-radius: 5px; display: grid; place-items: center;
                 box-sizing: border-box; background: #fff; color: #18bcf2;
                 box-shadow: 0 0 0 1px var(--divider-color, rgba(0,0,0,.12)), 0 0 0 3px var(--card-background-color, #fff); }
  .logo .brand.whois { color: #2a6db0; }
  .logo .brand .icon { width: 13px; height: 13px; }
  .banner .logo .brand { box-shadow: 0 0 0 1px rgba(13,42,69,.16), 0 1px 3px rgba(13,42,69,.18); }
  .titles { flex: 1 1 0; min-width: 5ch; }
  :host([hide-title]) .titles .name, :host([hide-subtitle]) .titles > .sub { display: none; }
  .chip { min-width: 0; overflow: hidden; line-height: 16px; box-sizing: border-box; }
  .chip-label { min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .titles { display: flex; flex-direction: column; align-items: flex-start; }
  .titles > * { max-width: 100%; }
  /* The status pill right after the title, its whole label on one line, while the title stays whole beside it
     (measured by the card, see _fitPill); otherwise on its own line under a one-line subtitle, and with its dot alone
     when even that does not fit the header. */
  .trow { display: flex; align-items: center; gap: 8px; min-width: 0; }
  .trow > .name { flex: 0 1 auto; min-width: 0; }
  .trow > .chip { flex: none; max-width: none; }
  .trow > .chip .chip-label { white-space: nowrap; overflow: visible; }
  .titles.below { display: grid; grid-template-columns: minmax(0, 1fr); align-content: center; }
  .titles.below > .trow { display: contents; }
  .titles.below > .trow > .chip { order: 3; justify-self: start; align-self: start; margin-top: 3px; }
  .titles.below > .sub { order: 2; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .titles.dot-only > .trow { display: flex; }
  .titles.dot-only > .trow > .chip { order: 0; margin-top: 0; align-self: center; padding: 5px; }
  .titles.dot-only > .trow > .chip .chip-label { display: none; }
  /* On a very narrow card only its dot is left (the label stays in its tooltip and for screen readers). */
  @container cc-card (max-width: 200px) { .titles .chip { padding: 5px; } .titles .chip .chip-label { display: none; } }
  @container (max-width: 239px) {
    .header { gap: 6px; }
    :host(:not([mini])) .header .logo { height: 32px; width: 32px; }
    :host(:not([mini])) .header .logo > .icon { width: 18px; height: 18px; }
  }
  .name { font-size: 16px; font-weight: 500; line-height: 1.25; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .sub { font-size: 12px; color: var(--secondary-text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .warning { padding: 16px; color: var(--cc-warn); }
  .zoom { all: unset; flex: none; cursor: pointer; width: 24px; height: 24px; margin: -4px;
          border-radius: 50%; display: grid; place-items: center; color: var(--secondary-text-color); }
  .zoom .icon { width: 16px; height: 16px; }
  .zoom:hover { background: color-mix(in srgb, var(--secondary-text-color) 16%, transparent); color: var(--primary-text-color); }
  .zoom:focus-visible { outline: 2px solid var(--primary-color, #03a9f4); outline-offset: 1px; }
  .left { flex: none; font-size: 12px; font-weight: 500; padding: 1px 8px; border-radius: 10px; white-space: nowrap;
          background: color-mix(in srgb, var(--c) 15%, transparent); color: var(--c); }
  .left.idle { color: var(--secondary-text-color); }
`;

// Appended last to every card style: with "reduce motion" set, bars and chevrons jump to their new value.
export const MOTION_STYLE = `
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { transition: none !important; animation: none !important; }
  }
`;

export const FULL_STYLE = `
  .content { padding: 0 12px 12px; display: flex; flex-direction: column; gap: 12px; }
  .counts { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 6px; }
  .count-tile { display: flex; flex-direction: column; align-items: center; padding: 6px 4px; border-radius: 10px; min-width: 0; text-align: center;
                background: color-mix(in srgb, var(--c, var(--secondary-text-color)) 10%, transparent); }
  .count-tile .top { display: flex; align-items: center; gap: 6px; color: var(--c); }
  .count-tile .v { font-size: 16px; font-weight: 500; }
  .count-tile .k { font-size: 11px; color: var(--secondary-text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
  .count-tile.zero { --c: var(--secondary-text-color); background: var(--secondary-background-color, rgba(127,127,127,.08)); }
  .section-title { display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 500; text-transform: uppercase;
                   letter-spacing: .04em; color: var(--secondary-text-color); margin-bottom: 4px; }
  .section-title .icon { width: 16px; height: 16px; }
  .section-title .count { margin-left: auto; text-transform: none; letter-spacing: 0; font-weight: 400; }
  .section-title.fold { cursor: pointer; user-select: none; }
  /* Folded: the chevron points right; unfolded: down (as in ha-carburants-france). */
  .section-title .chevron { transition: transform .2s ease; }
  .section-title.closed { margin-bottom: 0; }
  .section-title.closed .chevron { transform: rotate(-90deg); }
  .list { display: flex; flex-direction: column; }
  .item { display: flex; align-items: center; gap: 10px; padding: 6px 0; border-bottom: 1px solid var(--divider-color, rgba(127,127,127,.15)); min-width: 0; }
  .item:last-child { border-bottom: none; }
  .item .ico { width: 32px; height: 32px; border-radius: 50%; flex: none; display: grid; place-items: center;
               color: var(--c); background: color-mix(in srgb, var(--c) 14%, transparent); }
  .item .ico .icon { width: 18px; height: 18px; }
  .item .main { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
  .item .title { font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .item .detail { font-size: 12px; color: var(--secondary-text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .item .detail.err { color: var(--cc-crit); }
  .item.dns .ico { width: 24px; height: 24px; }
  .item.dns .ico .icon { width: 14px; height: 14px; }
  .item.dns .value { flex: none; font-size: 12px; color: var(--secondary-text-color); font-family: var(--code-font-family, monospace); }
  .empty { font-size: 13px; color: var(--secondary-text-color); padding: 4px 0; }
`;

export const MINI_STYLE = `
  .content { padding: 0 12px 12px; display: flex; flex-direction: column; gap: 8px; }
  /* Name column, a bar of at least 24 px, the days left at their width. */
  .row { display: grid; grid-template-columns: minmax(0, 1fr) minmax(24px, 72px) auto; align-items: center; gap: 8px; font-size: 13px; }
  .row .lbl { min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: flex; align-items: center; gap: 6px; }
  .row .lbl span { overflow: hidden; text-overflow: ellipsis; }
  .row .lbl .web { width: 12px; height: 12px; color: var(--c); margin: 0 -3px; }
  @container (max-width: 229px) {
    .row { grid-template-columns: minmax(0, 1fr) auto; }
    .row .bar { display: none; }
  }
  .foot { display: flex; align-items: center; gap: 12px; font-size: 12px; color: var(--secondary-text-color); margin-top: 2px; flex-wrap: wrap; }
  .foot span { display: inline-flex; align-items: center; gap: 4px; }
  .foot .icon { width: 14px; height: 14px; }
  .foot .warn, .foot .crit { color: var(--c); }
  .foot .more { margin-left: auto; }
`;
