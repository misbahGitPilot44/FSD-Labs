# CampusHire Portal — Stage 1 (front end only)

Registration flow for the CampusHire campus-recruitment portal, built with
plain **HTML + CSS + JavaScript**. No framework, no build step, no server.

```
Landing page  →  Register  →  Select account type  →  Student form
                                                   →  Recruiter form
                                                   →  Confirmation
```

All data is written to the browser's `localStorage`. **Stage 2** replaces
one function with a `fetch()` call to `POST /api/auth/register`; nothing
else changes.

---

## Run it

No install needed. Either:

- open `client/index.html` directly in a browser, **or**
- better: right-click `client/index.html` in VS Code → **Open with Live
  Server** (gives you `http://localhost:5500`, the same origin the API
  will expect in Stage 2).

---

## Files

| File | What it does |
| --- | --- |
| `client/index.html` | Landing page: heading, Register / Login, the three roles |
| `client/register.html` | The three-step registration wizard |
| `client/login.html` | Login form (validates, but tells the truth: no auth until Stage 3) |
| `client/accounts.html` | **Teaching aid** — shows everything in localStorage as a table |
| `client/css/style.css` | All styling. Design tokens at the top |
| `client/js/config.js` | Every tweakable rule: branches, roll-number pattern, CGPA scale, password policy, blocked email domains |
| `client/js/validate.js` | **Pure** validation functions. No DOM, no storage, no network |
| `client/js/storage.js` | The Stage 1 stand-in for the database |
| `client/js/register.js` | The wizard: steps, events, submit, confirmation |
| `client/js/login.js` | Stage 1 placeholder, with the Stage 3 code in a comment |

---

## Fields collected

**Student** — Full name, Email, Password, University roll number, Branch,
CGPA, Number of backlogs.

**Recruiter** — Full name, Official email, Password, Company name, plus
verification fields for the TPO: Designation, Industry, Website
(optional), Office phone (optional).

`Confirm password` is on both forms. It was not in the original field
list; delete the field from the HTML and its line from `validate.js` if
you do not want it.

---

## The three things to point out in class

**1. Validation in the browser is courtesy, not security.**
Open DevTools, delete the `required` attribute, submit. It goes through.
Everything in `validate.js` must be run **again** on the server in Stage 2.
That is why the file is pure functions — the same logic becomes
`server/src/utils/validate.js`.

**2. The password is deliberately not stored.**
`localStorage` is plain text that any script on this origin can read.
`storage.js` saves `passwordSet: true` and nothing more. The password
only ever travels over HTTPS and is hashed with bcrypt on the server.
`accounts.html` has no password column, on purpose.

**3. Duplicate checks here preview database constraints.**
`storage.js` rejects a repeated email and a repeated roll number. In
Stage 2 those become `UNIQUE` constraints on `users.email` and
`students.roll_no`, and the API returns `409 Conflict`. The browser check
is a courtesy; the database is the guarantee.

---

## Moving to Stage 2

Two edits, both in files you already have:

1. In `client/js/config.js`:
   ```js
   USE_API: true,
   API_BASE: 'http://localhost:5000/api',
   ```
2. Nothing else. `submitRegistration()` in `register.js` already contains
   the `fetch()` branch, including the `res.ok` check that students always
   forget — `fetch` does **not** throw on a 400 or a 409.

The confirmation screen already prints the exact JSON that will be sent,
so students can compare it against the API contract before writing a
single line of back-end code.

---

## Suggested lab exercises

1. Add a **Date of birth** field to the student form, end to end:
   HTML → `validate.js` → `buildStudentRecord()` → `accounts.html`.
2. Change the roll-number rule in `config.js` to your institute's actual
   format and watch every error message update.
3. Register with `CGPA = 11` and explain which function rejected it.
4. Register the same email twice and find the exact line that produced the
   error. Then name the SQL constraint it will become.
5. Delete `validate.js` from `register.html` and describe what breaks, and
   why the server would still be safe if it existed.
