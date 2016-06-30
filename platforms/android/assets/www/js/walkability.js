/*
* En este archivo se encuentra toda la lógica relacionada con la pantalla principal de la aplicación
* Proyecto: Walkability Capturer
* Autor: David Puerto Caldero
*/

//Variable donde se almacena el mapa mostrado en la pantalla principal de la aplicación. Necesaria para añadir marcadores
var map;
//Variable donde se almacena el marcador de posición actual del usuario. Necesaria para actualizar su posición
var marker;

//Genera el mapa de la pantalla principal de la aplicación
function initMap() {
    
    //Por defecto, el mapa se centra en la EUITI de Bilbao
    latlon = new google.maps.LatLng(43.263692, -2.950967);
    
    mapholder = document.getElementById("mapa");
    
    //Se adapta el mapa a la pantalla del dispositivo
    $('#mapa').height($(window).height()-$("div:jqmData(role='header')").height());
    width = window.innerWidth;
    mapholder.style.width = width+'px';

    var myOptions = {
        center:latlon,
        zoom:15,
        mapTypeId:google.maps.MapTypeId.HYBRID,
        mapTypeControl:false,
        navigationControlOptions:{style:google.maps.NavigationControlStyle.SMALL},
        streetViewControl: false,
        minZoom: 13,
        maxZoom: 17,
        rotateControl: false
    }
    
    map = new google.maps.Map(mapholder, myOptions);
    marker = new google.maps.Marker({position:latlon,map:map});
    
}

//Genera un mapa con la ruta pasada como parámetro en el div especificado
function pintarMapa(puntos, div){

    $('#' + div).height((window.innerWidth-20)+'px');
    $('#' + div).width((window.innerWidth-20)+'px');
    $('#' + div).css('margin-left','10px');
    
    mapholder = document.getElementById(div);

    var mapa = new google.maps.Map(mapholder,{
        center:puntos[0],
        zoom: 13,
        mapTypeId: google.maps.MapTypeId.HYBRID,
        mapTypeControl:false,
        navigationControlOptions:{style:google.maps.NavigationControlStyle.SMALL},
        streetViewControl: false,
        minZoom: 13,
        maxZoom: 17,
        rotateControl: false
    });

    var rutaPath = new google.maps.Polyline({
        path: puntos,
        geodesic: true,
        strokeColor: '#FF0000',
        strokeOpacity: 1.0,
        strokeWeight: 2,
        map: mapa
    });

    var marcaInicio = new google.maps.Marker({
        position: puntos[0],
        label: "I",
        map: mapa
    });

    var marcaFin = new google.maps.Marker({
        position: puntos[puntos.length-1],
        label: "F",
        map: mapa
    });

    for (var i = 0; i < puntos.length; i++) {
        marcador = new google.maps.Marker({
                map: mapa, //Objeto Map sobre el que se muestra el marcador 
                icon: {
                    path: google.maps.SymbolPath.CIRCLE, //Tipo de símbolo del marcador
                    scale: 3, //Tamaño
                    fillColor: 'green', //Color de relleno
                    strokeColor: 'green', //Color de línea del símbolo
                    strokeWeight: 5 //Anchura de la línea del símbolo
                },
                position: puntos[i] //Posición en el mapa
            });
    }
}

$(document).ready(function(e) { 
                
                //Al pulsar el botón de la esquina izquierda donde se muestra el texto inicial, se pasa al test donde se solicitan los datos iniciales al usuario
                $("#botonTexto").on( "click", function() {
                    window.location.href="#testInicial";
                });

                //Establece un margen superior a los elementos con data-role=panel igual a la altura de los elementos con data-role=header
                $("div:jqmData(role='panel')").css('margin-top',  ($("div:jqmData(role='header')").height()));

                $('#cuestionario').height($(window).height()-$("div:jqmData(role='header')").height());
                
                //Oculta los otros divs
                $('#configuracion').hide();
                $('#acerca').hide();
                
                //Muestra el div principal y oculta el resto
                $("#btnInicio").on( "click", function() {
                    $('#principal').show();
                    $('#configuracion').hide();
                    $('#acerca').hide();
                });

                //Muestra el div configuración y oculta el resto
                $("#btnConfiguracion").on( "click", function() {
                    //Recupera la hora establecida por el usuario para realizar el cuestionario y la muestra (data_base.js)
                    mostrarHoraCuestionario();
                    $('#principal').hide();
                    $('#configuracion').show();
                    $('#acerca').hide();
                    $('#cambiarConfig').hide();
                });

                //Muestra u oculta el div para cambiar la hora para realizar el cuestionario
                $("#btnCambiarConfig").on( "click", function() {
                    if ($('#cambiarConfig').is(':hidden')) {
                        $('#cambiarConfig').show();
                    } else {
                        $('#cambiarConfig').hide();
                    }
                });

                //Almacena el nuevo horario
                $("#btnGuardarHoraNueva").on( "click", function() {
                    if ($("#horaNueva").val().length == 0) {
                        alert("Por favor, seleccione una hora");
                    } else {
                        hora = $("#horaNueva").val();
                        horasMinutos = hora.slice(0,5);
                        horaMod = horasMinutos.replace(/:/g,"");
                        horaInt = parseInt(horaMod);
                        actualizarHorarioCuestionario(horaInt, hora);
                    }
                });                

                //Activa o desactiva el seguimiento
                $("#btnSeguimiento").on("click", function(){
                    if ($("#btnSeguimiento").text() == "Parar Geo.") {
                        $("#btnSeguimiento").text("Iniciar Geo.");
                        pararSeguimiento();
                        if (temporizadorParada != 0) {
                            clearTimeout(temporizadorParada);
                            temporizadorParada = 0;
                        }

                        if (temporizadorPunto != 0) {
                            clearTimeout(temporizadorPunto);
                            temporizadorPunto = 0;
                        }

                        if (estado == 3) {
                            //ALMACENAR RUTA EN BD
                            recogerRutas(ruta, distanciaTotal);
                            estado = 1;
                        }
                    } else {
                        $("#btnSeguimiento").text("Parar Geo.");
                        iniciarSeguimiento();
                    }
                });

                //Muestra el apartado Acerca de
                $("#btnAcerca").on( "click", function() {
                    $('#principal').hide();
                    $('#configuracion').hide();
                    $('#acerca').show();
                });

                //Al ocultarse la pagina testInicial, inicializar el mapa principal e inicia el seguimiento
                $(document).on("pagehide", "#testInicial", function() {
                    cargarConfig();
                    initMap();
                    $("#btnSeguimiento").trigger("click");
                }); 
});