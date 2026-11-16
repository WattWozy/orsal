export const VISUALIZER_CSS = `
.ov {
  max-width:1280px;
  margin:0 auto;
  padding:24px 20px 56px;
  font-family:system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif
}
.ov h1 {font-size:22px;font-weight:650;margin:0 0 4px}
.ov .sub {opacity:.7;margin:0 0 20px;font-size:14px}
.ov-grid {
  display:grid;
  grid-template-columns:340px minmax(0,1fr);
  gap:28px;
  align-items:start
}
@media(max-width:920px) {
  .ov-grid {grid-template-columns:1fr}
}
.ov-panel {display:flex;flex-direction:column;gap:18px}
.ov label.sel {
  display:flex;
  flex-direction:column;
  gap:6px;
  font-size:13px;
  font-weight:600
}
.ov fieldset label.sel {margin-top:12px}
.ov select,.ov input,.ov textarea {
  font:inherit;
  color:inherit;
  background:transparent;
  border:1px solid rgba(128,128,128,.45);
  border-radius:6px;
  padding:7px 9px;
  box-sizing:border-box;
  width:100%
}
.ov select {font-size:15px;padding:9px}
.ov textarea {resize:vertical;font-weight:400;font-size:14px}
.ov select:focus-visible,
.ov input:focus-visible,
.ov textarea:focus-visible,
.ov button:focus-visible {
  outline:2px solid #2f5597;
  outline-offset:1px
}
.ov fieldset {
  border:1px solid rgba(128,128,128,.35);
  border-radius:8px;
  padding:4px 14px 14px;
  margin:0;
  min-width:0
}
.ov legend {font-size:13px;font-weight:650;padding:0 6px}
.ov .row {
  display:grid;
  grid-template-columns:1fr 104px;
  gap:8px;
  align-items:center;
  margin-top:8px
}
.ov .row span.l {font-size:13px;line-height:1.25}
.ov .row small {display:block;opacity:.6;font-size:11px}
.ov .row input {text-align:right}
.ov .row input.client {background:rgba(255,235,0,.18)}
.ov .row input.bad {border-color:#b3261e}
.ov .sheet {
  border:1px solid rgba(128,128,128,.35);
  border-radius:8px;
  overflow:hidden;
  background:#fff
}
.ov .sheetbar {
  display:flex;
  justify-content:space-between;
  align-items:center;
  gap:12px;
  margin:0 0 10px
}
.ov .sheetbar h2 {font-size:16px;margin:0;font-weight:650}
.ov button {
  font:inherit;
  font-size:13px;
  color:inherit;
  background:transparent;
  border:1px solid rgba(128,128,128,.5);
  border-radius:6px;
  padding:7px 12px;
  cursor:pointer
}
.ov button:hover {background:rgba(128,128,128,.12)}
.ov button:disabled {opacity:.4;cursor:not-allowed}
.ov .strips {display:grid;gap:10px;margin-top:12px}
.ov .warn {
  border:1px solid #b3261e;
  border-radius:8px;
  padding:14px 16px;
  font-size:14px;
  color:#b3261e;
  background:rgba(179,38,30,.08)
}
.ov .status {
  display:inline-block;
  font-size:12px;
  font-weight:650;
  padding:3px 9px;
  border-radius:99px
}
.ov .status.ok {background:rgba(46,125,50,.16);color:#2e7d32}
.ov .status.bad {background:rgba(179,38,30,.14);color:#b3261e}
.ov table {
  width:100%;
  border-collapse:collapse;
  margin-top:16px;
  font-size:14px
}
.ov td {
  padding:7px 4px;
  border-bottom:1px solid rgba(128,128,128,.25)
}
.ov td.n {
  text-align:right;
  font-variant-numeric:tabular-nums;
  white-space:nowrap
}
.ov td.u {width:34px;opacity:.6;font-size:12px}
.ov tr.main td {font-weight:650}
.ov .legend {
  display:flex;
  gap:16px;
  flex-wrap:wrap;
  font-size:12px;
  opacity:.75;
  margin-top:10px
}
.ov .legend i {
  display:inline-block;
  width:12px;
  height:12px;
  border:1px solid #1d2733;
  vertical-align:-2px;
  margin-right:5px
}
`;