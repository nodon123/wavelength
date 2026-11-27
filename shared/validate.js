// Shared validation, loaded by the browser (<script src="/shared/validate.js">, sets window.WLValidate)
// and by the server (require('../shared/validate.js')). Keep it dependency-free.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.WLValidate = factory();
}(typeof self !== 'undefined' ? self : this, function () {
  // Default per-class email policy. `domains` stays empty for now; later a class can be limited to
  // e.g. ['purdue.edu'], which also accepts subdomains such as 'cs.purdue.edu'.
  var DEFAULT_EMAIL_POLICY = { required: true, domains: [] };

  function policyOf(p) {
    p = p || {};
    return {
      required: p.required !== false,
      domains: Array.isArray(p.domains) ? p.domains.map(function (d) { return String(d).trim().toLowerCase().replace(/^@/, ''); }).filter(Boolean) : [],
    };
  }

  // Returns { ok: true, value } with the address normalized (trimmed, domain lower-cased),
  // or { ok: false, error } with a plain-language explanation of what to fix.
  function checkEmail(input, policy) {
    var pol = policyOf(policy);
    var raw = String(input == null ? '' : input).trim();
    if (!raw) return pol.required ? { ok: false, error: 'Enter your email address to join.' } : { ok: true, value: '' };
    if (/\s/.test(raw)) return { ok: false, error: 'Email addresses can’t contain spaces. Check for a stray space.' };
    var at = raw.split('@');
    if (at.length === 1) return { ok: false, error: 'An email address needs an @, like name@school.edu.' };
    if (at.length > 2) return { ok: false, error: 'Use just one @ in your email address.' };
    var local = at[0], domain = at[1].toLowerCase();
    if (!local) return { ok: false, error: 'Add your name before the @, like name@school.edu.' };
    if (!domain) return { ok: false, error: 'Add the part after the @, like name@school.edu.' };
    if (local.length > 64 || raw.length > 254) return { ok: false, error: 'That email address is too long. Check that it’s typed correctly.' };
    if (!/^[A-Za-z0-9.!#$%&'*+\/=?^_`{|}~-]+$/.test(local)) return { ok: false, error: 'The part before the @ has a character email addresses can’t use.' };
    if (/^\.|\.$|\.\./.test(local)) return { ok: false, error: 'The part before the @ can’t start or end with a dot, or have two dots in a row.' };
    if (domain.indexOf('.') === -1) return { ok: false, error: 'The part after the @ looks incomplete. It needs a dot, like school.edu.' };
    if (/\.\.|^\.|\.$/.test(domain)) return { ok: false, error: 'The part after the @ has a misplaced dot. It should look like school.edu.' };
    var labels = domain.split('.');
    for (var i = 0; i < labels.length; i++) {
      if (!/^[a-z0-9-]+$/.test(labels[i]) || /^-|-$/.test(labels[i])) return { ok: false, error: 'The part after the @ has a character web addresses can’t use.' };
    }
    if (!/^[a-z]{2,}$/.test(labels[labels.length - 1])) return { ok: false, error: 'The ending after the last dot looks wrong. It should be something like .edu or .com.' };
    if (pol.domains.length) {
      var allowed = pol.domains.some(function (d) { return domain === d || domain.slice(-(d.length + 1)) === '.' + d; });
      if (!allowed) return { ok: false, error: 'Use your ' + pol.domains.map(function (d) { return '@' + d; }).join(' or ') + ' email address for this class.' };
    }
    return { ok: true, value: local + '@' + domain };
  }

  // LinkedIn is optional. Accepts a bare handle, "linkedin.com/in/handle", or a full pasted URL
  // (https://, www., mobile "Copy link" tracking params, trailing slash) and returns
  // { ok: true, value: 'linkedin.com/in/handle' } or { ok: false, error }. Empty input is fine.
  function checkLinkedin(input) {
    var raw = String(input == null ? '' : input).trim();
    if (!raw) return { ok: true, value: '' };
    var s = raw.replace(/^https?:\/\//i, '').replace(/^(www|[a-z]{2})\./i, '').replace(/[?#].*$/, '').replace(/\/+$/, '');
    var m = s.match(/^linkedin\.com\/(?:in|pub)\/([^\/]+)/i);
    var handle = m ? m[1] : (/^[^\/\s.]+$/.test(s) ? s : '');
    try { handle = decodeURIComponent(handle); } catch (e) { /* keep as typed */ }
    if (!handle) return { ok: false, error: 'That doesn’t look like a LinkedIn profile link. Open your profile, tap ⋯ → Copy link, and paste it here.' };
    if (handle.toLowerCase() === 'me') return { ok: false, error: 'That’s the shortcut link. On your profile, tap ⋯ → Copy link and paste that one.' };
    if (!/^[A-Za-z0-9\u00C0-\u024F_%-]{3,100}$/.test(handle)) return { ok: false, error: 'That handle has a character LinkedIn doesn’t use. Copy the link from your profile instead.' };
    return { ok: true, value: 'linkedin.com/in/' + handle };
  }

  return { DEFAULT_EMAIL_POLICY: DEFAULT_EMAIL_POLICY, policyOf: policyOf, checkEmail: checkEmail, checkLinkedin: checkLinkedin };
}));
