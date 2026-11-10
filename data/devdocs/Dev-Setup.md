# Dev Setup

See the [contributor quickstart](../../README.md#for-developers-getting-started-from-source) to install dependencies, start the app, and run tests.

## Pre-Push Hook

We created a pre-push hook which prevents pushing things to the remote repository that should not be there.

To enable it, copy the [pre-push script](../../pre-push) to `.git/hooks/pre-push` from the repository root.

### Check 1: package.json

The pre-push hook runs [check-package.json.sh](../../check-package.json.sh) to check that dependencies in [package.json](../../package.json) are pinned:

```bash
checking package.json...
non version-pinned content found in package.json, ABORT! Please remove all ^ and ~ in package.json to proceed.
```

### Check 2: KILLME content

We introduce the word **KILLME** alongside **TODO**, **HACK** etc.

Whenever you create code that must only be run temporary on your machine, e.g.:

- code that skips a multi-step wizard or
- hardcodes a certain state or
- prints debug infos

accompany this code with a comment stating **KILLME**, e.g.:

```js
const initialStep = 2; // KILLME: initialStep = 0;
```

```html
<p>DEBUG: {{ myVar }}</p>
<!-- KILLME -->
```

The pre-push hook will prevent pushing if **KILLME** content is found in [src](../../src):

```bash
checking for KILLME content...
KILLME content found in ./src, ABORT! Please remove all KILLME content from ./src to proceed.
```

We recommend the VS Code extension [TODO Tree](https://marketplace.visualstudio.com/items?itemName=Gruntfuggly.todo-tree). Go to Settings and add **KILLME** to the tags. You may also remove **[x]** from the tags.
