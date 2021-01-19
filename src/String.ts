export const slugify = (function constructor() {
  var from = '', to: Array<string> = [];
  var chars =
    { a: '\xe0\xe1\xe2\xe3\xe4\xe5\xe6\u0103\u0105'
    , e: '\xe8\xe9\xeb\xea\u0119'
    , i: '\xec\xed\xee\xef'
    , o: '\xf2\xf3\xf4\xf5\xf6\xf8'
    , u: '\xf9\xfa\xfb\xfc'
    , n: '\xf1\u0144'
    , c: '\xe7\u0107'
    , l: '\u0142'
    , s: '\u015b\u0219'
    , t: '\u021b'
    , z: '\u017a\u017c'
    , '-pound-': '\xa3'
    , '-dollar-': '\x24'
    , '-euro-': '\u20ac'
    , '-yen-': '\xa5'
    , '-and-': '&'
    , '-at-': '@'
    };
  for (const c in chars)
    for (let i = 0; i < chars[c].length; i++) {
      from += chars[c].charAt(i);
      to.push(c);
    }
  const rxp = new RegExp('[' + from + ']', 'g');
  const r1 = /[^a-z0-9]+/g, r2 = /^-+|-+$/g, r0 = /([a-z0-9])([A-Z])/g
  const modifier = function (c: string) { return to[from.indexOf(c)]; };
  const fn = function (str: string) {
    if (str == null) return '';
    return String(str)
      .replace(r0, '$1-$2')
      .toLowerCase()
      .replace(rxp, modifier)
      .replace(r1, '-').replace(r2, '');
  };
  fn.toString = function () { return '(' + constructor + ')()'; };
  return fn;
})();
