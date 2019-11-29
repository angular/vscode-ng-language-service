// SYNTAX TEST "template.ng"

@Component({
//// Property key/value test
  template: '<div></div>',
//^^^^^^^^^                 meta.object-literal.key.ts
//           ^^^^^^^^^^^    template.ng (fake grammar token)

//// String delimiter tests
  template: `<div></div>`,
//          ^               string
//                      ^   string
  template: "<div></div>",
//          ^               string
//                      ^   string
  template: '<div></div>',
//          ^               string
//                      ^   string

//// Parenthesization tests
  template: ( (( '<div></div>' )) ),
//          ^                         meta.brace.round.ts
//            ^^                      meta.brace.round.ts
//               ^                    string
//                           ^        string
//                             ^^     meta.brace.round.ts
//                                ^   meta.brace.round.ts
})
export class TMComponent{}
