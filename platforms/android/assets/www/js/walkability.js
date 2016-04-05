var x = document.getElementById("prueba");

var map;
var marker;
var num = 1;

function initMap() {
    
    latlon = new google.maps.LatLng(43.263692, -2.950967);
    //mapholder = document.getElementById('mapholder');
    mapholder = document.getElementById("mapa");
    /*height = window.innerHeight;
    mapholder.style.height = height+'px';*/
    $('#mapa').height($(window).height()-$("div:jqmData(role='header')").height());
    //mapholder.style.width = '500px';
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
    
    //var map = new google.maps.Map(document.getElementById("mapholder"), myOptions);
    map = new google.maps.Map(mapholder, myOptions);
    marker = new google.maps.Marker({position:latlon,map:map,title:"You are here!"});
    
}

$(document).ready(function(e) { 
                
                $("div:jqmData(role='panel')").css('margin-top',  ($("div:jqmData(role='header')").height()));

                $('#prueba').height($(window).height()-$("div:jqmData(role='header')").height());
                
                $('.prueba').hide();

                $("#inicio").on( "click", function() {
                    $('.map').show(); 
                    $('.prueba').hide(); 
                });

                $("#rutas").on( "click", function() {
                    $('.map').hide(); 
                    $('.prueba').show(); 
                });

                $("#seguimiento").on("click", function(){
                    if ($("#seguimiento").text() == "Parar Geo.") {
                        $("#seguimiento").text("Iniciar Geo.");
                        pararSeguimiento();
                    } else {
                        $("#seguimiento").text("Parar Geo.");
                        posicionInstantanea();
                    }
                });

                $(document).on("pageshow","#app",function(){ // When entering pagetwo
                    initMap();
                });

                $(document).on("pagecreate", function(event){ // When entering pagetwo
                    var d = new Date();
                    var n = d.getDay();

                    if (n == 3) {
                        $(':mobile-pagecontainer').pagecontainer('change', '#app', {showLoadMsg: true});
                    }
                });

                $(document).on("pagebeforecreate",function(event){
                    alert("pagebeforecreate event fired!");
                });

                

});

function rellenarSelect(){
    var anyos = document.getElementById("anyoNacimiento");
    var cont = 1;
    var fecha = new Date();
    var anyo = fecha.getFullYear() + 1; 
    anyos.options[0] = new Option("Seleccione un año", -1, true);
    for (var i = 1900; i < anyo; i++) {
        anyos.options[cont] = new Option(i, i);
        cont++;
    }
}