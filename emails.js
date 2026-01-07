/* Emails (V1) */

const $ = (id) => document.getElementById(id);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

const emailType = $("emailType");
const araName = $("araName");

const bitlockerSection = $("bitlockerSection");
const pickupSection = $("pickupSection");
const closingSection = $("closingSection");
const partfailedSection = $("partfailedSection");

const emailOutputSection = $("emailOutputSection");
const emailSubject = $("emailSubject");
const emailBody = $("emailBody");
const emailWarn = $("emailWarn");

const genEmailBtn = $("genEmailBtn");
const copySubjectBtn = $("copySubjectBtn");
const copyBodyBtn = $("copyBodyBtn");
const resetEmailBtn = $("resetEmailBtn");

// Pickup fields
const pickupNotes = $("pickupNotes");

// Closing fields
const closingIphoneCount = $("closingIphoneCount");
const closeCxName = $("closeCxName");
const closeWorkOrder = $("closeWorkOrder");
const closeStatus = $("closeStatus");
const addCloseItemBtn = $("addCloseItemBtn");
const closeItemsList = $("closeItemsList");

let closingItems = [];

// Part failed fields
const failedPart = $("failedPart");
const failedExtra = $("failedExtra");

function setHidden(el, hidden) {
  el.classList.toggle("hidden", !!hidden);
}

function getRadio(name) {
  const el = document.querySelector(`input[name="${name}"]:checked`);
  return el ? el.value : "";
}

function sentence(s) {
  const t = (s || "").trim();
  if (!t) return "";
  return /[.!?]$/.test(t) ? t : (t + ".");
}

function joinLines(lines) {
  return lines.filter(Boolean).join("\n");
}

function clearWarn() {
  emailWarn.classList.add("hidden");
  emailWarn.textContent = "";
}

function warn(msg) {
  emailWarn.textContent = msg;
  emailWarn.classList.remove("hidden");
}

function refreshUI() {
  const t = emailType.value;

  setHidden(bitlockerSection, t !== "bitlocker");
  setHidden(pickupSection, t !== "pickup");
  setHidden(closingSection, t !== "closing");
  setHidden(partfailedSection, t !== "partfailed");

  setHidden(emailOutputSection, t === "");
}

emailType.addEventListener("change", refreshUI);

// ---------- Closing chips ----------
function renderClosingChips() {
  closeItemsList.innerHTML = "";
  closingItems.forEach((item, idx) => {
    const chip = document.createElement("span");
    chip.className = "chip";

    const woPart = item.wo ? ` (WO#${item.wo})` : "";
    chip.textContent = `${item.name}${woPart} - ${item.status}`;

    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = "×";
    btn.title = "Remove";
    btn.addEventListener("click", () => {
      closingItems.splice(idx, 1);
      renderClosingChips();
    });

    chip.appendChild(btn);
    closeItemsList.appendChild(chip);
  });
}

addCloseItemBtn.addEventListener("click", () => {
  const name = (closeCxName.value || "").trim();
  const wo = (closeWorkOrder.value || "").trim();
  const status = (closeStatus.value || "").trim();
  if (!name || !status) return;

  closingItems.push({ name, wo, status });

  closeCxName.value = "";
  closeWorkOrder.value = "";
  closeStatus.value = "";
  renderClosingChips();
});

// ---------- Template builders ----------
function buildBitLockerEmail(ara) {
  const subject = "Action Needed: BitLocker Recovery Key Required";
  const bodyLines = [
    `Hi,`,
    ``,
    `We are currently working on your device, but it is protected by BitLocker and we need the BitLocker recovery key to continue service.`,
    ``,
    `Please reply to this email with your BitLocker recovery key.`,
    ``,
    `How to find your BitLocker recovery key (most common method):`,
    `1) On another device, go to your Microsoft account recovery keys page.`,
    `2) Sign in with the Microsoft account used on the locked device.`,
    `3) Locate the matching key and copy it.`,
    `4) Reply to this email and paste the key.`,
    ``,
    `If you need assistance locating the recovery key, you may also visit the store for help.`,
    ``,
    `Thank you,`,
    `${ara}`,
  ];

  return { subject, body: joinLines(bodyLines) };
}

function buildPickupEmail(ara) {
  const reason = getRadio("pickupReason");
  const reasonLine =
    reason === "late"
      ? "We are sending this email because it was too late in the day to call."
      : "We are sending this email because we were unable to reach you by phone.";

  const extra = (pickupNotes.value || "").trim();
  const extraLine = extra ? `Additional note: ${extra}` : "";

  const subject = "Your Device Is Ready for Pickup";
  const bodyLines = [
    `Hi,`,
    ``,
    reasonLine,
    extraLine,
    ``,
    `Your device is ready for pickup.`,
    ``,
    `Please schedule a pickup appointment by calling the number on your service receipt or by using the Best Buy website/app.`,
    `Walk-ins are allowed, but appointments are serviced first.`,
    ``,
    `Please bring a photo ID when you come to pick up your device.`,
    ``,
    `Thank you,`,
    `${ara}`,
  ].filter(line => line !== "");

  return { subject, body: joinLines(bodyLines) };
}

function buildClosingEmail(ara) {
  const rawCount = (closingIphoneCount?.value || "").trim();
  const iphoneCount = rawCount === "" ? "0" : rawCount;

  const subject = "Closing Recap: Overnight Devices";

  const lines = [];

  // Greeting
  lines.push("Hi team,");
  lines.push("");

  // iPhone count
  lines.push(`iPhone repairs: ${iphoneCount}`);
  lines.push("");

  // Header
  lines.push("Devices staying overnight:");
  lines.push("");

  // Customer entries
  if (closingItems.length === 0) {
    lines.push("No devices remaining overnight.");
  } else {
    closingItems.forEach((item, index) => {
      const woPart = item.wo ? ` (WO#${item.wo})` : "";
      lines.push(`${item.name}${woPart} - ${item.status}`);

      // blank line BETWEEN customers
      if (index !== closingItems.length - 1) {
        lines.push("");
      }
    });
  }

  // Space before closing
  lines.push("");
  lines.push("Thank you,");
  lines.push("");
  lines.push(ara);

  return { subject, body: joinLines(lines) };
}

function buildPartFailedEmail(ara) {
  const part = (failedPart.value || "").trim() || "a component";
  const extra = (failedExtra.value || "").trim();

  const subject = "Update Needed: Part Failure Identified";
  const bodyLines = [
    `Hi,`,
    ``,
    `During service, diagnostics indicate ${part} is failing and will need to be replaced to continue the repair.`,
    extra ? `${extra}` : ``,
    ``,
    `Please schedule a revisit appointment by calling the number on your service receipt, or call us back for further details.`,
    ``,
    `Thank you,`,
    `${ara}`,
  ].filter(Boolean);

  return { subject, body: joinLines(bodyLines) };
}

// ---------- Generate ----------
genEmailBtn.addEventListener("click", () => {
  clearWarn();

  const t = emailType.value;
  const ara = (araName.value || "").trim();
  if (!t) return warn("Select an email template.");
  if (!ara) return warn("ARA name is required.");

  let out;
  if (t === "bitlocker") out = buildBitLockerEmail(ara);
  if (t === "pickup") out = buildPickupEmail(ara);
  if (t === "closing") out = buildClosingEmail(ara);
  if (t === "partfailed") out = buildPartFailedEmail(ara);

  emailSubject.value = out.subject;
  emailBody.value = out.body;

  localStorage.setItem("gs_emails_ara", ara);
});

// ---------- Copy ----------
async function copyText(text, okMsg) {
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    warn(okMsg);
    setTimeout(clearWarn, 1200);
  } catch {
    warn("Copy failed. Select the text and copy manually.");
  }
}

copySubjectBtn.addEventListener("click", () => copyText(emailSubject.value, "Subject copied."));
copyBodyBtn.addEventListener("click", () => copyText(emailBody.value, "Body copied."));

// ---------- Reset ----------
resetEmailBtn.addEventListener("click", () => {
  clearWarn();

  emailType.value = "";
  emailSubject.value = "";
  emailBody.value = "";

  pickupNotes.value = "";

closingItems = [];
renderClosingChips();

if (closingIphoneCount) closingIphoneCount.value = "";
closeCxName.value = "";
closeWorkOrder.value = "";
closeStatus.value = "";

  failedPart.value = "";
  failedExtra.value = "";

  refreshUI();
});

// init
(function init() {
  araName.value = localStorage.getItem("gs_emails_ara") || "";
  refreshUI();
})();
