/* =====================================================================
   config.js — every rule a college might want to change, in one place.
   Loaded before every other script.

   Teaching note: when a rule lives in ONE named constant, changing it is
   a one-line edit. When it is scattered through the forms, it is an
   afternoon of searching. This file is the front-end twin of the
   server's .env file.
   ===================================================================== */

const CONFIG = {

  /* Branches offered by the institute (Student form dropdown). */
  BRANCHES: [
    'CSE',      // Computer Science and Engineering
    'IT',       // Information Technology
    'ECE',      // Electronics and Communication
    'EE',       // Electrical Engineering
    'ME',       // Mechanical Engineering
    'CIVIL',    // Civil Engineering
    'CHE',      // Chemical Engineering
    'BIOTECH',  // Biotechnology
  ],

  /* University roll number format.
     Default: 6 to 12 characters, digits and capital letters only.
     Example of a stricter institute rule: /^\d{9}$/ for 102103001 */
  ROLL_PATTERN: /^[0-9A-Z]{6,12}$/,
  ROLL_HINT: '6 to 12 characters, digits and capital letters (e.g. 102103001)',

  /* CGPA scale. Change MAX to 4 for a 4-point scale. */
  CGPA_MIN: 0,
  CGPA_MAX: 10,

  /* A sanity ceiling so a typo like 500 is caught. */
  BACKLOG_MAX: 20,

  /* Password policy. Kept deliberately modest so a demo is not painful. */
  PASSWORD_MIN: 8,

  /* A recruiter must use an official company address, not a free mailbox.
     Delete entries here to relax the rule. */
  FREE_EMAIL_DOMAINS: [
    'gmail.com', 'googlemail.com', 'yahoo.com', 'yahoo.in',
    'hotmail.com', 'outlook.com', 'live.com', 'rediffmail.com',
    'protonmail.com', 'icloud.com', 'aol.com', 'mail.com',
  ],

  /* Industry list for the recruiter form. */
  SECTORS: [
    'IT Services', 'Product / Software', 'Core Engineering',
    'Analytics / Data', 'Finance / Banking', 'Consulting',
    'Manufacturing', 'Research', 'Other',
  ],

  /* localStorage key. Namespaced so it cannot collide with another app
     served from the same origin. */
  STORAGE_KEY: 'campushire.accounts',

  /* STAGE 2: when the API exists, set this and flip USE_API to true.
     Nothing else in the project needs to change -- see js/register.js,
     function submitRegistration(). */
  USE_API: false,
  API_BASE: 'http://localhost:5000/api',
};
