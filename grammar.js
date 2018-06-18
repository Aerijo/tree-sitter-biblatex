let noCase = str => {
  return new RegExp(
    str
    .split("")
    .map(c => /[a-zA-Z]/.test(c) ? `[${c.toLowerCase()}${c.toUpperCase()}]` : c)
    .join("")
  );
};

/*
  Adapted from the PEG grammar given here https://github.com/aclements/biblib
*/

module.exports = grammar({
  name: "bibtex",

  rules: {
    program: $ => repeat(choice($._at_command, $._comment)),

    _comment: $ => /[^@]+/,

    _at_command: $ => seq('@', $._ws, $._command),

    _command: $ => choice(
      $.comment,
      $.string,
      $.preamble,
      $.entry
    ),

    _ws: $ => /[\s\t\n]*/,

    comment: $ => noCase("comment"),


    string: $ => seq(noCase("string"), $._ws, $._string_block),
    _string_block: $ => choice(
      seq('{', $.string_body, '}'),
      seq('(', $.string_body, ')')
    ),
    string_body: $ => seq($.identifier, $._ws, '=', $._ws, $.value),


    preamble: $ => seq(noCase("preamble"), $._ws, $._preamble_block),
    _preamble_block: $ => choice(
      seq('{', $.preamble_body, '}'),
      seq('(', $.preamble_body, ')')
    ),
    preamble_body: $ => $.value,


    entry: $ => seq($.identifier, $._ws, $._entry_block),
    _entry_block: $ => choice(
      seq('{', $._ws, $.key, $._ws, repeat($.field), optional(','), $._ws, '}'),
      seq('(', $._ws, $.kep, $._ws, repeat($.field), optional(','), $._ws, ')')
    ),

    key: $ => /[^,\s\t\n\}]*/,
    kep: $ => /[^,\s\t\n\)]*/, // "parentheses key"

    field: $ => seq(',', $._ws, $.identifier, $._ws, '=', $._ws, $.value),


    identifier: $ => {
      const first = /[\!\$\&\*\+\-\.\/\:\;<>\?\@\[\]\\\^\_\`\|\~a-zA-Z]/; // https://regex101.com/r/fAkBEf/1
      const later = /[\!\$\&\*\+\-\.\/\:\;<>\?\@\[\]\\\^\_\`\|\~a-zA-Z0-9]/; // basically all visible ascii except: "#%'(),={}
      return token(seq(first, repeat(later)));
    },

    value: $ => seq($.piece, $._ws, repeat(seq('#', $._ws, $.piece, $._ws))),

    piece: $ => choice(
      /[0-9]+/,
      seq("{", repeat($._balanced), '}'),
      seq('"', repeat($._quote_balanced), '"'),
      $.identifier
    ),

    _balanced: $ => choice(
      seq('{', repeat($._balanced), '}'),
      $._text
    ),

    _quote_balanced: $ => choice(
      seq('{', repeat($._balanced), '}'),
      $._quote_text
    ),

    _text: $ => /[^\{\}]+/,

    _quote_text: $ => /[^\"\{]+/
  }
});
