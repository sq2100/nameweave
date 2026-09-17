export function renamePlan(
  files,
  {
    prefix = "",
    find = "",
    replace = "",
    start = 1,
    digits = 3,
    mode = "keep",
    sequence = true,
  } = {},
) {
  if (
    !Number.isSafeInteger(start) ||
    start < 0 ||
    !Number.isSafeInteger(digits) ||
    digits < 1 ||
    digits > 8
  )
    throw new Error("Use a nonnegative integer start and 1–8 padding digits.");
  if (!["keep", "lower", "upper"].includes(mode))
    throw new Error("Unknown case rule.");
  if (files.length > 2000)
    throw new Error("Use at most 2,000 files per batch.");
  const plan = files.map((file, i) => {
    const dot = file.name.lastIndexOf("."),
      ext = dot > 0 ? file.name.slice(dot) : "",
      stem = dot > 0 ? file.name.slice(0, dot) : file.name;
    let base = find ? stem.split(find).join(replace) : stem;
    if (mode === "lower") base = base.toLowerCase();
    if (mode === "upper") base = base.toUpperCase();
    const name =
      prefix +
      (sequence ? String(start + i).padStart(digits, "0") + "_" : "") +
      base +
      ext;
    let error = "";
    if (
      !name ||
      name.length > 200 ||
      /[<>:"/\\|?*\x00-\x1f]/.test(name) ||
      /[ .]$/.test(name) ||
      /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(?:\.|$)/i.test(name)
    )
      error = "Not a portable file name";
    return { original: file.name, name, size: file.size, error };
  });
  const groups = new Map();
  for (const row of plan) {
    const key = row.name.normalize("NFC").toLowerCase();
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  }
  for (const group of groups.values())
    if (group.length > 1)
      for (const row of group) row.error = "Name collision (case-insensitive)";
  return plan;
}
