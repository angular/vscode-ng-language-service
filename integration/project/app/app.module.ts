import { NgModule }      from '@angular/core';
import { AppComponent }  from './app.component';
import { FooComponent } from './foo.component';

@NgModule({
  imports:      [],
  declarations: [
    AppComponent,
    FooComponent,
  ],
  bootstrap:    [ AppComponent ]
})
export class AppModule { }
