import React, {useMemo, useState, useEffect} from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';

const LB_TO_KG=0.45359237, IN_TO_CM=2.54, OZ_TO_G=28.3495;
const DEFAULT_FOODS=[
  {category:'Protein',item:'Chicken Breast Raw',servingG:100,cal:120,protein:23,carbs:0,fat:2.6,sugar:0,fiber:0,sodium:60},
  {category:'Protein',item:'Chicken Breast Cooked',servingG:100,cal:165,protein:31,carbs:0,fat:3.6,sugar:0,fiber:0,sodium:74},
  {category:'Protein',item:'Lean Ground Turkey 93%',servingG:100,cal:150,protein:22,carbs:0,fat:7,sugar:0,fiber:0,sodium:70},
  {category:'Protein',item:'Lean Ground Beef 93%',servingG:100,cal:170,protein:26,carbs:0,fat:8,sugar:0,fiber:0,sodium:75},
  {category:'Protein',item:'Egg Whites',servingG:100,cal:52,protein:11,carbs:0.7,fat:0.2,sugar:0.7,fiber:0,sodium:166},
  {category:'Protein',item:'Whole Eggs',servingG:50,cal:72,protein:6.3,carbs:0.4,fat:4.8,sugar:0.2,fiber:0,sodium:71},
  {category:'Protein',item:'Greek Yogurt Nonfat Plain',servingG:170,cal:100,protein:17,carbs:6,fat:0,sugar:5,fiber:0,sodium:60},
  {category:'Protein',item:'Whey Protein Isolate',servingG:30,cal:110,protein:25,carbs:1,fat:0.5,sugar:0,fiber:0,sodium:120},
  {category:'Carbs',item:'White Rice Cooked',servingG:100,cal:130,protein:2.7,carbs:28,fat:0.3,sugar:0.1,fiber:0.4,sodium:1},
  {category:'Carbs',item:'Jasmine Rice Cooked',servingG:100,cal:129,protein:2.4,carbs:28,fat:0.2,sugar:0,fiber:0.4,sodium:0},
  {category:'Carbs',item:'Potato Baked',servingG:100,cal:93,protein:2.5,carbs:21,fat:0.1,sugar:1.2,fiber:2.2,sodium:10},
  {category:'Carbs',item:'Sweet Potato Cooked',servingG:100,cal:90,protein:2,carbs:21,fat:0.2,sugar:6.5,fiber:3.3,sodium:36},
  {category:'Carbs',item:'Oats Dry',servingG:40,cal:150,protein:5,carbs:27,fat:3,sugar:1,fiber:4,sodium:0},
  {category:'Carbs',item:'Banana',servingG:118,cal:105,protein:1.3,carbs:27,fat:0.4,sugar:14.4,fiber:3.1,sodium:1},
  {category:'Fats',item:'Avocado',servingG:100,cal:160,protein:2,carbs:8.5,fat:14.7,sugar:0.7,fiber:6.7,sodium:7},
  {category:'Fats',item:'Olive Oil',servingG:14,cal:119,protein:0,carbs:0,fat:13.5,sugar:0,fiber:0,sodium:0},
  {category:'Fats',item:'Peanut Butter',servingG:32,cal:190,protein:7,carbs:7,fat:16,sugar:3,fiber:2,sodium:140},
  {category:'Fats',item:'Almonds',servingG:28,cal:164,protein:6,carbs:6,fat:14,sugar:1.2,fiber:3.5,sodium:0},
  {category:'Veg',item:'Broccoli',servingG:100,cal:35,protein:2.4,carbs:7.2,fat:0.4,sugar:1.4,fiber:3.3,sodium:41},
  {category:'Veg',item:'Spinach',servingG:100,cal:23,protein:2.9,carbs:3.6,fat:0.4,sugar:0.4,fiber:2.2,sodium:79},
  {category:'Veg',item:'Asparagus',servingG:100,cal:20,protein:2.2,carbs:3.9,fat:0.1,sugar:1.9,fiber:2.1,sodium:2},
  {category:'Veg',item:'Green Beans',servingG:100,cal:31,protein:1.8,carbs:7,fat:0.1,sugar:3.3,fiber:3.4,sodium:6},
  {category:'Blank',item:'Blank / None',servingG:100,cal:0,protein:0,carbs:0,fat:0,sugar:0,fiber:0,sodium:0}
].sort((a,b)=>a.category.localeCompare(b.category)||a.item.localeCompare(b.item));
const blankRow=()=>({category:'Blank', item:'Blank / None', qty:'', unit:'g'});
const blankMeal=(name)=>({name, rows:Array.from({length:7},blankRow)});
const defaultState={client:{name:'New Client',sex:'Male',age:30,heightFt:5,heightIn:10,weightLb:200,goalWeightLb:180,timeframeWeeks:16,activity:'Moderate',goal:'Fat Loss',notes:''},meals:Array.from({length:6},(_,i)=>blankMeal(`Meal ${i+1}`)),foods:DEFAULT_FOODS};
function round(n,d=0){return Number.isFinite(n)?Number(n.toFixed(d)):0}
function getGramQty(row,food){const q=parseFloat(row.qty)||0; if(row.unit==='oz') return q*OZ_TO_G; if(row.unit==='serving') return q*(food?.servingG||100); return q;}
function macrosFor(row,foods){const food=foods.find(f=>f.category===row.category&&f.item===row.item)||foods.find(f=>f.item==='Blank / None'); const g=getGramQty(row,food); const factor=g/(food.servingG||100); const fields=['cal','protein','carbs','fat','sugar','fiber','sodium']; return Object.fromEntries(fields.map(k=>[k,(food[k]||0)*factor]));}
function sumMacros(meals,foods){return meals.flatMap(m=>m.rows).reduce((a,r)=>{const m=macrosFor(r,foods); Object.keys(m).forEach(k=>a[k]+=m[k]); return a;},{cal:0,protein:0,carbs:0,fat:0,sugar:0,fiber:0,sodium:0});}
function calcTargets(c){const kg=c.weightLb*LB_TO_KG, cm=((+c.heightFt||0)*12+(+c.heightIn||0))*IN_TO_CM, age=+c.age||30; let bmr=10*kg+6.25*cm-5*age+(c.sex==='Female'?-161:5); const mult={Sedentary:1.2,Light:1.375,Moderate:1.55,Active:1.725,Athlete:1.9}[c.activity]||1.55; let maintenance=bmr*mult; const weekly=(c.weightLb-c.goalWeightLb)/(+c.timeframeWeeks||1); let cal=maintenance; if(c.goal==='Fat Loss') cal-=Math.min(1000,Math.max(250,weekly*500)); if(c.goal==='Lean Bulk') cal+=250; if(c.goal==='Muscle Gain') cal+=400; if(c.goal==='Recomp') cal-=100; const protein=c.goal==='Fat Loss'||c.goal==='Recomp'?c.weightLb*1.05:c.weightLb*.9; const fat=Math.max(c.weightLb*.3,(cal*.22)/9); const carbs=Math.max(0,(cal-protein*4-fat*9)/4); return {bmr,maintenance,weekly,cal,protein,carbs,fat,sodiumLow:1800,sodiumHigh:3000,fiberLow:c.sex==='Female'?25:30};}
function App(){
 const [state,setState]=useState(()=>{try{return JSON.parse(localStorage.getItem('sclass_app_v1'))||defaultState}catch{return defaultState}});
 useEffect(()=>localStorage.setItem('sclass_app_v1',JSON.stringify(state)),[state]);
 const totals=useMemo(()=>sumMacros(state.meals,state.foods),[state]); const targets=useMemo(()=>calcTargets(state.client),[state.client]);
 const cats=[...new Set(state.foods.map(f=>f.category))];
 const setClient=(k,v)=>setState(s=>({...s,client:{...s.client,[k]:v}}));
 const setRow=(mi,ri,k,v)=>setState(s=>{const meals=structuredClone(s.meals); meals[mi].rows[ri][k]=v; if(k==='category'){const item=s.foods.find(f=>f.category===v)?.item||'Blank / None'; meals[mi].rows[ri].item=item;} return {...s,meals};});
 const addFood=()=>{const item=prompt('Food name'); if(!item)return; const category=prompt('Category: Protein, Carbs, Fats, Veg, Other','Protein')||'Other'; const servingG=+(prompt('Serving grams','100')||100); const cal=+(prompt('Calories per serving','0')||0),protein=+(prompt('Protein','0')||0),carbs=+(prompt('Carbs','0')||0),fat=+(prompt('Fat','0')||0); setState(s=>({...s,foods:[...s.foods,{category,item,servingG,cal,protein,carbs,fat,sugar:0,fiber:0,sodium:0}].sort((a,b)=>a.category.localeCompare(b.category)||a.item.localeCompare(b.item))}));}
 const exportJson=()=>{const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=`${state.client.name.replaceAll(' ','_')}_sclass_plan.json`; a.click();}
 const importJson=(e)=>{const f=e.target.files[0]; if(!f)return; const r=new FileReader(); r.onload=()=>setState(JSON.parse(r.result)); r.readAsText(f)};
 const status=(actual,target,tol=.05)=>actual>target*(1+tol)?'over':actual<target*(1-tol)?'under':'hit';
 return <div className="app">
  <aside><div className="brand"><b>Sclass</b><span>Fitness Coach App</span></div><button onClick={()=>window.print()}><span>📄</span> Export / Print PDF</button><button onClick={exportJson}><span>⬇️</span> Save Client JSON</button><label className="import"><span>💾</span> Import JSON<input type="file" accept=".json" onChange={importJson}/></label><button onClick={()=>{if(confirm('Reset this dashboard?'))setState(defaultState)}}><span>🗑️</span> Reset</button></aside>
  <main>
   <section className="hero"><h1>Coach Dashboard</h1><p>Built from your base meal planner logic: category-filtered foods, 7 items per meal, grams/oz/serving conversion, live macros, goal pacing, notes, and PDF-ready output.</p></section>
   <section className="grid two"><div className="card"><h2><span>👤</span> Client Profile</h2><div className="form">{['name','age','heightFt','heightIn','weightLb','goalWeightLb','timeframeWeeks'].map(k=><label key={k}>{k.replace(/([A-Z])/g,' $1')}<input value={state.client[k]} onChange={e=>setClient(k,e.target.value)}/></label>)}<label>Sex<select value={state.client.sex} onChange={e=>setClient('sex',e.target.value)}><option>Male</option><option>Female</option></select></label><label>Activity<select value={state.client.activity} onChange={e=>setClient('activity',e.target.value)}>{['Sedentary','Light','Moderate','Active','Athlete'].map(x=><option key={x}>{x}</option>)}</select></label><label>Goal<select value={state.client.goal} onChange={e=>setClient('goal',e.target.value)}>{['Fat Loss','Maintain','Lean Bulk','Muscle Gain','Recomp'].map(x=><option key={x}>{x}</option>)}</select></label><label className="full">Notes<textarea value={state.client.notes} onChange={e=>setClient('notes',e.target.value)} placeholder="Crohn’s, low iron, food triggers, digestion notes, medications, preferences..."/></label></div></div>
   <div className="card"><h2><span>🎯</span> Targets</h2><div className="metrics"><Metric label="Calories" value={round(targets.cal)} /><Metric label="Protein" value={round(targets.protein)+'g'} /><Metric label="Carbs" value={round(targets.carbs)+'g'} /><Metric label="Fats" value={round(targets.fat)+'g'} /><Metric label="Weekly pace" value={round(targets.weekly,2)+' lb/wk'} /><Metric label="Maintenance" value={round(targets.maintenance)} /></div><p className="note">Sodium guide: {targets.sodiumLow}-{targets.sodiumHigh}mg/day. Fiber floor: {targets.fiberLow}g/day. Use medical judgment for clients with diagnosed conditions.</p></div></section>
   <section className="card"><h2><span>📊</span> Live Macro Status</h2><div className="macrobar">{[['cal','Calories',targets.cal],['protein','Protein',targets.protein],['carbs','Carbs',targets.carbs],['fat','Fats',targets.fat],['fiber','Fiber',targets.fiberLow],['sodium','Sodium',targets.sodiumHigh]].map(([k,l,t])=><div key={k}><div className="row"><b>{l}</b><span>{round(totals[k],k==='cal'||k==='sodium'?0:1)} / {round(t,k==='cal'||k==='sodium'?0:1)}</span></div><progress max={Math.max(t,1)} value={Math.min(totals[k],t)} className={status(totals[k],t)}></progress></div>)}</div></section>
   <section className="mealWrap"><h2><span>🍽️</span> Meal Planner <span>7 items per meal</span></h2>{state.meals.map((meal,mi)=><div className="meal card" key={meal.name}><h3>{meal.name}</h3><div className="table"><div className="thead"><span>Category</span><span>Food</span><span>Qty</span><span>Unit</span><span>g</span><span>Cal</span><span>P</span><span>C</span><span>F</span></div>{meal.rows.map((r,ri)=>{const food=state.foods.find(f=>f.category===r.category&&f.item===r.item)||state.foods[0]; const m=macrosFor(r,state.foods); const items=state.foods.filter(f=>f.category===r.category); return <div className="tr" key={ri}><select value={r.category} onChange={e=>setRow(mi,ri,'category',e.target.value)}>{cats.map(c=><option key={c}>{c}</option>)}</select><select value={r.item} onChange={e=>setRow(mi,ri,'item',e.target.value)}>{items.map(f=><option key={f.item}>{f.item}</option>)}</select><input value={r.qty} onChange={e=>setRow(mi,ri,'qty',e.target.value)} placeholder="0"/><select value={r.unit} onChange={e=>setRow(mi,ri,'unit',e.target.value)}><option>g</option><option>oz</option><option>serving</option></select><span>{round(getGramQty(r,food))}</span><span>{round(m.cal)}</span><span>{round(m.protein,1)}</span><span>{round(m.carbs,1)}</span><span>{round(m.fat,1)}</span></div>})}</div></div>)}</section>
   <section className="card"><h2><span>🗂️</span> Food Database</h2><button className="small" onClick={addFood}><span>＋</span> Add Food</button><p>{state.foods.length} foods loaded. Categories are alphabetized and food dropdowns filter by selected category.</p></section>
  </main>
 </div>
}
function Metric({label,value}){return <div className="metric"><span>{label}</span><b>{value}</b></div>}
createRoot(document.getElementById('root')).render(<App/>);
