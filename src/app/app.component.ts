import { Component } from '@angular/core';
import { WebsocketService } from './Services/websocket.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'mapbox';

  constructor(
    private wsService: WebsocketService
  ){}
}
