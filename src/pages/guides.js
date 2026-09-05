/* Long-form pages. These exist to rank for the questions people ask *around*
   the tools, and to give the tool pages something substantial to link to.
   Each one should answer the question properly — a thin page ranks for nothing
   and gets an AdSense policy warning for "low value content". */

export const guides = [
  {
    slug: 'why-online-tools-should-not-upload-your-files',
    title: 'Why online tools should not upload your files',
    description: 'Most online converters send your data to a server you know nothing about. Here is what that actually risks, and how to tell the difference.',
    published: '2026-01-14',
    updated: '2026-01-14',
    tools: ['json-formatter', 'jwt-decoder', 'base64-encode-decode', 'env-to-json'],
    body: `
<p>
  Search for "JSON formatter" or "PDF merge" and you will get a page of results that all work the
  same way: you paste or upload something, it goes to a server, the server does the work, and the
  result comes back. For a lorem ipsum generator that is fine. For the things developers actually
  paste into these tools, it deserves more thought than it usually gets.
</p>

<h2>What people paste without noticing</h2>
<p>
  Look at what passes through a formatter on an average working day. An API response, which contains
  customer records. A JWT, which is a live credential until it expires. A <code>.env</code> file, on
  the way to a Kubernetes secret. A CSV export, pulled from a production database to check one row.
  A configuration file with an internal hostname in it. Each of these is routine, and each of them
  is a document that your security policy almost certainly says should not be posted to an unknown
  third party.
</p>
<p>
  The risk is not usually that the site is malicious — most are not. It is that you have added an
  organisation you have never evaluated to the list of parties holding your data, and you did it in
  four seconds without telling anyone.
</p>

<h2>Where uploaded data actually goes</h2>
<p>
  Even a well-intentioned tool site leaves traces of your content in more places than its authors
  usually think about:
</p>
<ul>
  <li><strong>Request logs.</strong> If the payload arrives in a URL, it is in the access log, and
      access logs are shipped to log aggregators, retained for months, and readable by anyone with
      support access.</li>
  <li><strong>Error reporting.</strong> When a parse fails, the offending input is very often
      attached to the exception and sent to Sentry or an equivalent. Your malformed JSON — including
      whatever was in it — is now in a third system.</li>
  <li><strong>Caches and CDNs.</strong> Responses get cached. Intermediate proxies keep copies.</li>
  <li><strong>Backups.</strong> Anything written to disk, even temporarily, tends to end up in a
      snapshot with a retention period nobody remembers setting.</li>
  <li><strong>Acquisition.</strong> Free tool sites are bought and sold constantly. The privacy
      policy you did not read was written by an owner who may no longer be involved.</li>
</ul>
<p>
  None of this requires bad intent. It is the ordinary behaviour of ordinary web infrastructure, and
  it applies to every byte you send.
</p>

<h2>The alternative: do the work in the browser</h2>
<p>
  Almost every utility of this kind can run entirely as client-side JavaScript. The browser already
  has a JSON parser, a cryptographic random number generator, a full hashing suite in
  <code>SubtleCrypto</code>, an image encoder in <code>&lt;canvas&gt;</code>, and a file reader that
  never touches the network. A tool built on those primitives has no upload step because it has no
  server to upload to.
</p>
<p>
  This is not a compromise. Client-side tools are usually <em>faster</em> — no round trip, no queue,
  no rate limit — and they have no file size limit beyond your own memory. Verifying the SHA-256 of
  a 4 GB ISO in a browser tab takes seconds; uploading it to check the same hash takes minutes and
  is a genuinely worse idea.
</p>

<h2>How to tell which kind you are using</h2>
<p>Three checks, in increasing order of certainty:</p>
<ol>
  <li><strong>Read the claim.</strong> A site doing the work locally will say so, because it is the
      most useful thing it can tell you. Vagueness here is informative.</li>
  <li><strong>Open the Network panel.</strong> Press F12, switch to Network, and use the tool. If
      your content is being sent, you will see a request carrying it. This takes ten seconds and
      settles the question completely.</li>
  <li><strong>Turn off your network.</strong> Load the page, disconnect Wi-Fi, then use the tool. A
      client-side tool keeps working. A server-side one cannot.</li>
</ol>
<p>
  That last test is the one worth remembering, because it cannot be faked. Every tool on this site
  passes it.
</p>

<h2>When a server genuinely is required</h2>
<p>
  Some things cannot be done locally, and it is worth being honest about them: OCR on scanned
  documents, video transcoding, anything that needs a model too large to download, and anything that
  needs to reach a third-party API on your behalf. If a tool needs one of those, a server is the
  right answer — and the question becomes whether you trust that specific operator with that
  specific document, which is a decision you should be making deliberately rather than by default.
</p>`
  },

  {
    slug: 'json-formatting-and-common-errors',
    title: 'JSON: the four errors behind most parse failures',
    description: 'Trailing commas, single quotes, unquoted keys and raw control characters. What each error message means and how to fix it fast.',
    published: '2026-01-16',
    updated: '2026-01-16',
    tools: ['json-formatter', 'json-to-csv', 'csv-to-json', 'yaml-json-converter'],
    body: `
<p>
  JSON has one of the smallest grammars in wide use — the whole specification fits on a business card
  — and yet "Unexpected token" is one of the most-searched error messages on the internet. That is
  because the grammar is small in a very specific way: it deliberately excludes several things that
  look perfectly reasonable in JavaScript, and the error messages do a poor job of saying so.
</p>

<h2>1. Trailing commas</h2>
<pre><code>{
  "name": "Ada",
  "role": "Analyst",   ← this comma
}</code></pre>
<p>
  Valid JavaScript. Invalid JSON, always, everywhere. The specification permits no trailing comma in
  either objects or arrays, and no parser will make an exception. Chrome reports it as
  <code>Unexpected token }</code>, which points at the brace rather than the comma that caused it —
  so look at the line <em>above</em> the one the error mentions.
</p>
<p>
  This is the single most common cause of hand-edited configuration breaking, which is why formats
  like JSON5, HJSON and TOML exist and why <code>tsconfig.json</code> is not actually JSON.
</p>

<h2>2. Single quotes</h2>
<pre><code>{ 'name': 'Ada' }</code></pre>
<p>
  JSON strings must use double quotes, for both keys and values. Single quotes are a JavaScript
  convention that JSON never adopted. If you are generating JSON by string concatenation in Python,
  this is what <code>str(dict)</code> gives you — use <code>json.dumps()</code> instead.
</p>

<h2>3. Unquoted keys</h2>
<pre><code>{ name: "Ada" }</code></pre>
<p>
  In JavaScript, object keys need no quotes when they are valid identifiers. In JSON, every key is a
  string and every string is quoted. This is the giveaway that you are looking at a JavaScript object
  literal that someone has copied out of source code, not at JSON.
</p>

<h2>4. Raw control characters in strings</h2>
<p>
  A literal newline, tab or carriage return inside a string is not allowed — it must be escaped as
  <code>\\n</code>, <code>\\t</code> or <code>\\r</code>. This bites when a value has been pasted from
  a text editor, or when a log line containing a real newline has been interpolated into a JSON
  template. The error message here is usually <code>Bad control character in string literal</code>,
  which at least says what it means.
</p>

<h2>Things JSON does not have</h2>
<p>Worth knowing before you go looking for them:</p>
<ul>
  <li><strong>Comments.</strong> Douglas Crockford removed them deliberately, on the grounds that
      people were using them to hold parsing directives. The workaround everyone uses is a
      <code>"_comment"</code> key.</li>
  <li><strong>Dates.</strong> There is no date type. Use an ISO 8601 string
      (<code>2026-01-16T09:30:00Z</code>) and parse it at the boundary.</li>
  <li><strong>Integers, specifically.</strong> There is one number type. Values beyond
      2<sup>53</sup> lose precision in any JavaScript parser, which is why APIs that deal in large
      IDs — Twitter's famously — send them as strings.</li>
  <li><strong>NaN or Infinity.</strong> Not representable. <code>JSON.stringify</code> silently
      turns them into <code>null</code>, which is a fun bug to track down.</li>
  <li><strong>Trailing content.</strong> A document is one value. Two objects in a row is not JSON;
      it is JSON Lines, which is a different (and very useful) format.</li>
</ul>

<h2>Reading a position number</h2>
<p>
  Most parsers report a character offset rather than a line — <code>Unexpected token at position
  1247</code>. That is unhelpful in a 2,000-line file. A formatter that converts the offset into a
  line and column, as ours does, turns a five-minute hunt into a click.
</p>

<h2>A note on validating before you send</h2>
<p>
  If you are writing JSON that another service will consume, validate against strict JSON rather than
  whatever your local tooling tolerates. Node's <code>JSON.parse</code>, Python's <code>json</code>
  module and Go's <code>encoding/json</code> all follow the specification closely — but plenty of
  editors, linters and templating tools are more forgiving, and the gap between "my editor is happy"
  and "the API accepted it" is exactly where these bugs live.
</p>`
  },

  {
    slug: 'base64-explained',
    title: 'Base64, explained properly',
    description: 'What Base64 is for, why it makes files 33% bigger, why it is not encryption, and when a data URI is a good idea.',
    published: '2026-01-18',
    updated: '2026-01-18',
    tools: ['base64-encode-decode', 'jwt-decoder', 'hash-generator', 'url-encode-decode'],
    body: `
<p>
  Base64 turns arbitrary binary data into text made of 64 safe characters: <code>A–Z</code>,
  <code>a–z</code>, <code>0–9</code>, <code>+</code> and <code>/</code>, with <code>=</code> as
  padding. That is the whole idea. It exists because a great deal of internet plumbing was built for
  text and will corrupt raw bytes.
</p>

<h2>How it works</h2>
<p>
  Three bytes are 24 bits. Split those 24 bits into four groups of 6, and each group indexes into the
  64-character alphabet. So every 3 bytes in become 4 characters out — which is exactly where the
  <strong>33% size increase</strong> comes from, and why it is not negotiable.
</p>
<p>
  When the input length is not a multiple of three, the final group is padded with <code>=</code> so
  the output length stays a multiple of four. That is all the equals signs at the end mean.
</p>

<h2>What it is for</h2>
<ul>
  <li><strong>Email attachments.</strong> SMTP was specified for 7-bit ASCII. MIME uses Base64 to get
      binary through it — the original motivation, and still the biggest use.</li>
  <li><strong>Data URIs.</strong> Embedding a small image or font directly in HTML or CSS.</li>
  <li><strong>JSON and XML payloads.</strong> Neither format can carry raw bytes, so binary fields
      are Base64 strings.</li>
  <li><strong>HTTP headers.</strong> Basic authentication is <code>base64(user:password)</code> —
      encoding, not protection, which is why it is only acceptable over TLS.</li>
  <li><strong>JWTs and URLs.</strong> Using the URL-safe variant, below.</li>
</ul>

<h2>URL-safe Base64</h2>
<p>
  Standard Base64 uses <code>+</code> and <code>/</code>, both of which mean something in a URL, and
  <code>=</code>, which means something in a query string. The URL-safe variant (RFC 4648 §5) swaps
  them for <code>-</code> and <code>_</code> and usually drops the padding entirely, since the length
  can be inferred. This is what you see in JSON Web Tokens: three URL-safe Base64 segments separated
  by dots.
</p>

<h2>Base64 is not encryption</h2>
<p>
  This needs saying plainly, because it recurs in real codebases and real incidents. Base64 is
  reversible by anyone, instantly, with no key. It provides no confidentiality whatsoever. Storing a
  password "encoded in Base64", putting a Base64 token in a URL and calling it opaque, or
  Base64-encoding a config file to keep it from prying eyes — all of these provide the appearance of
  protection and none of the substance.
</p>
<p>
  It is also not a checksum. It cannot detect corruption, because it has no redundancy. If you want
  to know whether a file changed, hash it.
</p>

<h2>When to use a data URI (and when not to)</h2>
<p>
  Inlining an image as <code>data:image/png;base64,…</code> removes an HTTP request, which used to
  matter a great deal. With HTTP/2 and HTTP/3 multiplexing, it matters much less, and the costs are
  real:
</p>
<ul>
  <li>The asset is 33% larger, and it is now inside your HTML or CSS, so it cannot be cached
      separately or shared between pages.</li>
  <li>Every change to the image invalidates the whole file it is embedded in.</li>
  <li>Large inlined assets block rendering, because the stylesheet they sit in is render-blocking.</li>
</ul>
<p>
  The rule of thumb that has held up: inline only tiny assets — under about 2 KB — that appear on
  every page, such as an icon in a button. Everything else should be a separate file, ideally SVG.
</p>

<h2>Encoding non-English text</h2>
<p>
  A classic bug: JavaScript's <code>btoa()</code> throws <code>InvalidCharacterError</code> on any
  character above U+00FF. Base64 encodes <em>bytes</em>, and a JavaScript string is UTF-16 code
  units, so you have to choose an encoding first:
</p>
<pre><code>// Correct — encode to UTF-8 bytes first
const bytes = new TextEncoder().encode(text);
const b64 = btoa(String.fromCharCode(...bytes));

// Decoding
const back = new TextDecoder().decode(
  Uint8Array.from(atob(b64), c => c.charCodeAt(0))
);</code></pre>
<p>
  Handle that correctly and emoji, Arabic and Japanese all round-trip cleanly. Skip it and you get
  mojibake, or an exception, depending on the input.
</p>`
  },

  {
    slug: 'choosing-an-image-format',
    title: 'Choosing an image format: PNG, JPEG, WebP or SVG',
    description: 'A practical decision guide for web images, with the compression trade-offs and browser support that actually matter in 2026.',
    published: '2026-01-20',
    updated: '2026-01-20',
    tools: ['image-converter', 'image-compressor', 'image-resizer', 'favicon-generator'],
    body: `
<p>
  Images are usually the largest thing on a web page by a wide margin, and picking the wrong format
  is the easiest way to make a site slow. The good news is that the decision is mostly mechanical.
</p>

<h2>The short version</h2>
<ul>
  <li><strong>Photographs</strong> → WebP, with JPEG as a fallback if you still need one.</li>
  <li><strong>Screenshots, diagrams, anything with text or sharp edges</strong> → PNG, or WebP in
      lossless mode.</li>
  <li><strong>Logos, icons, illustrations</strong> → SVG. Always, if you have the vector.</li>
  <li><strong>Transparency needed</strong> → PNG, WebP or AVIF. Never JPEG.</li>
  <li><strong>Animation</strong> → a video file (MP4/WebM), not a GIF.</li>
</ul>

<h2>Why WebP is the default now</h2>
<p>
  WebP is typically 25–35% smaller than JPEG at equivalent visual quality, supports transparency and
  animation, and has a lossless mode that beats PNG on most images. Every browser released since
  2020 supports it. Unless you have a specific reason — a print workflow, a client tool that cannot
  read it — WebP should be what you ship.
</p>

<h2>AVIF: smaller, with caveats</h2>
<p>
  AVIF compresses better still, often 20% below WebP, and handles gradients and dark areas
  noticeably better. The catches are encoding speed — an order of magnitude slower, which matters if
  you process images on upload — and inconsistent support in non-browser software. The pragmatic
  answer is to serve both, and let the browser choose:
</p>
<pre><code>&lt;picture&gt;
  &lt;source srcset="photo.avif" type="image/avif"&gt;
  &lt;source srcset="photo.webp" type="image/webp"&gt;
  &lt;img src="photo.jpg" alt="…" width="1200" height="800"&gt;
&lt;/picture&gt;</code></pre>

<h2>Why your PNG got bigger when you converted it to JPEG</h2>
<p>
  This surprises people regularly. PNG uses lossless compression that is extremely good at flat
  colour and repeated patterns — exactly what a screenshot or a chart is made of. JPEG assumes it is
  looking at a photograph: it throws away high-frequency detail, which is precisely where the edges
  of text live. So a 40 KB screenshot becomes a 90 KB JPEG that also looks worse, with visible
  ringing around every letter.
</p>
<p>
  Match the format to the content, not to habit.
</p>

<h2>Quality settings that hold up</h2>
<p>
  For JPEG and WebP, 75–80% is where almost everyone lands: visually indistinguishable from the
  original at normal viewing size, at a fraction of the bytes. Below 60% you start seeing blocking
  in flat gradients — skies and skin tones first. Above 90% you are spending a lot of bytes on
  differences no one will see.
</p>
<p>
  One rule matters more than the setting: <strong>always compress from the original</strong>.
  Re-encoding an already-compressed image stacks the artefacts, and each round is irreversible.
</p>

<h2>Dimensions matter more than compression</h2>
<p>
  The most common real-world waste is not a bad quality setting — it is a 4000-pixel-wide photograph
  displayed in a 600-pixel-wide column. Resizing that image to the size it is actually shown at will
  save more than any amount of tuning. Serve responsive sizes and let the browser pick:
</p>
<pre><code>&lt;img src="photo-800.webp"
     srcset="photo-400.webp 400w, photo-800.webp 800w, photo-1600.webp 1600w"
     sizes="(max-width: 700px) 100vw, 700px"
     alt="…" width="800" height="533" loading="lazy"&gt;</code></pre>
<p>
  Always set <code>width</code> and <code>height</code>. They let the browser reserve space before
  the image arrives, which is what stops the page jumping around as it loads — and layout shift is
  a Core Web Vitals metric that affects your search ranking directly.
</p>

<h2>SVG deserves more use than it gets</h2>
<p>
  For anything drawn rather than photographed, SVG is usually both smaller and infinitely sharp at
  every resolution. It can be styled with CSS, animated, and inlined without a request. The two
  things to watch: run it through an optimiser, since export tools emit enormous amounts of junk;
  and never inline an SVG from an untrusted source, because it can carry scripts.
</p>

<h2>Stop using animated GIF</h2>
<p>
  GIF is limited to 256 colours and compresses animation terribly — a short clip is routinely
  several megabytes as a GIF and a couple of hundred kilobytes as an MP4. An autoplaying, muted,
  looping <code>&lt;video&gt;</code> does the same job at a fraction of the size, and gives the user
  the option to pause it.
</p>`
  }
];
