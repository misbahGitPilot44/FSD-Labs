/* =====================================================================
   register.js — the three-step registration flow.

     Step 1  choose account type  (student | recruiter)
     Step 2  fill the matching form
     Step 3  confirmation, with a preview of the Stage 2 payload

   Concepts on display here, all from the course:
     - querySelector / querySelectorAll
     - event delegation (one listener for both type cards)
     - the submit event and preventDefault()
     - building options from data instead of hardcoding <option> tags
     - separating validation (validate.js) from the DOM (this file)
     - separating persistence (storage.js) from the DOM (this file)
   ===================================================================== */

(function () {
  'use strict';

  /* ---------- element handles, fetched once ---------- */
  const stepper      = document.getElementById('stepper');
  const panels = {
    type:      document.getElementById('step-type'),
    student:   document.getElementById('step-student'),
    recruiter: document.getElementById('step-recruiter'),
    done:      document.getElementById('step-done'),
  };
  const studentForm   = document.getElementById('student-form');
  const recruiterForm = document.getElementById('recruiter-form');

  /* The only piece of state this page keeps. */
  let selectedRole = null;

  /* =================================================================
     1. Populate the dropdowns from CONFIG
     Hardcoding <option> tags in the HTML means editing two places when
     a branch is added. Building them from the array means editing one.
     ================================================================= */
  function fillSelect(selectEl, values) {
    values.forEach(function (value) {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = value;
      selectEl.appendChild(option);
    });
  }

  fillSelect(document.getElementById('s-branch'), CONFIG.BRANCHES);
  fillSelect(document.getElementById('r-sector'), CONFIG.SECTORS);

  /* =================================================================
     2. Moving between steps
     ================================================================= */
  function showPanel(name) {
    Object.keys(panels).forEach(function (key) {
      panels[key].classList.toggle('hidden', key !== name);
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function setStep(number) {
    stepper.querySelectorAll('.step').forEach(function (step) {
      const n = Number(step.dataset.step);
      step.classList.toggle('active', n === number);
      step.classList.toggle('done',   n <  number);
    });
  }

  function goToType() {
    selectedRole = null;
    setStep(1);
    showPanel('type');
  }

  function goToForm(role) {
    selectedRole = role;
    setStep(2);
    showPanel(role);
    // Move focus to the first field so keyboard users are not stranded.
    const first = panels[role].querySelector('input, select');
    if (first) first.focus();
  }

  /* =================================================================
     3. Step 1 — the account-type cards
     ONE listener on the container, not one per card. That is event
     delegation: it keeps working if a third card is added later.
     ================================================================= */
  panels.type.addEventListener('click', function (event) {
    const card = event.target.closest('.type-card');
    if (!card) return;                        // a click on empty space
    goToForm(card.dataset.role);              // "student" or "recruiter"
  });

  /* Back buttons on both forms. */
  document.querySelectorAll('.btn-back').forEach(function (btn) {
    btn.addEventListener('click', goToType);
  });

  /* Show / hide password. Again one listener, delegated from the body. */
  document.body.addEventListener('click', function (event) {
    const toggle = event.target.closest('.pw-toggle');
    if (!toggle) return;
    const input = document.getElementById(toggle.dataset.toggle);
    const isHidden = input.type === 'password';
    input.type = isHidden ? 'text' : 'password';
    toggle.textContent = isHidden ? 'Hide' : 'Show';
  });

  /* =================================================================
     4. Reading and cleaning the form
     ================================================================= */
  function readForm(formEl) {
    const data = {};
    // FormData walks every named control in the form -- no need to list
    // the fields again here, which means adding a field is a one-line
    // change in the HTML only.
    new FormData(formEl).forEach(function (value, name) {
      data[name] = typeof value === 'string' ? value.trim() : value;
    });
    return data;
  }

  /* Normalise before storing: lowercase emails, uppercase roll numbers.
     Do this ONCE, here, so that comparisons later are reliable.
     ("Asha@Mail.com" and "asha@mail.com" must not become two accounts.) */
  function normalise(data) {
    if (data.email)  data.email  = data.email.toLowerCase();
    if (data.rollNo) data.rollNo = data.rollNo.toUpperCase();
    return data;
  }

  /* =================================================================
     5. Showing errors
     ================================================================= */
  function clearErrors(formEl) {
    formEl.querySelectorAll('.field').forEach(function (field) {
      field.classList.remove('invalid');
      const msg = field.querySelector('.error');
      if (msg) msg.textContent = '';
    });
    const banner = formEl.parentElement.querySelector('.notice-err');
    if (banner) { banner.classList.add('hidden'); banner.textContent = ''; }
  }

  function showErrors(formEl, errors) {
    let firstInvalid = null;

    Object.keys(errors).forEach(function (name) {
      const field = formEl.querySelector('[data-field="' + name + '"]');
      if (!field) return;
      field.classList.add('invalid');
      const msg = field.querySelector('.error');
      if (msg) msg.textContent = errors[name];
      if (!firstInvalid) firstInvalid = field;
    });

    if (firstInvalid) {
      const input = firstInvalid.querySelector('input, select');
      if (input) input.focus();
    }
  }

  function showBanner(formEl, message) {
    const banner = formEl.parentElement.querySelector('.notice-err');
    if (!banner) return;
    banner.textContent = message;
    banner.classList.remove('hidden');
  }

  /* Re-validate one field as soon as the user leaves it, so mistakes are
     caught early rather than all at once on submit. */
  function wireLiveValidation(formEl, validator) {
    formEl.addEventListener('blur', function (event) {
      const field = event.target.closest('.field');
      if (!field) return;
      const name = field.dataset.field;
      const result = validator(normalise(readForm(formEl)));
      if (result.errors[name]) {
        field.classList.add('invalid');
        field.querySelector('.error').textContent = result.errors[name];
      } else {
        field.classList.remove('invalid');
        field.querySelector('.error').textContent = '';
      }
    }, true);   // capture phase: blur does not bubble
  }

  wireLiveValidation(studentForm,   validateStudentForm);
  wireLiveValidation(recruiterForm, validateRecruiterForm);

  /* =================================================================
     6. Building the record
     Two shapes matter here:
       record  -> what Stage 1 keeps in localStorage (NO password)
       payload -> what Stage 2 will POST to the API (password included,
                  sent over HTTPS and hashed server-side)
     ================================================================= */
  function buildStudentRecord(data) {
    return {
      role:        'student',
      fullName:    data.fullName,
      email:       data.email,
      passwordSet: true,          // deliberately not the password itself
      rollNo:      data.rollNo,
      branch:      data.branch,
      cgpa:        Number(data.cgpa),
      backlogs:    Number(data.backlogs),
      isPlaced:    false,         // mirrors students.is_placed
    };
  }

  function buildRecruiterRecord(data) {
    return {
      role:        'recruiter',
      fullName:    data.fullName,
      email:       data.email,
      passwordSet: true,
      designation: data.designation,
      companyName: data.companyName,
      sector:      data.sector,
      website:     data.website || null,
      phone:       data.phone || null,
      isApproved:  false,         // mirrors companies.is_approved -- the TPO gate
    };
  }

  function buildPayload(data, role) {
    // Exactly what POST /api/auth/register will carry in Stage 2.
    const base = {
      role:     role,
      fullName: data.fullName,
      email:    data.email,
      password: '********',       // masked for the on-screen preview only
    };
    return role === 'student'
      ? Object.assign(base, {
          rollNo:   data.rollNo,
          branch:   data.branch,
          cgpa:     Number(data.cgpa),
          backlogs: Number(data.backlogs),
        })
      : Object.assign(base, {
          designation: data.designation,
          companyName: data.companyName,
          sector:      data.sector,
          website:     data.website || null,
          phone:       data.phone || null,
        });
  }

  /* =================================================================
     7. THE ONE FUNCTION STAGE 2 REPLACES
     Everything above and below stays as it is. Only the body of this
     function changes from "write to localStorage" to "POST to the API".
     ================================================================= */
  async function submitRegistration(record, data) {

    if (!CONFIG.USE_API) {
      // ---- STAGE 1: the browser is the database ----
      return Storage.saveAccount(record);
    }

    // ---- STAGE 2: the real thing. Set CONFIG.USE_API = true. ----
    try {
      const response = await fetch(CONFIG.API_BASE + '/auth/register', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        // The real password goes here -- never the masked one.
        body: JSON.stringify(Object.assign(buildPayload(data, record.role), {
          password: data.password,
        })),
      });

      const body = await response.json();

      // Remember: fetch does NOT throw on 400 or 409. Check res.ok.
      if (!response.ok) {
        return {
          ok: false,
          field: body.field || null,
          error: body.error || 'Registration failed. Please try again.',
        };
      }
      return { ok: true, account: body };

    } catch (networkError) {
      // This catch only fires when the request never reached the server.
      console.error(networkError);
      return {
        ok: false,
        field: null,
        error: 'Could not reach the server. Is the API running?',
      };
    }
  }

  /* =================================================================
     8. Submit handlers
     ================================================================= */
  function handleSubmit(formEl, validator, buildRecord, role) {
    return async function (event) {
      event.preventDefault();          // stop the browser's own submit
      clearErrors(formEl);

      const data = normalise(readForm(formEl));

      // (a) validate in the browser -- courtesy, not security
      const check = validator(data);
      if (!check.valid) {
        showErrors(formEl, check.errors);
        return;
      }

      // (b) persist
      const submitBtn = formEl.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Creating account...';

      const result = await submitRegistration(buildRecord(data), data);

      submitBtn.disabled = false;
      submitBtn.textContent = role === 'student'
        ? 'Create student account'
        : 'Create recruiter account';

      if (!result.ok) {
        // A duplicate email comes back as a field error, so it lands
        // under the right input rather than in a vague banner.
        if (result.field) {
          const errors = {};
          errors[result.field] = result.error;
          showErrors(formEl, errors);
        } else {
          showBanner(formEl, result.error);
        }
        return;
      }

      // (c) success
      showDone(role, data, result.account);
      formEl.reset();
    };
  }

  studentForm.addEventListener('submit',
    handleSubmit(studentForm, validateStudentForm, buildStudentRecord, 'student'));

  recruiterForm.addEventListener('submit',
    handleSubmit(recruiterForm, validateRecruiterForm, buildRecruiterRecord, 'recruiter'));

  /* =================================================================
     9. The confirmation step
     ================================================================= */
  function showDone(role, data, account) {
    setStep(3);

    document.getElementById('done-title').textContent =
      role === 'student' ? 'Student account created' : 'Recruiter account created';

    document.getElementById('done-message').textContent =
      role === 'student'
        ? 'Welcome, ' + data.fullName + '. Your roll number ' + data.rollNo +
          ' is registered. Log in to see the jobs you are eligible for.'
        : 'Thank you, ' + data.fullName + '. ' + data.companyName +
          ' is registered and now waiting for TPO approval.';

    document.getElementById('payload-preview').textContent =
      JSON.stringify(buildPayload(data, role), null, 2);

    showPanel('done');
    console.log('Saved account:', account);
  }

  /* Start at step 1. */
  goToType();

})();
