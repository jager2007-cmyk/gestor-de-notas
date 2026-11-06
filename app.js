var KEY = "gestor-notas-v1";
var S = { students: [], acts: [], max: 5, pass: 3 };
var uid = function(){ return Math.random().toString(36).slice(2, 9); };

function load(){
  try {
    var raw = localStorage.getItem(KEY);
    if (raw) { S = JSON.parse(raw); return; }
  } catch (e) {}
  S.acts = [
    { id: uid(), name: "Quiz 1", w: 20 },
    { id: uid(), name: "Taller", w: 30 },
    { id: uid(), name: "Examen final", w: 50 }
  ];
  S.students = [{ id: uid(), name: "Ana Torres", g: {} }, { id: uid(), name: "Luis Gómez", g: {} }];
}
function save(){ try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }

function calc(st){
  var sum = 0, w = 0;
  S.acts.forEach(function(a){
    var v = st.g[a.id];
    if (v !== undefined && v !== "" && !isNaN(v)) { sum += Number(v) * a.w; w += a.w; }
  });
  return w > 0 ? sum / w : null;
}
function fmt(n){ return n === null ? "–" : n.toFixed(2); }
function status(avg){
  if (avg === null) return '<span class="tag na">Sin notas</span>';
  return avg >= S.pass ? '<span class="tag ok">Aprobado</span>' : '<span class="tag bad">Reprobado</span>';
}
function esc(s){ return String(s).replace(/[&<>"]/g, function(c){ return { "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;" }[c]; }); }

function stats(){
  var avgs = S.students.map(calc).filter(function(a){ return a !== null; });
  var ok = avgs.filter(function(a){ return a >= S.pass; }).length;
  var mean = avgs.length ? avgs.reduce(function(x, y){ return x + y; }, 0) / avgs.length : null;
  document.getElementById("stats").innerHTML =
    '<div class="stat"><b>' + S.students.length + '</b><span>Estudiantes</span></div>' +
    '<div class="stat"><b>' + fmt(mean) + '</b><span>Promedio del curso</span></div>' +
    '<div class="stat"><b>' + ok + '</b><span>Aprueban</span></div>' +
    '<div class="stat"><b>' + (avgs.length - ok) + '</b><span>Reprueban</span></div>';
  var tot = S.acts.reduce(function(s, a){ return s + a.w; }, 0);
  var n = document.getElementById("wnote");
  n.className = "note" + (tot !== 100 ? " warn" : "");
  n.textContent = tot !== 100 ? "Los porcentajes suman " + tot + "%. Ajústalos para que sumen 100%." : "";
}

function render(){
  var h = "<thead><tr><th>Estudiante</th>";
  S.acts.forEach(function(a){
    h += '<th><input data-act="' + a.id + '" data-f="name" value="' + esc(a.name) + '" aria-label="Nombre de la actividad">' +
         '<div class="w"><input data-act="' + a.id + '" data-f="w" type="number" min="0" max="100" value="' + a.w + '" aria-label="Porcentaje"> %' +
         '<button class="x" data-delact="' + a.id + '" title="Quitar actividad" aria-label="Quitar actividad">✕</button></div></th>';
  });
  h += "<th>Promedio</th><th>Estado</th><th></th></tr></thead><tbody>";
  if (!S.students.length) {
    h += '<tr><td colspan="' + (S.acts.length + 4) + '" class="empty">Aún no hay estudiantes. Escribe un nombre arriba y pulsa «Agregar estudiante».</td></tr>';
  }
  S.students.forEach(function(st){
    h += '<tr data-st="' + st.id + '"><td>' + esc(st.name) + "</td>";
    S.acts.forEach(function(a){
      var v = st.g[a.id];
      h += '<td><input class="g" type="number" min="0" max="' + S.max + '" step="0.1" data-st="' + st.id + '" data-a="' + a.id + '" value="' + (v === undefined ? "" : v) + '" aria-label="Nota de ' + esc(st.name) + ' en ' + esc(a.name) + '"></td>';
    });
    var avg = calc(st);
    h += '<td class="avg">' + fmt(avg) + "</td><td>" + status(avg) + '</td><td><button class="x" data-delst="' + st.id + '" title="Quitar estudiante" aria-label="Quitar a ' + esc(st.name) + '">✕</button></td></tr>';
  });
  document.getElementById("tbl").innerHTML = h + "</tbody>";
  stats();
}

document.getElementById("tbl").addEventListener("input", function(e){
  var t = e.target;
  if (!t.classList.contains("g")) return;
  var st = S.students.find(function(s){ return s.id === t.dataset.st; });
  var v = t.value;
  if (v !== "" && Number(v) > S.max) { v = String(S.max); t.value = v; }
  if (v === "") delete st.g[t.dataset.a]; else st.g[t.dataset.a] = Number(v);
  t.classList.toggle("low", v !== "" && Number(v) < S.pass);
  var tr = t.closest("tr"), avg = calc(st);
  tr.querySelector(".avg").textContent = fmt(avg);
  tr.children[tr.children.length - 2].innerHTML = status(avg);
  save(); stats();
});
document.getElementById("tbl").addEventListener("change", function(e){
  var t = e.target, id = t.dataset.act;
  if (!id) return;
  var a = S.acts.find(function(x){ return x.id === id; });
  if (t.dataset.f === "name") a.name = t.value.trim() || "Actividad";
  else a.w = Math.max(0, Number(t.value) || 0);
  save(); render();
});
document.getElementById("tbl").addEventListener("click", function(e){
  var b = e.target.closest("button");
  if (!b) return;
  if (b.dataset.delst) {
    var s = S.students.find(function(x){ return x.id === b.dataset.delst; });
    if (!confirm("¿Quitar a " + s.name + "?")) return;
    S.students = S.students.filter(function(x){ return x !== s; });
  }
  if (b.dataset.delact) {
    if (!confirm("¿Quitar esta actividad y sus notas?")) return;
    S.acts = S.acts.filter(function(x){ return x.id !== b.dataset.delact; });
  }
  save(); render();
});

function addStudent(){
  var inp = document.getElementById("newStudent"), n = inp.value.trim();
  if (!n) { inp.focus(); return; }
  S.students.push({ id: uid(), name: n, g: {} });
  inp.value = ""; save(); render(); inp.focus();
}
document.getElementById("addStudent").onclick = addStudent;
document.getElementById("newStudent").addEventListener("keydown", function(e){ if (e.key === "Enter") addStudent(); });
document.getElementById("addAct").onclick = function(){
  S.acts.push({ id: uid(), name: "Actividad " + (S.acts.length + 1), w: 0 });
  save(); render();
};
["max", "pass"].forEach(function(k){
  var el = document.getElementById(k);
  el.value = S[k];
  el.addEventListener("change", function(){
    var v = Number(el.value);
    if (!(v > 0)) { el.value = S[k]; return; }
    S[k] = v; save(); render();
  });
});

load();
document.getElementById("max").value = S.max;
document.getElementById("pass").value = S.pass;
render();
