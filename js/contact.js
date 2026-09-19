/* ==========================================================================
   Contact form.
   Static sites can't send mail on their own, so this does two things:
     1. If FORM_ENDPOINT below is filled in (Formspree, Basin, Netlify Forms,
        or any endpoint that accepts a POST), the form is submitted by fetch
        and the visitor never leaves the page.
     2. If it's still the placeholder, we fall back to opening the visitor's
        email app with everything filled in, so no lead is ever lost.
   See README.md for the two-minute setup.
   ========================================================================== */
(function () {
  "use strict";

  var FORM_ENDPOINT = "";            // e.g. "https://formspree.io/f/xdorwkyz"
  var FALLBACK_EMAIL = "quotes@trinitystoneco.com";

  var form = document.getElementById("quote-form");
  if (!form) return;
  var status = document.getElementById("form-status");

  /* Carry an estimate over from the estimator page, if there is one. */
  try {
    var carried = sessionStorage.getItem("stone-estimate");
    if (carried && form.elements.message && !form.elements.message.value) {
      form.elements.message.value = carried;
      sessionStorage.removeItem("stone-estimate");
      say("ok", "We brought your estimate over — add your details below and send it in.");
    }
  } catch (err) { /* private browsing; nothing to carry */ }

  function say(state, text) {
    if (!status) return;
    status.setAttribute("data-state", state);
    status.textContent = text;
  }

  function mailtoFallback(data) {
    var lines = [];
    ["name", "phone", "email", "city", "project", "material", "timeline", "sqft"].forEach(function (k) {
      if (data[k]) lines.push(label(k) + ": " + data[k]);
    });
    if (data.message) lines.push("", data.message);
    return "mailto:" + FALLBACK_EMAIL +
      "?subject=" + encodeURIComponent("Countertop quote request — " + (data.name || "website")) +
      "&body=" + encodeURIComponent(lines.join("\n"));
  }

  function label(key) {
    return ({ name: "Name", phone: "Phone", email: "Email", city: "City",
      project: "Project", material: "Material", timeline: "Timeline",
      sqft: "Approx. square feet" })[key] || key;
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    var data = {};
    new FormData(form).forEach(function (v, k) { data[k] = String(v).trim(); });

    if (!data.name || !data.phone) {
      say("error", "We need at least a name and a phone number so we can call you back.");
      return;
    }

    var button = form.querySelector("button[type=submit]");
    var original = button ? button.textContent : "";

    if (!FORM_ENDPOINT) {
      say("ok", "Opening your email app with the details filled in — hit send and we'll be in touch today.");
      window.location.href = mailtoFallback(data);
      return;
    }

    if (button) { button.disabled = true; button.textContent = "Sending…"; }

    fetch(FORM_ENDPOINT, {
      method: "POST",
      headers: { "Accept": "application/json" },
      body: new FormData(form)
    }).then(function (res) {
      if (!res.ok) throw new Error("Bad response " + res.status);
      form.reset();
      say("ok", "Got it — thanks. We'll call you back today, or first thing tomorrow if it's after hours.");
    }).catch(function () {
      say("error", "Something went wrong sending that. Call us at (214) 555-0147 and we'll take it down over the phone.");
    }).then(function () {
      if (button) { button.disabled = false; button.textContent = original; }
    });
  });
})();
