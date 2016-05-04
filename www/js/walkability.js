var map;
var marker;

function initMap() {
    
    latlon = new google.maps.LatLng(43.263692, -2.950967);
    
    mapholder = document.getElementById("mapa");
    
    $('#mapa').height($(window).height()-$("div:jqmData(role='header')").height());
    
    width = window.innerWidth;
    mapholder.style.width = width+'px';

    var myOptions = {
        center:latlon,
        zoom:15,
        mapTypeId:google.maps.MapTypeId.SATELLITE,
        mapTypeControl:false,
        navigationControlOptions:{style:google.maps.NavigationControlStyle.SMALL},
        streetViewControl: false
    }
    
    map = new google.maps.Map(mapholder, myOptions);
    marker = new google.maps.Marker({position:latlon,map:map,title:"You are here!"});
    
}

function pintarMapa(puntos, div){

    $('#' + div).height((window.innerWidth-20)+'px');
    $('#' + div).width((window.innerWidth-20)+'px');
    $('#' + div).css('margin-left','10px');
    
    mapholder = document.getElementById(div);

    var mapa = new google.maps.Map(mapholder,{
        center:puntos[0],
        zoom: 12,
        mapTypeId: google.maps.MapTypeId.TERRAIN
    });

    var rutaPath = new google.maps.Polyline({
        path: puntos,
        geodesic: true,
        strokeColor: '#FF0000',
        strokeOpacity: 1.0,
        strokeWeight: 2
    });

    rutaPath.setMap(mapa);

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

}

$(document).ready(function(e) { 
                
                $("#botonTexto").on( "click", function() {
                    window.location.href="#testInicial";
                });

                $("div:jqmData(role='panel')").css('margin-top',  ($("div:jqmData(role='header')").height()));

                $('#cuestionario').height($(window).height()-$("div:jqmData(role='header')").height());
                $('#pruebas').height($(window).height()-$("div:jqmData(role='header')").height());
                $('#acerca').height($(window).height()-$("div:jqmData(role='header')").height());
                
                $('#rutas').hide();
                $('#cuestionario').hide();
                $('#pruebas').hide();
                $('#acerca').hide();
                
                $("#btnInicio").on( "click", function() {
                    $('#principal').show();
                    $('#rutas').hide(); 
                    $('#cuestionario').hide();
                    $('#pruebas').hide();
                    $('#acerca').hide(); 
                });

                $("#btnRutas").on( "click", function() {
                    $('#principal').hide();
                    $('#rutas').show(); 
                    $('#cuestionario').hide();
                    $('#pruebas').hide();
                    $('#acerca').hide();
                    rutasAlmacenadas();
                });

                $("#btnCuestionario").on( "click", function() {
                    /*$('#principal').hide();
                    $('#rutas').hide(); 
                    $('#cuestionario').show();
                    $('#pruebas').hide();
                    $('#acerca').hide();*/
                    window.location.href="#cuestionarioPage";
                });

                $("#botonCuestionario").on("click", function(){
                    window.location.href="#app";
                });

                $("#btnPrueba").on( "click", function() {
                    $('#principal').hide();
                    $('#rutas').hide(); 
                    $('#cuestionario').hide();
                    $('#pruebas').show();
                    $('#acerca').hide(); 
                });

                $("#btnAcerca").on( "click", function() {
                    $('#principal').hide();
                    $('#rutas').hide(); 
                    $('#cuestionario').hide();
                    $('#pruebas').hide();
                    $('#acerca').show(); 
                });

                $("#btnSeguimiento").on("click", function(){
                    if ($("#btnSeguimiento").text() == "Parar Geo.") {
                        $("#btnSeguimiento").text("Iniciar Geo.");
                        pararSeguimiento();
                    } else {
                        $("#btnSeguimiento").text("Parar Geo.");
                        iniciarSeguimiento();
                    }
                });

                $("#btnRuta").on( "click", function() {
                    //insertarRutas();
                    anadir();
                });


                $("#btnBorrar").on( "click", function() {
                    window.sqlitePlugin.deleteDatabase({name: 'walkability.db', location: 1}, successcb, errorcb);
                });
                /*
                $(document).on("pageshow","#app",function(){ // When entering pagetwo
                    initMap();
                }); */

                $(document).on("pagehide", "#textoInicial", function() {
                    initMap();
                    $("body").removeClass("loading");
                });

                $(document).on("pagehide", "#testInicial", function() {
                    initMap();
                });

                $("#slcRutas").on("change", function(){
                    valor = $("#slcRutas option:selected").val();
                    if (valor != -1) {
                        recuperarRuta($("#slcRutas option:selected").text(), "mapaRuta");
                    }
                });
       
});

function successcb(){
    alert("Base de datos borrada");
}

function errorcb(err){
    console.log("ERROR: " + err.message);
}