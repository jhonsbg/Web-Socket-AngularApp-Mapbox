import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { WebsocketService } from 'src/app/Services/websocket.service';

import { Lugar } from 'src/app/interfaces/interfaces';
import * as mapboxgl from 'mapbox-gl'; 

interface RespMarcadores {
  [key: string]: Lugar
}

@Component({
  selector: 'app-mapa',
  templateUrl: './mapa.component.html',
  styleUrls: ['./mapa.component.css']
})
export class MapaComponent implements OnInit {

  mapa!: mapboxgl.Map;

  // lugares: Lugar[] = [];
  lugares: RespMarcadores = {};
  markersMapbox: {[id: string]: mapboxgl.Marker} = {};

  constructor(
    private http: HttpClient,
    private wsService: WebsocketService
  ) {}

  ngOnInit() {
    this.http.get<RespMarcadores>('http://localhost:5000/mapa').subscribe(lugares => {
      // console.log(lugares);
      this.lugares = lugares;
      this.crearMapa();
    })

    this.escucharSockets();
  }

  escucharSockets(){
    // Marcador nuevo
    this.wsService.listen('marcador-nuevo').subscribe((marcador: Lugar | any) => {
      console.log(marcador);
      this.agregarMarcador(marcador);
    });

    // marcador-mover
    this.wsService.listen( 'marcador-mover' )
      .subscribe( (marcador:Lugar | any) => {

        this.markersMapbox[ marcador.id ]
          .setLngLat([ marcador.lng, marcador.lat ])

    });

    // Marcador borrar
    this.wsService.listen('marcador-borrar').subscribe((id: string | any) => {
      this.markersMapbox[id].remove();
      delete this.markersMapbox[id];
    });
  }

  crearMapa(){
    (mapboxgl as any).accessToken = 'pk.eyJ1IjoiamhvbnNiZyIsImEiOiJja3Nhcm9xdTUxNWdlMnNuenJtNDA3ODB3In0.O7rhebA6nNSikLhKue4m4g';
    this.mapa = new mapboxgl.Map({
      container: 'mapa',
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [-75.75512993582937, 45.349977429009954],
      zoom: 15.8
    });

    for(const [id, marcador] of Object.entries(this.lugares)){
      this.agregarMarcador(marcador);
    }
  }

  agregarMarcador(marcador: Lugar){

    const h2 = document.createElement('h2');
    h2.innerText = marcador.nombre;

    const btnBorrar = document.createElement('button');
    btnBorrar.innerText = 'Borrar';

    const div = document.createElement('div');
    div.append(h2, btnBorrar);

    // const html = `<h2>${marcador.nombre}</h2>
    //               <br>
    //               <button>Borrar</button>`;

    const customPopup = new mapboxgl.Popup({
      offset: 25,
      closeOnClick: false
    }).setDOMContent(div);

    const marker = new mapboxgl.Marker({
      draggable: true,
      color: marcador.color
    })
    .setLngLat([marcador.lng, marcador.lat]) 
    .setPopup(customPopup)
    .addTo(this.mapa);

    marker.on('drag', () => {
      const lngLat = marker.getLngLat();
      // console.log(`Longitude: ${lngLat.lng}, Latitude: ${lngLat.lat}`);
      const nuevoMarcador = {
        id: marcador.id,
        ...lngLat
      }

      this.wsService.emit( 'marcador-mover', nuevoMarcador );
    });

    btnBorrar.addEventListener('click', () => {
      marker.remove();

      this.wsService.emit('marcador-borrar', marcador.id);
    });

    this.markersMapbox[marcador.id] = marker;
  }

  crearMarcador(){
    const customMarker: Lugar = {
      id: new Date().toISOString(),
      lng: -75.75512993582937,
      lat: 45.349977429009954,
      nombre: 'Sin nombre',
      color: '#' + Math.floor(Math.random()*16777215).toString(16) 
    }

    this.agregarMarcador(customMarker);

    // Emitir marcador nuevo
    this.wsService.emit('marcador-nuevo', customMarker);
  }
}
