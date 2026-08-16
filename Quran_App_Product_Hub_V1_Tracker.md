# Quran App --- Product Hub & V1 Tracker

> **Single source of truth for product state, shipped work, bugs,
> regressions, fixes, roadmap, decisions, testing, and release
> readiness.**
>
> **Current focus:** stabilize V1, verify production behavior, then
> freeze V1 and move deferred PWA/offline work into a dedicated
> follow-up cycle.

------------------------------------------------------------------------

## 0. Dashboard

### Current state

  -----------------------------------------------------------------------------------------------
  Item                                Current state
  ----------------------------------- -----------------------------------------------------------
  Product                             Tamil Quran web/PWA

  Current milestone                   V1 stabilization / post-release production verification

  Current local commit                `cb58368` ---
                                      `fix: polish V1 reading, search, navigation and image UX`

  Last audited commit before that     `a6994f8` --- `fix: finalize V1 audit and reliability`

  Working tree at last Codex report   Clean

  Remote push status at last report   `cb58368` was **not pushed**; verify current deployment
                                      provenance before treating production as this commit

  Build                               Passed

  TypeScript                          Passed

  Content audit                       Passed, 0 errors/warnings

  Targeted ESLint                     Passed; only pre-existing warning(s) reported in earlier
                                      audit

  `git diff --check`                  Passed

  V1 readiness                        **Conditional**: core reading/navigation is in good shape,
                                      but production verification still has open Android offline
                                      and Ayah-image issues

  Current priority                    Fix Arabic image regression; decide Reading Width mobile
                                      UX; park offline/PWA issues if not resolved safely
  -----------------------------------------------------------------------------------------------

### V1 health at a glance

-   🟢 Core Surah reading
-   🟢 Surah top/bottom navigation
-   🟢 Local Tamil font deployment
-   🟢 Mobile advanced search exposure
-   🟢 iOS search keyboard/viewport handling
-   🟢 Search reference stale-result protection in code
-   🟢 Tamil Ayah-image centering path
-   🟢 Header/footer Ayah-image centering path, according to latest
    production observation
-   🔴 Arabic Ayah-image alignment/clipping regression
-   🔴 Android offline reference search still intermittently wrong in
    observed testing
-   🔴 Android offline Ayah-image generation still reports network error
    in observed testing
-   🟡 Reading Width is not useful on phone-sized screens and is
    visually redundant for Normal/Wide on iPad portrait
-   🟡 PWA cache/update lifecycle fix implemented; deployment and Android
    offline verification remain pending

------------------------------------------------------------------------

# 1. Product overview

**What it is:**\
A Tamil Quran reading web application/PWA focused on clean Quran
reading, Tamil translation, search, responsive reading preferences, Ayah
sharing images, and offline-capable access.

**Primary audience:**\
Tamil-speaking Quran readers using phones, tablets, and desktop web.

**Primary experience:**\
Open a Surah → read Arabic + Tamil → navigate through long Surahs →
search Tamil/reference → share an Ayah image → use the app with
PWA/offline capabilities where supported.

**Current milestone:**\
V1 stabilization.

**North star metric:**\
**Successful Quran reading sessions**: a reader opens a Surah and can
read/navigate without encountering a blocking error.

> Metric instrumentation has not been formally defined yet. Treat this
> as the current product principle rather than an instrumented analytics
> metric.

**Current release philosophy:**\
Keep V1 focused. Prefer small, deterministic fixes over broad refactors.
Defer complex PWA/offline architecture work when it risks destabilizing
working online behavior.

------------------------------------------------------------------------

# 2. Product principles

1.  **Quran content correctness comes first.**
2.  **Reading must remain fast and visually stable across Android,
    iPhone, iPad, and desktop.**
3.  **Offline behavior must never silently produce incorrect Quran
    navigation.**
4.  **Do not fix one platform by breaking another.**
5.  **Prefer shared components and existing patterns over duplicate
    implementations.**
6.  **No speculative fixes. Diagnose the actual runtime path first.**
7.  **A known limitation is better than a misleading control.**
8.  **Every production regression gets recorded here.**
9.  **Every fix gets a regression test case.**
10. **V1 should be feature-frozen before major architecture work.**

------------------------------------------------------------------------

# 3. Quick links

-   App repo:
-   Production URL: `https://tamil-quran.vercel.app`
-   Design file:
-   Analytics dashboard:
-   Crash reporting:
-   Issue tracker:
-   Release notes:

------------------------------------------------------------------------

# 4. Technology / architecture

  ------------------------------------------------------------------------
  Area                    Current implementation  Notes
  ----------------------- ----------------------- ------------------------
  Framework               Next.js App Router      No rewrite planned for
                                                  V1

  Rendering               Static/pre-rendered     Uses
                          Surah pages             `generateStaticParams`

  Data                    Local JSON/data splits  Individual Surah/data
                                                  assets

  Styling                 Existing app            Preserve established
                          CSS/Tailwind-style      conventions
                          utility classes

  Fonts                   Local bundled Noto      Avoid runtime dependency
                          Serif Tamil for Tamil   on failing Google Fonts
                                                  endpoint

  Search                  Client UI +             SearchOverlay +
                          local/reference search  SearchPage
                          paths

  PWA                     Service worker          Current cache version is
                                                  `quran-v2`; update checks and
                                                  safe activation are implemented

  Offline                 Service-worker          Android reliability
                          caching + local assets  remains unresolved

  Ayah images             Canvas-based generation Cross-browser canvas
                                                  state is sensitive

  Navigation              Shared                  Now integrated into
                          `LongPageNavigation`    Surah pages

  Preferences             React provider +        Includes Reading Width
                          localStorage

  Deployment              Vercel-oriented         Deployment provenance
                                                  must be verified for
                                                  each release
  ------------------------------------------------------------------------

### Architecture decision

**Do not migrate from Next.js to SvelteKit/Nuxt for V1.**

The current static/local-data architecture is adequate. A framework
rewrite would introduce substantially more risk than benefit while the
current issues are mostly implementation/PWA behavior rather than a
proven framework performance problem.

------------------------------------------------------------------------

# 5. Feature master list

  ----------------------------------------------------------------------------------------
  Feature         Area         Status         Platforms   Description      Notes
  --------------- ------------ -------------- ----------- ---------------- ---------------
  Surah reading   Core         Shipped        Android /   Read Arabic +    V1 core
                                              iOS / iPad  Tamil
                                              / Web

  Local Tamil     Typography   Shipped        All         Bundled Noto     Prevents Google
  font                                                    Serif Tamil      font fetch
                                                                           dependency

  Tamil search    Search       Shipped        All         Search Tamil     Search UI
                                                          translation      exists

  Reference       Search       Shipped /      All         Search `2:255`,  Online works;
  search                       needs offline              `9.30`, etc.     Android offline
                               verification                                remains suspect

  Advanced search Search       Shipped        Android /   `மேம்பட்ட தேடல்`    Mobile exposure
                                              iOS / iPad  entry from       added
                                              / Web       search overlay

  Search          Mobile UX    Shipped        iOS + other Visual viewport  Production
  keyboard-safe                               mobile      handling +       sanity test
  overlay                                                 scroll lock      required

  Surah           Navigation   Shipped        Android /   Existing shared  Production
  top/bottom                                  iOS / iPad  control added to test: working
  navigation                                  / Web       Surah pages

  Reading Width   Reading UX   Shipped / UX   Tablet /    Narrow / Normal  Phone control
                               adjustment     desktop     / Wide max-width should be
                               pending                                     hidden

  Ayah image      Sharing      Shipped /      All         Generate         Android offline
  generation                   Android                    shareable Ayah   still fails
                               offline issue              image

  Ayah image      Sharing      Shipped        All         Measured-width   iPad issue
  Tamil centering                                         Tamil            addressed
                                                          positioning

  Ayah image      Sharing      Shipped /      All         Measured-width   Latest
  header/footer                verify                     centering        production
  centering                                                                appears
                                                                           improved

  Ayah image      Sharing      Fix required   All         Arabic must be   Current
  Arabic                                                  centered and     regression:
  rendering                                               fully visible    right-shift +
                                                                           clipping

  PWA/offline     Platform     Shipped /      Android /   Offline access   Android
  reading                      reliability    iOS/iPad                     cache/update
                               backlog                                     behavior needs
                                                                           dedicated work

  Notes           Content      Shipped        All         Notes content    Offline
                                                                           behavior
                                                                           differs by
                                                                           platform and
                                                                           needs tracking

  Topics          Content      Shipped        All         Topic content    Uses shared
                                                                           long-page
                                                                           navigation

  About           Content      Shipped        All         About page       Uses shared
                                                                           long-page
                                                                           navigation
  ----------------------------------------------------------------------------------------

------------------------------------------------------------------------

# 6. Current V1 scope

### Included

-   [x] Surah reading
-   [x] Tamil translation
-   [x] Local Tamil font
-   [x] Search overlay
-   [x] Tamil search
-   [x] Surah/reference search
-   [x] Advanced search on mobile
-   [x] iOS keyboard-safe search overlay
-   [x] Long-page navigation on Surah pages
-   [x] Reading Width preference on larger screens
-   [x] Ayah image generation
-   [x] Responsive Ayah image handling
-   [x] PWA/offline foundation
-   [x] Content audit tooling / validation

### Not required for V1

-   [ ] Framework migration
-   [ ] Major design rewrite
-   [ ] Full analytics platform
-   [ ] Complex audio architecture
-   [ ] English translation expansion
-   [ ] Large-scale personalization
-   [ ] Major PWA architecture rewrite

------------------------------------------------------------------------

# 7. Implemented / shipped changelog

  ----------------------------------------------------------------------------
  Commit            Type              Summary             Validation / notes
  ----------------- ----------------- ------------------- --------------------
  Pending commit   Fix               Improve PWA         Versioned cache
                                      update lifecycle   namespace, explicit
                                                          update checks, and
                                                          failure-safe precache

  `cb58368`         Fix / polish      Reading, search,    Five audited files;
                                      navigation and      build/type/content
                                      Ayah-image UX       checks passed

  `a6994f8`         Fix               Final V1 audit and  Five-file follow-up;
                                      reliability         clean tree

  `25ba60b0`        Feature/fix       V1 UX and           Later represented
                                      reliability audit   through follow-up
                                      commit before       history
                                      history integration

  `04fccb2`         Fix               V1 mobile           Remote history
                                      navigation/search
                                      UX

  `af5ed90`         Fix               V1 Tamil font       Remote history
                                      deployment

  `410599e`         Release           V1 release          Remote history
                                      checkpoint
  ----------------------------------------------------------------------------

> Verify exact remote/deployment history before publishing release notes
> because some commits were integrated through local history
> reconciliation.

------------------------------------------------------------------------

# 8. Detailed V1 fixes

## 8.1 Local Tamil font

**Problem:**\
Tamil font depended on `next/font/google`, creating a fragile production
build/runtime dependency on `fonts.gstatic.com`.

**Fix:**\
Changed `Noto_Serif_Tamil` to `next/font/local` and added:

`app/fonts/noto-serif-tamil.woff2`

**Status:** 🟢 Shipped.

**Regression test:** - Production clean build - Tamil text renders
without Google font access - Offline Tamil reading still renders
correctly

------------------------------------------------------------------------

## 8.2 iOS search overlay / keyboard

**Problem:**\
Search overlay used layout viewport sizing and did not correctly handle
mobile keyboard/visual viewport changes.

**Fix:** - Visual viewport height handling - Body/root scroll locking -
Mobile-safe overlay sizing - Desktop behavior preserved

**Status:** 🟢 Fixed in code.

**Test:** - iPhone search field + keyboard - iPad search field +
keyboard - Open/close search repeatedly - Verify underlying page does
not scroll - Verify keyboard does not cover search controls

------------------------------------------------------------------------

## 8.3 Advanced search on mobile

**Requirement:**\
The advanced search already available on web/desktop must also be
exposed on mobile.

**Current UI intent:** - Search field - Tamil reference hint -
`மேம்பட்ட தேடல் →`

**Status:** 🟢 Implemented.

**Important clarification:**\
`ஸூரா அல்லது வசன எண்ணை உள்ளிடலாம் (எ.கா. 2:255)` is informational helper
text. It is **not** intended to make `2:255` itself clickable.

------------------------------------------------------------------------

## 8.4 Reference search stale-result protection

**Problem:**\
Async search/reference resolution could potentially display a result
belonging to an older query.

**Fix:** - Exact `surah:verse` result key - Monotonically increasing
request-generation ID - Ignore stale callbacks - Render only when stored
result matches current reference

**Status:** 🟢 Code fix implemented.

**Production status:** 🔴 Android offline still intermittently behaves
incorrectly.

**Important:**\
Do not assume the React race remains the cause. Current diagnosis points
toward stale PWA JavaScript/cache execution on Android.

------------------------------------------------------------------------

## 8.5 Surah top/bottom navigation

**Problem:**\
Long-page navigation existed on other pages but was missing from Surah
pages.

**Fix:**\
Reused existing:

`components/LongPageNavigation.tsx`

Integrated at:

`app/surah/[number]/page.tsx`

**Status:** 🟢 Production tested and working.

**Do not refactor shared navigation for V1.**

------------------------------------------------------------------------

## 8.6 Reading Width

**Current implementation:**

-   Narrow: `42rem`
-   Normal: `52rem`
-   Wide: `64rem`

Mobile padding adjustment currently: - Narrow → `px-6` - Normal →
`px-4` - Wide → `px-2` - `sm:px-6` unchanged

**Observed behavior:** - Android: differences are too subtle to be
useful. - iPad portrait: Narrow differs; Normal and Wide collapse to the
available viewport width.

**Decision:**\
🟡 **Hide the Reading Width control on phone-sized mobile screens.**

Keep: - underlying preference - localStorage - wrapper - tablet/iPad
behavior - desktop behavior

Do not add another arbitrary mobile-padding workaround in V1.

------------------------------------------------------------------------

# 9. Bug / regression tracker

## 🔴 BUG-001 --- Android offline reference search can jump to wrong verse

**Severity:** High

**Area:** Search / PWA / Offline

**Platforms:** Android offline

**Status:** Investigating / **candidate backlog**

**Observed:** - `3:180` sometimes jumps around verse 200 - `9:30`
sometimes jumps around verse 36 - `9.30` and `3. 180` can sometimes
work - Behavior is intermittent - Online search works - iPad offline
search works

**Expected:**\
Every valid reference resolves to exactly that Surah + Ayah.

**Current evidence:** - `fetchVerseReference()` is deterministic. -
Generated href examples: - `3:180 → /surah/3#180` -
`9:30 → /surah/9#30` - Surah Ayah IDs are deterministic. -
SearchOverlay/SearchPage now guard stale results. - Strong suspicion:
Android is sometimes running stale cached JavaScript while offline.

**Likely system-level issue:**\
PWA cache/update lifecycle.

**Lifecycle fix status:**\
The V1 service-worker cache namespace now advances to `quran-v2`, old
`quran-*` caches are removed only after the new worker activates, and the
application explicitly checks for updates at startup and visible-page
return. The Android symptom remains unverified and is **not fixed by this
tracker entry**.

**Do not:**\
Add more speculative React race fixes.

**Next investigation:**\
Dedicated service-worker versioning/update strategy and clean-install
testing.

**Workaround:**\
Reconnect online / refresh after deployment / reinstall PWA if needed.

------------------------------------------------------------------------

## 🔴 BUG-002 --- Android offline Ayah image shows network error

**Severity:** High

**Area:** Sharing / PWA / Offline

**Platforms:** Android offline

**Status:** Investigating / **candidate backlog**

**Observed:**\
Android still reports network error when generating an Ayah image
offline.

**Expected:**\
Ayah image generation should work offline if required fonts/assets are
already bundled/cached.

**Existing fix:**\
Font loading failures are caught around: - `document.fonts.ready` -
`document.fonts.load(...)`

**Current diagnosis:**\
If production Android still shows the old network error, it is highly
likely that Android is executing an older cached application bundle.

**Lifecycle fix status:**\
The V1 service-worker cache namespace now advances to `quran-v2`, old
`quran-*` caches are removed only after the new worker activates, and the
application explicitly checks for updates at startup and visible-page
return. The Android symptom remains unverified and is **not fixed by this
tracker entry**.

**Next investigation:**\
Trace exact exception source and verify service-worker/client bundle
versions.

**Do not:**\
Assume another font-loading try/catch is the answer.

------------------------------------------------------------------------

## 🔴 BUG-003 --- Arabic Ayah image shifted right and clipped

**Severity:** High

**Area:** Ayah image / Canvas

**Platforms:** Android / iPad / Web observed

**Status:** Fix now

**Observed:**\
After header/footer centering change: - Header/footer improved. - Arabic
main text shifted right. - Arabic text is clipped at the right edge.

**Root cause:**\
Canvas `ctx.textAlign` state leaked.

Header changes:

`ctx.textAlign = "left"`

Arabic rendering followed without restoring:

`ctx.textAlign = "center"`

Arabic was therefore drawn from x=540 as its left edge rather than
centered at x=540.

**Smallest fix:**

``` ts
ctx.direction = "rtl";
ctx.textAlign = "center";
```

immediately before Arabic rendering.

**Important:**\
Do not revert header/footer measured-width fix.

**Regression test:** - iPad - Android - desktop/web - Verify Arabic
fully visible - Verify Tamil remains centered - Verify header centered -
Verify footer centered

------------------------------------------------------------------------

## 🟡 BUG-004 --- Reading Width has little/no useful effect on phones

**Severity:** Low

**Area:** Reading UX

**Status:** Product adjustment

**Root cause:**\
Phone viewport is narrower than all max-width values. Mobile padding
differences are too small to create a meaningful reading-width control.

**Decision:**\
Hide control on phone-sized screens.

**Keep:**\
Tablet/iPad + desktop setting.

------------------------------------------------------------------------

## 🟡 BUG-005 --- Notes offline behavior differs by platform

**Severity:** Medium

**Area:** PWA / Notes

**Observed:**\
iPad offline Notes did not load while Android did.

**Status:** Backlog / needs dedicated PWA investigation

**Expected:**\
If Notes are intended to be offline-capable, behavior should be
consistent.

**Do not fix during current V1 image/search stabilization unless
blocking release.**

------------------------------------------------------------------------

# 10. Known fixed issues / regression history

  ---------------------------------------------------------------------------
  Issue             Original symptom   Fix                  Current state
  ----------------- ------------------ -------------------- -----------------
  Tamil Google font Fragile external   Bundled local        🟢
  dependency        font dependency    WOFF2 +
                                       `next/font/local`

  iOS search        Keyboard caused    Visual viewport +    🟢
  viewport          overlay/page       scroll lock
                    layout issues

  Advanced search   Desktop-only       Added mobile entry   🟢
  mobile            exposure

  Duplicate search  Confusing search   Consolidated         🟢
  helper UI         presentation       helper/search layout

  `2:255`           Reference appeared Removed clickable    🟢
  unintended        as a link          reference behavior;
  clickable                            helper remains
  behavior                             informational

  Android image     Offline font       Failure-tolerant     🟡 Android
  font error        rejection escaped  font loading         offline still
                                                            affected, likely
                                                            stale PWA code

  iPad Tamil image  Tamil lines        Measured-width       🟢 / verify
  alignment         shifted            centering

  Web image footer  `textAlign=left`   Footer center        🟢
  shift             leaked to footer   restoration /
                                       measured centering

  iPad              Mixed-script text  Measured-width       🟢 latest
  header/footer     had small offset   header/footer        observation
  alignment                            centering

  Arabic image      Header fix leaked  Explicit Arabic      🔴 fix pending
  clipping          `textAlign=left`   center reset
                    into Arabic

  Surah top/bottom  Long pages lacked  Reused               🟢
  navigation        controls           LongPageNavigation
  missing
  ---------------------------------------------------------------------------

------------------------------------------------------------------------

# 11. Production test matrix

  -----------------------------------------------------------------------------------------
  Test            Android      Android    iPhone     iPad online  iPad offline Web
                  online       offline
  --------------- ------------ ---------- ---------- ------------ ------------ ------------
  Surah reading   ⬜           ⬜         ⬜         ⬜           ⬜           ⬜

  Tamil rendering ⬜           ⬜         ⬜         ⬜           ⬜           ⬜

  Tamil search    ⬜           ⬜         ⬜         ⬜           ⬜           ⬜

  Reference       ⬜           🔴 known   ⬜         ⬜           🟢 observed  ⬜
  search                       issue

  Advanced search ⬜           ⬜         ⬜         ⬜           ⬜           ⬜

  Search keyboard ⬜           ⬜         ⬜         ⬜           ⬜           N/A
  behavior

  Surah ↑/↓       🟢           ⬜         ⬜         ⬜           ⬜           ⬜
  navigation

  Reading Width   🔴 weak      N/A        N/A        🟡 partial   N/A          ⬜

  Ayah image      ⬜           🔴 known   ⬜         🟢           🟢           ⬜
  generation                   issue                 generation   generation

  Ayah Arabic     🔴 current   🔴         ⬜         🔴 current   🔴           🔴 current
  alignment       regression                         regression                regression

  Ayah Tamil      ⬜           ⬜         ⬜         🟢 mostly    ⬜           ⬜
  alignment                                          fixed

  Header/footer   ⬜           ⬜         ⬜         🟢 improved  ⬜           🟢 improved
  alignment

  Notes offline   🟢 observed  ⬜         ⬜         🔴 observed  🔴 observed  ⬜
                                                     issue

  PWA reopen      ⬜           ⬜         ⬜         ⬜           ⬜           N/A
  offline
  -----------------------------------------------------------------------------------------

------------------------------------------------------------------------

# 12. Regression protocol

For every production fix:

### Before declaring fixed

-   [ ] Reproduce original bug
-   [ ] Test fix on affected platform
-   [ ] Test opposite platform/browser
-   [ ] Test online
-   [ ] Test offline if relevant
-   [ ] Test fresh browser session
-   [ ] Test existing PWA installation if relevant
-   [ ] Test after reload
-   [ ] Test after service-worker update
-   [ ] Test long Surah / large content if relevant
-   [ ] Record exact device/browser
-   [ ] Record production commit/deployment
-   [ ] Record screenshot/video if visual
-   [ ] Add regression case to tracker

### For Quran navigation

Never mark fixed based only on visual behavior.

Explicitly test:

-   `1:1`
-   `2:255`
-   `3:180`
-   `9:30`
-   `9:36`
-   `114:6`
-   invalid references
-   alternate accepted reference formats

------------------------------------------------------------------------

# 13. Current release gate

V1 can be considered stable when:

### Must pass

-   [ ] Arabic Ayah image fully visible and centered on Android
-   [ ] Arabic Ayah image fully visible and centered on iPad
-   [ ] Arabic Ayah image fully visible and centered on web
-   [ ] Tamil Ayah image remains centered
-   [ ] Header/footer remain centered
-   [ ] Surah ↑/↓ navigation works
-   [ ] Online reference search is deterministic
-   [ ] Production build/type/content audits pass
-   [ ] No new regressions introduced

### Can be deferred

-   [ ] Android offline reference-search reliability
-   [ ] Android offline Ayah-image generation
-   [ ] Notes offline consistency
-   [ ] Full PWA cache/update architecture
-   [ ] Mobile Reading Width feature

### V1 freeze rule

Once the must-pass items are green:

> **Freeze V1. Do not add new features until the release is
> tagged/documented.**

------------------------------------------------------------------------

# 14. Roadmap

## NOW --- V1 stabilization

-   [ ] Fix Arabic Ayah-image alignment regression
-   [ ] Hide Reading Width control on phone-sized screens
-   [ ] Re-run production cross-platform image tests
-   [ ] Verify production deployment corresponds to intended commit
-   [ ] Run final V1 smoke test
-   [ ] Record known deferred issues
-   [ ] Freeze V1

------------------------------------------------------------------------

## NEXT --- PWA reliability

### PWA cache/update strategy

-   [x] Version cache per application release (`quran-v2`)
-   [x] Define service-worker update lifecycle
-   [x] Add explicit startup/visibility update checks
-   [x] Make critical precache failure prevent activation
-   [x] Verify old caches are cleaned safely on activation
-   [ ] Verify new JS bundles replace old cached bundles after deployment
-   [ ] Test existing installed PWA after deployment
-   [ ] Test fresh install
-   [ ] Test update from old version
-   [ ] Test Android offline after update
-   [ ] Test iOS/iPad offline after update
-   [x] Add a documented cache invalidation strategy

### Offline reference search

-   [ ] Reproduce Android issue on a known service-worker version
-   [ ] Confirm active SW version
-   [ ] Confirm cached JS version
-   [ ] Confirm cached Surah data version
-   [ ] Confirm exact generated href
-   [ ] Confirm destination anchor
-   [ ] Add automated reference-resolution tests
-   [ ] Re-test Android offline

### Offline Ayah images

-   [ ] Trace exact Android exception
-   [ ] Verify bundled fonts
-   [ ] Verify cached JS
-   [ ] Verify canvas/font behavior offline
-   [ ] Add Android offline regression test
-   [ ] Re-test image generation

### Notes offline

-   [ ] Define whether Notes are officially offline-supported
-   [ ] If yes, make caching deterministic
-   [ ] Test Android/iPad consistency

------------------------------------------------------------------------

## LATER --- Product expansion

### Audio

-   [ ] Reciter selection
-   [ ] Play/pause
-   [ ] Verse/ayah-group synchronization
-   [ ] Background playback strategy
-   [ ] Playback progress
-   [ ] Repeat verse/group
-   [ ] Offline audio policy

### English / additional translations

-   [ ] Translation architecture
-   [ ] Translation selector
-   [ ] Typography rules
-   [ ] Search across translations
-   [ ] Offline data strategy

### Reading experience

-   [ ] More granular text-size controls
-   [ ] Better mobile reading-width model if desired
-   [ ] Reading progress
-   [ ] Bookmarks
-   [ ] Last-read position
-   [ ] Notes/annotations

### Sharing

-   [ ] Refine Ayah-image templates
-   [ ] Additional themes
-   [ ] More reliable cross-browser canvas rendering
-   [ ] Share metadata
-   [ ] Save/share UX improvements

------------------------------------------------------------------------

# 15. Backlog / ideas

-   [ ] Dedicated PWA update architecture
-   [ ] Automated cross-browser screenshot testing
-   [ ] Device/browser compatibility matrix
-   [ ] Performance profiling on low-end Android
-   [ ] Search index optimization
-   [ ] Offline data integrity checks
-   [ ] Automated Quran reference tests
-   [ ] Audio
-   [ ] English translation
-   [ ] Reading progress
-   [ ] Bookmarks
-   [ ] Recitation support
-   [ ] Analytics
-   [ ] Crash/error reporting
-   [ ] Accessibility audit
-   [ ] Install/update UX for PWA

------------------------------------------------------------------------

# 16. Technical debt

  -------------------------------------------------------------------------------
  Item              Impact            Priority          Notes
  ----------------- ----------------- ----------------- -------------------------
  PWA cache version High              High              Versioned as `quran-v2`;
  remains                                               deployment/update
                                                      verification remains
                                                      pending

  Offline behavior  High              High              Android/iPad behavior
  lacks full                                            differs
  cross-browser
  verification

  Canvas rendering  Medium            High              Explicitly reset
  relies on mutable                                     `textAlign`/`direction`
  context state                                         per rendering section

  Reading Width     Low               Low               Hide control until a
  mobile UX                                             meaningful mobile model
                                                        exists

  No automated      Medium            Medium            Current verification is
  device/browser                                        heavily manual
  regression suite

  No formal         Medium            Later             Not needed for V1
  analytics                                             stabilization
  -------------------------------------------------------------------------------

------------------------------------------------------------------------

# 17. Decisions log

  --------------------------------------------------------------------------------
  Date              Decision             Context              Outcome / Follow-up
  ----------------- -------------------- -------------------- --------------------
  2026-08-16        Stay on Next.js for  Current static       Revisit only with
                    V1                   architecture is      evidence of
                                         adequate; rewrite    framework-level
                                         risk outweighs       performance
                                         benefit              limitation

  2026-08-16        Bundle Tamil font    External Google font Implemented
                    locally              dependency was
                                         fragile

  2026-08-16        Advanced search must It already existed   Implemented
                    exist on mobile      on web and should be
                                         equally discoverable
                                         on mobile

  2026-08-16        `2:255` helper       User explicitly did  Keep helper text,
                    reference is         not request          remove link behavior
                    informational, not   clickable reference
                    clickable

  2026-08-16        Reuse                Component already    Implemented and
                    LongPageNavigation   works on             production-tested
                    on Surah pages       Notes/Topics/About

  2026-08-16        Keep header/footer   Current production   Preserve
                    measured-width       observation shows
                    centering            improved alignment

  2026-08-16        Arabic needs         Header               Fix with explicit
                    explicit center      `textAlign=left`     Arabic
                    alignment            leaked into Arabic   `textAlign=center`
                                         canvas rendering

  2026-08-16        Hide Reading Width   Current mobile       Keep underlying
                    on phones            effect is too subtle preference; retain
                                         to justify the       tablet/desktop
                                         control

  2026-08-16        Park Android offline Avoid speculative    Dedicated PWA/cache
                    bugs if not safely   changes during V1    investigation later
                    resolved in this     stabilization
                    round
  --------------------------------------------------------------------------------

------------------------------------------------------------------------

# 18. Release checklist

## Code

-   [ ] Working tree clean
-   [ ] Intended files only
-   [ ] No accidental screenshots/assets staged
-   [ ] `npm run audit:content`
-   [ ] `npx tsc --noEmit`
-   [ ] `npm run build`
-   [ ] Targeted ESLint
-   [ ] `git diff --check`

## Functional

-   [ ] Surah reading
-   [ ] Search
-   [ ] Reference navigation
-   [ ] Advanced search
-   [ ] Long-page navigation
-   [ ] Settings
-   [ ] Reading Width on supported screens
-   [ ] Ayah image generation
-   [ ] Ayah image sharing
-   [ ] PWA install/open

## Cross-platform

-   [ ] Android Chrome online
-   [ ] Android Chrome offline
-   [ ] iPhone Safari online
-   [ ] iPad Safari online
-   [ ] iPad Safari offline
-   [ ] Desktop web

## Content integrity

-   [ ] Quran content audit passes
-   [ ] No unexpected content changes
-   [ ] Reference links resolve correctly
-   [ ] No duplicate/missing Ayah IDs
-   [ ] Long Surahs render correctly

## Release

-   [ ] Confirm exact commit deployed
-   [ ] Confirm production URL
-   [ ] Update version/changelog
-   [ ] Record known issues
-   [ ] Tag/release if applicable
-   [ ] Verify post-deployment smoke test
-   [ ] Do not mark deferred bugs as fixed

------------------------------------------------------------------------

# 19. Current test cases

## Search

  -----------------------------------------------------------------------
  ID                      Input                   Expected
  ----------------------- ----------------------- -----------------------
  SEARCH-001              Tamil keyword           Correct matching verses

  SEARCH-002              `2:255`                 Jump to Surah 2, Ayah
                                                  255

  SEARCH-003              `3:180`                 Jump to Surah 3, Ayah
                                                  180

  SEARCH-004              `9:30`                  Jump to Surah 9, Ayah
                                                  30

  SEARCH-005              `9.30`                  Correctly handled
                                                  according to parser

  SEARCH-006              `3. 180`                Correctly handled
                                                  according to parser

  SEARCH-007              Rapidly switch          Final result must be
                          `3:180 → 9:30`          9:30

  SEARCH-008              Invalid reference       No incorrect jump
  -----------------------------------------------------------------------

## Ayah image

  ----------------------------------------------------------------------------
  ID                      Test                    Expected
  ----------------------- ----------------------- ----------------------------
  IMAGE-001               Android online          Arabic/Tamil/header/footer
                                                  centered

  IMAGE-002               Android offline         No network error if offline
                                                  support is claimed

  IMAGE-003               iPhone                  Full image renders correctly

  IMAGE-004               iPad                    Arabic fully visible and
                                                  centered

  IMAGE-005               Web                     Arabic/Tamil/header/footer
                                                  centered

  IMAGE-006               Long Arabic line        No clipping

  IMAGE-007               Long Tamil line         No clipping

  IMAGE-008               Header/footer mixed     No optical/platform-specific
                          script                  shift
  ----------------------------------------------------------------------------

## Reading

  ID         Test            Expected
  ---------- --------------- ---------------------------------------------
  READ-001   Android phone   Reading Width control hidden
  READ-002   iPad            Supported width options behave meaningfully
  READ-003   Desktop         Narrow/Normal/Wide change reading column
  READ-004   Long Surah      No horizontal overflow

------------------------------------------------------------------------

# 20. Current known issues summary

### 🔴 Fix before V1 freeze

1.  **Arabic Ayah-image rendering**
    -   Right-shifted
    -   Clipped
    -   Root cause identified: leaked `ctx.textAlign = "left"`

### 🟡 Defer to PWA reliability cycle

2.  **Android offline reference search**
    -   Intermittently incorrect
    -   Strong stale-bundle/service-worker suspicion
3.  **Android offline Ayah image**
    -   Network error persists
    -   Strong stale-bundle/service-worker suspicion
4.  **iPad Notes offline inconsistency**
    -   Needs explicit offline-support decision and investigation

### 🟡 Product cleanup

5.  **Reading Width on phones**
    -   Hide control
    -   Keep feature for tablet/desktop

------------------------------------------------------------------------

# 21. Change-control rule

Before any new V1 change:

1.  State the exact user-visible problem.
2.  Identify the affected platforms.
3.  Reproduce it.
4.  Identify root cause.
5.  Define the smallest fix.
6.  Identify regression risk.
7.  Implement only that fix.
8.  Run automated validation.
9.  Test affected platforms.
10. Update this tracker.
11. Only then commit.

**No "while we're here" refactors during V1 stabilization.**

------------------------------------------------------------------------

# 22. Project status snapshot

**Overall:** 🟡 **V1 stabilization**

The application has moved from broad feature construction into the much
more valuable phase of controlled stabilization. The major core UX
pieces are in place, Surah navigation is working, Tamil font deployment
is robust, search/mobile UX has been substantially improved, and the
remaining problems are concentrated in cross-platform canvas rendering
and PWA/offline lifecycle behavior.

The immediate path is intentionally narrow:

**Fix Arabic image → hide misleading phone Reading Width control →
verify V1 → freeze → investigate PWA cache/offline architecture as a
separate workstream.**
