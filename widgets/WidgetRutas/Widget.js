define([
  "dojo/_base/declare",
  "dojo/_base/lang",

  "jimu/BaseWidget",

  "esri/Color",
  "esri/lang",
  "esri/graphic",
  "esri/InfoTemplate",
  "esri/layers/GraphicsLayer",
  "esri/renderers/SimpleRenderer",

  "esri/geometry/Point",
  "esri/tasks/FeatureSet",

  "esri/tasks/ClosestFacilityTask",
  "esri/tasks/ClosestFacilityParameters",

  "esri/symbols/SimpleMarkerSymbol",
  "esri/symbols/SimpleLineSymbol",

  "dojo/_base/array",
  "dojo/dom",
  "esri/SpatialReference",
], function (
  declare,
  lang,

  BaseWidget,
  Color,
  esriLang,
  Graphic,
  InfoTemplate,
  GraphicsLayer,
  SimpleRenderer,

  Point,
  FeatureSet,

  ClosestFacilityTask,
  ClosestFacilityParameters,

  SimpleMarkerSymbol,
  SimpleLineSymbol,

  array,
  dom,
  SpatialReference
) {
  //To create a widget, you need to derive from BaseWidget.
  return declare([BaseWidget], {
    // Custom widget code goes here

    baseClass: "jimu-widget-customwidget",

    //this property is set by the framework when widget is loaded.
    //name: 'CustomWidget',

    //methods to communication with app container:

    // Paso 1: Primero se crean las capas donde se almacenarán los parámetros y resultados que devolverá el servidor
    postCreate: function () {

      // 1.1 - La capa de rutas que recibirá la geometría de la ruta obtenida por el análisis.
      this.capaRutas = new GraphicsLayer();
      var rutaPolilineaSimbolo = new SimpleLineSymbol(
        SimpleLineSymbol.STYLE_SOLID,
        new Color([0, 38, 115, 1]),
        4.0
      );
      var rendererRuta = new SimpleRenderer(rutaPolilineaSimbolo);
      this.capaRutas.setRenderer(rendererRuta);
      this.map.addLayer(this.capaRutas);

      // 1.2 - La capa de facilities, que en este caso serán los almacenes de materiales.
      var simbolofacility = this.simbolofacility;
      simbolofacility = new SimpleMarkerSymbol();
      simbolofacility.setPath("M16,3.5c-4.142,0-7.5,3.358-7.5,7.5c0,4.143,7.5,18.121,7.5,18.121S23.5,15.143,23.5,11C23.5,6.858,20.143,3.5,16,3.5z M16,14.584c-1.979,0-3.584-1.604-3.584-3.584S14.021,7.416,16,7.416S19.584,9.021,19.584,11S17.979,14.584,16,14.584z");
      simbolofacility.setStyle(SimpleMarkerSymbol.STYLE_PATH);
      simbolofacility.setSize('8px')
      simbolofacility.setColor(new Color([255, 0, 0, 1]));

      this.capaFacilities = new GraphicsLayer();
      rendererFacility = new SimpleRenderer(simbolofacility);
      this.capaFacilities.setRenderer(rendererFacility);
      this.capaFacilities.setRenderer(rendererFacility);
  
      this.capaFacilities.add(
        new Graphic(
          new Point(-522874.366, 4962483.524, this.map.spatialReference)
        )
      );
      this.capaFacilities.add(
        new Graphic(
          new Point(-518493.156, 4963252.566, this.map.spatialReference)
        )
      );
      this.capaFacilities.add(
        new Graphic(
          new Point(-523876.45, 4959174.312, this.map.spatialReference)
        )
      );
      this.capaFacilities.add(
        new Graphic(
          new Point(-523803.341, 4962097.581, this.map.spatialReference)
        )
      );

      this.map.addLayer(this.capaFacilities);

      // this.params = new ClosestFacilityParameters();

      // 1.3 - La capa de incidentes, la cual recogerá el punto inicial de la ruta marcado por el usuario
      this.capaIncidentes = new GraphicsLayer();
      var simboloIncident = this.simboloIncident;
      simboloIncident = new SimpleMarkerSymbol(
        SimpleMarkerSymbol.STYLE_CIRCLE,
        16,
        new SimpleLineSymbol(
          SimpleLineSymbol.STYLE_SOLID,
          new Color([89, 95, 35]),
          2
        ),
        new Color([170, 255, 0, 0.78])
      );
      
      rendererIncidentes = new SimpleRenderer(simboloIncident);
      this.capaIncidentes.setRenderer(rendererIncidentes);
      this.map.addLayer(this.capaIncidentes);
    },

    // Paso 2: Se crean las funciones que se van a activar con la interacción del usuario
    startup: function () {
      // 2.1 Se prepara el widget para reaccionar al click del usuario si tiene el checkbox activado
      this.map.on(
        "click",
        lang.hitch(this, function (evento) {
          if (this.activado.checked) {
            
            var inPoint = new Point(evento.mapPoint);
            var location = new Graphic(inPoint);
            this.capaIncidentes.clear();
            this.capaIncidentes.add(location);

            // 2.2 Una vez recogidas las facilities y obtenido el click del usuario como punto inicial de la ruta se preparan los parámetros para lanzar el servicio
            this.params = new ClosestFacilityParameters();
            var localizacion = [];
            localizacion.push(location);
            var incidents = new FeatureSet();
            incidents.features = localizacion;
            this.params.incidents = incidents;
            var facilities = new FeatureSet();
            facilities.features = this.capaFacilities.graphics;
            this.params.facilities = facilities;
            console.log(this.params.incidents);
            console.log(this.params.facilities);
            console.log(this.params);
            this.params.impedenceAttribute = "Kilometers";
            this.params.defaultCutoff = 50.0;
            this.params.returnIncidents = false;
            this.params.returnRoutes = true;
            this.params.returnDirections = true;
            this.params.outSpatialReference = this.map.spatialReference;
            this.params.directionsLanguage = "es";
            

            // 2.3 Se lanza el servicio y se recogen los datos que necesitamos para pintarlos en pantalla
            var analisisRutas = new ClosestFacilityTask(
              "https://route.arcgis.com/arcgis/rest/services/World/ClosestFacility/NAServer/ClosestFacility_World/solveClosestFacility"
            );
            analisisRutas.solve(
              this.params,
              lang.hitch(this, function (resultadoSolve) {
                console.log(resultadoSolve);

                // 2.3.1 Se recorre la respuesta del servidor para coger la geometría de la ruta
                array.forEach(
                  resultadoSolve.routes,
                  lang.hitch(this, function (route, index) {
                    // 2.32 Se recorre el array con las indicaciones devueltas por el servidor y se recogen sólo los textos en otra array.
                    var attr = array.map(
                      resultadoSolve.directions[index].features,
                      function (feature) {
                        return feature.attributes.text;
                      }
                    );
                    console.log(attr);
                    route.setAttributes(attr);

                    
                    this.capaRutas.clear();
                    this.capaRutas.add(route);

                    // 2.3.2 Se recorre la array de textos creada y se pone dentro del widget.
                    attr.forEach(function (index) {
                      var parrafo = document.createElement("p");
                      parrafo.innerHTML = index;
                      dom.byId("direcciones").appendChild(parrafo);
                    });
                  })
                );
                // 2.4 Mostrar mensajes de error en la ruta si hay alguno
                if (resultadoSolve.messages.length > 0) {
                  var parrafo = document.createElement("p");
                  parrafo.innerHTML =
                    "<b>Error:</b>" + resultadoSolve.messages[0].description;
                  this.direcciones.appendChild(parrafo);
                }
              })
            );
          } else if ((this.activado.checked = false)) {
            alert("Tienes que tener activado el widget");
          }
        })
      );
    },
   
    onOpen: function () {
      this.capaIncidentes.show();
      this.capaFacilities.show();
      this.capaRutas.show();
    },

    onClose: function () {
      this.capaIncidentes.hide();
      this.capaFacilities.hide();
      this.capaRutas.hide();
    },

    // onMinimize: function(){
    //   console.log('onMinimize');
    // },

    // onMaximize: function(){
    //   console.log('onMaximize');
    // },

    // onSignIn: function(credential){
    //   /* jshint unused:false*/
    //   console.log('onSignIn');
    // },

    // onSignOut: function(){
    //   console.log('onSignOut');
    // }

    // onPositionChange: function(){
    //   console.log('onPositionChange');
    // },

    // resize: function(){
    //   console.log('resize');
    // }

    //methods to communication between widgets:
  });
});
