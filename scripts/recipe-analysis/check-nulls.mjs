import fs from "fs";
const d = JSON.parse(fs.readFileSync("recipe-analysis.json", "utf8"));
const bad = d.filter(r => !r.kcal_per_person || !r.prep_min || !r.cook_min);
console.log("Hâlâ null olan tarif sayısı:", bad.length);
bad.forEach(r => console.log(" -", r.id, r.title, "| kcal:", r.kcal_per_person, "| prep:", r.prep_min, "| cook:", r.cook_min));
