import { CommunicationProtocolEnum, DaprClient } from "@dapr/dapr"
import express from 'express'
const app = express()
app.use(express.json());
app.set('trust proxy', true);
const apiPort = 3000

const DAPR_STATE_STORE_NAME = "statestore"

const protocol = (process.env.DAPR_PROTOCOL === "grpc") ? CommunicationProtocolEnum.GRPC : CommunicationProtocolEnum.HTTP
const host = process.env.DAPR_HOST ?? "localhost"

let port
switch (protocol) {
    case CommunicationProtocolEnum.HTTP: {
        port = process.env.DAPR_HTTP_PORT
        break
    }
    case CommunicationProtocolEnum.GRPC: {
        port = process.env.DAPR_GRPC_PORT
        break
    }
    default: {
        port = 3500
    }
}

const client = new DaprClient(host, port, protocol)

//ENDPOINTS DE ADMINISTRADOR
app.get('/InicioCrearCandidatos', async (req, res) => {
    const state = [{
                         key: 'admin',
                         value: 'Inicio de fase para crear candidatos'
                    }]
                 
    await client.state.save(DAPR_STATE_STORE_NAME, state)
    res.status(200).send('Fase de Crear Candidatos iniciada')
})

app.get('/CierreCrearCandidatos', async (req, res) => {
    const state =  [{
                         key: 'admin',
                         value: 'Cierre de fase para crear candidatos'
                    }]
    await client.state.save(DAPR_STATE_STORE_NAME, state)
    res.send('Fase de Crear Candidatos finalizada')
})

app.get('/InicioVotaciones', async (req, res) => {
    const state =  [{
                         key: 'admin',
                         value: 'Inicio de fase para votar'
                    }]
    await client.state.save(DAPR_STATE_STORE_NAME, state)
    res.send('Fase de Votaciones iniciada')
})

app.get('/CierreVotaciones', async (req, res) => {
    const state =   [{
                         key: 'admin',
                         value: 'Cierre de fase para votar'
                    }]
    await client.state.save(DAPR_STATE_STORE_NAME, state)
    res.send('Fase de votaciones finalizada')
})

app.get('/faseActual', async (req, res) => {
    const faseActual = await client.state.get(DAPR_STATE_STORE_NAME, 'admin')
    console.log("La fase actual de la votación es: ", faseActual)
    res.send({message: `Fase actual: ${faseActual}`})
})

app.post('/CrearCandidatos', async (req, res) => {
    const data = req.body;
    const nombreCandidatoPresidencia = data.nombreCandidatoPresi;
    const nombreCandidatoVice = data.nombreCandidatoVice;
    const partido = data.partido;
    const inscripcion = nombreCandidatoPresidencia + "/" + nombreCandidatoVice + "/" + partido
    const state = [
                    {
                         key: 'candidatos',
                         value: inscripcion
                    }
                 ]
    const faseActual = await client.state.get(DAPR_STATE_STORE_NAME, 'admin')
    if(faseActual == "Inicio de fase para crear candidatos"){
        await client.state.save(DAPR_STATE_STORE_NAME, state)
        res.status(200).send('Candidato creado: ' + inscripcion);
    }
    else{
        res.status(400).send('La fase de inscripción de candidatos ha finalizado');
    }
    
})

//ENDPOINTS PUBLICOS
app.get('/Candidatos', async (req, res) => {
    const faseActual = await client.state.get(DAPR_STATE_STORE_NAME, 'candidatos')
    console.log("Candidato: ", faseActual)
    res.send({message: `${faseActual}`})
})

app.post('/Votar', async (req, res) => {
    const data = req.body;
    const nombreCompleto = data.nombreCompleto;
    const DPI = data.DPI;
    const partido = data.partido;
    let date_ob = new Date();
    const fechaHora = date_ob;
    const ip = req.ip;
    console.log(ip);
    console.log(fechaHora);
    const voto = nombreCompleto + "/" + DPI + "/" + partido + "/" + fechaHora + "/" + ip
    const state = [
                    {
                         key: 'votos',
                         value: voto
                    }
                 ]
    const faseActual = await client.state.get(DAPR_STATE_STORE_NAME, 'admin')
    if(faseActual == "Inicio de fase para votar"){
        await client.state.save(DAPR_STATE_STORE_NAME, state)
        res.status(200).send('Voto realizado: ' + voto);
    }
    else{
        res.status(400).send('La fase de votación ha finalizado, intente nuevamente en 4 años');
    }
    
})


app.listen(apiPort, () => {
    console.log(`API corriendo en:  ${apiPort}`);
})
