/* =====================================================================
   validate.js — PURE validation functions.

   Not one line in this file touches the DOM, the network or storage.
   It takes values in and returns messages out. That is what makes it:
     - reusable by both forms,
     - the easiest thing in the project to unit test,
     - and the direct twin of the server's src/utils/validate.js.

   Every function returns either null (valid) or a string (the message
   to show the user).

   IMPORTANT: this is CONVENIENCE validation. It makes the form pleasant.
   It is NOT security. Anyone can open DevTools and delete these checks,
   so in Stage 2 the server must run the same rules again before writing
   a single row.
   ===================================================================== */

/* ---------- small helpers ---------- */

function isBlank(value) {
  return value === undefined || value === null || String(value).trim() === '';
}

function domainOf(email) {
  const at = String(email).lastIndexOf('@');
  return at === -1 ? '' : String(email).slice(at + 1).toLowerCase();
}

/* ---------- shared fields ---------- */

function validateFullName(value) {
  if (isBlank(value)) return 'Full name is required.';
  const name = String(value).trim();
  if (name.length < 3) return 'Please enter your full name (at least 3 characters).';
  if (name.length > 80) return 'That name is too long (80 characters maximum).';
  if (!/^[A-Za-z][A-Za-z .'-]*$/.test(name))
    return 'Use letters, spaces, apostrophes and hyphens only.';
  return null;
}

/* official = true applies the recruiter rule: no free mailbox domains. */
function validateEmail(value, options) {
  const official = options && options.official;
  if (isBlank(value)) return 'Email address is required.';
  const email = String(value).trim().toLowerCase();

  // Deliberately simple. The only real proof an address works is a
  // confirmation mail, which Stage 2 can add.
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email))
    return 'Enter a valid email address, for example name@college.edu.';

  if (official && CONFIG.FREE_EMAIL_DOMAINS.includes(domainOf(email)))
    return 'Please use your official company address, not a personal mailbox.';

  return null;
}

function validatePassword(value) {
  if (isBlank(value)) return 'Password is required.';
  const pw = String(value);
  if (pw.length < CONFIG.PASSWORD_MIN)
    return 'Password must be at least ' + CONFIG.PASSWORD_MIN + ' characters.';
  if (!/[A-Za-z]/.test(pw)) return 'Password must contain at least one letter.';
  if (!/[0-9]/.test(pw))    return 'Password must contain at least one number.';
  return null;
}

function validateConfirmPassword(password, confirm) {
  if (isBlank(confirm)) return 'Please type the password again.';
  if (password !== confirm) return 'The two passwords do not match.';
  return null;
}

/* ---------- student-only fields ---------- */

function validateRollNo(value) {
  if (isBlank(value)) return 'University roll number is required.';
  const roll = String(value).trim().toUpperCase();
  if (!CONFIG.ROLL_PATTERN.test(roll))
    return 'Roll number format looks wrong: ' + CONFIG.ROLL_HINT + '.';
  return null;
}

function validateBranch(value) {
  if (isBlank(value)) return 'Please select your branch.';
  if (!CONFIG.BRANCHES.includes(String(value)))
    return 'Select a branch from the list.';
  return null;
}

function validateCgpa(value) {
  if (isBlank(value)) return 'CGPA is required.';
  const n = Number(value);
  if (Number.isNaN(n)) return 'CGPA must be a number.';
  if (n < CONFIG.CGPA_MIN || n > CONFIG.CGPA_MAX)
    return 'CGPA must be between ' + CONFIG.CGPA_MIN + ' and ' + CONFIG.CGPA_MAX + '.';
  // Two decimal places is the usual institute convention.
  if (!/^\d+(\.\d{1,2})?$/.test(String(value).trim()))
    return 'Use at most two decimal places, for example 8.24.';
  return null;
}

function validateBacklogs(value) {
  if (isBlank(value)) return 'Enter 0 if you have no backlogs.';
  const n = Number(value);
  if (!Number.isInteger(n)) return 'Backlogs must be a whole number.';
  if (n < 0) return 'Backlogs cannot be negative.';
  if (n > CONFIG.BACKLOG_MAX)
    return 'That seems too high. Contact the placement cell if it is correct.';
  return null;
}

/* ---------- recruiter-only fields ---------- */

function validateCompanyName(value) {
  if (isBlank(value)) return 'Company name is required.';
  const name = String(value).trim();
  if (name.length < 2) return 'Company name is too short.';
  if (name.length > 100) return 'Company name is too long (100 characters maximum).';
  return null;
}

function validateDesignation(value) {
  if (isBlank(value)) return 'Designation is required.';
  if (String(value).trim().length < 2) return 'Designation is too short.';
  return null;
}

function validateSector(value) {
  if (isBlank(value)) return 'Please select an industry.';
  if (!CONFIG.SECTORS.includes(String(value))) return 'Select an industry from the list.';
  return null;
}

/* Optional: blank is acceptable, a malformed URL is not. */
function validateWebsite(value) {
  if (isBlank(value)) return null;
  const url = String(value).trim();
  if (!/^https?:\/\/[^\s.]+\.[^\s]{2,}$/.test(url))
    return 'Enter a full address starting with https://';
  return null;
}

/* Optional: blank is acceptable, 10 digits if given. */
function validatePhone(value) {
  if (isBlank(value)) return null;
  const digits = String(value).replace(/\D/g, '');
  if (digits.length < 10 || digits.length > 13)
    return 'Enter a 10-digit phone number.';
  return null;
}

/* ---------- whole-form validators ----------
   Each returns { valid, errors } where errors maps field name -> message.
   An empty errors object means the form is good.                        */

function validateStudentForm(data) {
  const errors = {};
  const put = (field, message) => { if (message) errors[field] = message; };

  put('fullName',        validateFullName(data.fullName));
  put('email',           validateEmail(data.email));
  put('password',        validatePassword(data.password));
  put('confirmPassword', validateConfirmPassword(data.password, data.confirmPassword));
  put('rollNo',          validateRollNo(data.rollNo));
  put('branch',          validateBranch(data.branch));
  put('cgpa',            validateCgpa(data.cgpa));
  put('backlogs',        validateBacklogs(data.backlogs));

  return { valid: Object.keys(errors).length === 0, errors: errors };
}

function validateRecruiterForm(data) {
  const errors = {};
  const put = (field, message) => { if (message) errors[field] = message; };

  put('fullName',        validateFullName(data.fullName));
  put('email',           validateEmail(data.email, { official: true }));
  put('password',        validatePassword(data.password));
  put('confirmPassword', validateConfirmPassword(data.password, data.confirmPassword));
  put('companyName',     validateCompanyName(data.companyName));
  put('designation',     validateDesignation(data.designation));
  put('sector',          validateSector(data.sector));
  put('website',         validateWebsite(data.website));
  put('phone',           validatePhone(data.phone));

  return { valid: Object.keys(errors).length === 0, errors: errors };
}
