/* Geek Squad Notes Generator - Customer Summary Notes (V1) */

const $ = (id) => document.getElementById(id);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

const deviceSel = $("device");

const iphoneSection = $("iphoneSection");
const iphoneRepairs = $("iphoneRepairs");
const iphoneOtherWrap = $("iphoneOtherWrap");
const iphoneOther = $("iphoneOther");

const pcHardwareSection = $("pcHardwareSection");
const pcHwDetails = $("pcHwDetails");
const pcHwParts = $("pcHwParts");
const customBuildWrap = $("customBuildWrap");
const pcPartActions = $("pcPartActions");
const pcPartActionsList = $("pcPartActionsList");
const pcHwFailWrap = $("pcHwFailWrap");
const pcHwFailReason = $("pcHwFailReason");
const pcHwIncludeRec = $("pcHwIncludeRec");

const softwareSection = $("softwareSection");
const pcSoftwareDidWrap = $("pcSoftwareDidWrap");
const softwareDetails = $("softwareDetails");

const swDiagnostics = $("swDiagnostics");
const swOsRepair = $("swOsRepair");
const swDbu = $("swDbu");
const swInstalls = $("swInstalls");
const swAv = $("swAv");
const swOsInstall = $("swOsInstall");
const swSetup = $("swSetup");
const swUpdates = $("swUpdates");
const swDriverUpdates = $("swDriverUpdates");

const diagWrap = $("diagWrap");
const diagFailWrap = $("diagFailWrap");
const diagFailParts = $("diagFailParts");
const diagIncludeRec = $("diagIncludeRec");
const diagNowPassWrap = $("diagNowPassWrap");

const osRepairWrap = $("osRepairWrap");
const virusesRemoved = $("virusesRemoved");
const policiesRemoved = $("policiesRemoved");

const dbuWrap = $("dbuWrap");
const dbuFailReasonWrap = $("dbuFailReasonWrap");
const dbuFailReason = $("dbuFailReason");
const dbuDest = $("dbuDest");
const dbuAmount = $("dbuAmount");

const installsWrap = $("installsWrap");
const addSoftwareBtn = $("addSoftwareBtn");
const softwareItem = $("softwareItem");
const softwareList = $("softwareList");

const avWrap = $("avWrap");
const avName = $("avName");
const avOtherWrap = $("avOtherWrap");
const avOther = $("avOther");
const avInstalled = $("avInstalled");
const avActivated = $("avActivated");

const osInstallWrap = $("osInstallWrap");
const osChoice = $("osChoice");

const finalSection = $("finalSection");
const recycled = $("recycled");
const extraComments = $("extraComments");
const initials = $("initials");
const output = $("output");
const warn = $("warn");

const generateBtn = $("generateBtn");
const copyBtn = $("copyBtn");
const resetBtn = $("resetBtn");

let softwareItems = [];
let partActionMap = new Map(); // part -> "installed"|"replaced"

// ---------- helpers ----------
function selectedValues(selectEl) {
  return Array.from(selectEl.selectedOptions).map(o => o.value);
}

function joinHuman(list) {
  const arr = list.filter(Boolean);
  if (arr.length === 0) return "";
  if (arr.length === 1) return arr[0];
  if (arr.length === 2) return `${arr[0]} and ${arr[1]}`;
  return `${arr.slice(0, -1).join(", ")}, and ${arr[arr.length - 1]}`;
}

function getRadio(name) {
  const el = document.querySelector(`input[name="${name}"]:checked`);
  return el ? el.value : "";
}

function setHidden(el, hidden) {
  el.classList.toggle("hidden", !!hidden);
}

function normalizeInitials(s) {
  return (s || "").trim().toUpperCase();
}

function sentence(s) {
  const t = (s || "").trim();
  if (!t) return "";
  return /[.!?]$/.test(t) ? t : (t + ".");
}

function capFirst(s) {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function enforceLength(note) {
  const words = note.trim().split(/\s+/).filter(Boolean).length;
  if (words > 500) {
    warn.textContent = `Note is about ${words} words. Consider shortening to stay under ~500 words.`;
    warn.classList.remove("hidden");
  }
  return note;
}

// ---------- UI ----------
function renderPartActions(parts) {
  pcPartActionsList.innerHTML = "";

  for (const part of parts) {
    if (!partActionMap.has(part)) partActionMap.set(part, "installed");

    const row = document.createElement("div");
    row.className = "partRow";

    const label = document.createElement("div");
    label.textContent = capFirst(part);

    const actionSel = document.createElement("select");
    actionSel.innerHTML = `
      <option value="installed">Installed</option>
      <option value="replaced">Replaced</option>
    `;
    actionSel.value = partActionMap.get(part);
    actionSel.addEventListener("change", () => {
      partActionMap.set(part, actionSel.value);
    });

    row.appendChild(label);
    row.appendChild(actionSel);
    pcPartActionsList.appendChild(row);
  }

  // cleanup removed parts
  for (const key of Array.from(partActionMap.keys())) {
    if (!parts.includes(key)) partActionMap.delete(key);
  }
}

function renderSoftwareChips() {
  softwareList.innerHTML = "";
  softwareItems.forEach((name, idx) => {
    const chip = document.createElement("span");
    chip.className = "chip";
    chip.textContent = name;

    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = "×";
    btn.title = "Remove";
    btn.addEventListener("click", () => {
      softwareItems.splice(idx, 1);
      renderSoftwareChips();
    });

    chip.appendChild(btn);
    softwareList.appendChild(chip);
  });
}

addSoftwareBtn.addEventListener("click", () => {
  const val = (softwareItem.value || "").trim();
  if (!val) return;
  softwareItems.push(val);
  softwareItem.value = "";
  renderSoftwareChips();
});

function refreshUI() {
  const device = deviceSel.value;

  setHidden(iphoneSection, device !== "iphone");
  setHidden(pcHardwareSection, device !== "pc");

  // Software section rules:
  // - iPhone: none
  // - MacBook: always software (no "did software?" question)
  // - PC: show "did software?" question; details only if yes
  setHidden(softwareSection, device === "" || device === "iphone");

  if (device === "mac") {
    setHidden(pcSoftwareDidWrap, true);
    softwareDetails.classList.remove("hidden");
  } else if (device === "pc") {
    setHidden(pcSoftwareDidWrap, false);
    const swDid = getRadio("swDid");
    setHidden(softwareDetails, swDid !== "yes");
  }

  // MacBook: hide driver updates option
  $$(".pcOnly").forEach(el => {
    if (device === "mac") el.classList.add("hidden");
    else el.classList.remove("hidden");
  });

  // Final section visible once device chosen
  setHidden(finalSection, device === "");

  // iPhone other
  const iphoneSel = selectedValues(iphoneRepairs);
  setHidden(iphoneOtherWrap, !iphoneSel.includes("other"));

  // PC hardware details
  if (device === "pc") {
    const hwDid = getRadio("pcHwDid");
    setHidden(pcHwDetails, hwDid !== "yes");

    const parts = selectedValues(pcHwParts);
    const customSelected = parts.includes("custom build");
    setHidden(customBuildWrap, !customSelected);

    if (customSelected) {
      // force only custom build
      Array.from(pcHwParts.options).forEach(opt => {
        if (opt.value !== "custom build") opt.selected = false;
      });
      setHidden(pcPartActions, true);
    } else {
      setHidden(pcPartActions, parts.length === 0);
      if (parts.length) renderPartActions(parts);
    }

    const hwSuccess = getRadio("pcHwSuccess");
    setHidden(pcHwFailWrap, hwSuccess !== "no");
  }

  // nested software sections
  setHidden(diagWrap, !swDiagnostics.checked);
  const diagPass = getRadio("diagPass");
  setHidden(diagFailWrap, !(swDiagnostics.checked && diagPass === "no"));

  const diagReplaced = getRadio("diagReplaced");
  setHidden(diagNowPassWrap, !(swDiagnostics.checked && diagPass === "no" && diagReplaced === "yes"));

  setHidden(osRepairWrap, !swOsRepair.checked);

  setHidden(dbuWrap, !swDbu.checked);
  const dbuSuccess = getRadio("dbuSuccess");
  setHidden(dbuFailReasonWrap, !(swDbu.checked && dbuSuccess === "no"));

  setHidden(installsWrap, !swInstalls.checked);

  setHidden(avWrap, !swAv.checked);
  setHidden(avOtherWrap, !(swAv.checked && avName.value === "Other"));

  setHidden(osInstallWrap, !swOsInstall.checked);
}

// ---------- generation ----------
function buildNote() {
  const device = deviceSel.value;
  const init = normalizeInitials(initials.value);

  warn.classList.add("hidden");
  warn.textContent = "";

  if (!device) return "";
  if (!init) {
    warn.textContent = "Agent initials are required.";
    warn.classList.remove("hidden");
    return "";
  }

  // One paragraph: we build sentences then join with spaces.
  const sentences = [];

  // -------- iPhone --------
  if (device === "iphone") {
    const sel = selectedValues(iphoneRepairs);
    const other = (iphoneOther.value || "").trim();

    const items = [];

    // special-case whole unit replacement
    if (sel.includes("whole unit")) {
      // This will be written as: "Performed a whole unit replacement."
      items.push({ type: "whole", text: "a whole unit replacement" });
    }

    // normal replaced items
    const replacedMap = {
      "display": "the display",
      "battery": "the battery",
      "back glass": "the back glass",
      "rear system": "the rear system",
      "mid system": "the mid system",
      "truedepth": "the TrueDepth system",
      "back camera": "the back camera",
    };

    const replacedList = [];
    for (const key of Object.keys(replacedMap)) {
      if (sel.includes(key)) replacedList.push(replacedMap[key]);
    }

    if (sel.includes("other") && other) {
      // write "the <other>" unless they already typed a full phrase
      const cleaned = other.trim();
      const startsWithArticle = /^the\s+/i.test(cleaned) || /^a\s+/i.test(cleaned) || /^an\s+/i.test(cleaned);
      replacedList.push(startsWithArticle ? cleaned : `the ${cleaned}`);
    }

    // Build output:
    // If whole unit selected, write it as a separate sentence.
    if (items.some(x => x.type === "whole")) {
      sentences.push(sentence("Performed a whole unit replacement"));
    }

    // If any other replacements, write as "Replaced ..."
    if (replacedList.length > 0) {
      sentences.push(sentence(`Replaced ${joinHuman(replacedList)}`));
    }

    if (sentences.length === 0) {
      sentences.push(sentence("Repair completed"));
    }

    sentences.push(sentence("All necessary diagnostics were completed to ensure a successful repair"));

    if (recycled.checked) {
      sentences.push(sentence("Device recycled per customer request"));
    }

    const extra = (extraComments.value || "").trim();
    if (extra) sentences.push(sentence(extra));

    const para = sentences.join(" ").trim() + ` - ${init}`;
    return enforceLength(para);
  }

  // -------- PC / Mac --------

  // PC hardware
  let isCustomBuild = false;
  let customBuildSentence = "";

  if (device === "pc") {
    const hwDid = getRadio("pcHwDid");
    if (hwDid === "yes") {
      const parts = selectedValues(pcHwParts);

      if (parts.includes("custom build")) {
        isCustomBuild = true;
        const cbType = getRadio("customBuildType");
        if (cbType === "built") customBuildSentence = "Built a new custom PC from components";
        else if (cbType === "reassembled") customBuildSentence = "Reassembled customer-provided custom PC";
        else customBuildSentence = "Custom PC build completed";
      } else if (parts.length > 0) {
        const installed = [];
        const replaced = [];
        for (const p of parts) {
          const act = partActionMap.get(p) || "installed";
          const label = capFirst(p).toLowerCase();
          if (act === "replaced") replaced.push(label);
          else installed.push(label);
        }

        if (installed.length) sentences.push(sentence(`Installed ${joinHuman(installed)}`));
        if (replaced.length) sentences.push(sentence(`Replaced ${joinHuman(replaced)}`));

        const hwSuccess = getRadio("pcHwSuccess");
        if (hwSuccess === "no") {
          sentences.push(sentence("Hardware work was unsuccessful"));
          const reason = (pcHwFailReason.value || "").trim();
          if (reason) sentences.push(sentence(reason));
          if (pcHwIncludeRec.checked) {
            sentences.push(sentence("Recommended additional service and/or part replacement as needed"));
          }
        }
      } else {
        sentences.push(sentence("Hardware work completed"));
      }
    }
  }

  // Software enabled?
  let softwareEnabled = true;
  if (device === "pc") softwareEnabled = (getRadio("swDid") === "yes");
  if (device === "mac") softwareEnabled = true;

  // Buckets for strict ordering
  const bucket = {
    osInstall: [],
    setup: [],
    diagnostics: [],
    osRepair: [],
    dbu: [],
    installs: [],
    av: [],
    updates: [],
    driverUpdates: [],
  };

  if (softwareEnabled) {
    // OS install
    if (swOsInstall.checked) {
      const os = osChoice.value;
      const preserved = getRadio("filesPreserved"); // yes/no
      if (os) {
        if (preserved === "yes") {
          bucket.osInstall.push(
            sentence(`Performed a ${os} installation with personal files preserved (software and applications do not carry over)`)
          );
        } else {
          bucket.osInstall.push(sentence(`Performed a clean ${os} installation`));
        }
      } else {
        bucket.osInstall.push(sentence("Performed an operating system installation"));
      }
    }

    // Setup
    if (swSetup.checked) bucket.setup.push(sentence("Completed device setup"));

    // Diagnostics
    if (swDiagnostics.checked) {
      const pass = getRadio("diagPass");
      if (pass === "yes") {
        bucket.diagnostics.push(sentence("All diagnostics passed"));
      } else {
        const fails = selectedValues(diagFailParts);
        if (fails.length) bucket.diagnostics.push(sentence(`Diagnostics identified issues with ${joinHuman(fails)}`));
        else bucket.diagnostics.push(sentence("Diagnostics identified hardware-related issues"));

        const replaced = getRadio("diagReplaced");
        if (replaced === "yes") {
          const nowPass = getRadio("diagNowPass");
          if (nowPass === "yes") bucket.diagnostics.push(sentence("Diagnostics pass after service"));
          else bucket.diagnostics.push(sentence("Diagnostics still indicate issues after service"));
        } else {
          if (diagIncludeRec.checked) bucket.diagnostics.push(sentence("Recommended replacement of the affected component(s)"));
        }
      }
    }

    // OS repair
    if (swOsRepair.checked) {
      const v = Number(virusesRemoved.value || 0);
      const p = Number(policiesRemoved.value || 0);

      let base = "Performed operating system repair and verified system stability";
      const extras = [];
      if (v > 0) extras.push(`${v} virus${v === 1 ? "" : "es"} removed`);
      if (p > 0) extras.push(`${p} malicious polic${p === 1 ? "y" : "ies"} removed`);
      if (extras.length) base += `, including ${joinHuman(extras)}`;
      bucket.osRepair.push(sentence(base));
    }

    // DBU
    if (swDbu.checked) {
      const suc = getRadio("dbuSuccess");
      const dest = (dbuDest.value || "").trim();
      const amt = (dbuAmount.value || "").trim();

      if (suc === "yes") {
        let s = "Completed data backup";
        if (amt) s += ` (${amt} GB transferred)`;
        if (dest) s += ` to ${dest}`;
        bucket.dbu.push(sentence(s));
      } else {
        let s = "Attempted data backup; unsuccessful";
        const reason = dbuFailReason.value;
        if (reason) s += ` due to ${reason}`;
        if (dest) s += ` (destination: ${dest})`;
        bucket.dbu.push(sentence(s));
      }
    }

    // Installs
    if (swInstalls.checked) {
      bucket.installs.push(sentence("Installed requested applications"));
      if (softwareItems.length) {
        bucket.installs.push(sentence(`Applications installed included ${joinHuman(softwareItems)}`));
      }
    }

    // AV
    if (swAv.checked) {
      let name = avName.value;
      if (name === "Other") name = (avOther.value || "").trim() || "antivirus";
      if (!name) name = "antivirus";

      const didInstall = avInstalled.checked;
      const didActivate = avActivated.checked;

      if (didInstall && didActivate) bucket.av.push(sentence(`Installed and activated ${name}`));
      else if (didInstall) bucket.av.push(sentence(`Installed ${name}`));
      else if (didActivate) bucket.av.push(sentence(`Activated ${name}`));
      else bucket.av.push(sentence(`Antivirus service completed for ${name}`));
    }

    // Updates
    if (swUpdates.checked) bucket.updates.push(sentence("Installed system updates"));
    if (device === "pc" && swDriverUpdates.checked) bucket.driverUpdates.push(sentence("Updated device drivers"));
  }

  // Apply ordering rules:
  // - Normal: Hardware already in sentences, then OSI -> Setup -> Diags -> rest -> recycle -> extra
  // - Custom build override: custom build MUST be first, then OSI -> Setup -> Diags -> rest
  if (isCustomBuild) {
    const ordered = [];
    ordered.push(sentence(customBuildSentence || "Custom PC build completed"));
    ordered.push(...bucket.osInstall);
    ordered.push(...bucket.setup);
    ordered.push(...bucket.diagnostics);
    ordered.push(...bucket.osRepair);
    ordered.push(...bucket.dbu);
    ordered.push(...bucket.installs);
    ordered.push(...bucket.av);
    ordered.push(...bucket.updates);
    ordered.push(...bucket.driverUpdates);

    if (recycled.checked) ordered.push(sentence("Device recycled per customer request"));

    const extra = (extraComments.value || "").trim();
    if (extra) ordered.push(sentence(extra));

    const para = ordered.join(" ").trim() + ` - ${init}`;
    return enforceLength(para);
  }

  // Non-custom-build order:
  sentences.push(...bucket.osInstall);
  sentences.push(...bucket.setup);
  sentences.push(...bucket.diagnostics);
  sentences.push(...bucket.osRepair);
  sentences.push(...bucket.dbu);
  sentences.push(...bucket.installs);
  sentences.push(...bucket.av);
  sentences.push(...bucket.updates);
  sentences.push(...bucket.driverUpdates);

  if (recycled.checked) sentences.push(sentence("Device recycled per customer request"));

  const extra = (extraComments.value || "").trim();
  if (extra) sentences.push(sentence(extra));

  const para = sentences.join(" ").trim() + ` - ${init}`;
  return enforceLength(para);
}

// ---------- events ----------
deviceSel.addEventListener("change", refreshUI);
iphoneRepairs.addEventListener("change", refreshUI);
avName.addEventListener("change", refreshUI);
pcHwParts.addEventListener("change", refreshUI);

$$('input[name="pcHwDid"]').forEach(el => el.addEventListener("change", refreshUI));
$$('input[name="pcHwSuccess"]').forEach(el => el.addEventListener("change", refreshUI));
$$('input[name="swDid"]').forEach(el => el.addEventListener("change", refreshUI));
$$('input[name="diagPass"]').forEach(el => el.addEventListener("change", refreshUI));
$$('input[name="diagReplaced"]').forEach(el => el.addEventListener("change", refreshUI));
$$('input[name="dbuSuccess"]').forEach(el => el.addEventListener("change", refreshUI));
$$('input[name="filesPreserved"]').forEach(el => el.addEventListener("change", refreshUI));

[
  swDiagnostics, swOsRepair, swDbu, swInstalls, swAv, swOsInstall, swSetup, swUpdates, swDriverUpdates
].forEach(el => el.addEventListener("change", refreshUI));

generateBtn.addEventListener("click", () => {
  const note = buildNote();
  output.value = note;

  const init = normalizeInitials(initials.value);
  if (init) localStorage.setItem("gs_notes_initials", init);
});

copyBtn.addEventListener("click", async () => {
  const text = (output.value || "").trim();
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    warn.textContent = "Copied to clipboard.";
    warn.classList.remove("hidden");
    setTimeout(() => warn.classList.add("hidden"), 1200);
  } catch {
    warn.textContent = "Copy failed. Select the text and copy manually.";
    warn.classList.remove("hidden");
  }
});

resetBtn.addEventListener("click", () => {
  const keepInit = normalizeInitials(initials.value) || localStorage.getItem("gs_notes_initials") || "";

  // reset selects/text/checkboxes
  document.querySelectorAll("input, select, textarea").forEach(el => {
    if (el.id === "initials") return;

    if (el.type === "checkbox") el.checked = false;
    else if (el.type === "radio") {
      // radios reset below
    } else if (el.tagName === "SELECT") {
      el.value = "";
      Array.from(el.options).forEach(o => o.selected = false);
    } else {
      el.value = "";
    }
  });

  // restore default radios
  // PC defaults
  const pcNo = document.querySelector('input[name="pcHwDid"][value="no"]');
  if (pcNo) pcNo.checked = true;

  const hwYes = document.querySelector('input[name="pcHwSuccess"][value="yes"]');
  if (hwYes) hwYes.checked = true;

  // Software defaults (PC)
  const swNo = document.querySelector('input[name="swDid"][value="no"]');
  if (swNo) swNo.checked = true;

  // Diagnostics defaults
  const diagYes = document.querySelector('input[name="diagPass"][value="yes"]');
  if (diagYes) diagYes.checked = true;

  const diagRepNo = document.querySelector('input[name="diagReplaced"][value="no"]');
  if (diagRepNo) diagRepNo.checked = true;

  const diagNowYes = document.querySelector('input[name="diagNowPass"][value="yes"]');
  if (diagNowYes) diagNowYes.checked = true;

  // DBU defaults
  const dbuYes = document.querySelector('input[name="dbuSuccess"][value="yes"]');
  if (dbuYes) dbuYes.checked = true;

  // Files preserved default
  const fpYes = document.querySelector('input[name="filesPreserved"][value="yes"]');
  if (fpYes) fpYes.checked = true;

  softwareItems = [];
  renderSoftwareChips();
  partActionMap.clear();

  output.value = "";
  warn.classList.add("hidden");
  initials.value = keepInit;

  refreshUI();
});

// init
(function init() {
  initials.value = localStorage.getItem("gs_notes_initials") || "";
  refreshUI();
})();

