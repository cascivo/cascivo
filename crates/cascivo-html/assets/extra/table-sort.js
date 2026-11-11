(()=>{const t=(r,i)=>(r.cells[i]?.textContent||"").trim(),s=(h,v)=>{h.setAttribute("aria-sort",v);h.querySelector("button")?.setAttribute("data-state",v)};
document.addEventListener("click",e=>{const h=e.target.closest("table[data-sortable] th[aria-sort]");if(!h)return;
const b=h.closest("table").tBodies[0],i=h.cellIndex,d=h.getAttribute("aria-sort")=="ascending"?-1:1,
r=[...b.rows].filter(x=>!x.hasAttribute("data-empty-row"));
r.sort((x,y)=>{const a=t(x,i),c=t(y,i);return d*(a!==""&&c!==""&&!isNaN(a)&&!isNaN(c)?a-c:a.localeCompare(c,void 0,{numeric:true}))});
r.forEach((x,k)=>{x.dataset.parity=k%2?"odd":"even";b.append(x)});
for(const c of h.parentNode.cells)c.hasAttribute("aria-sort")&&s(c,"none");s(h,d>0?"ascending":"descending")})})();
