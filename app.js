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
let pcSelectedParts = []; // values from select
let partActionMap = new Map(); // part -> "installed"|"replaced"

// ----------------- helpers -----------------
function selectedValues(selectEl) {
  return Array.from(selectEl.selectedOptions).map(o => o.value);
}
function capFirst(s) {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
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

// ----------------- UI toggles -----------------
function refreshUI() {
  const device = deviceSel.value;

  setHidden(iphoneSection, device !== "iphone");
  setHidden(pcHardwareSection, device !== "pc");

  // software section rules:
  // - iPhone: none
  // - MacBook: always software details shown (no "did software" question)
  // - PC: show "did software" question; details only if yes
  setHidden(softwareSection, device === "");
  if (device === "iphone") {
    setHidden(softwareSection, true);
  } else if (device === "mac") {
    setHidden(softwareSection, false);
    setHidden(pcSoftwareDidWrap, true);
    softwareDetails.classList.remove("hidden");
  } else if (device === "pc") {
    setHidden(softwareSection, false);
    setHidden(pcSoftwareDidWrap, false);
    const swDid = getRadio("swDid");
    setHidden(softwareDetails, swDid !== "yes");
  }

  // MacBook: hide driver updates option
  $$(".pcOnly").forEach(el => {
    if (device === "mac") el.parentElement.classList.add("hidden");
    else el.parentElement.classList.remove("hidden");
  });

  // PC hardware details shown only if hwDid yes
  if (device === "pc") {
    const hwDid = getRadio("pcHwDid");
    setHidden(pcHwDetails, hwDid !== "yes");
  }

  // iPhone "Other"
  const iphoneSel = selectedValues(iphoneRepairs);
  setHidden(iphoneOtherWrap, !iphoneSel.includes("other"));

  // PC parts / custom build handling
  if (device === "pc") {
    const parts = selectedValues(pcHwParts);

    const customSelected = parts.includes("custom build");
    setHidden(customBuildWrap, !customSelected);

    if (customSelected) {
      // if custom build selected, force only that option selected
      Array.from(pcHwParts.options).forEach(opt => {
        if (opt.value !== "custom build") opt.selected = false;
      });
      pcSelectedParts = ["custom build"];
      // no part actions list for custom build
      setHidden(pcPartActions, true);
    } else {
      pcSelectedParts = parts;
      setHidden(pcPartActions, pcSelectedParts.length === 0);
      renderPartActions(pcSelectedParts);
    }
  }

  // Hardware success -> failure reason
  const hwSuccess = getRadio("pcHwSuccess");
  setHidden(pcHwFailWrap, hwSuccess !== "no");

  // Diagnostics nested
  setHidden(diagWrap, !swDiagnostics.checked);
  const diagPass = getRadio("diagPass");
  setHidden(diagFailWrap, diagPass !== "no" || !swDiagnostics.checked);

  const diagReplaced = getRadio("diagReplaced");
  setHidden(diagNowPassWrap, diagPass !== "no" || diagReplaced !== "yes" || !swDiagnostics.checked);

  // OS repair nested
  setHidden(osRepairWrap, !swOsRepair.checked);

  // DBU nested
  setHidden(dbuWrap, !swDbu.checked);
  const dbuSuccess = getRadio("dbuSuccess");
  setHidden(dbuFailReasonWrap, dbuSuccess !== "no" || !swDbu.checked);

  // Installs nested
  setHidden(installsWrap, !swInstalls.checked);

  // AV nested
  setHidden(avWrap, !swAv.checked);
  setHidden(avOtherWrap, avName.value !== "Other" || !swAv.checked);

  // OS install nested
  setHidden(osInstallWrap, !swOsInstall.checked);

  // final section visible once device chosen
  setHidden(finalSection, device === "");
}

function renderPartActions(parts) {
  // preserve existing selections where possible
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

  // clean out removed parts
  for (const key of Array.from(partActionMap.keys())) {
    if (!parts.includes(key)) partActionMap.delete(key);
  }
}

// ----------------- installs chips -----------------
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

// ----------------- generation logic -----------------
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

  const sentences = [];

  // ---- device specific: iPhone ----
    const reps = selectedValues(iphoneRepairs)
      .filter(v => v !== "other")
      .map(v => {
        if (v === "whole unit") return "a whole unit replacement";
        if (v === "truedepth") return "the TrueDepth system";
        return `the ${v}`;
      });


    const other = (iphoneOther.value || "").trim();
    if (selectedValues(iphoneRepairs).includes("other") && other) reps.push(other);

    if (reps.length > 0) {
      sentences.push(sentence(`Replaced ${joinHuman(reps)}`));
    } else {
      sentences.push(sentence("Hardware repair completed"));
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

  // ---- PC / Mac shared: software actions ----
  // PC hardware (if PC)
  let isCustomBuild = false;

  if (device === "pc") {
    const hwDid = getRadio("pcHwDid");
    if (hwDid === "yes") {
      const parts = selectedValues(pcHwParts);
      if (parts.includes("custom build")) {
        isCustomBuild = true;

        const cbType = getRadio("customBuildType");
        if (cbType === "built") {
          sentences.push(sentence("Built a new custom PC from components"));
        } else if (cbType === "reassembled") {
          sentences.push(sentence("Reassembled customer-provided custom PC"));
        } else {
          sentences.push(sentence("Custom PC build completed"));
        }
      } else if (parts.length > 0) {
        // narrative hardware actions
        const actionGroups = { installed: [], replaced: [] };
        parts.forEach(p => {
          const act = partActionMap.get(p) || "installed";
          actionGroups[act].push(capFirst(p));
        });

        if (actionGroups.installed.length) {
          sentences.push(sentence(`Installed ${joinHuman(actionGroups.installed).toLowerCase()}`));
        }
        if (actionGroups.replaced.length) {
          sentences.push(sentence(`Replaced ${joinHuman(actionGroups.replaced).toLowerCase()}`));
        }
      } else {
        sentences.push(sentence("Hardware work completed"));
      }

      const hwSuccess = getRadio("pcHwSuccess");
      if (hwSuccess === "no") {
        sentences.push(sentence("Hardware work was unsuccessful"));
        const reason = (pcHwFailReason.value || "").trim();
        if (reason) sentences.push(sentence(reason));
        if (pcHwIncludeRec.checked) {
          sentences.push(sentence("Recommended additional service and/or part replacement as needed"));
        }
      }
    }
  }

  // Determine whether software details should be considered
  let softwareEnabled = true;
  if (device === "pc") softwareEnabled = (getRadio("swDid") === "yes");
  if (device === "mac") softwareEnabled = true;

  // For ordering:
  // Normal order:
  // 1 Hardware repair, 2 OS install, 3 Setup, 4 Diagnostics, 5 OS repair, 6 DBU, 7 Installs, 8 AV, 9 Recycling, 10 Extra
  // Custom build override:
  // custom build -> OSI -> setup -> diags -> everything else
  // (Our sentence list already may include custom build/hardware sentence at the start.)

  // We'll build software sentences into buckets and then append in correct order.
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
          bucket.osInstall.push(sentence(`Performed a ${os} installation with personal files preserved (software and applications do not carry over)`));
        } else {
          bucket.osInstall.push(sentence(`Performed a clean ${os} installation`));
        }
      } else {
        bucket.osInstall.push(sentence("Performed an operating system installation"));
      }
    }

    // Setup
    if (swSetup.checked) {
      bucket.setup.push(sentence("Completed device setup"));
    }

    // Diagnostics
    if (swDiagnostics.checked) {
      const pass = getRadio("diagPass");
      if (pass === "yes") {
        bucket.diagnostics.push(sentence("All diagnostics passed"));
      } else {
        const fails = selectedValues(diagFailParts).map(v => v.toUpperCase() === "HDD/SSD" ? "HDD/SSD" : v);
        if (fails.length) {
          bucket.diagnostics.push(sentence(`Diagnostics identified issues with ${joinHuman(fails)}`));
        } else {
          bucket.diagnostics.push(sentence("Diagnostics identified hardware-related issues"));
        }

        const replaced = getRadio("diagReplaced");
        if (replaced === "yes") {
          const nowPass = getRadio("diagNowPass");
          if (nowPass === "yes") bucket.diagnostics.push(sentence("Diagnostics pass after service"));
          else bucket.diagnostics.push(sentence("Diagnostics still indicate issues after service"));
        } else {
          if (diagIncludeRec.checked) {
            bucket.diagnostics.push(sentence("Recommended replacement of the affected component(s)"));
          }
        }
      }
    }

    // OS repair
    if (swOsRepair.checked) {
      const v = Number(virusesRemoved.value || 0);
      const p = Number(policiesRemoved.value || 0);

      // always include generic statement if selected
      let base = "Performed operating system repair and verified system stability";
      const extras = [];
      if (v > 0) extras.push(`${v} virus${v === 1 ? "" : "es"} removed`);
      if (p > 0) extras.push(`${p} malicious policy${p === 1 ? "" : "ies"} removed`);
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
      // per your preference: “Installed requested applications”
      bucket.installs.push(sentence("Installed requested applications"));
      // If they added items, we can optionally include them without making it messy:
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

  // Now append buckets in strict order (OSI -> Setup -> Diags -> rest)
  // Custom build override is already satisfied because custom build sentence is first, then we append OSI/Setup/Diags next.
  sentences.push(...bucket.osInstall);
  sentences.push(...bucket.setup);
  sentences.push(...bucket.diagnostics);

  // everything else in the order you want
  sentences.push(...bucket.osRepair);
  sentences.push(...bucket.dbu);
  sentences.push(...bucket.installs);
  sentences.push(...bucket.av);
  sentences.push(...bucket.updates);
  sentences.push(...bucket.driverUpdates);

  if (recycled.checked) {
    sentences.push(sentence("Device recycled per customer request"));
  }

  const extra = (extraComments.value || "").trim();
  if (extra) sentences.push(sentence(extra));

  const para = sentences.join(" ").trim() + ` - ${init}`;
  return enforceLength(para);
}

function enforceLength(note) {
  // soft warning if long; do not truncate automatically (agent may want full context)
  const words = note.trim().split(/\s+/).filter(Boolean).length;
  if (words > 500) {
    warn.textContent = `Note is about ${words} words. Consider shortening to stay under ~500 words.`;
    warn.classList.remove("hidden");
  }
  return note;
}

// ----------------- events -----------------
deviceSel.addEventListener("change", () => {
  // reset device-specific state minimally
  refreshUI();
});

iphoneRepairs.addEventListener("change", refreshUI);
avName.addEventListener("change", refreshUI);

pcHwParts.addEventListener("change", refreshUI);
$$('input[name="pcHwDid"]').forEach(el => el.addEventListener("change", refreshUI));
$$('input[name="pcHwSuccess"]').forEach(el => el.addEventListener("change", refreshUI));
$$('input[name="swDid"]').forEach(el => el.addEventListener("change", refreshUI));
$$('input[name="diagPass"]').forEach(el => el.addEventListener("change", refreshUI));
$$('input[name="diagReplaced"]').forEach(el => el.addEventListener("change", refreshUI));
$$('input[name="dbuSuccess"]').forEach(el => el.addEventListener("change", refreshUI));

[
  swDiagnostics, swOsRepair, swDbu, swInstalls, swAv, swOsInstall, swSetup, swUpdates, swDriverUpdates
].forEach(el => el.addEventListener("change", refreshUI));

generateBtn.addEventListener("click", () => {
  const note = buildNote();
  output.value = note;

  // store initials for convenience
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
  // quick reset by reloading UI state but keeping initials from localStorage
  const keepInit = normalizeInitials(initials.value) || localStorage.getItem("gs_notes_initials") || "";
  document.querySelectorAll("input, select, textarea").forEach(el => {
    if (el.id === "initials") return;
    if (el.type === "checkbox") el.checked = false;
    else if (el.type === "radio") {
      // leave radios to default by full reload-like reset:
    } else if (el.tagName === "SELECT") {
      el.value = "";
      Array.from(el.options).forEach(o => o.selected = false);
    } else {
      el.value = "";
    }
  });

  // restore defaults for radios
  // PC defaults
  document.querySelector('input[name="pcHwDid"][value="no"]').checked = true;
  document.querySelector('input[name="pcHwSuccess"][value="yes"]').checked = true;
  pcHwIncludeRec.checked = false;

  // Software defaults
  const swDidNo = document.querySelector('input[name="swDid"][value="no"]');
  if (swDidNo) swDidNo.checked = true;

  // Diagnostics defaults
  document.querySelector('input[name="diagPass"][value="yes"]').checked = true;
  document.querySelector('input[name="diagReplaced"][value="no"]').checked = true;
  document.querySelector('input[name="diagNowPass"][value="yes"]').checked = true;

  // DBU defaults
  document.querySelector('input[name="dbuSuccess"][value="yes"]').checked = true;

  // OS install files preserved default yes
  document.querySelector('input[name="filesPreserved"][value="yes"]').checked = true;

  softwareItems = [];
  renderSoftwareChips();
  partActionMap.clear();
  output.value = "";
  warn.classList.add("hidden");

  initials.value = keepInit;
  refreshUI();
});

const sendFeedbackBtn = document.getElementById("sendFeedbackBtn");
const feedbackText = document.getElementById("feedbackText");

if (sendFeedbackBtn) {
  sendFeedbackBtn.addEventListener("click", () => {
    const text = (feedbackText.value || "").trim();

    if (!text) {
      alert("Please enter feedback before sending.");
      return;
    }

    const subject = encodeURIComponent("Geek Squad Notes Generator Feedback");
    const body = encodeURIComponent(text);

    window.location.href =
      `mailto:gavin.couch@bestbuy.com?subject=${subject}&body=${body}`;
  });
}

// init
(function init() {
  initials.value = localStorage.getItem("gs_notes_initials") || "";
  refreshUI();
})();
