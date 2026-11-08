-- Las solicitudes ahora se aceptan o se rechazan (antes solo "resuelta")
UPDATE "SolicitudArrepentimiento" SET "estado" = 'aceptada' WHERE "estado" = 'resuelta';
