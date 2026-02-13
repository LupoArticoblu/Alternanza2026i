import { bootstrapApplication } from '@angular/platform-browser';
import { Component } from '@angular/core'
import { appConfig } from './app/app.config';

@Component({
  selector: 'app-root',
  standalone: true,
  template: '<h2>Welcome in Angular! {{name}}</h2>',
})
class App{
  name = 'Carmelo';
}

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
