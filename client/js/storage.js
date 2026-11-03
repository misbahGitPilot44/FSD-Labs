/* =====================================================================
   storage.js — Stage 1 stand-in for the database.

   Everything here writes to localStorage under ONE namespaced key.
   In Stage 2 this whole file is replaced by HTTP calls; the function
   names stay the same so the rest of the code does not change.

   -------------------------------------------------------------------
   SECURITY NOTE, and please say this out loud in class:
   we deliberately DO NOT store the password.
   localStorage is plain text, readable by any script on this origin and
   by anyone who opens DevTools. A password belongs nowhere except in
   transit over HTTPS and then hashed (bcrypt) on the server. So the
   record keeps { passwordSet: true } and nothing more.
   -------------------------------------------------------------------
   ===================================================================== */

const Storage = (function () {

  const KEY = CONFIG.STORAGE_KEY;

  /* Read every account. Always returns an array, never throws.
     localStorage can fail in private windows or when it is full, so
     every access is wrapped. */
  function readAll() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      console.error('Could not read accounts from localStorage:', err);
      return [];
    }
  }

  function writeAll(accounts) {
    try {
      localStorage.setItem(KEY, JSON.stringify(accounts));
      return { ok: true };
    } catch (err) {
      console.error('Could not write to localStorage:', err);
      return { ok: false, error: 'Your browser refused to save the data. ' +
                                 'Private browsing or a full storage quota?' };
    }
  }

  function findByEmail(email) {
    const needle = String(email).trim().toLowerCase();
    return readAll().find(a => a.email === needle) || null;
  }

  function findByRollNo(rollNo) {
    const needle = String(rollNo).trim().toUpperCase();
    return readAll().find(a => a.rollNo === needle) || null;
  }

  /* Save one account.
     Returns { ok: true, account } or { ok: false, field, error }.

     The two duplicate checks below are Stage 1 stand-ins for real
     database constraints:
         users.email     -> UNIQUE
         students.roll_no-> UNIQUE
     A browser check is a courtesy; the database is the guarantee. */
  function saveAccount(record) {
    if (findByEmail(record.email))
      return { ok: false, field: 'email',
               error: 'An account already exists with this email address.' };

    if (record.role === 'student' && findByRollNo(record.rollNo))
      return { ok: false, field: 'rollNo',
               error: 'An account already exists with this roll number.' };

    const accounts = readAll();
    const account = Object.assign({}, record, {
      id: accounts.length ? Math.max(...accounts.map(a => a.id)) + 1 : 1,
      createdAt: new Date().toISOString(),
    });

    accounts.push(account);
    const result = writeAll(accounts);
    if (!result.ok) return { ok: false, field: null, error: result.error };

    return { ok: true, account: account };
  }

  function count() { return readAll().length; }

  function clearAll() {
    try { localStorage.removeItem(KEY); return true; }
    catch (err) { console.error(err); return false; }
  }

  /* Exported surface. Keep it small -- these names are what Stage 2
     will re-implement over fetch(). */
  return {
    readAll:     readAll,
    findByEmail: findByEmail,
    findByRollNo: findByRollNo,
    saveAccount: saveAccount,
    count:       count,
    clearAll:    clearAll,
  };
})();
