/* ==========================================================================
   Pricing model — the single source of truth for the instant estimator.
   Every number below is an installed price for the Dallas–Fort Worth market.
   Update these values and both the estimator and the rate table follow.
   ========================================================================== */

window.STONE_PRICING = {
  currency: "USD",

  /* Spread applied to the subtotal to produce the low/high range shown. */
  rangeSpread: 0.1,

  /* Smallest job we template, fabricate and install. */
  minimumJob: 1450,

  /* Sales tax is charged on materials in Texas; labor on new construction
     differs. Set to 0 to hide the line entirely. */
  taxRate: 0.0825,
  taxAppliesTo: "material", // "material" | "total" | "none"

  /* Slabs are sold whole. We add this allowance for cutting waste so the
     estimate reflects what actually gets bought. */
  wasteFactor: 0.15,

  /* --- Material tiers: price per finished square foot, installed --------- */
  materials: [
    { id: "granite-1",  label: "Granite — Level 1",   rate: 52,  blurb: "Everyday builder-grade colors. Big inventory, quick turnaround." },
    { id: "granite-2",  label: "Granite — Level 2",   rate: 64,  blurb: "More movement and depth; the most popular pick." },
    { id: "granite-3",  label: "Granite — Premium",   rate: 82,  blurb: "Exotic and one-of-a-kind slabs from the importers we buy from." },
    { id: "quartz-1",   label: "Quartz — Standard",   rate: 68,  blurb: "Engineered, non-porous, never needs sealing." },
    { id: "quartz-2",   label: "Quartz — Designer",   rate: 88,  blurb: "Marble-look veining that runs through the full slab." },
    { id: "quartzite",  label: "Quartzite",           rate: 104, blurb: "Natural stone, harder than granite, marble-like look." },
    { id: "marble",     label: "Marble",              rate: 96,  blurb: "Classic and soft-toned; patinas over time." },
    { id: "porcelain",  label: "Porcelain / Sintered", rate: 110, blurb: "Ultra-thin, heat-proof, ideal for outdoor kitchens." }
  ],

  /* --- Edge profiles: upcharge per square foot -------------------------- */
  edges: [
    { id: "eased",    label: "Eased / Straight", rate: 0,  note: "Included" },
    { id: "bullnose", label: "Half Bullnose",    rate: 6,  note: "+$6/sq ft" },
    { id: "bevel",    label: "Bevel",            rate: 6,  note: "+$6/sq ft" },
    { id: "ogee",     label: "Ogee",             rate: 14, note: "+$14/sq ft" },
    { id: "mitered",  label: "Mitered 2\" / 3\"", rate: 22, note: "+$22/sq ft" }
  ],

  /* --- Per-unit add-ons ------------------------------------------------- */
  addons: {
    sinkUndermount:  { label: "Undermount sink cutout + polish", price: 175 },
    sinkFarmhouse:   { label: "Farmhouse sink cutout + polish",  price: 295 },
    sinkDropIn:      { label: "Drop-in sink cutout",             price: 95  },
    cooktop:         { label: "Cooktop cutout",                  price: 135 },
    faucetHole:      { label: "Faucet / soap-dispenser hole",    price: 30  },
    outletCutout:    { label: "Outlet cutout in backsplash",     price: 45  },
    waterfallPanel:  { label: "Waterfall panel (per side)",      price: 850 },
    radiusCorner:    { label: "Radius / curved cut",             price: 165 }
  },

  /* --- Services --------------------------------------------------------- */
  services: {
    demo:        { label: "Remove & haul off existing tops", perSqFt: 9,  min: 175 },
    plumbing:    { label: "Disconnect & reconnect plumbing", price: 235 },
    backsplash4: { label: "4\" splash from the same stone",   perLinFt: 19 },
    backsplashFull: { label: "Full-height splash", perSqFt: null }, // priced at material rate
    seal:        { label: "15-year premium sealer",          price: 250 },
    stairs:      { label: "Stairs / long-carry surcharge",   price: 175 },
    rushed:      { label: "Rush schedule (under 7 days)",    pct: 0.12 }
  },

  /* --- Trip charge by distance from the shop ---------------------------- */
  travel: [
    { id: "core",  label: "Dallas / Fort Worth & inner suburbs", price: 0,   note: "No trip charge" },
    { id: "metro", label: "Collin, Denton, Rockwall, Ellis Co.", price: 0,   note: "No trip charge" },
    { id: "out",   label: "60+ miles from the shop",             price: 225, note: "+$225" }
  ]
};
