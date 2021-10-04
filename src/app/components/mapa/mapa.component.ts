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
    this.http.get<RespMarcadores>('https://web-socket-server-mapbox.herokuapp.com/mapa').subscribe(lugares => {
    // this.http.get<RespMarcadores>('http://localhost:5000/mapa').subscribe(lugares => {
      console.log(lugares);
      this.lugares = lugares;
      this.crearMapa();
      // this.crearMarcador();
    })
    
    this.escucharSockets();
  }

  escucharSockets(){

    // ID de Usuario
    this.wsService.listen('id-usuario').subscribe((idUsuario: string | any) => {
      console.log(idUsuario);
      this.crearMarcador(idUsuario);
    }) 

    // Marcador nuevo
    this.wsService.listen('marcador-nuevo').subscribe((marcador: Lugar | any) => {
      console.log(marcador);
      this.agregarMarcador(marcador);
    });

    // marcador-mover
    this.wsService.listen( 'marcador-mover' )
      .subscribe( (marcador:Lugar | any) => {
        console.log(marcador);
        this.markersMapbox[ marcador.id ]
          .setLngLat([ marcador.lng, marcador.lat ]);
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
      center: [-74.06165854470065, 4.687273776841303],
      zoom: 15.8
    });

    for(const [id, marcador] of Object.entries(this.lugares)){
      this.agregarMarcador(marcador);
    };

    // Add geolocate control to the map.
    this.mapa.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true
        },
        // When active the map will receive updates to the device's location as it changes.
        trackUserLocation: true,
        // Draw an arrow next to the location dot to indicate which direction the device is heading.
        showUserHeading: true
      })
    );
  }

  agregarMarcador(marcador: Lugar, idUsuario?: string){

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
      draggable: false,
      color: marcador.color
    })
    .setLngLat([marcador.lng, marcador.lat]) 
    // .setLngLat(new mapboxgl.LngLat(marcador.lng, marcador.lat)) 
    .setPopup(customPopup)
    .addTo(this.mapa);

    navigator.geolocation.watchPosition( (position) => {
      if (marcador.id == idUsuario){
        var latitude = position.coords.latitude; 
        var longitude = position.coords.longitude;
  
        // console.log(`Longitud ${lngLat.lng} y Latitud ${lngLat.lat}`);
  
        const nuevoMarcador = {
          id: marcador.id,
          lng: longitude,
          lat: latitude,
          nombre: marcador.nombre,
          color: marcador.color
        } 
        
        this.markersMapbox[ marcador.id ].setLngLat([longitude, latitude]);

        console.log(nuevoMarcador);
  
        this.wsService.emit( 'marcador-mover', nuevoMarcador );
        
        var centrar = document.getElementById('centrarMapa');
        var status = centrar?.getAttribute('status');
        if(status == '1'){
          this.mapa.setCenter([longitude, latitude]);
          this.mapa.setZoom(15.8);
        }
      }
    },
    (err) =>{
      console.log(err);
    },
    {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0
    });


    // marker.on('drag', () => {
    //   const lngLat = marker.getLngLat();
    //   // console.log(`Longitude: ${lngLat.lng}, Latitude: ${lngLat.lat}`);
    //   const nuevoMarcador = {
    //     id: marcador.id,
    //     ...lngLat
    //   }

    //   this.wsService.emit( 'marcador-mover', nuevoMarcador );
    // });

    btnBorrar.addEventListener('click', () => {
      marker.remove();

      this.wsService.emit('marcador-borrar', marcador.id);
    });

    this.markersMapbox[marcador.id] = marker;
  }

  crearMarcador(idUsuario: string){
    // const customMarker: Lugar = {
    //   id: new Date().toISOString(),
    //   lng: -57,
    //   lat: 45.349977429009954,
    //   nombre: 'Sin nombre',
    //   color: '#' + Math.floor(Math.random()*16777215).toString(16) 
    // }

    // this.agregarMarcador(customMarker);

    // // Emitir marcador nuevo
    // this.wsService.emit('marcador-nuevo', customMarker);







    if(!navigator.geolocation){
      console.log('Geolocation is not supported by your browser');
    }else{
      navigator.geolocation.getCurrentPosition((position) => {
        var latitude = position.coords.latitude; 
        var longitude = position.coords.longitude;

        const customMarker: Lugar = {
          id: idUsuario,
          lng: longitude,
          lat: latitude,
          nombre: 'Sin nombre',
          color: '#' + Math.floor(Math.random()*16777215).toString(16) 
        }

        this.mapa.setCenter([longitude, latitude]);
        this.mapa.setZoom(15.8);

        this.agregarMarcador(customMarker, idUsuario);

        // // Emitir marcador nuevo
        this.wsService.emit('marcador-nuevo', customMarker);
      })
    }
  }

  centrarMapa(){
    var centrar = document.getElementById('centrarMapa');
    var status = centrar?.getAttribute('status');

    if(status == '0'){
      centrar?.setAttribute('status','1');
      document.getElementById('imgCentrarMapa')!.style.filter = 'grayscale(0%)';
    }else{
      centrar?.setAttribute('status','0');
      document.getElementById('imgCentrarMapa')!.style.filter = 'grayscale(80%)';
    }
  }
}
