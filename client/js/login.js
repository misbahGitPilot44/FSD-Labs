/* =====================================================================
   login.js — Stage 1 placeholder.

   The form validates its inputs and then tells the user, honestly, that
   there is nothing to log in to yet. It does NOT pretend to authenticate.

   Why it cannot work in Stage 1: storage.js deliberately never saves a
   password, so the browser has nothing to compare against. That is the
   correct trade-off. A "login" that compares plain-text passwords held
   in localStorage would teach exactly the wrong habit.

   In Stage 3 the body of attemptLogin() becomes:

       const res = await fetch(CONFIG.API_BASE + '/auth/login', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ email, password }),
       });
       const body = await res.json();
       if (!res.ok) return { ok: false, error: body.error };
       localStorage.setItem('campushire.token', body.token);   // the JWT
       return { ok: true, role: body.user.role };

   ...and then the page redirects by role:

       window.location.href = role + '.html';

   SECURITY, and this is the line to repeat in class:
   that redirect is CONVENIENCE, not protection. A student can open
   DevTools and navigate straight to tpo.html. What actually protects the
   data is that every API call carries the signed token, and the server
   re-checks the role on every single request.
   ===================================================================== */

(function () {
  'use strict';

  const form    = document.getElementById('login-form');
  const result  = document.getElementById('login-result');

  /* Reuse the same show/hide password behaviour as the register page. */
  document.body.addEventListener('click', function (event) {
    const toggle = event.target.closest('.pw-toggle');
    if (!toggle) return;
    const input = document.getElementById(toggle.dataset.toggle);
    const isHidden = input.type === 'password';
    input.type = isHidden ? 'text' : 'password';
    toggle.textContent = isHidden ? 'Hide' : 'Show';
  });

  function setFieldError(name, message) {
    const field = form.querySelector('[data-field="' + name + '"]');
    if (!field) return;
    field.classList.toggle('invalid', Boolean(message));
    field.querySelector('.error').textContent = message || '';
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();

    const email    = (form.elements.email.value || '').trim().toLowerCase();
    const password = form.elements.password.value || '';

    // Validation still runs -- the rules live in validate.js, shared with
    // the registration forms.
    const emailError    = validateEmail(email);
    const passwordError = password ? null : 'Password is required.';

    setFieldError('email', emailError);
    setFieldError('password', passwordError);
    if (emailError || passwordError) return;

    // Stage 1: no authentication. Be honest about it, but still give a
    // useful answer -- does an account with this email exist at all?
    const account = Storage.findByEmail(email);

    result.classList.remove('hidden', 'notice-info', 'notice-ok', 'notice-err');
    if (account) {
      result.classList.add('notice-ok');
      result.innerHTML =
        '<strong>Account found.</strong> ' + account.fullName +
        ' is registered in this browser as a <em>' + account.role + '</em>. ' +
        'Signing in needs the API, which arrives in Stage 3.';
    } else {
      result.classList.add('notice-err');
      result.innerHTML =
        '<strong>No account with that email</strong> in this browser. ' +
        'Try <a href="register.html">registering</a> first.';
    }
  });

})();
