import {MockData} from './test_utils';

export const QUICKSTART: MockData = {
  'tsconfig.json': `
{
  "compilerOptions": {
    "target": "es5",
    "module": "commonjs",
    "moduleResolution": "node",
    "sourceMap": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "lib": [ "es2015", "dom" ],
    "noImplicitAny": true,
    "suppressImplicitAnyIndexErrors": true
  }
}
`,
  'app': {

    'app.component.ts': `
import { Component } from '@angular/core';

@Component({
  selector: 'my-app',
  template: \`<h1>Hello  {{name}}</h1> ><div *ngIf="name !== undefined"></div>\`,
})
export class AppComponent  { name = 'Angular'; }`,


    'app.module.ts': `
import { NgModule }      from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent }  from './app.component';

@NgModule({
  imports:      [ BrowserModule ],
  declarations: [ AppComponent ],
  bootstrap:    [ AppComponent ]
})
export class AppModule { } `,


    'main.ts': `
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app.module';

platformBrowserDynamic().bootstrapModule(AppModule);`,
  }
};