/*
* En este archivo se encuentra toda la lógica relacionada con la base de datos
* Proyecto: Walkability Capturer
* Autor: David Puerto Caldero
*/

var db;
var res;
var error;

var vel_max;
var dist_min_ruta;
var tiempo_parada;
var radio_parada;
var puntos_distintos;
var dist_puntos;
var dif_duracion;
var idusuario;


/* Funciones de init.js*/

function abrirBD(){
	db = window.sqlitePlugin.openDatabase({name: 'walkability.db', androidLockWorkaround: 1, location: 1});
}

function existeBD(){
	db.transaction(function(tx) {
		//Se comprueba que exista la tabla usuario
		tx.executeSql('SELECT * FROM sqlite_master WHERE name = "usuario"', [], function(tx, rs){
			res = rs;
			console.log("Result: " + rs.rows.length);
			//Si no existe, se crea el esquema de la BD
			if (rs.rows.length == 0) {
				inicializarBD();
			}else{
				//Si existe, se comprueba que haya configuracion y que haya un usuario creado
				existeConfig();
				existeUsuario();
			}
		}, function(err){console.log('ERROR: ' + err.message);});

  	}, function(err){console.log('ERROR existeBD: ' + err.message);}, function(){console.log('TODO OK existeBD');});

}

function inicializarBD(){
	db.transaction(function(tx) {
    	tx.executeSql('PRAGMA foreign_keys = ON');
    	tx.executeSql('DROP TABLE IF EXISTS "usuario"');
    	tx.executeSql('CREATE TABLE IF NOT EXISTS "usuario"("idusuario" TEXT PRIMARY KEY NOT NULL, "anyo_nacimiento" INTEGER, "genero" NUMERIC, "municipio_procedencia" TEXT, "movilidad_reducida" NUMERIC, "en_servidor" NUMERIC)');
    	tx.executeSql('DROP TABLE IF EXISTS "punto"');
    	tx.executeSql('CREATE TABLE IF NOT EXISTS "punto"("idpunto" TEXT PRIMARY KEY NOT NULL, "latitud" REAL, "longitud" REAL, "precision" REAL)');
    	tx.executeSql('DROP TABLE IF EXISTS "ruta"');
    	tx.executeSql('CREATE TABLE IF NOT EXISTS "ruta"("idruta" TEXT PRIMARY KEY NOT NULL, "duracion" INTEGER, "distancia_recorrida" REAL, "cuantas" INTEGER, "municipio_inicio" TEXT, "punto_inicio" TEXT NOT NULL, "municipio_fin" TEXT, "punto_fin" TEXT NOT NULL, "copia_de" TEXT, "en_servidor" NUMERIC, CONSTRAINT "fk_ruta_punto1" FOREIGN KEY("punto_inicio") REFERENCES "punto"("idpunto"), CONSTRAINT "fk_ruta_punto2" FOREIGN KEY("punto_fin") REFERENCES "punto"("idpunto"), CONSTRAINT "fk_ruta_ruta1" FOREIGN KEY("copia_de") REFERENCES "ruta"("idruta"))');
    	tx.executeSql('CREATE INDEX "ruta.fk_ruta_punto1_idx" ON "ruta"("punto_inicio")');
    	tx.executeSql('CREATE INDEX "ruta.fk_ruta_punto2_idx" ON "ruta"("punto_fin")');
    	tx.executeSql('CREATE INDEX "ruta.fk_ruta_ruta1_idx" ON "ruta"("copia_de")');
    	tx.executeSql('DROP TABLE IF EXISTS "fecha_cuestionario"');
    	tx.executeSql('CREATE TABLE IF NOT EXISTS "fecha_cuestionario"("idfecha_cuestionario" TEXT PRIMARY KEY NOT NULL, "dia" INTEGER, "hora" INTEGER, "version" INTEGER)');
    	tx.executeSql('DROP TABLE IF EXISTS "respuesta_usuario"');
    	tx.executeSql('CREATE TABLE IF NOT EXISTS "respuesta_usuario"( "idrespuesta_usuario" TEXT PRIMARY KEY NOT NULL, "idpregunta" INTEGER, "opcion_elegida" INTEGER)');
    	tx.executeSql('DROP TABLE IF EXISTS "punto_intermedio"');
    	tx.executeSql('CREATE TABLE IF NOT EXISTS "punto_intermedio"("idruta" TEXT NOT NULL, "idpunto" TEXT NOT NULL, "orden" INTEGER, "hora" TEXT, PRIMARY KEY("idruta","idpunto"), CONSTRAINT "fk_punto_intermedio_punto1" FOREIGN KEY("idpunto") REFERENCES "punto"("idpunto"), CONSTRAINT "fk_punto_intermedio_ruta1" FOREIGN KEY("idruta") REFERENCES "ruta"("idruta"))');
    	tx.executeSql('CREATE INDEX "punto_intermedio.fk_punto_intermedio_ruta1_idx" ON "punto_intermedio"("idruta")');
    	tx.executeSql('CREATE INDEX "punto_intermedio.fk_punto_intermedio_punto1_idx" ON "punto_intermedio"("idpunto")');
    	tx.executeSql('DROP TABLE IF EXISTS "configuracion"');
    	tx.executeSql('CREATE TABLE IF NOT EXISTS "configuracion"("idconfiguracion" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, "vel_max" INTEGER, "dist_min_ruta" INTEGER, "tiempo_parada" INTEGER, "radio_parada" INTEGER, "puntos_distintos" INTEGER, "dist_puntos" INTEGER, "realizar_cuestionario" INTEGER, "version_actual" INTEGER, "dif_duracion" INTEGER)');
    	tx.executeSql('DROP TABLE IF EXISTS "fecha_ruta"');
    	tx.executeSql('CREATE TABLE IF NOT EXISTS "fecha_ruta"("idfecha_ruta" TEXT PRIMARY KEY NOT NULL, "dia" INTEGER, "hora" INTEGER, "idruta" TEXT NOT NULL, "en_servidor" NUMERIC, "configuracion_version" INTEGER NOT NULL, CONSTRAINT "fk_fecha_ruta_ruta1" FOREIGN KEY("idruta") REFERENCES "ruta"("idruta"), CONSTRAINT "fk_fecha_ruta_configuracion1" FOREIGN KEY("configuracion_version") REFERENCES "configuracion"("version_actual"))');
    	tx.executeSql('CREATE INDEX "fecha_ruta.fk_fecha_ruta_ruta1_idx" ON "fecha_ruta"("idruta")');
    	tx.executeSql('CREATE INDEX "fecha_ruta.fk_fecha_ruta_configuracion1_idx" ON "fecha_ruta"("configuracion_version")');
    	tx.executeSql('DROP TABLE IF EXISTS "ruta_valorada"');
    	tx.executeSql('CREATE TABLE IF NOT EXISTS "ruta_valorada"("fecha_ruta_idfecha_ruta" TEXT NOT NULL, "fecha_cuestionario_idfecha_cuestionario" TEXT NOT NULL, "respuesta_usuario_idrespuesta_usuario" TEXT NOT NULL, "en_servidor" NUMERIC, "categoria" INTEGER, PRIMARY KEY("fecha_ruta_idfecha_ruta", "fecha_cuestionario_idfecha_cuestionario", "respuesta_usuario_idrespuesta_usuario"), CONSTRAINT "fk_ruta_valorada_fecha_ruta1" FOREIGN KEY("fecha_ruta_idfecha_ruta") REFERENCES "fecha_ruta"("idfecha_ruta"), CONSTRAINT "fk_ruta_valorada_fecha_cuestionario1" FOREIGN KEY("fecha_cuestionario_idfecha_cuestionario") REFERENCES "fecha_cuestionario"("idfecha_cuestionario"), CONSTRAINT "fk_ruta_valorada_respuesta_usuario1" FOREIGN KEY("respuesta_usuario_idrespuesta_usuario") REFERENCES "respuesta_usuario"("idrespuesta_usuario"))');
    	tx.executeSql('CREATE INDEX "ruta_valorada.fk_ruta_valorada_fecha_ruta1_idx" ON "ruta_valorada"("fecha_ruta_idfecha_ruta")');
    	tx.executeSql('CREATE INDEX "ruta_valorada.fk_ruta_valorada_fecha_cuestionario1_idx" ON "ruta_valorada"("fecha_cuestionario_idfecha_cuestionario")');
    	tx.executeSql('CREATE INDEX "ruta_valorada.fk_ruta_valorada_respuesta_usuario1_idx" ON "ruta_valorada"("respuesta_usuario_idrespuesta_usuario")');
    	
		}, function(err){console.log('ERROR inicializarBD: ' + err.message);}, function(){console.log('BD CREADA'); existeConfig(); existeUsuario();});
}

function existeConfig(){
	db.transaction(function(tx){
		tx.executeSql('SELECT * FROM configuracion', [], function(tx, rs){
			//Si no existe configuracion previa
			if (rs.rows.length == 0) {
				//SOLICITAR ULTIMA VERSION
				solicitarConfig(0);
			} else{
				//COMPROBAR SI ES LA VERSION ACTIVA
				comprobarVersionConfig();
			}
		});
	}, function(err){console.log('ERROR existeConfig: ' + err.message); error = err;}, function(){console.log('TODO OK existeConfig');});
}

function solicitarConfig(intento){
	intento++;
	$.getJSON('http://galan.ehu.eus/dpuerto001/WEB/solicitarConfig.php',function(data){

		vel_max = parseInt(data[0].vel_max);
		dist_min_ruta = parseInt(data[0].dist_min_ruta);
		tiempo_parada = parseInt(data[0].tiempo_parada);
		radio_parada = parseInt(data[0].radio_parada);
		puntos_distintos = parseInt(data[0].puntos_distintos);
		dist_puntos = parseInt(data[0].dist_puntos);
		dif_duracion = parseInt(data[0].dif_duracion);
		version_actual = parseInt(data[0].version);

		db.transaction(function(tx) {
    		tx.executeSql('INSERT INTO configuracion (vel_max, dist_min_ruta, tiempo_parada, radio_parada, puntos_distintos, dist_puntos, version_actual, dif_duracion) VALUES (?,?,?,?,?,?,?,?)', [vel_max, dist_min_ruta, tiempo_parada, radio_parada, puntos_distintos, dist_puntos, version_actual, dif_duracion], function(tx, rs) {});
		}, function(err){console.log('ERROR solicitarConfig: ' + err.message);}, function(){console.log('TODO OK solicitarConfig');});
	})
	.fail(function() {
		console.log("ERROR en solicitarConfig");
		if (intento == 3) {
			alert("Imposible contactar con el servidor. Por favor, inténtelo de nuevo más tarde");
			$("body").addClass("loading");
		} else {
			alert("Error al solicitar la configuracion, a continuación se reintentará. Si el problema persiste, contáctenos");
			solicitarConfig(intento);
		}
	});
}

function comprobarVersionConfig(){
	var version;

	//Se selecciona la versión actual
	db.transaction(function(tx){
		tx.executeSql('SELECT version_actual FROM configuracion', [], function(tx, rs){
			version = rs.rows.item(0).version_actual;
		});
	}, function(err){console.log('ERROR comprobarVersionConfig: ' + err.message);}, 
	
	//Se manda al servidor para comprobar si es la activa
	function(){
		console.log('TODO OK comprobarVersionConfig');
		$.ajax({type: "POST", 
				url: "http://galan.ehu.eus/dpuerto001/WEB/comprobarVersionConfig.php",
				data: {dato:version},
				success: function(data){
					cambiar = parseInt(data[0].cambiar);

					if (cambiar == 0) {
						console.log("COINCIDE");
					}else{
						if (cambiar == 1) {
							console.log("CAMBIAR CONFIGURACION");
							actualizarConfig(data[0]);
						}
					}
				},
				error: function(e){console.log("ERROR");},
		});
	});
}

function actualizarConfig(data){
	vel_max = data.vel_max;
	dist_min_ruta = data.dist_min_ruta; 
	tiempo_parada = data.tiempo_parada;
	radio_parada = data.radio_parada;
	puntos_distintos = data.puntos_distintos; 
	dist_puntos = data.dist_puntos;
	dif_duracion = data.dif_duracion; 

	db.transaction(function(tx) {
    		tx.executeSql('UPDATE configuracion SET vel_max = ?, dist_min_ruta = ?, tiempo_parada = ?, radio_parada = ?, puntos_distintos = ?, dist_puntos = ?, version_actual = ?, dif_duracion = ? WHERE idconfiguracion = 1', [vel_max, dist_min_ruta, tiempo_parada, radio_parada, puntos_distintos, dist_puntos, data.version_actual, dif_duracion], function(tx, rs) {});
		}, function(err){console.log('ERROR actualizarConfig: ' + err.message);}, function(){console.log('TODO OK actualizarConfig');});
}

function existeUsuario(){
	db.transaction(function(tx){
  		tx.executeSql('SELECT * FROM usuario', [], function(tx, rs){
			//Si existe, se pasa directamente a la pantalla principal. Si no, se muestra el texto inicial
			if (rs.rows.length == 1) {
				window.location.href="#app";
				activarNotificacionDiaria();
				cargarConfig();
				$(document).on("pagehide", "#textoInicial", function() {
                    initMap();
                    $("body").removeClass("loading");
                    $("#btnSeguimiento").trigger("click");
                });
                enviosPendientes();
			}else{
				window.location.href="#textoInicial";
				rellenarSelect();
				$("body").removeClass("loading");
			}
		});
  	}, function(err){console.log('ERROR existeUsuario: ' + err.message);}, function(){console.log('TODO OK existeUsuario');});
}

function cargarConfig(){
	db.transaction(function(tx){
  		tx.executeSql('SELECT vel_max, dist_min_ruta, tiempo_parada, radio_parada, puntos_distintos, dist_puntos, dif_duracion FROM configuracion', [], function(tx, rs){
			if (rs.rows.length != 0) {
				vel_max = rs.rows.item(0).vel_max;
				dist_min_ruta = rs.rows.item(0).dist_min_ruta;
				tiempo_parada = rs.rows.item(0).tiempo_parada;
				radio_parada = rs.rows.item(0).radio_parada;
				puntos_distintos = rs.rows.item(0).puntos_distintos;
				dist_puntos = rs.rows.item(0).dist_puntos;
				dif_duracion = rs.rows.item(0).dif_duracion;
			}
		});
		tx.executeSql('SELECT idusuario FROM usuario', [], function(tx, rs){
			if (rs.rows.length != 0) {
				idusuario = rs.rows.item(0).idusuario;
			}
		});
  	}, function(err){console.log('ERROR existeUsuario: ' + err.message);}, function(){console.log('TODO OK cargarConfig');});
}

function activarNotificacionDiaria(){
	console.log("ACTIVAR NOTIFICACION DIARIA");
	db.transaction(function(tx) {
		tx.executeSql('SELECT realizar_cuestionario FROM configuracion WHERE idconfiguracion = 1', [], function(tx, rs) {
			if (rs.rows.length != 0) {
				cuestionario = rs.rows.item(0).realizar_cuestionario;
				fecha = new Date();
				hora = fecha.toLocaleTimeString();
				horasMinutos = hora.slice(0,5);
				horaMod = horasMinutos.replace(/:/g,"");
				horaInt = parseInt(horaMod);

				if (cuestionario == horaInt) {
					momento = new Date(fecha.getTime() + 60*1000);
				} else {

					if (cuestionario <= horaInt) {
						dia = fecha.getDate() + 1;
					} else {
						dia = fecha.getDate();
					}

					anyo = fecha.getFullYear();
					mes = fecha.getMonth();
					horaSt = cuestionario.toString();

					if (horaSt.length <= 2) {
						hora = 0;
						minutos = cuestionario;
					} else {
						if (horaSt.length == 3) {
							hora = parseInt(horaSt.substr(0,1));
							minutos = parseInt(horaSt.substr(1,3));
						} else {
							hora = parseInt(horaSt.substr(0,2));
							minutos = parseInt(horaSt.substr(2,4));
						}
					}
					momento = new Date(anyo, mes, dia, hora, minutos, 0, 0);
				}
				cordova.plugins.notification.local.schedule({
					title: "Geolocalización",
					text: "Localización activada",
					id: 1,
					every: "day",
					at:momento
				});
			}
		});
	}, function(err){console.log("ERROR: " + err.message);}, function(){});
}

function reactivarNotificacionDiaria(){
	console.log("REACTIVAR NOTIFICACION DIARIA");
	db.transaction(function(tx) {
		tx.executeSql('SELECT realizar_cuestionario FROM configuracion WHERE idconfiguracion = 1', [], function(tx, rs) {
			if (rs.rows.length != 0) {
				cuestionario = rs.rows.item(0).realizar_cuestionario;
				fecha = new Date();
				hora = fecha.toLocaleTimeString();
				horasMinutos = hora.slice(0,5);
				horaMod = horasMinutos.replace(/:/g,"");
				horaInt = parseInt(horaMod);

				dia = fecha.getDate() + 1;
					

					anyo = fecha.getFullYear();
					mes = fecha.getMonth();
					horaSt = cuestionario.toString();

					if (horaSt.length <= 2) {
						hora = 0;
						minutos = cuestionario;
					} else {
						if (horaSt.length == 3) {
							hora = parseInt(horaSt.substr(0,1));
							minutos = parseInt(horaSt.substr(1,3));
						} else {
							hora = parseInt(horaSt.substr(0,2));
							minutos = parseInt(horaSt.substr(2,4));
						}
					}
					
					momento = new Date(anyo, mes, dia, hora, minutos, 0, 0);

				cordova.plugins.notification.local.schedule({
					title: "Geolocalización",
					text: "Localización activada",
					id: 1,
					every: "day",
					at:momento
				});
			}
		});
	}, function(err){console.log("ERROR: " + err.message);}, function(){});
}

function anadirUsuario(buttonIndex) {
    if(buttonIndex == 1){
    	genero = $("#genero :radio:checked").val()
		fechaNac = parseInt($("#anyoNacimiento option:selected").val());
		if ($("#check").prop('checked')) {
			mun = $("#municipio").val();
		} else {
			mun = $(".ps-mun option:selected").text();
		} 
		mov = $("#movilidad :radio:checked").val();
		uuid = device.uuid;
		date = new Date();
		idusuario = uuid.concat(date.getTime());
		hora = $("#hora").val();
		horasMinutos = hora.slice(0,5);
		horaMod = horasMinutos.replace(/:/g,"");
		horaInt = parseInt(horaMod);

		db.transaction(function(tx) {
			tx.executeSql('UPDATE configuracion SET realizar_cuestionario = ? WHERE idconfiguracion = 1', [horaInt], function(tx,rs){});
		}, function(err){console.log("ERROR UPDATE anadirUsuario" + err.message);}, function(){console.log("TODO OK UPDATE anadirUsuario")});

		db.transaction(function(tx) {
    	tx.executeSql('INSERT INTO usuario (idusuario, anyo_nacimiento, genero, municipio_procedencia, movilidad_reducida, en_servidor) VALUES (?,?,?,?,?,?)', [idusuario, fechaNac, genero, mun, mov, 0], function(tx, rs) {});
		}, function(err){console.log('ERROR INSERT anadirUsuario ' + err.message);}, 
		function(){
			console.log('USUARIO INSERTADO');
			navigator.notification.alert(
    			'¡¡Enhorabuena!! Ya es usted miembro de la comunidad Walkability Capturer',  // message
    			function alertDismissed() {window.location = "#app";},         // callback
    			'Usuario creado',            // title
    			'Aceptar'                  // buttonName
			);
			activarNotificacionDiaria();
			enviarUsuario();
		});

    }
}

function enviarUsuario(){
	var idusuario;
	var anyo_nacimiento;
	var genero;
	var municipio_procedencia;
	var movilidad_reducida;
	db.transaction(function(tx) {
		tx.executeSql('SELECT idusuario, anyo_nacimiento, genero, municipio_procedencia, movilidad_reducida FROM usuario WHERE en_servidor = 0', [], function(tx, rs) {
			if (rs.rows.length != 0) {
				data = rs.rows;
				idusuario = data.item(0).idusuario;
				anyo_nacimiento = data.item(0).anyo_nacimiento;
				genero = data.item(0).genero;
				municipio_procedencia = data.item(0).municipio_procedencia;
				movilidad_reducida = data.item(0).movilidad_reducida;
				datos = [{idusuario:idusuario, anyo_nacimiento:anyo_nacimiento, genero:genero, municipio_procedencia:municipio_procedencia, movilidad_reducida:movilidad_reducida}];
				datosJSON = JSON.stringify(datos);
				$.ajax({type: "POST",
						url: "http://galan.ehu.eus/dpuerto001/WEB/enviarUsuario.php",
						data: {dato:datosJSON},
						success: function(data){
									console.log("ENVIADO");
									if (data[0].insertado == 1) {
										//cambiar en_servidor
										console.log("Usuario insertado en el servidor");
										db.transaction(function(tx) {
    										tx.executeSql('UPDATE usuario SET en_servidor = 1 WHERE idusuario = ?', [idusuario], function(tx, rs) {});
										}, function(err){console.log('ERROR UPDATE enviarUsuario: ' + err.message);}, function(){console.log('TODO OK UPDATE enviarUsuario');});
									} else {
										if (data[0].insertado == 0) {
											console.log("Usuario no insertado en el servidor");
										}
									}
								},
						error: function(e){console.log("ERROR al enviar el usuario o al insertarlo en el servidor");}
				});
			}
		});
	}, function(err){console.log("ERROR SELECT enviarUsuario: " + err.message);}, function(){console.log("TODO OK SELECT enviarUsuario")});
}

/*Funciones de walkability.js*/

function mostrarHoraCuestionario(){
    db.transaction(function(tx) {
        tx.executeSql('SELECT realizar_cuestionario FROM configuracion WHERE idconfiguracion = 1', [], function(tx, rs) {
            if (rs.rows.length != 0) {
                horario = rs.rows.item(0).realizar_cuestionario;
                if (horario <= 59) {
                    horarioStr = "00:" + horario;
                } else{
                    minutos = horario % 100;
                    hora = (horario - minutos) / 100;
                    if (hora <= 9) {
                        horarioStr = "0" + hora;
                    } else {
                        horarioStr = hora;
                    }
                    if (minutos < 10) {
                        horarioStr = horarioStr + ":0" + minutos;
                    } else {
                        horarioStr = horarioStr + ":" + minutos;
                    }  
                }
                $("#configActual").text("La hora definida para realizar el cuestionario es: " + horarioStr);
            }
        });
    }, function(err){console.log("ERROR: " + err.message);}, function(){});
}

function actualizarHorarioCuestionario(hora, horarioStr){
	db.transaction(function(tx) {
		tx.executeSql('UPDATE configuracion SET realizar_cuestionario = ? WHERE idconfiguracion = 1', [hora], function(tx, rs) {
			if (rs.rowsAffected != 0) {
				alert("Horario del cuestionario modificado");
				$('#cambiarConfig').hide();
                $("#configActual").text("La hora definida para realizar el cuestionario es: " + horarioStr);
                cordova.plugins.notification.local.cancel(1, function(){console.log("Notificacion borrada")});
                activarNotificacionDiaria();
			}
		});
	}, function(err){console.log("ERROR: " + err.message);}, function(){});
}

/*Funciones de geolocation.js*/

function anadirRuta(ruta, distancia, copia_de){
	var municipio_inicio;
	var municipio_fin;

	uuid = device.uuid;
	time = new Date();
	idruta = uuid.concat(time.getTime());
	punto_inicio = ruta[0].identificador;
	punto_fin = ruta[ruta.length-1].identificador;

	var geocoder = new google.maps.Geocoder;

	geocoder.geocode({'location': {lat:ruta[0].latitud, lng:ruta[0].longitud}}, function(results, status) {
 		if (status == google.maps.GeocoderStatus.OK) {
 			municipio_inicio = results[1].address_components[0].short_name;
 		} else {
 			municipio_inicio = "No determinado";
 		}
	});
	geocoder.geocode({'location': {lat:ruta[ruta.length-1].latitud, lng:ruta[ruta.length-1].longitud}}, function(results, status) {
 		if (status == google.maps.GeocoderStatus.OK) {
 			municipio_fin = results[1].address_components[0].short_name;
 		} else {
 			municipio_fin = "No determinado";
 		}
	});

	duracion = calcularDuracion(ruta[0].hora, ruta[ruta.length-1].hora);

	for (var i = 0; i < ruta.length; i++) {
		insertarPunto(ruta[i].identificador, ruta[i].latitud, ruta[i].longitud, ruta[i].precision);
	}

	if (copia_de == 0) {
		db.transaction(function(tx) {
			tx.executeSql('INSERT INTO ruta (idruta, duracion, distancia_recorrida, cuantas, municipio_inicio, municipio_fin, punto_inicio, punto_fin, en_servidor) VALUES (?,?,?,?,?,?,?,?,?)', [idruta, duracion, distancia, 0, municipio_inicio, municipio_fin, punto_inicio, punto_fin, 0], function(tx, res) {});
		}, function(err){console.log("ERROR: " + err.message);}, function(){console.log("RUTA INSERTADA");});
	} else {
		db.transaction(function(tx) {
			tx.executeSql('INSERT INTO ruta (idruta, duracion, distancia_recorrida, cuantas, municipio_inicio, municipio_fin, punto_inicio, punto_fin, copia_de, en_servidor) VALUES (?,?,?,?,?,?,?,?,?,?)', [idruta, duracion, distancia, 0, municipio_inicio, municipio_fin, punto_inicio, punto_fin, copia_de, 0], function(tx, res) {});
		}, function(err){console.log("ERROR: " + err.message);}, function(){console.log("RUTA INSERTADA");});
	}

	for (var i = 1; i < ruta.length-1; i++) {
		relacionarPuntoYRuta(idruta, ruta[i].identificador, i, ruta[i].hora);
	}

	if (copia_de == 0) {
		insertarFechaRuta(idruta);
	} else {
		insertarFechaRuta(copia_de);
	}
}

function calcularDuracion(inicio, fin){
	inicioHoras = inicio.substr(0,2);
	inicioMinutos = inicio.substr(3,2);

	finHoras = fin.substr(0,2);
	finMinutos = fin.substr(3,2);

	transcurridoHoras = finHoras - inicioHoras;
	transcurridoMinutos = finMinutos - inicioMinutos;

	if (transcurridoHoras < 0) {
		transcurridoHoras = 24 + transcurridoHoras;
	}

	if (transcurridoMinutos < 0) {
		transcurridoHoras--;
		transcurridoMinutos = 60 + transcurridoMinutos;
	}

	horas = transcurridoHoras * 60;
	duracion = horas + transcurridoMinutos;
	duracionInt = parseInt(duracion);

	return duracionInt;
}

function insertarPunto(idpunto, latitud, longitud, precision){
	db.transaction(function(tx) {
		tx.executeSql('INSERT INTO punto (idpunto, latitud, longitud, precision) VALUES (?,?,?,?)', [idpunto, latitud, longitud, precision], function(tx, rs) {});
	}, function(err){console.log("ERROR: " + err.message);}, function(){console.log("PUNTO INSERTADO");});
}

function relacionarPuntoYRuta(idruta, idpunto, orden, hora){
	db.transaction(function(tx) {
		tx.executeSql('INSERT INTO punto_intermedio (idruta, idpunto, orden, hora) VALUES (?,?,?,?)', [idruta, idpunto, orden, hora], function(tx, rs) {});
	}, function(err){console.log("ERROR: " + err.message);}, function(){console.log("RELACION INSERTADA");});
}

function insertarFechaRuta(idruta){
	fecha = new Date();
	diaHoy = fecha.getDate();
	mesHoy = fecha.getMonth() + 1;
	anyoHoy = fecha.getFullYear();
	fechaHoy = (anyoHoy * 10000) + (mesHoy * 100) + diaHoy;

	hora = fecha.toLocaleTimeString();
	horasMinutos = hora.slice(0,5);
	horaMod = horasMinutos.replace(/:/g,"");
	horaInt = parseInt(horaMod);

	uuid = device.uuid;
	idfecha_ruta = uuid.concat(fecha.getTime());

	db.transaction(function(tx) {
		tx.executeSql('SELECT version_actual FROM configuracion WHERE idconfiguracion = 1', [], function(tx, rs) {
			if (rs.rows.length != 0) {
				version = rs.rows.item(0).version_actual;
				tx.executeSql('INSERT INTO fecha_ruta (idfecha_ruta, dia, hora, idruta, en_servidor, configuracion_version) VALUES (?,?,?,?,?,?)', [idfecha_ruta, fechaHoy, horaInt, idruta, 0, version], function(tx, rs) {});
			}
		});		
	}, function(err){console.log("ERROR: " + err.message);}, function(){console.log("FECHA_RUTA INSERTADA");});
}

function aumentarCuantas(idruta){
	db.transaction(function(tx) {
		tx.executeSql('SELECT cuantas FROM ruta WHERE idruta = ?', [idruta], function(tx, rs) {
			if (rs.rows.length != 0) {
				cuantas = rs.rows.item(0).cuantas;
				cuantas = cuantas + 1;
				tx.executeSql('UPDATE ruta SET cuantas = ? WHERE idruta = ?', [cuantas, idruta], function(tx, rs) {});
			}
		});
	}, function(err){console.log("ERROR: " + err.message);}, function(){console.log("TODO OK aumentarCuantas")});

}

function rutasAlmacenadas(){
	db.transaction(function(tx){
		tx.executeSql('SELECT idruta FROM ruta',[],function(tx,rs){
			if(rs.rows.length != 0){
				$("#slcRutas option").remove();
				rellenarSlcRutas(rs.rows);
			}else{
				$("#slcRutas option").remove();
				document.getElementById('slcRutas').options[0] = new Option("Seleccione una ruta", -1);
			}
		});
	}, function(err){console.log("ERROR SELECT rutasAlmacenadas: " + err.message);}, function(){console.log("TODO OK SELECT rutasAlmacenadas")});
}

function rellenarSlcRutas(data){
	var rutas = document.getElementById('slcRutas');
	rutas.options[0] = new Option("Seleccione una ruta", -1);
	for (var i = 0; i < data.length; i++) {
		rutas.options[i+1] = new Option(data.item(i).idruta, i);
	}
}

function recuperarRuta(idruta, div){
	var inicio;
	var fin;
	db.transaction(function(tx){
		tx.executeSql('SELECT latitud, longitud FROM punto INNER JOIN ruta ON punto.idpunto = ruta.punto_inicio WHERE ruta.idruta = ?',[idruta],function(tx,rs){
			if (rs.rows.length != 0) {
				inicio = {lat: rs.rows.item(0).latitud, lng: rs.rows.item(0).longitud};
			}
		});
		tx.executeSql('SELECT latitud, longitud FROM punto INNER JOIN ruta ON punto.idpunto = ruta.punto_fin WHERE ruta.idruta = ?',[idruta],function(tx,rs){
			if (rs.rows.length != 0) {
				fin = {lat: rs.rows.item(0).latitud, lng: rs.rows.item(0).longitud};
			}
		});
		tx.executeSql('SELECT latitud, longitud FROM punto INNER JOIN punto_intermedio ON punto.idpunto = punto_intermedio.idpunto WHERE punto_intermedio.idruta = ? ORDER BY orden ASC',[idruta],function(tx,rs){
			if(rs.rows.length != 0){
				res = rs.rows;
				var puntos = new Array();
				puntos.push(inicio); 
				for (var i = 0; i < res.length; i++) {
					punto = {lat:res.item(i).latitud, lng:res.item(i).longitud};
					puntos.push(punto);
					if (i == res.length-1) {
						puntos.push(fin);
					}
				}
				pintarMapa(puntos, div);
			}
		});
	}, function(err){console.log("ERROR recuperarRuta: " + err.message)}, function(data){console.log("TODO OK recuperarRuta")});
}

function enviarRuta(idfecha_ruta){
	db.transaction(function(tx) {
		tx.executeSql('SELECT idusuario FROM usuario WHERE en_servidor = 1',[],function(tx,rs){
			if(rs.rows.length != 0){
				tx.executeSql('SELECT * FROM fecha_ruta INNER JOIN ruta ON fecha_ruta.idruta = ruta.idruta WHERE ruta.en_servidor = 0 AND idfecha_ruta = ?', [idfecha_ruta], function(tx, rs) {
					if (rs.rows.length != 0) {
						idruta = rs.rows.item(0).idruta;
						duracion = rs.rows.item(0).duracion;
						distancia_recorrida = rs.rows.item(0).distancia_recorrida;
						cuantas = rs.rows.item(0).cuantas;
						municipio_inicio = rs.rows.item(0).municipio_inicio;
						idpunto_inicio = rs.rows.item(0).punto_inicio;
						municipio_fin = rs.rows.item(0).municipio_fin;
						idpunto_fin = rs.rows.item(0).punto_fin;
						copia_de = rs.rows.item(0).copia_de;
						dia = rs.rows.item(0).dia;
						hora = rs.rows.item(0).hora;
						version = rs.rows.item(0).configuracion_version;
						rutaFecha = {idruta:idruta,duracion:duracion,distancia_recorrida:distancia_recorrida,cuantas:cuantas,municipio_inicio:municipio_inicio,punto_inicio:idpunto_inicio,municipio_fin:municipio_fin,punto_fin:idpunto_fin,copia_de:copia_de,idfecha_ruta:idfecha_ruta, dia:dia,hora:hora,version:version};
						tx.executeSql('SELECT * FROM punto_intermedio INNER JOIN punto ON punto_intermedio.idpunto = punto.idpunto WHERE idruta = ? ORDER BY orden ASC', [idruta], function(tx, rs) {
							if (rs.rows.length != 0) {
								data = rs.rows;
								puntos_intermedios = new Array();
								for (var i = 0; i < data.length; i++) {
									idpunto = data.item(i).idpunto;
									latitud = data.item(i).latitud;
									longitud = data.item(i).longitud;
									precision = data.item(i).precision;
									orden = data.item(i).orden;
									hora = data.item(i).hora;
									puntos_intermedios.push({idpunto:idpunto,latitud:latitud,longitud:longitud,precision:precision,orden:orden,hora:hora});
								}
								tx.executeSql('SELECT latitud, longitud, precision FROM punto WHERE idpunto = ?', [idpunto_inicio], function(tx, rs) {
									if (rs.rows.length != 0) {
										data = rs.rows;
										idpunto = data.item(0).idpunto;
										latitud = data.item(0).latitud;
										longitud = data.item(0).longitud;
										precision = data.item(0).precision;
										punto_inicio = {idpunto:idpunto,latitud:latitud,longitud:longitud,precision:precision};

										tx.executeSql('SELECT latitud, longitud, precision FROM punto WHERE idpunto = ?', [idpunto_fin], function(tx, rs) {
											if (rs.rows.length != 0) {
												data = rs.rows;
												idpunto = data.item(0).idpunto;
												latitud = data.item(0).latitud;
												longitud = data.item(0).longitud;
												precision = data.item(0).precision;
												punto_fin = {idpunto:idpunto,latitud:latitud,longitud:longitud,precision:precision};

												datos = [{rutaFecha: rutaFecha},{puntos_intermedios:puntos_intermedios},{punto_inicio:punto_inicio},{punto_fin:punto_fin},{idusuario:idusuario}];
												datosJSON = JSON.stringify(datos);
												$.ajax({type: "POST",
														url: "http://galan.ehu.eus/dpuerto001/WEB/enviarRuta.php",
														data: {dato:datosJSON},
														success: function(data){
																	db.transaction(function(tx) {
    																	tx.executeSql('UPDATE ruta SET en_servidor = 1 WHERE idruta = ?', [data[0].idruta], function(tx, rs) {});
    																	tx.executeSql('UPDATE fecha_ruta SET en_servidor = 1 WHERE idfecha_ruta = ?', [data[0].idfecha_ruta], function(tx, rs) {});
																	}, function(err){console.log('ERROR UPDATE enviarRuta: ' + err.message);}, function(){console.log('TODO OK UPDATE enviarRuta');});
														},
														error: function(e){console.log("ERROR");}
												});
											}
										});
									}
								});
							}
						});
					}
				});		
			} else {
				enviarUsuario();
			}
		});
	}, function(err){console.log("ERROR: " + err.message);}, function(){console.log("TODO OK enviarRuta")});
}

function enviosPendientes(){
	db.transaction(function(tx){
		//Se selecciona la hora de cuestionario
		tx.executeSql('SELECT realizar_cuestionario FROM configuracion WHERE idconfiguracion = 1',[],function(tx,rs){
			if (rs.rows.length != 0) {
				fecha = new Date();
				diaHoy = fecha.getDate();
				mesHoy = fecha.getMonth() + 1;
				anyoHoy = fecha.getFullYear();
				fechaAyer = diaAnterior(diaHoy, mesHoy, anyoHoy);
				hora = rs.rows.item(0).realizar_cuestionario;
				//Se seleccionan las fecha_ruta anteriores a la última verificación diaria
				tx.executeSql('SELECT idfecha_ruta FROM fecha_ruta WHERE ((dia = ? AND hora < ?) OR dia < ?) AND en_servidor = 0',[fechaAyer, hora, fechaAyer],function(tx,rs){
					if (rs.rows.length != 0) {
						fechas_rutas = rs.rows;
						for (var i = 0; i < fechas_rutas.length; i++) {
							idfecha_ruta = fechas_rutas.item(i).idfecha_ruta;
							//Se seleccionan las fecha_ruta de las rutas originales y que no están en el servidor
							tx.executeSql('SELECT fecha_ruta.idfecha_ruta FROM fecha_ruta INNER JOIN ruta ON fecha_ruta.idruta = ruta.idruta WHERE idfecha_ruta = ? AND ruta.en_servidor = 0 AND copia_de IS NULL', [idfecha_ruta], function(tx, rs) {
								if (rs.rows.length != 0) {
									enviarRuta(rs.rows.item(0).idfecha_ruta);
									//Se comprueba si la fecha_ruta ha sido valorada y si la valoracion ha sido enviada al servidor
									tx.executeSql('SELECT fecha_ruta_idfecha_ruta FROM ruta_valorada WHERE fecha_ruta_idfecha_ruta = ? AND en_servidor = 0', [rs.rows.item(0).idfecha_ruta], function(tx, rs) {
										if (rs.rows.length != 0) {
											enviarCuestionario(rs.rows.item(0).fecha_ruta_idfecha_ruta);
										}
									});
								}
							});
							//Se seleccionan las fecha_ruta de las rutas copia y que no están en el servidor
							tx.executeSql('SELECT fecha_ruta.idfecha_ruta FROM fecha_ruta INNER JOIN ruta ON fecha_ruta.idruta = ruta.idruta WHERE idfecha_ruta = ? AND ruta.en_servidor = 0 AND copia_de IS NOT NULL', [idfecha_ruta], function(tx, rs) {
								if (rs.rows.length != 0) {
									//enviarRuta(rs.rows.item(0).idfecha_ruta);
								}	
							});
						}
						//Se selecionan las fecha_ruta que no están en el servidor, pero la ruta sí que está en el servidor
						tx.executeSql('SELECT fecha_ruta.idfecha_ruta FROM fecha_ruta INNER JOIN ruta ON fecha_ruta.idruta = ruta.idruta WHERE ((dia = ? AND hora < ?) OR dia < ?) AND ruta.en_servidor = 1 AND fecha_ruta.en_servidor = 0',[fechaAyer, hora, fechaAyer],function(tx,rs){
							if (rs.rows.length != 0) {
								for (var i = 0; i < rs.rows.length; i++) {
									enviarFechaRuta(rs.rows.item(i).idfecha_ruta);
								}
							}
						});
					}
				});
			}
		});
	}, function(err){console.log("ERROR: " + err.message);}, function(){console.log("TODO OK enviosPendientes")});
}

function enviarFechaRuta(idfecha_ruta){
	db.transaction(function(tx) {
		tx.executeSql('SELECT idfecha_ruta, dia, hora, idruta, configuracion_version FROM fecha_ruta WHERE idfecha_ruta = ?', [idfecha_ruta], function(tx, rs) {
			if (rs.rows.length != 0) {
				idfecha_ruta = rs.rows.item(0).idfecha_ruta;
				dia = rs.rows.item(0).dia;
				hora = rs.rows.item(0).hora;
				idruta = rs.rows.item(0).idruta;
				configuracion_version = rs.rows.item(0).configuracion_version;

				datos = {idfecha_ruta:idfecha_ruta, dia:dia, hora:hora, idruta:idruta, configuracion_version:configuracion_version, idusuario:idusuario};
				datosJSON = JSON.stringify(datos);
				$.ajax({type: "POST",
						url: "http://galan.ehu.eus/dpuerto001/WEB/enviarFechaRuta.php",
						data: {dato:datosJSON},
						success: function(data){
									console.log("ENVIADO"); /*Poner atributo en_servidor a 1 en la ruta enviada*/
									db.transaction(function(tx) {
    									tx.executeSql('UPDATE fecha_ruta SET en_servidor = 1 WHERE idfecha_ruta = ?', [data[0].idfecha_ruta], function(tx, rs) {});
									}, function(err){console.log('ERROR UPDATE enviarRuta: ' + err.message);}, function(){console.log('TODO OK UPDATE enviarFechaRuta');});
						},
						error: function(e){console.log("ERROR");}
				});
			}
		});		
	}, function(err){console.log("ERROR: " + err.message);}, function(){console.log("TODO OK enviarFechaRuta");});
}

function borrarRuta(idfecha_ruta){
	db.transaction(function(tx) {
		tx.executeSql('SELECT idruta FROM fecha_ruta WHERE idfecha_ruta = ?', [idfecha_ruta], function(tx, rs) {
			if (rs.rows.length != 0) {
				idruta = rs.rows.item(0).idruta;
				tx.executeSql('SELECT punto_inicio, punto_fin FROM ruta WHERE idruta = ?', [idruta], function(tx, rs) {
					if (rs.rows.length != 0) {

						punto_inicio = rs.rows.item(0).punto_inicio;
						punto_fin = rs.rows.item(0).punto_fin;
						puntos = new Array(punto_inicio, punto_fin);

						tx.executeSql('SELECT idpunto FROM punto_intermedio WHERE idruta = ?', [idruta], function(tx, rs) {
							if (rs.rows.length != 0) {

								for (var i = 0; i < rs.rows.length; i++) {
									puntos.push(rs.rows.item(i).idpunto);
								}

								tx.executeSql('DELETE FROM fecha_ruta WHERE idruta = ?', [idruta], function(tx, rs) {
									tx.executeSql('DELETE FROM punto_intermedio WHERE idruta = ?', [idruta], function(tx, rs) {
										tx.executeSql('DELETE FROM ruta WHERE idruta = ?', [idruta], function(tx, rs) {
											for (var i = 0; i < puntos.length; i++) {
												tx.executeSql('DELETE FROM punto WHERE idpunto = ?', [puntos[i]], function(tx, rs) {});
											}
										});
									});
								});
							}
						});
					}
				});
			}
		});
	}, function(err){console.log("ERROR: " + err.message);}, function(){console.log("TODO OK borrarRuta");});
}