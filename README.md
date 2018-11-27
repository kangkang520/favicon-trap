# FAVICON-TRAP

A util allows you get favicons from a url

using this util you can get all favicons from given url.

# Installation
```
npm install favicon-trap
```

# Usage

there is only one function, it's verry easilly!

you can find more information from `.d.ts` file

```typescript
import { favicon } from 'favicon-trap'

favicon('/path/to/url', option).then(icons=>console.log(icons))
```


# Option

* **types**: which types of icons you want, "icon"、"apple-touch-icon"， default: ['icon']

* **timeout**: http request timeout (unit:ms), default: 5000

* **headers**: headers of http request