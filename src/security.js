export const escapeHtml = (str) =>
  String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

export const validateEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) && email.length <= 254;

export const validatePhone = (phone) => {
  if (!phone) return true;
  const digits = phone.replace(/\D/g, "");
  return digits.length === 10 || (digits.length === 11 && digits[0] === "1");
};

export const sanitizePhone = (phone) =>
  phone.replace(/\D/g, "").replace(/^1(\d{10})$/, "$1");

export const validateZip = (zip) => /^\d{5}$/.test(zip);

export const filterNumeric = (raw, { allowDecimal = true, maxDecimalPlaces = 2 } = {}) => {
  let v = String(raw).replace(/[^0-9.]/g, "");
  const parts = v.split(".");
  if (parts.length > 2) v = parts[0] + "." + parts.slice(1).join("");
  if (!allowDecimal) v = v.replace(/\./g, "");
  if (allowDecimal && v.includes(".")) {
    const [int, dec] = v.split(".");
    v = int + "." + dec.slice(0, maxDecimalPlaces);
  }
  return v;
};

const submissionTimestamps = [];
export const checkRateLimit = () => {
  const now = Date.now();
  const fiveMinAgo = now - 5 * 60 * 1000;
  while (submissionTimestamps.length && submissionTimestamps[0] < fiveMinAgo) {
    submissionTimestamps.shift();
  }
  if (submissionTimestamps.length >= 3) return false;
  submissionTimestamps.push(now);
  return true;
};
