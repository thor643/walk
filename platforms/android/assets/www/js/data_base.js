var db;
var res;
var error;

function abrirBD(){
	db = window.sqlitePlugin.openDatabase({name: 'walkability.db', androidLockWorkaround: 1, location: 1});
}

function inicializarBD(){

	db.transaction(function(tx) {
    	tx.executeSql('PRAGMA foreign_keys = ON');
    	tx.executeSql('DROP TABLE IF EXISTS "usuario"');
    	tx.executeSql('CREATE TABLE IF NOT EXISTS "usuario"("idusuario" TEXT PRIMARY KEY NOT NULL, "anyo_nacimiento" INTEGER, "genero" NUMERIC, "municipio_procedencia" TEXT, "movilidad_reducida" INTEGER, "en_servidor" NUMERIC)');
    	tx.executeSql('DROP TABLE IF EXISTS "configuracion"');
    	tx.executeSql('CREATE TABLE IF NOT EXISTS "configuracion"("idconfiguracion" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, "vel_max" INTEGER, "dist_min_ruta" INTEGER, "tiempo_parada" INTEGER, "radio_parada" INTEGER, "puntos_distintos" INTEGER, "dist_puntos" INTEGER, "realizar_cuestionario" INTEGER, "version_actual" INTEGER)');
    	tx.executeSql('DROP TABLE IF EXISTS "punto"');
    	tx.executeSql('CREATE TABLE IF NOT EXISTS "punto"("idpunto" TEXT PRIMARY KEY NOT NULL, "latitud" REAL, "longitud" REAL, "precision" REAL)');
    	tx.executeSql('DROP TABLE IF EXISTS "ruta"');
    	tx.executeSql('CREATE TABLE IF NOT EXISTS "ruta"("idruta" TEXT PRIMARY KEY NOT NULL, "duracion" INTEGER, "distancia_recorrida" REAL, "cuantas" INTEGER, "municipio_inicio" TEXT, "municipio_fin" TEXT, "punto_inicio" TEXT NOT NULL, "punto_fin" TEXT NOT NULL, "copia_de" TEXT,"en_servidor" NUMERIC, "categoria" INTEGER, CONSTRAINT "fk_ruta_punto1" FOREIGN KEY("punto_inicio") REFERENCES "punto"("idpunto"), CONSTRAINT "fk_ruta_punto2" FOREIGN KEY("punto_fin") REFERENCES "punto"("idpunto"), CONSTRAINT "fk_ruta_ruta1" FOREIGN KEY("copia_de") REFERENCES "ruta"("idruta"))');
    	tx.executeSql('CREATE INDEX "ruta.fk_ruta_punto1_idx" ON "ruta"("punto_inicio")');
    	tx.executeSql('CREATE INDEX "ruta.fk_ruta_punto2_idx" ON "ruta"("punto_fin")');
    	tx.executeSql('CREATE INDEX "ruta.fk_ruta_ruta1_idx" ON "ruta"("copia_de")');
    	tx.executeSql('DROP TABLE IF EXISTS "fecha_ruta"');
    	tx.executeSql('CREATE TABLE IF NOT EXISTS "fecha_ruta"("idfecha_ruta" TEXT PRIMARY KEY NOT NULL, "dia" TEXT, "hora" TEXT, "idruta" TEXT NOT NULL, CONSTRAINT "fk_fecha_ruta_ruta1" FOREIGN KEY("idruta") REFERENCES "ruta"("idruta"))');
    	tx.executeSql('CREATE INDEX "fecha_ruta.fk_fecha_ruta_ruta1_idx" ON "fecha_ruta"("idruta")');
    	tx.executeSql('DROP TABLE IF EXISTS "fecha_cuestionario"');
    	tx.executeSql('CREATE TABLE IF NOT EXISTS "fecha_cuestionario"("idfecha_cuestionario" TEXT PRIMARY KEY NOT NULL, "dia" TEXT, "hora" TEXT, "version" INTEGER)');
    	tx.executeSql('DROP TABLE IF EXISTS "respuesta_usuario"');
    	tx.executeSql('CREATE TABLE IF NOT EXISTS "respuesta_usuario"( "idrespuesta_usuario" TEXT PRIMARY KEY NOT NULL, "idpregunta" INTEGER, "opcion_elegida" INTEGER)');
    	tx.executeSql('DROP TABLE IF EXISTS "ruta_valorada"');
    	tx.executeSql('CREATE TABLE IF NOT EXISTS "ruta_valorada"("fecha_ruta_idfecha_ruta" VARCHAR(45) NOT NULL, "fecha_cuestionario_idfecha_cuestionario" VARCHAR(45) NOT NULL, "respuesta_usuario_idrespuesta_usuario" VARCHAR(45) NOT NULL, PRIMARY KEY("fecha_ruta_idfecha_ruta", "fecha_cuestionario_idfecha_cuestionario", "respuesta_usuario_idrespuesta_usuario"), CONSTRAINT "fk_ruta_valorada_fecha_ruta1" FOREIGN KEY("fecha_ruta_idfecha_ruta") REFERENCES "fecha_ruta"("idfecha_ruta"), CONSTRAINT "fk_ruta_valorada_fecha_cuestionario1" FOREIGN KEY("fecha_cuestionario_idfecha_cuestionario") REFERENCES "fecha_cuestionario"("idfecha_cuestionario"), CONSTRAINT "fk_ruta_valorada_respuesta_usuario1" FOREIGN KEY("respuesta_usuario_idrespuesta_usuario") REFERENCES "respuesta_usuario"("idrespuesta_usuario"))');
    	tx.executeSql('CREATE INDEX "ruta_valorada.fk_ruta_valorada_fecha_ruta1_idx" ON "ruta_valorada"("fecha_ruta_idfecha_ruta")');
    	tx.executeSql('CREATE INDEX "ruta_valorada.fk_ruta_valorada_fecha_cuestionario1_idx" ON "ruta_valorada"("fecha_cuestionario_idfecha_cuestionario")');
    	tx.executeSql('CREATE INDEX "ruta_valorada.fk_ruta_valorada_respuesta_usuario1_idx" ON "ruta_valorada"("respuesta_usuario_idrespuesta_usuario")');
    	tx.executeSql('DROP TABLE IF EXISTS "punto_intermedio"');
    	tx.executeSql('CREATE TABLE IF NOT EXISTS "punto_intermedio"("orden" INTEGER, "hora" TEXT, "idpunto" VARCHAR(45) NOT NULL, "idruta" VARCHAR(45) NOT NULL, PRIMARY KEY("idpunto","idruta"), CONSTRAINT "fk_punto_intermedio_punto1" FOREIGN KEY("idpunto") REFERENCES "punto"("idpunto"), CONSTRAINT "fk_punto_intermedio_ruta1" FOREIGN KEY("idruta") REFERENCES "ruta"("idruta"))');
    	tx.executeSql('CREATE INDEX "punto_intermedio.fk_punto_intermedio_ruta1_idx" ON "punto_intermedio"("idruta")');
    	tx.executeSql('CREATE INDEX "punto_intermedio.fk_punto_intermedio_punto1_idx" ON "punto_intermedio"("idpunto")');
		}, function(err){console.log('ERROR inicializarBD: ' + err.message);}, function(){console.log('BD CREADA'); existeConfig(); existeUsuario();});
}

function existeBD(){
	db.transaction(function(tx) {
		tx.executeSql('SELECT * FROM sqlite_master WHERE name = "usuario"', [], function(tx, rs){
			res = rs;
			console.log("Result: " + rs.rows.length);
			if (rs.rows.length == 0) {
				inicializarBD();
			}else{
				existeConfig();
				existeUsuario();
			}
		}, function(err){console.log('ERROR: ' + err.message);});

  	}, function(err){console.log('ERROR existeBD: ' + err.message);}, function(){console.log('TODO OK existeBD');});

}

function existeUsuario(){
	db.transaction(function(tx){
  		tx.executeSql('SELECT * FROM usuario', [], function(tx, rs){
			if (rs.rows.length == 1) {
				window.location.href="#app";
				
			}else{
				window.location.href="#textoInicial";
				$("body").removeClass("loading");
			}
		});
  	}, function(err){console.log('ERROR existeUsuario: ' + err.message);}, function(){console.log('TODO OK existeUsuario');});
}

function existeConfig(){
	db.transaction(function(tx){
		tx.executeSql('SELECT * FROM configuracion', [], function(tx, rs){
			if (rs.rows.length == 0) {
				//SOLICITAR ULTIMA VERSION
				solicitarConfig();
			} else{
				//COMPROBAR SI ES LA VERSION ACTIVA
				comprobarVersionConfig();
			}
		});
	}, function(err){console.log('ERROR existeConfig: ' + err.message); error = err;}, function(){console.log('TODO OK existeConfig');});
}

function solicitarConfig(){
	$.getJSON('http://galan.ehu.eus/dpuerto001/WEB/solicitarConfig.php',function(data){

		vel_max = parseInt(data[0].vel_max);
		dist_min_ruta = parseInt(data[0].dist_min_ruta);
		tiempo_parada = parseInt(data[0].tiempo_parada);
		radio_parada = parseInt(data[0].radio_parada);
		puntos_distintos = parseInt(data[0].puntos_distintos);
		dist_puntos = parseInt(data[0].dist_puntos);
		version_actual = parseInt(data[0].version);

		db.transaction(function(tx) {
    		tx.executeSql('INSERT INTO configuracion (vel_max, dist_min_ruta, tiempo_parada, radio_parada, puntos_distintos, dist_puntos, version_actual) VALUES (?,?,?,?,?,?,?)', [vel_max, dist_min_ruta, tiempo_parada, radio_parada, puntos_distintos, dist_puntos, version_actual], function(tx, res) {
      				console.log("insertId: " + res.insertId + " -- probably 1");
      				console.log("rowsAffected: " + res.rowsAffected + " -- should be 1");
  			});
		}, function(err){console.log('ERROR solicitarConfig: ' + err.message);}, function(){console.log('TODO OK solicitarConfig');});
	});
}

function comprobarVersionConfig(){
	var version;

	db.transaction(function(tx){
		tx.executeSql('SELECT version_actual FROM configuracion', [], function(tx, rs){
			version = rs.rows.item(0).version_actual;
		});
	}, function(err){console.log('ERROR comprobarVersionConfig1: ' + err.message);}, 
	
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
					console.log("CAMBIAR CONFIGURACION");
					actualizarConfig(data[0]);
				}
			},
			error: function(e){console.log("ERROR");},
			});
	});
}

function actualizarConfig(data){
	db.transaction(function(tx) {
    		tx.executeSql('UPDATE configuracion SET vel_max = ?, dist_min_ruta = ?, tiempo_parada = ?, radio_parada = ?, puntos_distintos = ?, dist_puntos = ?, version_actual = ? WHERE idconfiguracion = 1', [data.vel_max, data.dist_min_ruta, data.tiempo_parada, data.radio_parada, data.puntos_distintos, data.dist_puntos, data.version_actual], function(tx, rs) {
   				res = rs;
  			});
		}, function(err){console.log('ERROR solicitarConfig: ' + err.message);}, function(){console.log('TODO OK actualizarConfig');});
}

$(document).ready(function(e) {

	$("#botonTest").on("click", function(){
		if ($("#anyoNacimiento option:selected").val() == -1) {
			alert("Seleccione un año");
		} else {
			if ($(".ps-prov option:selected").val() == -1) {
				alert("Seleccione una provincia");
			} else {
				if ($(".ps-mun option:selected").val() == -1) {
					alert("Seleccione un municipio");
				} else {
					genero = $("#genero label[for="+$("#genero :radio:checked").attr("id")+"]").text();
					fechaNac = $("#anyoNacimiento option:selected").text();
					prov = $(".ps-prov option:selected").text(); 
					mun = $(".ps-mun option:selected").text();
					mov = $("#movilidad label[for="+$("#movilidad :radio:checked").attr("id")+"]").text();
					hora = $("#hora").val();
					navigator.notification.confirm(
    					"Los datos ofrecidos son:\n -Genero: " + genero +
						"\n-Fecha de nacimiento: " + fechaNac +
						"\n-Provincia: " + prov +
						"\n-Municipio: " + mun +
						"\n-Problemas de movilidad: " + mov +
						"\n-Horario cuestionario: " + hora, // message
     					onConfirm,  // callback to invoke with index of button pressed
    					'Confirmar datos',           // title
    					['Sí','No']     // buttonLabels
					);
				}
			}	
		}
	});

});

function onConfirm(buttonIndex) {
    if(buttonIndex == 1){
    	genero = $("#genero :radio:checked").val()
		fechaNac = parseInt($("#anyoNacimiento option:selected").val()); 
		mun = $(".ps-mun option:selected").text();
		mov = $("#movilidad :radio:checked").val();
		uuid = device.uuid;
		date = new Date();
		idusuario = uuid.concat(date.getTime());
		hora = $("#hora").val();
		horaMod = hora.replace(/:/g,"");

		db.transaction(function(tx) {
    	tx.executeSql('INSERT INTO usuario (idusuario, anyo_nacimiento, genero, municipio_procedencia, movilidad_reducida, en_servidor) VALUES (?,?,?,?,?,?)', [idusuario, fechaNac, genero, mun, mov, 0], function(tx, res) {
      		console.log("insertId: " + res.insertId + " -- probably 1");
      		console.log("rowsAffected: " + res.rowsAffected + " -- should be 1");
  		});
		
		}, function(err){console.log('ERROR ' + err.message);}, 
		function(){
			console.log('USUARIO INSERTADO');
			navigator.notification.alert(
    			'¡¡Enhorabuena!! Ya es usted miembro de la comunidad Walkability Capturer',  // message
    			function alertDismissed() {window.location = "#app";},         // callback
    			'Usuario creado',            // title
    			'Aceptar'                  // buttonName
			);
		});

    }
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
	});
}

function rellenarSlcRutas(data){
	var rutas = document.getElementById('slcRutas');
	rutas.options[0] = new Option("Seleccione una ruta", -1);
	for (var i = 0; i < data.length; i++) {
		rutas.options[i+1] = new Option(data.item(i).idruta, i);
	}
}

function recuperarRuta(idruta){
	var inicio;
	var fin;
	db.transaction(function(tx){
		tx.executeSql('SELECT latitud, longitud FROM punto INNER JOIN ruta ON punto.idpunto = ruta.punto_inicio WHERE ruta.idruta = ?',[idruta],function(tx,rs){
			if (rs.rows.length != 0) {
				console.log("Inicio -> Lat: " + rs.rows.item(0).latitud + " Long: " + rs.rows.item(0).longitud);
				inicio = {lat: rs.rows.item(0).latitud, lng: rs.rows.item(0).longitud};
			}
		});
		tx.executeSql('SELECT latitud, longitud FROM punto INNER JOIN ruta ON punto.idpunto = ruta.punto_fin WHERE ruta.idruta = ?',[idruta],function(tx,rs){
			if (rs.rows.length != 0) {
				console.log("Fin -> Lat: " + rs.rows.item(0).latitud + " Long: " + rs.rows.item(0).longitud);
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
					console.log(punto);
					if (i == res.length-1) {
						puntos.push(fin);
						console.log("FIN");
					}
				}
				pintarMapa(puntos);
			}
		});
	}, function(err){console.log("ERROR: " + err.message)}, function(data){});
}

/*
*
* Datos para pruebas
*
*/

function insertarRutas(){
	//idpunto, longitud, latitud, precision
	db.transaction(function(tx) {
    	tx.executeSql('INSERT INTO punto (idpunto, latitud, longitud, precision) VALUES (?,?,?,?)', ["14607465452961", 39.2535267042545470, -6.1152058839797974, 10], function(tx, res) {});
    	tx.executeSql('INSERT INTO punto (idpunto, latitud, longitud, precision) VALUES (?,?,?,?)', ["14607465452962", 39.2540800000000019, -6.1145900000000006, 10], function(tx, res) {});
    	tx.executeSql('INSERT INTO punto (idpunto, latitud, longitud, precision) VALUES (?,?,?,?)', ["14607465452963", 39.2552700000000030, -6.1133300000000004, 10], function(tx, res) {});
    	tx.executeSql('INSERT INTO punto (idpunto, latitud, longitud, precision) VALUES (?,?,?,?)', ["14607465452964", 39.2569400000000002, -6.1127300000000009, 10], function(tx, res) {});
    	tx.executeSql('INSERT INTO punto (idpunto, latitud, longitud, precision) VALUES (?,?,?,?)', ["14607465452965", 39.2580900000000028, -6.1120800000000006, 10], function(tx, res) {});
    	tx.executeSql('INSERT INTO punto (idpunto, latitud, longitud, precision) VALUES (?,?,?,?)', ["14607465452966", 39.2598800000000026, -6.1102200000000009, 10], function(tx, res) {});
    	tx.executeSql('INSERT INTO punto (idpunto, latitud, longitud, precision) VALUES (?,?,?,?)', ["14607465452967", 39.2616000000000014, -6.1082400000000003, 10], function(tx, res) {});
    	tx.executeSql('INSERT INTO punto (idpunto, latitud, longitud, precision) VALUES (?,?,?,?)', ["14607465452968", 39.2627748793909817, -6.1072719097137451, 10], function(tx, res) {});
    	tx.executeSql('INSERT INTO punto (idpunto, latitud, longitud, precision) VALUES (?,?,?,?)', ["14607465452969", 39.2634747253134790, -6.1076098680496216, 10], function(tx, res) {});
    	tx.executeSql('INSERT INTO punto (idpunto, latitud, longitud, precision) VALUES (?,?,?,?)', ["146074654529610", 39.2659147862637781, -6.1038279533386230, 10], function(tx, res) {});
    	tx.executeSql('INSERT INTO punto (idpunto, latitud, longitud, precision) VALUES (?,?,?,?)', ["146074654529611", 39.2675386776200099, -6.1013254523277283, 10], function(tx, res) {});
    	tx.executeSql('INSERT INTO punto (idpunto, latitud, longitud, precision) VALUES (?,?,?,?)', ["146074654529612", 39.2685582628102452, -6.0999709367752075, 10], function(tx, res) {});
    	tx.executeSql('INSERT INTO punto (idpunto, latitud, longitud, precision) VALUES (?,?,?,?)', ["146074654529613", 39.2698830784331889, -6.0983562469482422, 10], function(tx, res) {});
    	tx.executeSql('INSERT INTO punto (idpunto, latitud, longitud, precision) VALUES (?,?,?,?)', ["146074654529614", 39.2702256990870353, -6.0962319374084473, 10], function(tx, res) {});
    	tx.executeSql('INSERT INTO punto (idpunto, latitud, longitud, precision) VALUES (?,?,?,?)', ["146074654529615", 39.2700180504058807, -6.0944697260856628, 10], function(tx, res) {});
    	tx.executeSql('INSERT INTO punto (idpunto, latitud, longitud, precision) VALUES (?,?,?,?)', ["146074654529616", 39.2698270130757692, -6.0922810435295105, 10], function(tx, res) {});
    	tx.executeSql('INSERT INTO punto (idpunto, latitud, longitud, precision) VALUES (?,?,?,?)', ["146074654529617", 39.2694449368532119, -6.0901299118995667, 10], function(tx, res) {});
    	tx.executeSql('INSERT INTO punto (idpunto, latitud, longitud, precision) VALUES (?,?,?,?)', ["146074654529618", 39.2685395740094592, -6.0890623927116394, 10], function(tx, res) {});
    	tx.executeSql('INSERT INTO punto (idpunto, latitud, longitud, precision) VALUES (?,?,?,?)', ["146074654529619", 39.2686849312175212, -6.0876139998435974, 10], function(tx, res) {});
    	tx.executeSql('INSERT INTO punto (idpunto, latitud, longitud, precision) VALUES (?,?,?,?)', ["146074654529620", 39.2662802689295063, -6.0841459035873413, 10], function(tx, res) {});
    	tx.executeSql('INSERT INTO punto (idpunto, latitud, longitud, precision) VALUES (?,?,?,?)', ["146074654529621", 39.2636907000922548, -6.0814261436462402, 10], function(tx, res) {});
    	tx.executeSql('INSERT INTO punto (idpunto, latitud, longitud, precision) VALUES (?,?,?,?)', ["146074654529622", 39.2622370108620160, -6.0786420106887817, 10], function(tx, res) {});
    	tx.executeSql('INSERT INTO punto (idpunto, latitud, longitud, precision) VALUES (?,?,?,?)', ["146074654529623", 39.2607459097307441, -6.0769334435462952, 10], function(tx, res) {});
    	tx.executeSql('INSERT INTO punto (idpunto, latitud, longitud, precision) VALUES (?,?,?,?)', ["146074654529624", 39.2598591256330351, -6.0789021849632263, 10], function(tx, res) {});
    	tx.executeSql('INSERT INTO punto (idpunto, latitud, longitud, precision) VALUES (?,?,?,?)', ["146074654529625", 39.2594686878599148, -6.0814288258552551, 10], function(tx, res) {});
    	tx.executeSql('INSERT INTO punto (idpunto, latitud, longitud, precision) VALUES (?,?,?,?)', ["146074654529626", 39.2585652729735770, -6.0841271281242371, 10], function(tx, res) {});
    	tx.executeSql('INSERT INTO punto (idpunto, latitud, longitud, precision) VALUES (?,?,?,?)', ["146074654529627", 39.2580626785026112, -6.0854065418243408, 10], function(tx, res) {});
    	tx.executeSql('INSERT INTO punto (idpunto, latitud, longitud, precision) VALUES (?,?,?,?)', ["146074654529628", 39.2564987974517905, -6.0941103100776672, 10], function(tx, res) {});
    	tx.executeSql('INSERT INTO punto (idpunto, latitud, longitud, precision) VALUES (?,?,?,?)', ["146074654529629", 39.2557054208188703, -6.1016848683357239, 10], function(tx, res) {});
    	tx.executeSql('INSERT INTO punto (idpunto, latitud, longitud, precision) VALUES (?,?,?,?)', ["146074654529630", 39.2539774071339025, -6.1077868938446045, 10], function(tx, res) {});
    	tx.executeSql('INSERT INTO punto (idpunto, latitud, longitud, precision) VALUES (?,?,?,?)', ["146074654529631", 39.2532795433810904, -6.1097341775894165, 10], function(tx, res) {});
    	tx.executeSql('INSERT INTO punto (idpunto, latitud, longitud, precision) VALUES (?,?,?,?)', ["146074654529632", 39.2523573556259180, -6.1114910244941711, 10], function(tx, res) {});
    	tx.executeSql('INSERT INTO punto (idpunto, latitud, longitud, precision) VALUES (?,?,?,?)', ["146074654529633", 39.2522202726268645, -6.1146962642669678, 10], function(tx, res) {});
    	tx.executeSql('INSERT INTO punto (idpunto, latitud, longitud, precision) VALUES (?,?,?,?)', ["146074654529634", 39.2532400806399764, -6.1155787110328674, 10], function(tx, res) {});
    	tx.executeSql('INSERT INTO punto (idpunto, latitud, longitud, precision) VALUES (?,?,?,?)', ["146074654529635", 39.2535121654037482, -6.1152461171150208, 10], function(tx, res) {});
    	tx.executeSql('INSERT INTO ruta (idruta, duracion, distancia_recorrida, cuantas, municipio_inicio, municipio_fin, punto_inicio, punto_fin, en_servidor) VALUES (?,?,?,?,?,?,?,?,?)', ["1460746545296", 120, 2000.12, 0, "Torre de Santa Maria", "Torre de Santa Maria", "14607465452961", "146074654529635", 0], function(tx, res) {});
    	tx.executeSql('INSERT INTO punto_intermedio (idruta, idpunto, orden) VALUES (?,?,?)', ["1460746545296","14607465452962",1], function(tx, res) {});
    	tx.executeSql('INSERT INTO punto_intermedio (idruta, idpunto, orden) VALUES (?,?,?)', ["1460746545296","14607465452963",2], function(tx, res) {});
    	tx.executeSql('INSERT INTO punto_intermedio (idruta, idpunto, orden) VALUES (?,?,?)', ["1460746545296","14607465452964",3], function(tx, res) {});
    	tx.executeSql('INSERT INTO punto_intermedio (idruta, idpunto, orden) VALUES (?,?,?)', ["1460746545296","14607465452965",4], function(tx, res) {});
    	tx.executeSql('INSERT INTO punto_intermedio (idruta, idpunto, orden) VALUES (?,?,?)', ["1460746545296","14607465452966",5], function(tx, res) {});
    	tx.executeSql('INSERT INTO punto_intermedio (idruta, idpunto, orden) VALUES (?,?,?)', ["1460746545296","14607465452967",6], function(tx, res) {});
    	tx.executeSql('INSERT INTO punto_intermedio (idruta, idpunto, orden) VALUES (?,?,?)', ["1460746545296","14607465452968",7], function(tx, res) {});
    	tx.executeSql('INSERT INTO punto_intermedio (idruta, idpunto, orden) VALUES (?,?,?)', ["1460746545296","14607465452969",8], function(tx, res) {});
    	tx.executeSql('INSERT INTO punto_intermedio (idruta, idpunto, orden) VALUES (?,?,?)', ["1460746545296","146074654529610",9], function(tx, res) {});
    	tx.executeSql('INSERT INTO punto_intermedio (idruta, idpunto, orden) VALUES (?,?,?)', ["1460746545296","146074654529611",10], function(tx, res) {});
    	tx.executeSql('INSERT INTO punto_intermedio (idruta, idpunto, orden) VALUES (?,?,?)', ["1460746545296","146074654529612",11], function(tx, res) {});
    	tx.executeSql('INSERT INTO punto_intermedio (idruta, idpunto, orden) VALUES (?,?,?)', ["1460746545296","146074654529613",12], function(tx, res) {});
    	tx.executeSql('INSERT INTO punto_intermedio (idruta, idpunto, orden) VALUES (?,?,?)', ["1460746545296","146074654529614",13], function(tx, res) {});
    	tx.executeSql('INSERT INTO punto_intermedio (idruta, idpunto, orden) VALUES (?,?,?)', ["1460746545296","146074654529615",14], function(tx, res) {});
    	tx.executeSql('INSERT INTO punto_intermedio (idruta, idpunto, orden) VALUES (?,?,?)', ["1460746545296","146074654529616",15], function(tx, res) {});
    	tx.executeSql('INSERT INTO punto_intermedio (idruta, idpunto, orden) VALUES (?,?,?)', ["1460746545296","146074654529617",16], function(tx, res) {});
    	tx.executeSql('INSERT INTO punto_intermedio (idruta, idpunto, orden) VALUES (?,?,?)', ["1460746545296","146074654529618",17], function(tx, res) {});
    	tx.executeSql('INSERT INTO punto_intermedio (idruta, idpunto, orden) VALUES (?,?,?)', ["1460746545296","146074654529619",18], function(tx, res) {});
    	tx.executeSql('INSERT INTO punto_intermedio (idruta, idpunto, orden) VALUES (?,?,?)', ["1460746545296","146074654529620",19], function(tx, res) {});
    	tx.executeSql('INSERT INTO punto_intermedio (idruta, idpunto, orden) VALUES (?,?,?)', ["1460746545296","146074654529621",20], function(tx, res) {});
    	tx.executeSql('INSERT INTO punto_intermedio (idruta, idpunto, orden) VALUES (?,?,?)', ["1460746545296","146074654529622",21], function(tx, res) {});
    	tx.executeSql('INSERT INTO punto_intermedio (idruta, idpunto, orden) VALUES (?,?,?)', ["1460746545296","146074654529623",22], function(tx, res) {});
    	tx.executeSql('INSERT INTO punto_intermedio (idruta, idpunto, orden) VALUES (?,?,?)', ["1460746545296","146074654529624",23], function(tx, res) {});
    	tx.executeSql('INSERT INTO punto_intermedio (idruta, idpunto, orden) VALUES (?,?,?)', ["1460746545296","146074654529625",24], function(tx, res) {});
    	tx.executeSql('INSERT INTO punto_intermedio (idruta, idpunto, orden) VALUES (?,?,?)', ["1460746545296","146074654529626",25], function(tx, res) {});
    	tx.executeSql('INSERT INTO punto_intermedio (idruta, idpunto, orden) VALUES (?,?,?)', ["1460746545296","146074654529627",26], function(tx, res) {});
    	tx.executeSql('INSERT INTO punto_intermedio (idruta, idpunto, orden) VALUES (?,?,?)', ["1460746545296","146074654529628",27], function(tx, res) {});
    	tx.executeSql('INSERT INTO punto_intermedio (idruta, idpunto, orden) VALUES (?,?,?)', ["1460746545296","146074654529629",28], function(tx, res) {});
    	tx.executeSql('INSERT INTO punto_intermedio (idruta, idpunto, orden) VALUES (?,?,?)', ["1460746545296","146074654529630",29], function(tx, res) {});
    	tx.executeSql('INSERT INTO punto_intermedio (idruta, idpunto, orden) VALUES (?,?,?)', ["1460746545296","146074654529631",30], function(tx, res) {});
    	tx.executeSql('INSERT INTO punto_intermedio (idruta, idpunto, orden) VALUES (?,?,?)', ["1460746545296","146074654529632",31], function(tx, res) {});
    	tx.executeSql('INSERT INTO punto_intermedio (idruta, idpunto, orden) VALUES (?,?,?)', ["1460746545296","146074654529633",32], function(tx, res) {});
    	tx.executeSql('INSERT INTO punto_intermedio (idruta, idpunto, orden) VALUES (?,?,?)', ["1460746545296","146074654529634",33], function(tx, res) {});
    	tx.executeSql('INSERT INTO punto (idpunto, latitud, longitud, precision) VALUES (?,?,?,?)', ["1460827510801", 39.2535204733188792, -6.1152246594429016, 10], function(tx, res) {});
    	tx.executeSql('INSERT INTO punto (idpunto, latitud, longitud, precision) VALUES (?,?,?,?)', ["1460827510802", 39.2531900000000036, -6.1161700000000003, 10], function(tx, res) {});
    	tx.executeSql('INSERT INTO punto (idpunto, latitud, longitud, precision) VALUES (?,?,?,?)', ["1460827510803", 39.2520300000000049, -6.1167000000000007, 10], function(tx, res) {});
    	tx.executeSql('INSERT INTO punto (idpunto, latitud, longitud, precision) VALUES (?,?,?,?)', ["1460827510804", 39.2516300000000058, -6.1176000000000004, 10], function(tx, res) {});
    	tx.executeSql('INSERT INTO punto (idpunto, latitud, longitud, precision) VALUES (?,?,?,?)', ["1460827510805", 39.2514300000000063, -6.1189500000000008, 10], function(tx, res) {});
    	tx.executeSql('INSERT INTO punto (idpunto, latitud, longitud, precision) VALUES (?,?,?,?)', ["1460827510806", 39.2507900000000021, -6.1198600000000001, 10], function(tx, res) {});
    	tx.executeSql('INSERT INTO punto (idpunto, latitud, longitud, precision) VALUES (?,?,?,?)', ["1460827510807", 39.2499099999999999, -6.1213900000000008, 10], function(tx, res) {});
    	tx.executeSql('INSERT INTO punto (idpunto, latitud, longitud, precision) VALUES (?,?,?,?)', ["1460827510808", 39.2491500000000002, -6.1216900000000001, 10], function(tx, res) {});
    	tx.executeSql('INSERT INTO punto (idpunto, latitud, longitud, precision) VALUES (?,?,?,?)', ["1460827510809", 39.2479500000000030, -6.1227300000000007, 10], function(tx, res) {});
    	tx.executeSql('INSERT INTO punto (idpunto, latitud, longitud, precision) VALUES (?,?,?,?)', ["14608275108010", 39.2469400000000022, -6.1233400000000007, 10], function(tx, res) {});
    	tx.executeSql('INSERT INTO punto (idpunto, latitud, longitud, precision) VALUES (?,?,?,?)', ["14608275108011", 39.2465400000000031, -6.1230300000000009, 10], function(tx, res) {});
    	tx.executeSql('INSERT INTO punto (idpunto, latitud, longitud, precision) VALUES (?,?,?,?)', ["14608275108012", 39.2459300000000013, -6.1226900000000004, 10], function(tx, res) {});
    	tx.executeSql('INSERT INTO punto (idpunto, latitud, longitud, precision) VALUES (?,?,?,?)', ["14608275108013", 39.2446700000000064, -6.1218300000000001, 10], function(tx, res) {});
    	tx.executeSql('INSERT INTO punto (idpunto, latitud, longitud, precision) VALUES (?,?,?,?)', ["14608275108014", 39.2436500000000024, -6.1212300000000006, 10], function(tx, res) {});
    	tx.executeSql('INSERT INTO punto (idpunto, latitud, longitud, precision) VALUES (?,?,?,?)', ["14608275108015", 39.2429200000000051, -6.1212900000000001, 10], function(tx, res) {});
    	tx.executeSql('INSERT INTO punto (idpunto, latitud, longitud, precision) VALUES (?,?,?,?)', ["14608275108016", 39.2420200000000037, -6.1209300000000004, 10], function(tx, res) {});
    	tx.executeSql('INSERT INTO punto (idpunto, latitud, longitud, precision) VALUES (?,?,?,?)', ["14608275108017", 39.2415800000000061, -6.1211900000000004, 10], function(tx, res) {});
    	tx.executeSql('INSERT INTO punto (idpunto, latitud, longitud, precision) VALUES (?,?,?,?)', ["14608275108018", 39.2405400000000029, -6.1214200000000005, 10], function(tx, res) {});
    	tx.executeSql('INSERT INTO punto (idpunto, latitud, longitud, precision) VALUES (?,?,?,?)', ["14608275108019", 39.2399000000000058, -6.1217700000000006, 10], function(tx, res) {});
    	tx.executeSql('INSERT INTO punto (idpunto, latitud, longitud, precision) VALUES (?,?,?,?)', ["14608275108020", 39.2392500000000055, -6.1223500000000008, 10], function(tx, res) {});
    	tx.executeSql('INSERT INTO punto (idpunto, latitud, longitud, precision) VALUES (?,?,?,?)', ["14608275108021", 39.2388700000000057, -6.1230100000000007, 10], function(tx, res) {});
    	tx.executeSql('INSERT INTO punto (idpunto, latitud, longitud, precision) VALUES (?,?,?,?)', ["14608275108022", 39.2379700000000042, -6.1233400000000007, 10], function(tx, res) {});
    	tx.executeSql('INSERT INTO punto (idpunto, latitud, longitud, precision) VALUES (?,?,?,?)', ["14608275108023", 39.2364100000000064, -6.1235800000000005, 10], function(tx, res) {});
    	tx.executeSql('INSERT INTO punto (idpunto, latitud, longitud, precision) VALUES (?,?,?,?)', ["14608275108024", 39.2357900000000015, -6.1229900000000006, 10], function(tx, res) {});
    	tx.executeSql('INSERT INTO punto (idpunto, latitud, longitud, precision) VALUES (?,?,?,?)', ["14608275108025", 39.2359400000000065, -6.1222400000000006, 10], function(tx, res) {});
    	tx.executeSql('INSERT INTO punto (idpunto, latitud, longitud, precision) VALUES (?,?,?,?)', ["14608275108026", 39.2358400000000032, -6.1208300000000007, 10], function(tx, res) {});
    	tx.executeSql('INSERT INTO punto (idpunto, latitud, longitud, precision) VALUES (?,?,?,?)', ["14608275108027", 39.2358200000000039, -6.1192800000000007, 10], function(tx, res) {});
		tx.executeSql('INSERT INTO punto (idpunto, latitud, longitud, precision) VALUES (?,?,?,?)', ["14608275108028", 39.2356700000000060, -6.1182200000000009, 10], function(tx, res) {});
		tx.executeSql('INSERT INTO punto (idpunto, latitud, longitud, precision) VALUES (?,?,?,?)', ["14608275108029", 39.2357300000000038, -6.1169000000000002, 10], function(tx, res) {});
		tx.executeSql('INSERT INTO punto (idpunto, latitud, longitud, precision) VALUES (?,?,?,?)', ["14608275108030", 39.2358600000000024, -6.1151500000000008, 10], function(tx, res) {});
		tx.executeSql('INSERT INTO punto (idpunto, latitud, longitud, precision) VALUES (?,?,?,?)', ["14608275108031", 39.2361600000000053, -6.1142600000000007, 10], function(tx, res) {});
		tx.executeSql('INSERT INTO punto (idpunto, latitud, longitud, precision) VALUES (?,?,?,?)', ["14608275108032", 39.2367900000000063, -6.1136200000000009, 10], function(tx, res) {});
		tx.executeSql('INSERT INTO punto (idpunto, latitud, longitud, precision) VALUES (?,?,?,?)', ["14608275108033", 39.2372600000000062, -6.1125300000000005, 10], function(tx, res) {});
		tx.executeSql('INSERT INTO punto (idpunto, latitud, longitud, precision) VALUES (?,?,?,?)', ["14608275108034", 39.2390700000000052, -6.1135400000000004, 10], function(tx, res) {});
		tx.executeSql('INSERT INTO punto (idpunto, latitud, longitud, precision) VALUES (?,?,?,?)', ["14608275108035", 39.2403400000000033, -6.1133700000000006, 10], function(tx, res) {});
		tx.executeSql('INSERT INTO punto (idpunto, latitud, longitud, precision) VALUES (?,?,?,?)', ["14608275108036", 39.2413800000000066, -6.1130900000000006, 10], function(tx, res) {});
		tx.executeSql('INSERT INTO punto (idpunto, latitud, longitud, precision) VALUES (?,?,?,?)', ["14608275108037", 39.2424300000000059, -6.1128800000000005, 10], function(tx, res) {});
		tx.executeSql('INSERT INTO punto (idpunto, latitud, longitud, precision) VALUES (?,?,?,?)', ["14608275108038", 39.2436500000000024, -6.1124300000000007, 10], function(tx, res) {});
		tx.executeSql('INSERT INTO punto (idpunto, latitud, longitud, precision) VALUES (?,?,?,?)', ["14608275108039", 39.2454400000000021, -6.1121100000000004, 10], function(tx, res) {});
		tx.executeSql('INSERT INTO punto (idpunto, latitud, longitud, precision) VALUES (?,?,?,?)', ["14608275108040", 39.2465000000000046, -6.1116500000000009, 10], function(tx, res) {});
		tx.executeSql('INSERT INTO punto (idpunto, latitud, longitud, precision) VALUES (?,?,?,?)', ["14608275108041", 39.2485300000000024, -6.1114500000000005, 10], function(tx, res) {});
		tx.executeSql('INSERT INTO punto (idpunto, latitud, longitud, precision) VALUES (?,?,?,?)', ["14608275108042", 39.2495200000000040, -6.1119500000000002, 10], function(tx, res) {});
		tx.executeSql('INSERT INTO punto (idpunto, latitud, longitud, precision) VALUES (?,?,?,?)', ["14608275108043", 39.2504700000000000, -6.1127400000000005, 10], function(tx, res) {});
		tx.executeSql('INSERT INTO punto (idpunto, latitud, longitud, precision) VALUES (?,?,?,?)', ["14608275108044", 39.2510000000000048, -6.1136300000000006, 10], function(tx, res) {});
		tx.executeSql('INSERT INTO punto (idpunto, latitud, longitud, precision) VALUES (?,?,?,?)', ["14608275108045", 39.2518300000000053, -6.1143300000000007, 10], function(tx, res) {});
		tx.executeSql('INSERT INTO punto (idpunto, latitud, longitud, precision) VALUES (?,?,?,?)', ["14608275108046", 39.2527299999999997, -6.1151500000000008, 10], function(tx, res) {});
		tx.executeSql('INSERT INTO punto (idpunto, latitud, longitud, precision) VALUES (?,?,?,?)', ["14608275108047", 39.2535300000000049, -6.1151800000000005, 10], function(tx, res) {});
    	tx.executeSql('INSERT INTO ruta (idruta, duracion, distancia_recorrida, cuantas, municipio_inicio, municipio_fin, punto_inicio, punto_fin, en_servidor) VALUES (?,?,?,?,?,?,?,?,?)', ["146082751080", 120, 2000.12, 0, "Torre de Santa Maria", "Torre de Santa Maria", "1460827510801", "14608275108047", 0], function(tx, res) {});
    	tx.executeSql('INSERT INTO punto_intermedio (idruta, idpunto, orden) VALUES (?,?,?)', ["146082751080","1460827510802",1], function(tx, res) {});
    	tx.executeSql('INSERT INTO punto_intermedio (idruta, idpunto, orden) VALUES (?,?,?)', ["146082751080","1460827510803",2], function(tx, res) {});
    	tx.executeSql('INSERT INTO punto_intermedio (idruta, idpunto, orden) VALUES (?,?,?)', ["146082751080","1460827510804",3], function(tx, res) {});
    	tx.executeSql('INSERT INTO punto_intermedio (idruta, idpunto, orden) VALUES (?,?,?)', ["146082751080","1460827510805",4], function(tx, res) {});
    	tx.executeSql('INSERT INTO punto_intermedio (idruta, idpunto, orden) VALUES (?,?,?)', ["146082751080","1460827510806",5], function(tx, res) {});
    	tx.executeSql('INSERT INTO punto_intermedio (idruta, idpunto, orden) VALUES (?,?,?)', ["146082751080","1460827510807",6], function(tx, res) {});
    	tx.executeSql('INSERT INTO punto_intermedio (idruta, idpunto, orden) VALUES (?,?,?)', ["146082751080","1460827510808",7], function(tx, res) {});
    	tx.executeSql('INSERT INTO punto_intermedio (idruta, idpunto, orden) VALUES (?,?,?)', ["146082751080","1460827510809",8], function(tx, res) {});
    	tx.executeSql('INSERT INTO punto_intermedio (idruta, idpunto, orden) VALUES (?,?,?)', ["146082751080","14608275108010",9], function(tx, res) {});
    	tx.executeSql('INSERT INTO punto_intermedio (idruta, idpunto, orden) VALUES (?,?,?)', ["146082751080","14608275108011",10], function(tx, res) {});
    	tx.executeSql('INSERT INTO punto_intermedio (idruta, idpunto, orden) VALUES (?,?,?)', ["146082751080","14608275108012",11], function(tx, res) {});
    	tx.executeSql('INSERT INTO punto_intermedio (idruta, idpunto, orden) VALUES (?,?,?)', ["146082751080","14608275108013",12], function(tx, res) {});
    	tx.executeSql('INSERT INTO punto_intermedio (idruta, idpunto, orden) VALUES (?,?,?)', ["146082751080","14608275108014",13], function(tx, res) {});
    	tx.executeSql('INSERT INTO punto_intermedio (idruta, idpunto, orden) VALUES (?,?,?)', ["146082751080","14608275108015",14], function(tx, res) {});
    	tx.executeSql('INSERT INTO punto_intermedio (idruta, idpunto, orden) VALUES (?,?,?)', ["146082751080","14608275108016",15], function(tx, res) {});
    	tx.executeSql('INSERT INTO punto_intermedio (idruta, idpunto, orden) VALUES (?,?,?)', ["146082751080","14608275108017",16], function(tx, res) {});
    	tx.executeSql('INSERT INTO punto_intermedio (idruta, idpunto, orden) VALUES (?,?,?)', ["146082751080","14608275108018",17], function(tx, res) {});
    	tx.executeSql('INSERT INTO punto_intermedio (idruta, idpunto, orden) VALUES (?,?,?)', ["146082751080","14608275108019",18], function(tx, res) {});
    	tx.executeSql('INSERT INTO punto_intermedio (idruta, idpunto, orden) VALUES (?,?,?)', ["146082751080","14608275108020",19], function(tx, res) {});
    	tx.executeSql('INSERT INTO punto_intermedio (idruta, idpunto, orden) VALUES (?,?,?)', ["146082751080","14608275108021",20], function(tx, res) {});
    	tx.executeSql('INSERT INTO punto_intermedio (idruta, idpunto, orden) VALUES (?,?,?)', ["146082751080","14608275108022",21], function(tx, res) {});
    	tx.executeSql('INSERT INTO punto_intermedio (idruta, idpunto, orden) VALUES (?,?,?)', ["146082751080","14608275108023",22], function(tx, res) {});
    	tx.executeSql('INSERT INTO punto_intermedio (idruta, idpunto, orden) VALUES (?,?,?)', ["146082751080","14608275108024",23], function(tx, res) {});
    	tx.executeSql('INSERT INTO punto_intermedio (idruta, idpunto, orden) VALUES (?,?,?)', ["146082751080","14608275108025",24], function(tx, res) {});
    	tx.executeSql('INSERT INTO punto_intermedio (idruta, idpunto, orden) VALUES (?,?,?)', ["146082751080","14608275108026",25], function(tx, res) {});
    	tx.executeSql('INSERT INTO punto_intermedio (idruta, idpunto, orden) VALUES (?,?,?)', ["146082751080","14608275108027",26], function(tx, res) {});
    	tx.executeSql('INSERT INTO punto_intermedio (idruta, idpunto, orden) VALUES (?,?,?)', ["146082751080","14608275108028",27], function(tx, res) {});
    	tx.executeSql('INSERT INTO punto_intermedio (idruta, idpunto, orden) VALUES (?,?,?)', ["146082751080","14608275108029",28], function(tx, res) {});
    	tx.executeSql('INSERT INTO punto_intermedio (idruta, idpunto, orden) VALUES (?,?,?)', ["146082751080","14608275108030",29], function(tx, res) {});
    	tx.executeSql('INSERT INTO punto_intermedio (idruta, idpunto, orden) VALUES (?,?,?)', ["146082751080","14608275108031",30], function(tx, res) {});
    	tx.executeSql('INSERT INTO punto_intermedio (idruta, idpunto, orden) VALUES (?,?,?)', ["146082751080","14608275108032",31], function(tx, res) {});
    	tx.executeSql('INSERT INTO punto_intermedio (idruta, idpunto, orden) VALUES (?,?,?)', ["146082751080","14608275108033",32], function(tx, res) {});
    	tx.executeSql('INSERT INTO punto_intermedio (idruta, idpunto, orden) VALUES (?,?,?)', ["146082751080","14608275108034",33], function(tx, res) {});
    	tx.executeSql('INSERT INTO punto_intermedio (idruta, idpunto, orden) VALUES (?,?,?)', ["146082751080","14608275108035",34], function(tx, res) {});
    	tx.executeSql('INSERT INTO punto_intermedio (idruta, idpunto, orden) VALUES (?,?,?)', ["146082751080","14608275108036",35], function(tx, res) {});
    	tx.executeSql('INSERT INTO punto_intermedio (idruta, idpunto, orden) VALUES (?,?,?)', ["146082751080","14608275108037",36], function(tx, res) {});
    	tx.executeSql('INSERT INTO punto_intermedio (idruta, idpunto, orden) VALUES (?,?,?)', ["146082751080","14608275108038",37], function(tx, res) {});
    	tx.executeSql('INSERT INTO punto_intermedio (idruta, idpunto, orden) VALUES (?,?,?)', ["146082751080","14608275108039",38], function(tx, res) {});
    	tx.executeSql('INSERT INTO punto_intermedio (idruta, idpunto, orden) VALUES (?,?,?)', ["146082751080","14608275108040",39], function(tx, res) {});
    	tx.executeSql('INSERT INTO punto_intermedio (idruta, idpunto, orden) VALUES (?,?,?)', ["146082751080","14608275108041",40], function(tx, res) {});
    	tx.executeSql('INSERT INTO punto_intermedio (idruta, idpunto, orden) VALUES (?,?,?)', ["146082751080","14608275108042",41], function(tx, res) {});
    	tx.executeSql('INSERT INTO punto_intermedio (idruta, idpunto, orden) VALUES (?,?,?)', ["146082751080","14608275108043",42], function(tx, res) {});
    	tx.executeSql('INSERT INTO punto_intermedio (idruta, idpunto, orden) VALUES (?,?,?)', ["146082751080","14608275108044",43], function(tx, res) {});
    	tx.executeSql('INSERT INTO punto_intermedio (idruta, idpunto, orden) VALUES (?,?,?)', ["146082751080","14608275108045",44], function(tx, res) {});
    	tx.executeSql('INSERT INTO punto_intermedio (idruta, idpunto, orden) VALUES (?,?,?)', ["146082751080","14608275108046",45], function(tx, res) {});
    }, function(err) {console.log("ERROR insertarRutas: " + err.message);}, function(data) {console.log("RUTA INSERTADA"); alert("Ruta insertada");});
}