var db;
var res;

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
    	tx.executeSql('CREATE TABLE IF NOT EXISTS "punto"("idpunto" TEXT PRIMARY KEY NOT NULL, "latitud" REAL, "longitud" REAL, "precision" INTEGER)');
    	tx.executeSql('DROP TABLE IF EXISTS "ruta"');
    	tx.executeSql('CREATE TABLE IF NOT EXISTS "ruta"("idruta" TEXT PRIMARY KEY NOT NULL, "duracion" INTEGER, "distancia_recorrida" REAL, "cuantas" INTEGER, "municipio_inicio" TEXT, "municipio_fin" TEXT, "punto_inicio" TEXT NOT NULL, "punto_fin" TEXT NOT NULL, "copia_de" TEXT, CONSTRAINT "fk_ruta_punto1" FOREIGN KEY("punto_inicio") REFERENCES "punto"("idpunto"), CONSTRAINT "fk_ruta_punto2" FOREIGN KEY("punto_fin") REFERENCES "punto"("idpunto"), CONSTRAINT "fk_ruta_ruta1" FOREIGN KEY("copia_de") REFERENCES "ruta"("idruta"))');
    	tx.executeSql('CREATE INDEX "ruta.fk_ruta_punto1_idx" ON "ruta"("punto_inicio")');
    	tx.executeSql('CREATE INDEX "ruta.fk_ruta_punto2_idx" ON "ruta"("punto_fin")');
    	tx.executeSql('CREATE INDEX "ruta.fk_ruta_ruta1_idx" ON "ruta"("copia_de")');
    	tx.executeSql('DROP TABLE IF EXISTS "fecha_ruta"');
    	tx.executeSql('CREATE TABLE IF NOT EXISTS "fecha_ruta"("idfecha_ruta" TEXT PRIMARY KEY NOT NULL, "dia" TEXT, "hora" TEXT, "idruta" TEXT NOT NULL, CONSTRAINT "fk_fecha_ruta_ruta1" FOREIGN KEY("idruta") REFERENCES "ruta"("idruta"))');
    	tx.executeSql('CREATE INDEX "fecha_ruta.fk_fecha_ruta_ruta1_idx" ON "fecha_ruta"("idruta")');
    	tx.executeSql('DROP TABLE IF EXISTS "fecha_cuestionario"');
    	tx.executeSql('CREATE TABLE IF NOT EXISTS "fecha_cuestionario"("idfecha_cuestionario" TEXT PRIMARY KEY NOT NULL, "dia" TEXT, "hora" TEXT, "version" TEXT)');
    	tx.executeSql('DROP TABLE IF EXISTS "respuesta_usuario"');
    	tx.executeSql('CREATE TABLE IF NOT EXISTS "respuesta_usuario"( "idrespuesta_usuario" TEXT PRIMARY KEY NOT NULL, "idpregunta" INTEGER, "opcion_elegida" INTEGER)');
    	tx.executeSql('DROP TABLE IF EXISTS "ruta_valorada"');
    	tx.executeSql('CREATE TABLE IF NOT EXISTS "ruta_valorada"("fecha_ruta_idfecha_ruta" VARCHAR(45) NOT NULL, "fecha_cuestionario_idfecha_cuestionario" VARCHAR(45) NOT NULL, "respuesta_usuario_idrespuesta_usuario" VARCHAR(45) NOT NULL, PRIMARY KEY("fecha_ruta_idfecha_ruta", "fecha_cuestionario_idfecha_cuestionario", "respuesta_usuario_idrespuesta_usuario"), CONSTRAINT "fk_ruta_valorada_fecha_ruta1" FOREIGN KEY("fecha_ruta_idfecha_ruta") REFERENCES "fecha_ruta"("idfecha_ruta"), CONSTRAINT "fk_ruta_valorada_fecha_cuestionario1" FOREIGN KEY("fecha_cuestionario_idfecha_cuestionario") REFERENCES "fecha_cuestionario"("idfecha_cuestionario"), CONSTRAINT "fk_ruta_valorada_respuesta_usuario1" FOREIGN KEY("respuesta_usuario_idrespuesta_usuario") REFERENCES "respuesta_usuario"("idrespuesta_usuario"))');
    	tx.executeSql('CREATE INDEX "ruta_valorada.fk_ruta_valorada_fecha_ruta1_idx" ON "ruta_valorada"("fecha_ruta_idfecha_ruta")');
    	tx.executeSql('CREATE INDEX "ruta_valorada.fk_ruta_valorada_fecha_cuestionario1_idx" ON "ruta_valorada"("fecha_cuestionario_idfecha_cuestionario")');
    	tx.executeSql('CREATE INDEX "ruta_valorada.fk_ruta_valorada_respuesta_usuario1_idx" ON "ruta_valorada"("respuesta_usuario_idrespuesta_usuario")');
    	tx.executeSql('DROP TABLE IF EXISTS "punto_intermedio"');
    	tx.executeSql('CREATE TABLE IF NOT EXISTS "punto_intermedio"("orden" INTEGER, "hora" INTEGER, "idpunto" VARCHAR(45) NOT NULL, "idruta" VARCHAR(45) NOT NULL, PRIMARY KEY("idpunto","idruta"), CONSTRAINT "fk_punto_intermedio_punto1" FOREIGN KEY("idpunto") REFERENCES "punto"("idpunto"), CONSTRAINT "fk_punto_intermedio_ruta1" FOREIGN KEY("idruta") REFERENCES "ruta"("idruta"))');
    	tx.executeSql('CREATE INDEX "punto_intermedio.fk_punto_intermedio_ruta1_idx" ON "punto_intermedio"("idruta")');
    	tx.executeSql('CREATE INDEX "punto_intermedio.fk_punto_intermedio_punto1_idx" ON "punto_intermedio"("idpunto")');
		}, function(err){console.log('ERROR ' + err.message);}, function(){console.log('BD CREADA');});
}

function existeBD(){
	db.transaction(function(tx) {
		tx.executeSql('SELECT * FROM sqlite_master WHERE name = "usuario"', [], function(tx, rs){
			res = rs;
			console.log("Result: " + rs.rows.length);
			if (rs.rows.length == 0) {
				inicializarBD();
			}
		}, function(err){console.log('ERROR: ' + err.message);});

		tx.executeSql('SELECT * FROM usuario', [], function(tx, rs){
			if (rs.rows.length == 1) {
				window.location.href="#app";
			}
		});
  	}, function(err){console.log('ERROR ' + err.message);}, function(){console.log('TODO OK');$("body").removeClass("loading");});
}

$(document).ready(function(e) {

	$("#boton").on("click", function(){
		console.log("CLICK");
		if ($("#anyoNacimiento option:selected").val() == -1) {
			alert("Seleccione un año");
		} else {
			if ($(".ps-prov option:selected").val() == -1) {
				alert("Seleccione una provincia");
			} else {
				if ($(".ps-mun option:selected").val() == -1) {
					alert("Seleccione un municipio");
				} else {
					genero = $("#genero label[for="+$("#genero :radio:checked").val()+"]").text();
					fechaNac = $("#anyoNacimiento option:selected").text();
					prov = $(".ps-prov option:selected").text(); 
					mun = $(".ps-mun option:selected").text();
					mov = $("#movilidad label[for="+$("#movilidad :radio:checked").val()+"]").text();
					alert("Los datos ofrecidos son:\n -Genero: " + genero +
						"\n-Fecha de nacimiento: " + fechaNac +
						"\n-Provincia: " + prov +
						"\n-Municipio: " + mun +
						"\n-Problemas de movilidad: " + mov);
					navigator.notification.confirm(
    					"Los datos ofrecidos son:\n -Genero: " + genero +
						"\n-Fecha de nacimiento: " + fechaNac +
						"\n-Provincia: " + prov +
						"\n-Municipio: " + mun +
						"\n-Problemas de movilidad: " + mov, // message
     					onConfirm,  // callback to invoke with index of button pressed
    					'Confirmar datos',           // title
    					['Sí','No']     // buttonLabels
					);
				}
			}	
		}
		
		if (num == 0) {
			window.location = "#app";
		}else{console.log("NUM = 1");}
	});

});

function onConfirm(buttonIndex) {
    if(buttonIndex == 1){
    	genero = $("#genero label[for="+$("#genero :radio:checked").val()+"]").text();
		fechaNac = $("#anyoNacimiento option:selected").text();
		prov = $(".ps-prov option:selected").text(); 
		mun = $(".ps-mun option:selected").text();
		mov = $("#movilidad label[for="+$("#movilidad :radio:checked").val()+"]").text();

		db.transaction(function(tx) {
    	tx.executeSql('INSERT');
		}, function(err){console.log('ERROR ' + err.message);}, function(){console.log('BD CREADA');});

    }
}

