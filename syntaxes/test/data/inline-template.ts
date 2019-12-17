/* clang-format off */

@Component({
//// Property key/value test
  template: '<div></div>',

//// String delimiter tests
  template: `<div></div>`,
  template: "<div></div>",
  template: '<div></div>',

//// Parenthesization tests
  template: ( (( '<div></div>' )) ),

//// Comments tests
  // template: '<div></div>'
  /*
   * template: '<div></div>'
   */
  /**
   * template: '<div></div>'
   */
})
export class TMComponent{}
