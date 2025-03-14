import {Component, NgModule} from '@angular/core';

@Component({
  selector: 'lib-post',
  template: '{{random}}',
  host: {
    '[id]': 'getId()',
  }
})
export class PostComponent {
  random = Math.random();

  getId() {
    return 'my-id';
  }
}

@NgModule({
  declarations: [PostComponent],
  exports: [PostComponent],
})
export class PostModule {
}
