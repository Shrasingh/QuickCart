# QuickCart — Git Workflow and Contributor Attribution

Investigated 2026-10-28 (updated 2026-10-29) against the local clone and the public GitHub API for `Shrasingh/QuickCart`. Facts are marked **verified**; everything else is marked as inference or recommendation. Sections 2 to 6 are the standing rules for this repository; section 1 is the dated record that motivated them.

---

## 1. Findings

### 1.1 Repository and remote (verified)

| Item | Value |
|---|---|
| GitHub repository | <https://github.com/Shrasingh/QuickCart> — owner `Shrasingh`, public, not a fork |
| Default branch | `main`, **not protected** |
| Local remote | `origin` → `https://github.com/Shrasingh/QuickCart.git` (fetch and push) |
| Local branches (2026-10-28) | `main`, `backup-before-removing-claude` (local only, never pushed); feature branches are created per change and deleted after merge |
| Remote branches | `main` plus short-lived feature branches while their PR is open |

### 1.2 Who authored what (verified via `git log` and the GitHub commits API)

| Commit | Date | Author (name / email) | GitHub account shown | Committer |
|---|---|---|---|---|
| `dca90af` Initial commit from Create Next App | 2024-05-26 | Shivang Tripathi `<shivangtripathi101@gmail.com>` | `shivang-tripati` | same |
| `da3953d` first commit (gallery, cart store, summary, no-results) | 2024-06-06 | Shivang Tripathi | `shivang-tripati` | same |
| `ff5770d` quickcart | 2024-06-17 | Shraddha Singh `<shra192002@gmail.com>` | `Shrasingh` | same |
| `003d1fc` update mobile-filter | 2024-06-18 | Shraddha Singh | `Shrasingh` | same |
| `ee2bef4` name change | 2024-06-18 | Shraddha Singh | `Shrasingh` | same |
| `b59b9c3` fix (search, price filter, orders, order-success, 404, skeleton) | 2026-07-04 | Shraddha Singh | `Shrasingh` | same |
| `714b3cc` Configurable home billboard, checkout errors, fresh navbar | 2026-10-24 | Shraddha Singh | `Shrasingh` | same |
| `dd0768c` Upgrade to Next.js 16 and React 19 | 2026-10-24 | Shraddha Singh | `Shrasingh` | same |
| `bd43877` Update README for Next.js 16 upgrade | 2026-10-24 | Shraddha Singh | `Shrasingh` | same |

GitHub's contributor list matches: **Shrasingh 7, shivang-tripati 2**. Author and committer are identical on every commit (no rebases by a third party, no cherry-picks from someone else).

### 1.3 `shraddhasingh-cfc` and Claude trailers (verified)

- **On the remote (`origin/main`): none.** No commit is authored or committed by `shraddhasingh-cfc <<work email>>`, and no commit message carries a `Co-Authored-By: Claude …` trailer.
- **Locally:** the branch `backup-before-removing-claude` holds the *pre-rewrite* versions of the three 2026-10-24 commits:
  - `81cb028` — authored by `shraddhasingh-cfc <<work email>>`, with a Claude co-author trailer;
  - `09620ae`, `65dc245` — authored by Shraddha Singh, with Claude co-author trailers.
- **History was rewritten once, on 2026-10-24.** The reflog shows `rebase (start)` → three `commit (amend)` → `rebase (finish)`. The GitHub deployments API shows Vercel deployed `65dc245` (old) at 08:58 UTC and `bd43877` (rewritten) at 09:20 UTC, so the old commits *were* briefly published and then replaced with a force-push. Nobody else had pushed in between (Shivang's last commit is from 2024), so no collaborator was affected. The old SHAs are not on any branch and will not appear in the contributor graph; GitHub may still serve them by direct URL until it garbage-collects them.

### 1.4 Identity configuration on this machine (verified)

| Scope | `user.name` | `user.email` | Effect |
|---|---|---|---|
| **Global** (`~/.gitconfig`) | `shraddhasingh-cfc` | `<work email>` | Default for **every** repository without a local override — this is the work account |
| **Local** (this repo's `.git/config`) | `Shraddha Singh` | `shra192002@gmail.com` | Wins inside this repo. Correct. |

`git config user.email` run inside the repo returns `shra192002@gmail.com`, so new commits here will be attributed to `Shrasingh`. The `81cb028` mishap happened because the clone (reflog: `clone: from …` on 2026-10-24) was made before the local override existed, so the first commit inherited the global work identity.

No credentials or tokens are stored in either config (checked: no `credential.*` entries beyond the helper, no URLs with embedded tokens).

### 1.5 Shivang Tripathi

- Authored the two scaffold commits in May/June 2024 under his own account `shivang-tripati`; attribution is correct and must stay.
- Whether he is currently a collaborator on the repository could not be read (the collaborators endpoint needs authentication). He has made no commits since 2024-06-06. **Inference:** the project has been solo since then.

### 1.6 Later history (verified 2026-10-29)

The production-hardening work described in `docs/ENGINEERING_REVIEW.md` was committed on the branch `chore/quickcart-production-hardening` and merged into `main` through pull requests #1 and #2 on 2026-10-28, authored as `Shraddha Singh <shra192002@gmail.com>` with no AI trailers. `backup-before-removing-claude` remains a local-only branch (see §4).

---

## 2. How GitHub decides who gets credit

GitHub attribution is derived from **commit metadata**, not from who pushed:

1. Each commit stores an **author** (who wrote it) and a **committer** (who created the commit object — differs after rebase/cherry-pick/`--amend` by someone else). GitHub shows the author; the contributor graph counts authors.
2. The **email** in the author field is matched against the **verified emails of GitHub accounts**. `shra192002@gmail.com` is verified on `Shrasingh`, so those commits link to that profile. If an email matches no account, the commit shows a plain name with no avatar and counts for nobody.
3. `Co-Authored-By: Name <email>` trailers in the message add **additional** authors. A trailer for `noreply@anthropic.com` would not link to any human account, but it would be visible in the commit and in some tooling.
4. Attribution is therefore controlled per commit, at commit time. A later configuration change fixes future commits only; existing ones can be changed only by rewriting them.

---

## 3. Rules for future commits

### 3.1 This repository (done)

The local identity is already correct (set with `git config --local user.name "Shraddha Singh"` and `git config --local user.email "shra192002@gmail.com"`). Verify before **every** commit, not just the first of a session:

```bash
git config user.name    # must print: Shraddha Singh
git config user.email   # must print: shra192002@gmail.com
```

If either line differs, **stop and do not commit**; re-run the two `--local` commands above. After committing, confirm the commit itself carries the right identity before pushing:

```bash
git log -1 --format='author=%an <%ae> | committer=%cn <%ce>'
```

Both halves must read `Shraddha Singh <shra192002@gmail.com>`. The GitHub username (`Shrasingh`) is not a git setting; GitHub derives it from that email, which must be verified on the `Shrasingh` account (section 2).

### 3.2 Preventing the wrong identity in a fresh clone (recommendation — not applied)

A fresh `git clone` has **no local identity**, so it silently inherits the global one (`shraddhasingh-cfc`). Two safe ways to prevent that; both leave the global config alone for work repositories:

**Option A — per-clone override (simplest):** immediately after cloning any personal repo:

```bash
git config user.name "Shraddha Singh"
git config user.email "shra192002@gmail.com"
```

**Option B — conditional include by directory (set-and-forget):** keep personal projects under one folder and let git pick the identity from the path. Add to `~/.gitconfig`:

```ini
[includeIf "gitdir/i:C:/Users/shraddha/Desktop/TEST/"]
    path = ~/.gitconfig-personal
```

and create `~/.gitconfig-personal`:

```ini
[user]
    name = Shraddha Singh
    email = shra192002@gmail.com
```

Every repository under that folder (including future clones) then authors as the personal account; everything else keeps the work identity. This touches the global file but only adds a scoped include, which is why it is listed as a recommendation for you to apply rather than applied here.

**Optional guard:** GitHub → Settings → Emails → "Block command line pushes that expose my email" is unrelated; the useful guard is a local `pre-commit` hook that aborts when `user.email` matches the work domain inside a personal repo. Not installed; hooks are per-clone and easy to forget, so Option B is the better fix.

### 3.3 AI assistance and honesty

- Do **not** add `Co-Authored-By: Claude …` trailers to commits in this project. Claude is a tool, not a collaborator with a GitHub account; the trailer adds a non-human "author" to the history and confuses the contributor record.
- Do **not** claim that AI-generated changes were written unaided. The honest position, and the one that holds up in an interview, is: *"I used AI coding tools for parts of the refactoring, tests and documentation; I reviewed, understood and am accountable for every change."* The README carries a one-line statement to that effect; edit it if you prefer different wording, but keep it truthful.
- Every change made in this session is explained, with rationale, in `docs/ENGINEERING_REVIEW.md` so you can defend it.

### 3.4 Never impersonate a collaborator

Do not use `--author="Shivang Tripathi <…>"` or amend commits to carry his name. His two commits are correctly attributed; nothing else should be.

---

## 4. Rules for existing history

- **Do not rewrite `main` again.** The published history is already clean (§1.2–1.3). A further rebase/force-push would gain nothing and would be the second rewrite of a public branch.
- **`backup-before-removing-claude`:** this local branch is the only remaining copy of the `shraddhasingh-cfc` / Claude-trailer commits. `main` contains the same code under corrected metadata. Recommended, **after you confirm**: `git branch -D backup-before-removing-claude`. Never push it. (Deleting it is reversible for ~90 days via the reflog, e.g. `git branch backup-before-removing-claude 65dc245`.)
- The 2026-10-24 rewrite is **not** something to hide; if asked in an interview, the accurate description is "I corrected the author identity on three unpublished-in-practice commits the same morning, before anyone else had based work on them."

---

## 5. Branch and pull-request conventions

- `main` is the only long-lived branch and is what Vercel deploys to production. Never commit to it directly once branch protection is enabled (see `docs/DEPLOYMENT_WORKFLOW.md`).
- Branch names: `feat/<topic>`, `fix/<topic>`, `chore/<topic>`, `docs/<topic>`. Short, lowercase, hyphenated.
- One concern per pull request. Small PRs get reviewed; 2,000-line PRs get rubber-stamped.
- Commit messages: imperative subject under 72 characters ("Add timeout to catalog fetches"), optional body explaining *why*. No `Co-Authored-By` trailers for AI tools.
- Every PR must pass the CI job ("Lint, typecheck, test, build") and be checked on its Vercel preview before merge.
- Merge with "Squash and merge" or "Create a merge commit"; never rebase-merge a shared branch after others have pulled it. Delete the branch after merging.
- Never `git push --force` to `main`. If a branch needs history cleanup before review, use `git push --force-with-lease` on that feature branch only, and only before anyone else has based work on it.

## 6. Verifying attribution on GitHub

After pushing, confirm the commit landed under the right account:

1. Open `https://github.com/Shrasingh/QuickCart/commits/main`. Each commit should show the `Shrasingh` avatar and username next to "Shraddha Singh". A commit that shows a grey default avatar and a plain name means the email on that commit is not verified on any GitHub account.
2. Open `https://github.com/Shrasingh/QuickCart/graphs/contributors`. Only `Shrasingh` and `shivang-tripati` should be listed.
3. Without a browser, the public API reports the account GitHub linked to each commit:

   ```bash
   curl -s "https://api.github.com/repos/Shrasingh/QuickCart/commits?per_page=5" | grep -E '"login"|"email"'
   ```

   `author.login` and `committer.login` should both be `Shrasingh` for your commits.
4. If a commit is attributed wrongly, the cause is always the email in the commit metadata. Check it with `git log -1 --format='%an <%ae> / %cn <%ce>'`. For an **unpushed** commit, fix it with `git commit --amend --reset-author` (after setting the local identity). For a **pushed** commit, do not rewrite; see section 4.
5. Make sure `shra192002@gmail.com` stays listed and verified under GitHub -> Settings -> Emails for the `Shrasingh` account. If "Keep my email addresses private" is enabled there, GitHub will still link commits made with the real address, but it will warn on pushes from the command line unless "Block command line pushes that expose my email" is off.
