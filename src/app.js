import { zipSync } from "fflate";
import { renamePlan } from "./core.js";
import {
  $,
  init,
  message,
  table,
  stats,
  csv,
  download,
  guard,
  ready,
} from "./ui.js";
init();
let files = [],
  plan = [];
function run() {
  if (!files.length) throw new Error("Choose some files, or try the example.");
  plan = renamePlan(files, {
    prefix: $("prefix").value,
    find: $("find").value,
    replace: $("replace").value,
    start: Number($("start").value),
    digits: Number($("digits").value),
    mode: $("case").value,
    sequence: $("sequence").checked,
  });
  stats([
    ["Files", plan.length],
    ["Renamed", plan.filter((r) => r.original !== r.name).length],
    ["Conflicts", plan.filter((r) => r.error).length],
    ["Total MiB", (files.reduce((n, f) => n + f.size, 0) / 1048576).toFixed(1)],
  ]);
  table(
    ["Original name", "New name", "Status"],
    plan.map((r) => [r.original, r.name, r.error || "Ready"]),
  );
  message(
    "Preview only. Originals stay untouched. ZIP exports contain renamed copies.",
  );
  ready();
  $("zip").disabled =
    plan.some((r) => r.error) ||
    files.reduce((n, f) => n + f.size, 0) > 100 * 1024 * 1024;
  if ($("zip").disabled)
    message(
      "Resolve naming conflicts and keep total input under 100 MiB to export a ZIP.",
      true,
    );
}
$("files").onchange = guard((event) => {
  files = [...event.target.files];
  $("file-label").textContent = `${files.length} files selected`;
  document
    .querySelectorAll("[data-export]")
    .forEach((b) => (b.disabled = true));
  message("Files selected. Preview your naming plan.");
});
$("run").onclick = guard(run);
$("export").onclick = () =>
  download(
    csv([
      ["original", "new_name", "status"],
      ...plan.map((r) => [r.original, r.name, r.error || "Ready"]),
    ]),
    "nameweave-plan.csv",
    "text/csv;charset=utf-8",
  );
$("zip").onclick = guard(async () => {
  if (plan.some((r) => r.error))
    throw new Error("Resolve naming conflicts first.");
  $("zip").disabled = true;
  message("Preparing renamed copies…");
  const exportFiles = [...files],
    exportPlan = plan.map((row) => ({ ...row }));
  const archive = Object.create(null);
  for (let i = 0; i < exportFiles.length; i++)
    archive[exportPlan[i].name] = new Uint8Array(
      await exportFiles[i].arrayBuffer(),
    );
  download(
    new Blob([zipSync(archive, { level: 0 })], { type: "application/zip" }),
    "nameweave-files.zip",
  );
  message("ZIP ready. Source files were not modified.");
  if (
    files.every((file, i) => file === exportFiles[i]) &&
    files.length === exportFiles.length &&
    JSON.stringify(plan) === JSON.stringify(exportPlan)
  )
    $("zip").disabled = false;
});
$("demo").onclick = guard(() => {
  files = ["IMG_2041.txt", "IMG_2042.txt", "IMG_2043.txt", "IMG_2044.txt"].map(
    (name, i) => new File([`Synthetic demo file ${i + 1}\n`], name),
  );
  $("file-label").textContent = "4 synthetic example files";
  $("prefix").value = "trip_";
  $("find").value = "IMG_";
  $("replace").value = "";
  $("start").value = "1";
  $("digits").value = "3";
  $("sequence").checked = true;
  run();
});
