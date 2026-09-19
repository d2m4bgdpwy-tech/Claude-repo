/* ==========================================================================
   Instant estimator. Reads window.STONE_PRICING, renders the material and
   edge options from it, and recalculates on every input change.
   Nothing is sent anywhere — the math runs entirely in the browser.
   ========================================================================== */
(function () {
  "use strict";

  var P = window.STONE_PRICING;
  var form = document.getElementById("estimator-form");
  if (!P || !form) return;

  var money = function (n) {
    return "$" + Math.round(n).toLocaleString("en-US");
  };

  /* --- Render data-driven inputs ---------------------------------------- */
  var materialSelect = form.elements.material;
  P.materials.forEach(function (m, i) {
    var opt = document.createElement("option");
    opt.value = m.id;
    opt.textContent = m.label + " — " + money(m.rate) + "/sq ft installed";
    if (i === 1) opt.selected = true; // Granite Level 2 is the common default
    materialSelect.appendChild(opt);
  });

  var edgeHost = document.getElementById("edge-options");
  P.edges.forEach(function (e, i) {
    var label = document.createElement("label");
    label.className = "choice";
    label.innerHTML =
      '<input type="radio" name="edge" value="' + e.id + '"' + (i === 0 ? " checked" : "") + ">" +
      "<span><b>" + e.label + "</b><em>" + e.note + "</em></span>";
    edgeHost.appendChild(label);
  });

  var travelSelect = form.elements.travel;
  P.travel.forEach(function (t) {
    var opt = document.createElement("option");
    opt.value = t.id;
    opt.textContent = t.label + (t.price ? " (" + t.note + ")" : "");
    travelSelect.appendChild(opt);
  });

  /* --- Helpers ----------------------------------------------------------- */
  function num(name) {
    var el = form.elements[name];
    var v = el ? parseFloat(el.value) : 0;
    return isNaN(v) || v < 0 ? 0 : v;
  }
  function checked(name) {
    var el = form.elements[name];
    return !!(el && el.checked);
  }
  function find(list, id) {
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return list[0];
  }

  /* --- The calculation --------------------------------------------------- */
  function calculate() {
    var lines = [];
    var sqft = num("sqft");
    var material = find(P.materials, materialSelect.value);
    var edge = find(P.edges, form.elements.edge.value);

    // Material, fabrication and installation.
    var materialCost = sqft * material.rate;
    lines.push({
      label: material.label + " — " + sqft.toFixed(0) + " sq ft @ " + money(material.rate),
      amount: materialCost,
      goods: true
    });

    // Edge profile.
    var edgeCost = sqft * edge.rate;
    if (edgeCost > 0) {
      lines.push({ label: edge.label + " edge — " + money(edge.rate) + "/sq ft", amount: edgeCost, goods: true });
    }

    // Sink cutouts.
    var sinkType = form.elements.sinkType.value;
    var sinkCount = num("sinkCount");
    if (sinkType !== "none" && sinkCount > 0) {
      var sink = P.addons[sinkType];
      lines.push({ label: sink.label + " × " + sinkCount, amount: sink.price * sinkCount });
    }

    // Cooktop, faucet holes, corners, waterfalls.
    if (checked("cooktop")) {
      lines.push({ label: P.addons.cooktop.label, amount: P.addons.cooktop.price });
    }
    var holes = num("faucetHoles");
    if (holes > 0) {
      lines.push({ label: P.addons.faucetHole.label + " × " + holes, amount: P.addons.faucetHole.price * holes });
    }
    var waterfalls = num("waterfall");
    if (waterfalls > 0) {
      lines.push({ label: P.addons.waterfallPanel.label + " × " + waterfalls, amount: P.addons.waterfallPanel.price * waterfalls, goods: true });
    }

    // Backsplash.
    var splash = form.elements.splash.value;
    if (splash === "4in") {
      var linft = num("splashLinFt");
      if (linft > 0) {
        lines.push({
          label: P.services.backsplash4.label + " — " + linft.toFixed(0) + " lin ft",
          amount: linft * P.services.backsplash4.perLinFt,
          goods: true
        });
      }
    } else if (splash === "full") {
      var splashSqft = num("splashSqFt");
      if (splashSqft > 0) {
        lines.push({
          label: "Full-height splash — " + splashSqft.toFixed(0) + " sq ft @ " + money(material.rate),
          amount: splashSqft * material.rate,
          goods: true
        });
      }
    }

    // Services.
    if (checked("demo")) {
      var demo = Math.max(P.services.demo.min, sqft * P.services.demo.perSqFt);
      lines.push({ label: P.services.demo.label, amount: demo });
    }
    if (checked("plumbing")) {
      lines.push({ label: P.services.plumbing.label, amount: P.services.plumbing.price });
    }
    if (checked("seal")) {
      lines.push({ label: P.services.seal.label, amount: P.services.seal.price });
    }
    if (checked("stairs")) {
      lines.push({ label: P.services.stairs.label, amount: P.services.stairs.price });
    }

    var travel = find(P.travel, travelSelect.value);
    if (travel.price > 0) {
      lines.push({ label: "Trip charge — " + travel.label, amount: travel.price });
    }

    var subtotal = lines.reduce(function (sum, l) { return sum + l.amount; }, 0);

    // Rush scheduling is a percentage of everything above it.
    if (checked("rush") && subtotal > 0) {
      var rush = subtotal * P.services.rushed.pct;
      lines.push({ label: P.services.rushed.label, amount: rush });
      subtotal += rush;
    }

    // Shop minimum.
    var belowMinimum = subtotal > 0 && subtotal < P.minimumJob;
    if (belowMinimum) subtotal = P.minimumJob;

    // Tax on the goods portion.
    var tax = 0;
    if (P.taxAppliesTo !== "none" && P.taxRate > 0 && subtotal > 0) {
      var base = P.taxAppliesTo === "total"
        ? subtotal
        : lines.reduce(function (sum, l) { return sum + (l.goods ? l.amount : 0); }, 0);
      tax = base * P.taxRate;
    }

    return {
      lines: lines,
      subtotal: subtotal,
      tax: tax,
      total: subtotal + tax,
      belowMinimum: belowMinimum,
      slabArea: sqft * (1 + P.wasteFactor),
      material: material,
      sqft: sqft
    };
  }

  /* --- Render ------------------------------------------------------------ */
  var totalEl = document.getElementById("quote-total");
  var rangeEl = document.getElementById("quote-range");
  var linesEl = document.getElementById("quote-lines");
  var noteEl = document.getElementById("quote-note");
  var lastResult = null;

  function render() {
    var r = lastResult = calculate();

    linesEl.innerHTML = "";
    r.lines.forEach(function (l) {
      var li = document.createElement("li");
      li.innerHTML = "<span>" + l.label + "</span><span>" + money(l.amount) + "</span>";
      linesEl.appendChild(li);
    });

    if (r.tax > 0) {
      var taxLi = document.createElement("li");
      taxLi.innerHTML = "<span>Estimated sales tax</span><span>" + money(r.tax) + "</span>";
      linesEl.appendChild(taxLi);
    }

    if (r.total <= 0) {
      totalEl.textContent = "—";
      rangeEl.textContent = "Enter your square footage to see a number.";
      noteEl.textContent = "Not sure of the square footage? Multiply each run's length by its depth in feet — standard counters are 25\" deep, about 2.1 ft.";
      return;
    }

    var spread = P.rangeSpread;
    totalEl.textContent = money(r.total);
    rangeEl.textContent = "Typical range " + money(r.total * (1 - spread)) + " – " + money(r.total * (1 + spread));

    var notes = [];
    if (r.belowMinimum) notes.push("This job falls under our " + money(P.minimumJob) + " shop minimum, so the minimum is shown.");
    if (r.sqft > 0) notes.push("Plan on roughly " + Math.ceil(r.slabArea) + " sq ft of slab once cutting waste is counted.");
    notes.push("Final pricing is set after we laser-template the actual cabinets.");
    noteEl.textContent = notes.join(" ");
  }

  form.addEventListener("input", render);
  form.addEventListener("change", render);

  /* Show or hide the backsplash measurement that matches the choice. */
  function syncConditionalFields() {
    var splash = form.elements.splash.value;
    document.getElementById("splash-linft").hidden = splash !== "4in";
    document.getElementById("splash-sqft").hidden = splash !== "full";
    document.getElementById("sink-count").hidden = form.elements.sinkType.value === "none";
  }
  form.addEventListener("change", syncConditionalFields);
  syncConditionalFields();

  /* --- Hand the estimate off to the contact form ------------------------- */
  var sendBtn = document.getElementById("quote-send");
  if (sendBtn) {
    sendBtn.addEventListener("click", function () {
      if (!lastResult || lastResult.total <= 0) {
        alert("Add your square footage first and we'll carry the numbers over.");
        return;
      }
      var text = ["Here's the estimate I built on your site:", ""];
      lastResult.lines.forEach(function (l) { text.push("• " + l.label + " — " + money(l.amount)); });
      if (lastResult.tax > 0) text.push("• Estimated sales tax — " + money(lastResult.tax));
      text.push("", "Estimated total: " + money(lastResult.total));
      text.push("", "I'd like to schedule a template.");
      try {
        sessionStorage.setItem("stone-estimate", text.join("\n"));
      } catch (err) { /* private browsing — the contact form still works */ }
      window.location.href = "contact.html#quote-form";
    });
  }

  var printBtn = document.getElementById("quote-print");
  if (printBtn) printBtn.addEventListener("click", function () { window.print(); });

  render();

  /* --- Rate table (same data, rendered on this page) --------------------- */
  var rateBody = document.getElementById("rate-table-body");
  if (rateBody) {
    P.materials.forEach(function (m) {
      var tr = document.createElement("tr");
      tr.innerHTML = "<td><strong>" + m.label + "</strong></td>" +
        "<td>" + m.blurb + "</td>" +
        '<td class="num">' + money(m.rate) + " / sq ft</td>";
      rateBody.appendChild(tr);
    });
  }
})();
