const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors");
const express = require("express");

const serviceAccount = require("./permisos.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://proyectosemestralbigdata-ddbd3-default-rtdb.firebaseio.com",
  ignoreUndefinedProperties: true,
});

const db = admin.firestore();

const app = express();
app.use(cors({origin: true}));

// Ruta para crear registros
app.post("/api/crear", async (req, res) => {
  try {
    const {DispID, fecha, latitud, longitud} = req.body;
    if (latitud === undefined || longitud === undefined) {
      return res.status(400).send("Latitud y longitud son requeridos");
    }
    const docRef = db.collection("location").doc(String(DispID));
    const doc = await docRef.get();
    let dataToUpdate = [];
    let nextId = 1;

    if (doc.exists) {
      dataToUpdate = doc.data().viaje || [];

      if (dataToUpdate.length > 0) {
        nextId = parseInt(dataToUpdate[dataToUpdate.length - 1].id) + 1;
      }
    }

    dataToUpdate.push({
      fecha,
      id: nextId,
      lat: latitud,
      lon: longitud,
    });

    await docRef.set({viaje: dataToUpdate});

    return res.status(201).send("Registro creado exitosamente");
  } catch (error) {
    console.error("Error al crear el registro:", error);
    return res.status(500).send("Hubo un error al crear el registro");
  }
});

// Ruta para obtener todos los datos de todos los documentos
app.get("/api/ubicaciones", async (req, res) => {
  try {
    const datos = await db.collection("location").get();
    const data = [];

    datos.forEach((doc) => {
      data.push({id: doc.id, ...doc.data()});
    });

    return res.status(200).json(data);
  } catch (error) {
    console.error("Error al obtener los registros:", error);
    return res.status(500).send("Hubo un error al obtener los registros");
  }
});

exports.app = functions.https.onRequest(app);
